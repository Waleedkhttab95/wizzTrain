import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, uniqueEmail } from './setup';

const API = '/api/v1';
const TRAINER_PASSWORD = 'TrainerPass123';
const CLIENT_PASSWORD = 'ClientPass123';

/** Today in UTC as YYYY-MM-DD — the same convention DailyLog stores. */
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Walks the three end-to-end flows in spec §7.3 and the role matrix in §F1,
 * against a real PostgreSQL. Every record it creates is namespaced to this run
 * and removed afterwards.
 */
describe('Personal Training Platform (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  let trainerId: string;
  let trainerToken: string;
  let clientId: string;
  let clientToken: string;
  let clientEmail: string;
  let programId: string;
  let exerciseIds: string[] = [];

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    http = request(app.getHttpServer());

    const trainer = await prisma.trainer.create({
      data: {
        name: 'مدرب الاختبار',
        email: uniqueEmail('trainer'),
        passwordHash: await bcrypt.hash(TRAINER_PASSWORD, 10),
      },
    });
    trainerId = trainer.id;

    const login = await http
      .post(`${API}/auth/login`)
      .send({ email: trainer.email, password: TRAINER_PASSWORD })
      .expect(200);
    trainerToken = login.body.accessToken;
  }, 30_000);

  afterAll(async () => {
    // Cascades clear every program, plan and log belonging to this trainer.
    if (trainerId) {
      await prisma.trainer.delete({ where: { id: trainerId } }).catch(() => undefined);
    }
    await app?.close();
  });

  const asTrainer = () => ({ Authorization: `Bearer ${trainerToken}` });
  const asClient = () => ({ Authorization: `Bearer ${clientToken}` });

  describe('F1 — authentication', () => {
    it('rejects an unauthenticated request', () => http.get(`${API}/clients`).expect(401));

    it('rejects a malformed token', () =>
      http.get(`${API}/clients`).set('Authorization', 'Bearer nonsense').expect(401));

    it('returns the same message for a wrong password as for an unknown email', async () => {
      const wrongPassword = await http
        .post(`${API}/auth/login`)
        .send({ email: 'nobody@e2e.local', password: 'wrong-password' })
        .expect(401);

      expect(wrongPassword.body.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('reports the caller identity on /auth/me', async () => {
      const { body } = await http.get(`${API}/auth/me`).set(asTrainer()).expect(200);

      expect(body).toMatchObject({ id: trainerId, role: 'trainer' });
    });
  });

  describe('F2 — the trainer creates a client', () => {
    it('creates a client with the full profile', async () => {
      clientEmail = uniqueEmail('client');

      const { body } = await http
        .post(`${API}/clients`)
        .set(asTrainer())
        .send({
          name: 'سارة',
          email: clientEmail,
          password: CLIENT_PASSWORD,
          heightCm: 165,
          age: 29,
          startDate: '2026-08-01',
          phone: '+201001234567',
          goalWeightKg: 62,
          goalNote: 'خسارة دهون',
        })
        .expect(201);

      clientId = body.id;
      expect(body).toMatchObject({ name: 'سارة', heightCm: 165, age: 29, goalWeightKg: 62 });
    });

    it('never returns the password hash', async () => {
      const { text } = await http.get(`${API}/clients/${clientId}`).set(asTrainer()).expect(200);

      expect(text).not.toContain('passwordHash');
      expect(text).not.toContain(CLIENT_PASSWORD);
    });

    it('rejects a duplicate email with 409', () =>
      http
        .post(`${API}/clients`)
        .set(asTrainer())
        .send({ name: 'مكرر', email: clientEmail, password: CLIENT_PASSWORD })
        .expect(409));

    it('strips unknown fields rather than trusting them', () =>
      // A client must not be able to reassign themselves to another trainer.
      http
        .post(`${API}/clients`)
        .set(asTrainer())
        .send({
          name: 'حقن',
          email: uniqueEmail('inject'),
          password: CLIENT_PASSWORD,
          trainerId: 'some-other-trainer',
        })
        .expect(400));

    it('validates field ranges', () =>
      http
        .post(`${API}/clients`)
        .set(asTrainer())
        .send({ name: 'س', email: 'not-an-email', password: 'short' })
        .expect(400));
  });

  describe('F3 — the trainer builds a program', () => {
    it('creates a program for the client', async () => {
      const { body } = await http
        .post(`${API}/clients/${clientId}/programs`)
        .set(asTrainer())
        .send({ title: 'برنامج المرحلة الأولى', startDate: '2026-08-24' })
        .expect(201);

      programId = body.id;
      expect(body).toMatchObject({ title: 'برنامج المرحلة الأولى', isActive: true, days: [] });
    });

    it('adds days and exercises, defaulting their order', async () => {
      exerciseIds = [];

      for (const label of ['الصدر', 'الظهر', 'الأرجل']) {
        const day = await http
          .post(`${API}/programs/${programId}/days`)
          .set(asTrainer())
          .send({ dayLabel: label })
          .expect(201);

        for (const name of ['تمرين أول', 'تمرين ثانٍ']) {
          const exercise = await http
            .post(`${API}/days/${day.body.id}/exercises`)
            .set(asTrainer())
            .send({ name, sets: 4, reps: '8-10', restInterval: '90 ثانية' })
            .expect(201);

          exerciseIds.push(exercise.body.id);
        }
      }

      const { body } = await http.get(`${API}/programs/${programId}`).set(asTrainer()).expect(200);

      expect(body.days).toHaveLength(3);
      expect(body.days.map((day: { orderIndex: number }) => day.orderIndex)).toEqual([0, 1, 2]);
      expect(body.days[0].exercises.map((e: { orderIndex: number }) => e.orderIndex)).toEqual([
        0, 1,
      ]);
    });

    it('accepts a free-form rep target such as AMRAP', async () => {
      const { body: day } = await http
        .post(`${API}/programs/${programId}/days`)
        .set(asTrainer())
        .send({ dayLabel: 'إضافي' })
        .expect(201);

      const { body } = await http
        .post(`${API}/days/${day.body?.id ?? day.id}/exercises`)
        .set(asTrainer())
        .send({ name: 'سحب', sets: 3, reps: 'AMRAP' })
        .expect(201);

      expect(body.reps).toBe('AMRAP');

      await http.delete(`${API}/days/${day.id}`).set(asTrainer()).expect(204);
    });

    it('edits and deletes an exercise', async () => {
      const { body: day } = await http
        .post(`${API}/programs/${programId}/days`)
        .set(asTrainer())
        .send({ dayLabel: 'مؤقت' })
        .expect(201);

      const { body: exercise } = await http
        .post(`${API}/days/${day.id}/exercises`)
        .set(asTrainer())
        .send({ name: 'قديم', sets: 3, reps: '10' })
        .expect(201);

      const { body: updated } = await http
        .patch(`${API}/exercises/${exercise.id}`)
        .set(asTrainer())
        .send({ name: 'جديد', sets: 5 })
        .expect(200);

      expect(updated).toMatchObject({ name: 'جديد', sets: 5, reps: '10' });

      await http.delete(`${API}/exercises/${exercise.id}`).set(asTrainer()).expect(204);
      await http.delete(`${API}/days/${day.id}`).set(asTrainer()).expect(204);
    });

    it('retires the previous program when a new one is created', async () => {
      const { body: replacement } = await http
        .post(`${API}/clients/${clientId}/programs`)
        .set(asTrainer())
        .send({ title: 'برنامج بديل', startDate: '2026-09-01' })
        .expect(201);

      const { body: list } = await http
        .get(`${API}/clients/${clientId}/programs`)
        .set(asTrainer())
        .expect(200);

      const active = list.filter((p: { isActive: boolean }) => p.isActive);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(replacement.id);

      // Restore the original as the active program for the remaining tests.
      await http.delete(`${API}/programs/${replacement.id}`).set(asTrainer()).expect(204);
      await http
        .patch(`${API}/programs/${programId}`)
        .set(asTrainer())
        .send({ isActive: true })
        .expect(200);
    });
  });

  describe('F4 — the trainer sets nutrition targets', () => {
    it('creates a plan with meals', async () => {
      const { body } = await http
        .post(`${API}/clients/${clientId}/nutrition-plan`)
        .set(asTrainer())
        .send({
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 60,
          fiberMinG: 30,
          waterMinL: 3,
          stepsMin: 8000,
          meals: [
            { name: 'الإفطار', description: 'شوفان وبيض' },
            { name: 'الغداء', description: 'أرز ودجاج' },
          ],
        })
        .expect(201);

      expect(body).toMatchObject({ dailyCalories: 2000, fiberMinG: 30, stepsMin: 8000 });
      expect(body.meals).toHaveLength(2);
    });

    it('rejects an unsafe calorie target', () =>
      http
        .post(`${API}/clients/${clientId}/nutrition-plan`)
        .set(asTrainer())
        .send({ dailyCalories: 100, proteinG: 10, carbsG: 10, fatG: 5 })
        .expect(400));
  });

  describe('F5/F6 — the client views and logs', () => {
    beforeAll(async () => {
      const { body } = await http
        .post(`${API}/auth/login`)
        .send({ email: clientEmail, password: CLIENT_PASSWORD })
        .expect(200);

      clientToken = body.accessToken;
      expect(body.role).toBe('client');
    });

    it('shows the client their active program', async () => {
      const { body } = await http.get(`${API}/programs/active`).set(asClient()).expect(200);

      expect(body.id).toBe(programId);
      expect(body.days).toHaveLength(3);
    });

    it('shows the client every nutrition target, including fibre, water and steps', async () => {
      const { body } = await http.get(`${API}/nutrition-plan/active`).set(asClient()).expect(200);

      expect(body).toMatchObject({
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 60,
        fiberMinG: 30,
        waterMinL: 3,
        stepsMin: 8000,
      });
      expect(body.meals).toHaveLength(2);
    });

    it('records an exercise log the trainer can see immediately', async () => {
      await http
        .post(`${API}/exercises/${exerciseIds[0]}/logs`)
        .set(asClient())
        .send({ actualWeightKg: 40, actualReps: '10/9/9' })
        .expect(201);

      const { body } = await http.get(`${API}/programs/${programId}`).set(asTrainer()).expect(200);

      const logs = body.days.flatMap((d: { exercises: { logs: unknown[] }[] }) =>
        d.exercises.flatMap((e) => e.logs),
      );
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({ actualWeightKg: 40, actualReps: '10/9/9' });
    });
  });

  describe('F7 — the daily log is one record per day', () => {
    it('creates the day', async () => {
      const { body } = await http
        .post(`${API}/daily-logs`)
        .set(asClient())
        .send({
          logDate: TODAY,
          weightKg: 68.4,
          caloriesActual: 1850,
          proteinGActual: 140,
          carbsGActual: 180,
          fatGActual: 55,
          fiberGActual: 25,
          waterLActual: 2.5,
          sleepHours: 7.5,
          stepsActual: 9000,
          notes: 'يوم جيد',
        })
        .expect(201);

      expect(body.logDate).toBe(TODAY);
    });

    it('updates rather than duplicating when the same date is submitted again', async () => {
      await http
        .post(`${API}/daily-logs`)
        .set(asClient())
        .send({ logDate: TODAY, weightKg: 68.1, caloriesActual: 1900 })
        .expect(201);

      const { body } = await http
        .get(`${API}/clients/${clientId}/daily-logs`)
        .query({ from: TODAY, to: TODAY })
        .set(asTrainer())
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].weightKg).toBe(68.1);
      // Fields omitted on resubmission are cleared, not silently retained.
      expect(body[0].sleepHours).toBeNull();
    });

    it('rejects a future date', () =>
      http
        .post(`${API}/daily-logs`)
        .set(asClient())
        .send({ logDate: '2099-01-01', weightKg: 70 })
        .expect(400));

    it('rejects a malformed date', () =>
      http.post(`${API}/daily-logs`).set(asClient()).send({ logDate: '24-08-2026' }).expect(400));
  });

  describe('F8 — the weekly summary', () => {
    it('aggregates the current week when no week is given', async () => {
      const { body } = await http
        .get(`${API}/clients/${clientId}/weekly-summary`)
        .set(asTrainer())
        .expect(200);

      expect(body.week).toMatch(/^\d{4}-W\d{2}$/);
      expect(body.daysLogged).toBe(1);
      expect(body.nutrition.calories.actual).toBe(1900);
      expect(body.nutrition.calories.target).toBe(14_000);
      expect(body.nutrition.calories.remaining).toBe(12_100);
      expect(body.adherence).toMatchObject({ planned: 6, logged: 1 });
      expect(body.weightTrend).toHaveLength(1);
      expect(body.previousWeek).toBeDefined();
    });

    it('accepts an explicit ISO week', async () => {
      const { body } = await http
        .get(`${API}/clients/${clientId}/weekly-summary`)
        .query({ week: '2026-W35' })
        .set(asTrainer())
        .expect(200);

      expect(body.week).toBe('2026-W35');
      expect(body.weekStart).toBe('2026-08-24');
      expect(body.weekEnd).toBe('2026-08-30');
    });

    it('rejects a malformed week', () =>
      http
        .get(`${API}/clients/${clientId}/weekly-summary`)
        .query({ week: 'banana' })
        .set(asTrainer())
        .expect(400));
  });


  describe('F9 — password changes', () => {
    // Left as the trainer's password at the end of this block, so the order
    // of assertions below matters.
    const ROTATED = 'RotatedPass456';
    const CLIENT_REPLACEMENT = 'Replacement789';

    // 400, so the web client does not mistake it for an expired session.
    it('refuses a change when the current password is wrong', async () => {
      await http
        .post(`${API}/auth/password`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ currentPassword: 'not-the-password', newPassword: ROTATED })
        .expect(400);
    });

    it('refuses a new password identical to the current one', async () => {
      await http
        .post(`${API}/auth/password`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ currentPassword: TRAINER_PASSWORD, newPassword: TRAINER_PASSWORD })
        .expect(400);
    });

    it('refuses a new password under eight characters', async () => {
      await http
        .post(`${API}/auth/password`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ currentPassword: TRAINER_PASSWORD, newPassword: 'short' })
        .expect(400);
    });

    it('rejects an unauthenticated caller', async () => {
      await http
        .post(`${API}/auth/password`)
        .send({ currentPassword: TRAINER_PASSWORD, newPassword: ROTATED })
        .expect(401);
    });

    it('changes the trainer password, and only the new one then works', async () => {
      await http
        .post(`${API}/auth/password`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ currentPassword: TRAINER_PASSWORD, newPassword: ROTATED })
        .expect(204);

      const trainer = await prisma.trainer.findUniqueOrThrow({ where: { id: trainerId } });

      await http
        .post(`${API}/auth/login`)
        .send({ email: trainer.email, password: TRAINER_PASSWORD })
        .expect(401);

      const { body } = await http
        .post(`${API}/auth/login`)
        .send({ email: trainer.email, password: ROTATED })
        .expect(200);

      // Later blocks keep using the trainer, so carry the fresh token forward.
      trainerToken = body.accessToken;
    });

    it('lets the trainer issue a client a replacement password', async () => {
      await http
        .post(`${API}/clients/${clientId}/password`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ password: CLIENT_REPLACEMENT })
        .expect(204);

      await http
        .post(`${API}/auth/login`)
        .send({ email: clientEmail, password: CLIENT_PASSWORD })
        .expect(401);

      const { body } = await http
        .post(`${API}/auth/login`)
        .send({ email: clientEmail, password: CLIENT_REPLACEMENT })
        .expect(200);

      clientToken = body.accessToken;
    });

    it('does not let a client reset anyone\'s password', async () => {
      await http
        .post(`${API}/clients/${clientId}/password`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ password: 'ClientChosen123' })
        .expect(403);
    });

    it('lets the client change their own password', async () => {
      await http
        .post(`${API}/auth/password`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ currentPassword: CLIENT_REPLACEMENT, newPassword: 'ClientChosen123' })
        .expect(204);

      await http
        .post(`${API}/auth/login`)
        .send({ email: clientEmail, password: 'ClientChosen123' })
        .expect(200);
    });
  });

  describe('role and ownership enforcement', () => {
    let otherClientToken: string;

    beforeAll(async () => {
      const email = uniqueEmail('other');
      await http
        .post(`${API}/clients`)
        .set(asTrainer())
        .send({ name: 'متدرب آخر', email, password: CLIENT_PASSWORD })
        .expect(201);

      const { body } = await http
        .post(`${API}/auth/login`)
        .send({ email, password: CLIENT_PASSWORD })
        .expect(200);

      otherClientToken = body.accessToken;
    });

    const asOtherClient = () => ({ Authorization: `Bearer ${otherClientToken}` });

    it.each([
      ['GET', '/clients'],
      ['POST', '/clients'],
    ])('denies a client the trainer route %s %s', (method, path) =>
      http[method.toLowerCase() as 'get' | 'post'](`${API}${path}`).set(asClient()).expect(403),
    );

    it('denies a trainer the client-only active-program route', () =>
      http.get(`${API}/programs/active`).set(asTrainer()).expect(403));

    it("denies a client logging another client's exercise", () =>
      http
        .post(`${API}/exercises/${exerciseIds[1]}/logs`)
        .set(asOtherClient())
        .send({ actualReps: '10' })
        .expect(403));

    it("denies a client reading another client's daily logs", () =>
      http.get(`${API}/clients/${clientId}/daily-logs`).set(asOtherClient()).expect(403));

    it('returns 404 for a client the trainer does not own', () =>
      http.get(`${API}/clients/00000000-0000-4000-8000-000000000000`).set(asTrainer()).expect(404));

    it('returns 400 for an id that is not a UUID', () =>
      http.get(`${API}/clients/not-a-uuid`).set(asTrainer()).expect(400));
  });

  describe('error shape', () => {
    it('returns the unified error body', async () => {
      const { body } = await http.get(`${API}/clients`).expect(401);

      expect(body).toMatchObject({
        statusCode: 401,
        path: `${API}/clients`,
      });
      expect(body.timestamp).toEqual(expect.any(String));
      expect(body.message).toBeDefined();
    });
  });

  describe('health', () => {
    it('is public and reports the database', async () => {
      const { body } = await http.get(`${API}/health`).expect(200);

      expect(body.status).toBe('ok');
      expect(body.info.database.status).toBe('up');
    });
  });
});
