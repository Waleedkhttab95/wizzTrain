/**
 * Seeds the single pilot trainer (spec §2: no public sign-up — the trainer is
 * pre-seeded, and clients are created only by the trainer).
 *
 * Idempotent: re-running updates the seeded trainer's name and password rather
 * than failing on the unique email, so it is safe to run on every deploy.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

  console.log(`✔ Trainer ready: ${trainer.email} (${trainer.id})`);
}

main()
  .catch((error) => {
    console.error('✖ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
