# Tech Spec — Personal Training Management Platform (MVP v0)

> This is a comprehensive technical reference (BRD + PRD + SDD + System Design + How The System Works) intended to be handed directly to a coding agent for implementation.

---

## 1. Product Overview

A platform that lets a single personal trainer (a pilot partner) manage their clients: build a customized workout program and nutrition plan for each client, and track their daily and weekly adherence and progress from one place — replacing the current Excel + WhatsApp + PDF workflow.

**MVP v0 Scope:**
- Single trainer only (seeded in the database, no public sign-up)
- No WhatsApp integration
- No payment system
- No automation for periodization schemes (e.g. Double Progression) — managed manually by the trainer
- One web app (Next.js) serving both Trainer and Client, with role-based views

**Fully out of scope for this version:**
- WhatsApp Business API
- Payments / subscriptions
- In-app discovery / marketplace
- Multi-trainer / multi-tenant support
- Progress photos
- Push notifications
- Advanced analytics beyond the weekly summary
- Wearable integrations (Whoop, Apple Watch, Fitbit, etc.)

---

## 2. Roles

| Role | Description |
|---|---|
| **Trainer** | A single user, seeded in the database, manages all clients |
| **Client** | Account created by the Trainer; receives their program and logs their progress |

---

## 3. User Stories

| # | Story | Priority |
|---|---|---|
| U1 | Trainer logs in securely to their single account | Must |
| U2 | Trainer adds a new Client with full profile data (height, age, weight goal, etc.) | Must |
| U3 | Trainer builds a workout program with flexible days and exercises | Must |
| U4 | Trainer sets comprehensive daily nutrition targets for each Client | Must |
| U5 | Trainer sees an aggregated weekly summary per Client at a glance | Must |
| U6 | Client views their program and logs actual execution for each exercise | Must |
| U7 | Client logs their full daily data (weight, macros, sleep, steps, etc.) in one record per day | Must |
| U8 | Client views their complete nutrition plan | Must |

---

## 4. Functional Requirements (Detailed Features)

### F1 — Login (Trainer + Client)
- Email/password login for both Trainer and Client
- No public sign-up; the Trainer is pre-seeded in the database, and Clients are created only by the Trainer
- **Acceptance**: Each role can only access their own interface after login, enforced via a JWT carrying the role

### F2 — Client Management (Trainer Dashboard)
- List all Clients
- Add a new Client with fields: name, email, initial password, heightCm, age, startDate, phone, goalWeightKg, goalNote
- View each Client's profile (personal data, current program, latest daily log)
- **Acceptance**: Trainer can add a new Client with all fields above and see them immediately in the list

### F3 — Create and Edit Workout Program (Trainer Dashboard)
- Create a WorkoutProgram for a given Client (title, startDate)
- Add WorkoutDay entries (dayLabel, orderIndex)
- Add ExerciseItem entries per day: name, sets, reps (flexible string, e.g. "8-10" or "AMRAP"), restInterval (optional string), notes, orderIndex
- Edit/delete an exercise or a day
- **Scope note**: The trainer adds any exercise with whatever sets/reps target they see fit. Periodization schemes (weight/reps changing week to week across a training cycle) are **not built as automation in this version**
- **Acceptance**: Trainer can build a full program (3+ days, each with exercises) and it appears immediately for the Client

### F4 — Create Nutrition Plan (Trainer Dashboard)
- Set daily targets: dailyCalories, proteinG, carbsG, fatG, fiberMinG, waterMinL, stepsMin
- Add Meals (name, description)
- **Acceptance**: Client sees all their daily targets in full (including fiber/water/steps)

### F5 — View Program and Log Adherence (Client App)
- View the current WorkoutProgram (days and exercises)
- Log an ExerciseLog: actualWeightKg + actualReps (string, e.g. "10/9/9" meaning 3 sets with different rep counts)
- **Acceptance**: After a Client logs an exercise as completed, it appears immediately for the Trainer

### F6 — View Nutrition Plan (Client App)
- View full daily targets (calories/macros/fiber/water/steps) + meals
- **Acceptance**: Full, complete display of all targets and meals

### F7 — Daily Log (Client App)
Each day, the Client logs:
- weightKg, caloriesActual, carbsGActual, proteinGActual, fatGActual, fiberGActual, waterLActual, sleepHours, stepsActual, notes (free text)

One record per Client per date only (upsert based on `clientId + logDate` — resubmitting on the same day updates the existing record)

- **Acceptance**: Trainer sees a complete, date-ordered log of all a Client's entries, with all fields

### F8 — Aggregated Weekly Summary (Trainer Dashboard)
- Weight trend over the weeks (line chart)
- Total/average actual calories and macros for the week vs. targets (total, remaining)
- Workout adherence rate (how many ExerciseLogs were recorded out of the number planned)
- Current week vs. previous week comparison
- **Computed live from existing tables (DailyLog + ExerciseLog), with no separate storage table at this stage**
- **Acceptance**: Trainer opens a Client's profile and sees the weekly summary at a glance, without opening each DailyLog individually

---

## 5. Non-Functional Requirements

- **Language**: Fully Arabic, full RTL support on both interfaces (Trainer + Client)
- **Performance**: API response time under 300ms for standard read operations
- **Security**: Hashed passwords (bcrypt, salt rounds ≥ 10), JWT with a reasonable expiry (e.g. 7 days), HTTPS mandatory in production
- **Compatibility**: Modern browsers (Chrome, Safari) — desktop and mobile web
- **Backup**: Daily database backup (scheduled pg_dump) from day one of launch — this is sensitive health data for a real pilot partner

---

## 6. MVP Success Metrics

- The pilot trainer actually replaces their Excel/PDF workflow with this system for a 2–4 week trial period
- Clients log their daily data regularly inside the app instead of WhatsApp/Excel
- Trainer can build a full program + nutrition plan for a new Client in under 15 minutes
- Trainer can review a Client's full week (weekly summary) in under a minute

---

## 7. System Design

### 7.1 Monorepo Structure

```
/apps
  /api        → NestJS backend
  /web        → Next.js frontend (Trainer + Client, same app with role-based route groups)
/packages
  /shared     → Shared TypeScript types/DTOs between api and web
```

### 7.2 Stack
- **Backend**: NestJS + TypeScript
- **Frontend**: Next.js + TypeScript + Tailwind (RTL enabled)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (passport-jwt)
- **Deployment**: Docker Compose (api + web + postgres containers) on a single server, with Nginx/Caddy as a reverse proxy for HTTPS

### 7.3 How The System Works (End-to-End Flows)

**Flow 1 — Trainer builds a program for a new Client:**
1. Trainer logs in → receives a JWT with role `trainer`
2. Trainer opens "Add Client" → fills the form (personal data + goal) → `POST /clients`
3. Trainer opens the new Client's profile → adds a WorkoutProgram → `POST /clients/:id/programs`
4. For each workout day → `POST /programs/:id/days` → for each exercise in that day → `POST /days/:id/exercises`
5. Trainer adds a NutritionPlan → `POST /clients/:id/nutrition-plan`
6. The Trainer manually hands the Client their login credentials (email + initial password) outside the system (e.g. via WhatsApp — this manual handoff is acceptable for the MVP)

**Flow 2 — Client logs their day:**
1. Client logs in → receives a JWT with role `client`
2. Client opens "My Program" → `GET /programs/active` → sees today's exercises
3. After each exercise, logs the actual (weight + reps) → `POST /exercises/:id/logs`
4. Client opens "Daily Log" → fills the fields (weight, calories, macros, sleep, steps, notes) → `POST /daily-logs` (upsert by `clientId + logDate`)

**Flow 3 — Trainer reviews a Client's week:**
1. Trainer opens the Client's profile → "Weekly Summary" tab
2. Frontend requests `GET /clients/:id/weekly-summary?week=YYYY-WW`
3. Backend aggregates all DailyLog and ExerciseLog entries for that week, computing: average weight, total/remaining macros vs. NutritionPlan target × 7 days, workout adherence rate (number of ExerciseLogs recorded ÷ number of ExerciseItems planned for that week)
4. Frontend displays the result (numbers + a weight trend chart)

---

## 8. Data Model — Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Trainer {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())

  clients Client[]

  @@map("trainers")
}

model Client {
  id           String    @id @default(uuid())
  trainerId    String
  trainer      Trainer   @relation(fields: [trainerId], references: [id])
  name         String
  email        String    @unique
  passwordHash String
  heightCm     Float?
  age          Int?
  startDate    DateTime?
  phone        String?
  goalWeightKg Float?
  goalNote     String?
  createdAt    DateTime  @default(now())

  workoutPrograms WorkoutProgram[]
  nutritionPlans  NutritionPlan[]
  dailyLogs       DailyLog[]

  @@map("clients")
}

model WorkoutProgram {
  id        String   @id @default(uuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id])
  title     String
  startDate DateTime
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  days WorkoutDay[]

  @@map("workout_programs")
}

model WorkoutDay {
  id         String         @id @default(uuid())
  programId  String
  program    WorkoutProgram @relation(fields: [programId], references: [id])
  dayLabel   String
  orderIndex Int

  exercises ExerciseItem[]

  @@map("workout_days")
}

model ExerciseItem {
  id           String     @id @default(uuid())
  workoutDayId String
  workoutDay   WorkoutDay @relation(fields: [workoutDayId], references: [id])
  name         String
  sets         Int
  reps         String
  restInterval String?
  notes        String?
  orderIndex   Int        @default(0)

  logs ExerciseLog[]

  @@map("exercise_items")
}

model ExerciseLog {
  id             String       @id @default(uuid())
  exerciseItemId String
  exerciseItem   ExerciseItem @relation(fields: [exerciseItemId], references: [id])
  completedAt    DateTime     @default(now())
  actualWeightKg Float?
  actualReps     String?

  @@map("exercise_logs")
}

model NutritionPlan {
  id            String   @id @default(uuid())
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])
  dailyCalories Int
  proteinG      Int
  carbsG        Int
  fatG          Int
  fiberMinG     Int?
  waterMinL     Float?
  stepsMin      Int?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  meals Meal[]

  @@map("nutrition_plans")
}

model Meal {
  id              String        @id @default(uuid())
  nutritionPlanId String
  nutritionPlan   NutritionPlan @relation(fields: [nutritionPlanId], references: [id])
  name            String
  description     String

  @@map("meals")
}

model DailyLog {
  id             String   @id @default(uuid())
  clientId       String
  client         Client   @relation(fields: [clientId], references: [id])
  logDate        DateTime
  weightKg       Float?
  caloriesActual Int?
  carbsGActual   Int?
  proteinGActual Int?
  fatGActual     Int?
  fiberGActual   Int?
  waterLActual   Float?
  sleepHours     Float?
  stepsActual    Int?
  notes          String?

  @@unique([clientId, logDate])
  @@map("daily_logs")
}
```

---

## 9. API Design

### Auth
- `POST /auth/login` → body: `{ email, password }` → response: `{ accessToken, role }`

### Clients (Trainer only)
- `GET /clients`
- `POST /clients` — body: all Client fields (name, email, password, heightCm, age, startDate, phone, goalWeightKg, goalNote)
- `GET /clients/:id`

### Programs
- `POST /clients/:id/programs` (Trainer) — body: `{ title, startDate }`
- `POST /programs/:id/days` (Trainer) — body: `{ dayLabel, orderIndex }`
- `POST /days/:id/exercises` (Trainer) — body: `{ name, sets, reps, restInterval?, notes?, orderIndex }`
- `GET /programs/active` (Client) — returns the current active program with all its days and exercises
- `POST /exercises/:id/logs` (Client) — body: `{ actualWeightKg?, actualReps? }`

### Nutrition
- `POST /clients/:id/nutrition-plan` (Trainer) — body: all NutritionPlan fields + an array of Meals
- `GET /nutrition-plan/active` (Client)

### Daily Logs
- `POST /daily-logs` (Client) — body: `{ logDate, weightKg?, caloriesActual?, ... }` — upsert by `clientId + logDate`
- `GET /clients/:id/daily-logs?from=&to=` (Trainer)

### Summary
- `GET /clients/:id/weekly-summary?week=YYYY-WW` (Trainer)

---

## 10. Module Breakdown (NestJS)

| Module | Responsibility |
|---|---|
| `AuthModule` | Login, JWT strategy, `RolesGuard` + `@Roles()` decorator |
| `ClientsModule` | Client CRUD |
| `ProgramsModule` | WorkoutProgram, WorkoutDay, ExerciseItem, ExerciseLog |
| `NutritionModule` | NutritionPlan, Meal |
| `DailyLogsModule` | DailyLog (upsert logic) |
| `SummaryModule` | Weekly summary computation (live aggregation, no separate table) |

### Auth Design
- JWT payload: `{ sub: userId, role: 'trainer' | 'client' }`
- A general `RolesGuard` + `@Roles('trainer')` / `@Roles('client')` decorator on each endpoint
- Passwords: bcrypt, salt rounds ≥ 10

### Validation
- A DTO per endpoint using `class-validator` + `class-transformer`
- Example: `CreateClientDto` validates a proper email format, a positive `heightCm`, an optional `goalWeightKg`

### Error Handling
- A general `HttpExceptionFilter`: `{ statusCode, message, error }`
- Unified errors: 400 (Validation), 401/403 (Auth), 404 (Not Found)

---

## 11. Deployment

- Docker Compose: 3 containers (`api`, `web`, `postgres`)
- Reverse proxy (Nginx/Caddy) in front of the containers for HTTPS
- Environment variables: `DATABASE_URL`, `JWT_SECRET` — in a `.env` file not committed to Git
- Backup: daily scheduled `pg_dump`

---

## 12. Assumptions & Risks

| Risk | Mitigation |
|---|---|
| The pilot trainer reverts to WhatsApp instead of the app | Track actual usage weekly during the trial period |
| Sensitive health data without advanced security standards yet | Encryption + HTTPS as a minimum for the MVP, reassess before scaling |
| No backup risks losing weeks of real tracking data | Daily backup from day one of launch |

---

## 13. Post-MVP Roadmap (not required at this stage, for context only)

WhatsApp Business API integration · Payment system · General habit tracking · Wearable integrations · AI Workout Builder · Multi-tenant (multiple trainers) · Progress photos · Native mobile app
