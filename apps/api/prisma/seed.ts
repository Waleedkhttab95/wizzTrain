/**
 * Seeds the single pilot trainer (spec §2: no public sign-up — the trainer is
 * pre-seeded, and clients are created only by the trainer).
 *
 * With `SEED_DEMO=true` it also fills the database with a worked example: a
 * reusable workout template, three clients at different levels of adherence,
 * programs, nutrition plans and three weeks of daily logs. That is what makes
 * the app explorable on a fresh checkout — without it every screen is an empty
 * state and the weekly summary has nothing to compute.
 *
 * Idempotent on both halves. Re-running updates the trainer rather than
 * failing on the unique email, and the demo clients are keyed on their emails,
 * so a second run replaces their data instead of duplicating it.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** YYYY-MM-DD in UTC, matching how DailyLog.logDate is stored. */
function isoDate(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

const TEMPLATE = {
  title: 'تقسيم دفع/سحب/أرجل',
  notes: 'ثلاثة أيام بالأسبوع. قالب جاهز يُطبَّق على أي متدرب ثم يُعدَّل نسخته وحدها.',
  days: [
    {
      dayLabel: 'دفع',
      exercises: [
        { name: 'بنش برس', sets: 4, reps: '8-10', restInterval: '90 ثانية' },
        { name: 'ضغط أكتاف بالدمبل', sets: 3, reps: '10-12', restInterval: '75 ثانية' },
        { name: 'تفتيح كابل', sets: 3, reps: '12-15', restInterval: '60 ثانية' },
        { name: 'تراي سبس بالحبل', sets: 3, reps: '12', restInterval: '60 ثانية' },
      ],
    },
    {
      dayLabel: 'سحب',
      exercises: [
        { name: 'سحب أرضي', sets: 4, reps: '8-10', restInterval: '90 ثانية' },
        { name: 'عقلة بمساعدة', sets: 3, reps: '8', restInterval: '90 ثانية' },
        { name: 'تجديف بالدمبل', sets: 3, reps: '10-12', restInterval: '75 ثانية' },
        { name: 'باي سبس بالبار', sets: 3, reps: '12', restInterval: '60 ثانية' },
      ],
    },
    {
      dayLabel: 'أرجل',
      exercises: [
        { name: 'سكوات', sets: 5, reps: '5', restInterval: '150 ثانية' },
        { name: 'رفعة ميتة رومانية', sets: 3, reps: '8-10', restInterval: '120 ثانية' },
        { name: 'ضغط أرجل', sets: 3, reps: '12', restInterval: '90 ثانية' },
        { name: 'سمانة واقف', sets: 4, reps: '15', restInterval: '45 ثانية' },
      ],
    },
  ],
};

const MEALS = [
  { name: 'الفطور', description: 'شوفان 80 جم · 3 بيضات · موزة' },
  { name: 'الغداء', description: 'صدر دجاج 200 جم · أرز 150 جم · سلطة' },
  { name: 'العشاء', description: 'سلمون 180 جم · بطاطا مشوية · خضار' },
  { name: 'سناك', description: 'زبادي يوناني · حفنة لوز' },
];

/**
 * Three clients chosen to cover the three adherence states the roster colours
 * by, so the dashboard is not a wall of one status.
 *   committed — logs almost every day
 *   partial   — logs about half the week
 *   behind    — stopped two weeks ago
 */
const DEMO_CLIENTS = [
  {
    name: 'ريم القحطاني',
    email: 'reem@wizzapp.local',
    heightCm: 163,
    age: 26,
    phone: '0500000001',
    startWeightKg: 68,
    goalWeightKg: 62,
    goalNote: 'تنشيف تدريجي مع الحفاظ على الكتلة',
    calories: 1900,
    protein: 140,
    carbs: 190,
    fat: 60,
    /** How many of the last 21 days they logged, newest first. */
    logDays: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 20],
    weightFrom: 68,
    weightTo: 65.4,
  },
  {
    name: 'فهد الحربي',
    email: 'fahad@wizzapp.local',
    heightCm: 178,
    age: 31,
    phone: '0500000002',
    startWeightKg: 85.9,
    goalWeightKg: 78,
    goalNote: 'نزول وزن مع رفع قوة البنش',
    calories: 2200,
    protein: 180,
    carbs: 280,
    fat: 75,
    logDays: [0, 2, 3, 6, 7, 9, 13, 14, 16, 20],
    weightFrom: 85.9,
    weightTo: 82.6,
  },
  {
    name: 'نور إبراهيم',
    email: 'nour@wizzapp.local',
    heightCm: 170,
    age: 27,
    phone: '0500000003',
    startWeightKg: 74,
    goalWeightKg: 65,
    goalNote: 'بداية هادئة، التركيز على الالتزام قبل الأرقام',
    calories: 2000,
    protein: 150,
    carbs: 210,
    fat: 65,
    logDays: [14, 15, 16, 17, 18, 19, 20],
    weightFrom: 74,
    weightTo: 73.2,
  },
];

async function seedTrainer(): Promise<{ id: string; email: string }> {
  const name = process.env.SEED_TRAINER_NAME ?? 'المدرب';
  const email = (process.env.SEED_TRAINER_EMAIL ?? 'trainer@wizzapp.local').toLowerCase();
  const password = process.env.SEED_TRAINER_PASSWORD;
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  if (!password) {
    throw new Error(
      'SEED_TRAINER_PASSWORD is not set. Refusing to seed a trainer with a default password.',
    );
  }
  if (password.length < 8) {
    throw new Error('SEED_TRAINER_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const trainer = await prisma.trainer.upsert({
    where: { email },
    create: { name, email, passwordHash },
    update: { name, passwordHash },
  });

  console.log(`✔ Trainer ready: ${trainer.email}`);
  return trainer;
}

async function seedTemplate(trainerId: string): Promise<void> {
  const existing = await prisma.programTemplate.findFirst({
    where: { trainerId, title: TEMPLATE.title },
  });
  if (existing) {
    await prisma.programTemplate.delete({ where: { id: existing.id } });
  }

  await prisma.programTemplate.create({
    data: {
      trainerId,
      title: TEMPLATE.title,
      notes: TEMPLATE.notes,
      days: {
        create: TEMPLATE.days.map((day, dayIndex) => ({
          dayLabel: day.dayLabel,
          orderIndex: dayIndex,
          exercises: {
            create: day.exercises.map((exercise, i) => ({ ...exercise, orderIndex: i })),
          },
        })),
      },
    },
  });

  console.log(`✔ Template ready: ${TEMPLATE.title}`);
}

async function seedClient(
  trainerId: string,
  demo: (typeof DEMO_CLIENTS)[number],
  password: string,
  saltRounds: number,
): Promise<void> {
  const email = demo.email.toLowerCase();

  // Deleting first keeps a re-run from stacking a second program and plan on
  // the same person; the cascade clears their logs with them.
  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) {
    await prisma.client.delete({ where: { id: existing.id } });
  }

  const client = await prisma.client.create({
    data: {
      trainerId,
      name: demo.name,
      email,
      passwordHash: await bcrypt.hash(password, saltRounds),
      heightCm: demo.heightCm,
      age: demo.age,
      phone: demo.phone,
      startDate: isoDate(21),
      startWeightKg: demo.startWeightKg,
      goalWeightKg: demo.goalWeightKg,
      goalNote: demo.goalNote,
    },
  });

  const program = await prisma.workoutProgram.create({
    data: {
      clientId: client.id,
      title: `برنامج ${demo.name.split(' ')[0]} — المرحلة 1`,
      startDate: isoDate(21),
      isActive: true,
      days: {
        create: TEMPLATE.days.map((day, dayIndex) => ({
          dayLabel: day.dayLabel,
          orderIndex: dayIndex,
          exercises: {
            create: day.exercises.map((exercise, i) => ({ ...exercise, orderIndex: i })),
          },
        })),
      },
    },
    include: { days: { include: { exercises: true } } },
  });

  await prisma.nutritionPlan.create({
    data: {
      clientId: client.id,
      isActive: true,
      dailyCalories: demo.calories,
      proteinG: demo.protein,
      carbsG: demo.carbs,
      fatG: demo.fat,
      fiberMinG: 30,
      waterMinL: 3,
      stepsMin: 9000,
      meals: { create: MEALS },
    },
  });

  // Weight walks from start to current across the logged days, newest first.
  const span = demo.weightFrom - demo.weightTo;
  const oldest = Math.max(...demo.logDays);

  await prisma.dailyLog.createMany({
    data: demo.logDays.map((daysAgo) => {
      const progress = oldest === 0 ? 1 : (oldest - daysAgo) / oldest;
      const weight = Number((demo.weightFrom - span * progress).toFixed(1));
      return {
        clientId: client.id,
        logDate: isoDate(daysAgo),
        weightKg: weight,
        caloriesActual: demo.calories - 50,
        proteinGActual: demo.protein - 15,
        carbsGActual: demo.carbs - 8,
        fatGActual: demo.fat,
        fiberGActual: 28,
        waterLActual: 2.8,
        sleepHours: 7,
        stepsActual: 8200,
      };
    }),
  });

  // A handful of exercise logs on the most recent training day, so the weekly
  // summary has an adherence rate to report rather than null.
  const firstDay = program.days[0];
  const recent = demo.logDays.filter((d) => d <= 7).slice(0, 3);
  if (firstDay && recent.length > 0) {
    await prisma.exerciseLog.createMany({
      data: firstDay.exercises.slice(0, 3).flatMap((exercise, i) =>
        recent.slice(0, 2).map((daysAgo) => ({
          exerciseItemId: exercise.id,
          completedAt: isoDate(daysAgo),
          actualWeightKg: 40 + i * 5,
          actualReps: '10/9/9',
        })),
      ),
    });
  }

  console.log(`  • ${demo.name} — ${demo.logDays.length} daily logs`);
}

async function main(): Promise<void> {
  const trainer = await seedTrainer();

  if (process.env.SEED_DEMO !== 'true') {
    console.log('\nℹ Demo data skipped. Set SEED_DEMO=true to add example clients.');
    return;
  }

  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      'SEED_DEMO=true needs SEED_DEMO_PASSWORD (8+ characters). It is the password every demo client signs in with.',
    );
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  await seedTemplate(trainer.id);

  console.log('✔ Demo clients:');
  for (const demo of DEMO_CLIENTS) {
    await seedClient(trainer.id, demo, password, saltRounds);
  }

  console.log('\n  Every demo client signs in with SEED_DEMO_PASSWORD.');
  console.log('  Emails: ' + DEMO_CLIENTS.map((c) => c.email).join(', '));
}

main()
  .catch((error) => {
    console.error('✖ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
