# منصة إدارة التدريب الشخصي — Personal Training Management Platform

MVP v0 backend, implementing [`TECH_SPEC_EN.md`](TECH_SPEC_EN.md).

A single personal trainer manages their clients: builds a workout program and a
nutrition plan for each one, and reviews their daily and weekly adherence from
one place — replacing an Excel + WhatsApp + PDF workflow.

**Status:** both apps are built and verified — the NestJS API and the Next.js
web app (Trainer + Client, Arabic RTL).

---

## Stack

| Layer | Choice |
|---|---|
| API | NestJS 11 + TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT via `passport-jwt`, bcrypt password hashing |
| Validation | `class-validator` + `class-transformer`, Joi for environment config |
| Web | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| Deployment | Docker Compose (api + postgres), reverse proxy for HTTPS |

## Layout

```
apps/
  api/                  NestJS backend
    prisma/             schema, migrations, seed
    src/
      auth/             login, JWT strategy, password hashing
      clients/          client CRUD + the single ownership rule
      programs/         programs, days, exercises, exercise logs
      nutrition/        nutrition plans and meals
      daily-logs/       one record per client per date (upsert)
      summary/          weekly aggregation, computed live
      common/           guards, filters, decorators, date utilities
      config/           namespaced config + boot-time validation
    test/               e2e suite (supertest against a real database)
  web/                  Next.js frontend — one app, two role sections
    src/
      app/
        login/          shared sign-in, routes on the JWT role
        trainer/        roster, client profile, program builder, plan editor
        client/         program, nutrition, daily log, progress
      components/
        ui/             Button, Card, Field, Meter, Stat, Modal, Toast, Tabs
        shell/          role-aware nav: side rail on desktop, tab bar on phones
        trainer/        the trainer-only screens
        client/         the exercise card with inline logging
        charts/         hand-drawn SVG weight trend
      lib/              api client, auth context, formatters
packages/
  shared/               TypeScript contracts shared by api and web
scripts/
  backup.sh             daily pg_dump with retention
```

Feature modules are self-contained. The only thing a feature module imports from
another is `ClientAccessService` — the single answer to "may this caller touch
this client's data?" — which keeps the authorisation rule in one testable place
and stops the modules forming a dependency cycle.

---

## Getting started

### 1. Environment

```bash
cp .env.example .env
```

Then edit `.env`. Two values must be set before anything will boot:

```bash
openssl rand -base64 48   # paste into JWT_SECRET (minimum 32 characters)
```

- `SEED_TRAINER_PASSWORD` — the seed refuses to run without it, so the pilot
  trainer never ends up with a default password.
- `DATABASE_URL` — must match the `POSTGRES_*` values if you use Compose.

Every variable is validated by Joi at startup: a missing or malformed value
fails the boot with a clear message instead of surfacing on a later request.

### 2. Database

With Docker:

```bash
docker compose up -d postgres
```

Or point `DATABASE_URL` at any PostgreSQL you already run.

### 3. Install, migrate, seed

```bash
npm install
npm run build --workspace @wizzapp/shared
npm run prisma:migrate
npm run seed
```

### 4. Run

Two processes, in two terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

- **Web app** — http://localhost:3000
- **API** — http://localhost:4000/api/v1

Sign in with the `SEED_TRAINER_EMAIL` / `SEED_TRAINER_PASSWORD` from your `.env`.
The API routes you to the trainer or client section based on the role in the JWT.

If port 3000 is taken, run the web app elsewhere and add that origin to
`CORS_ORIGINS` — the API rejects any origin it wasn't told about:

```bash
WEB_PORT=3001 npm run dev:web
```

Check the API on its own:

```bash
curl http://localhost:4000/api/v1/health
```

### Interactive API docs

| | |
|---|---|
| **Swagger UI** | http://localhost:4000/api/docs |
| **OpenAPI JSON** | http://localhost:4000/api/docs/json |

To try a request: call `POST /auth/login` with your `SEED_TRAINER_EMAIL` /
`SEED_TRAINER_PASSWORD`, copy `accessToken`, click **Authorize**, paste it. The
token persists across page reloads.

Schemas are generated from the DTOs by the `@nestjs/swagger` CLI plugin, so
validation rules (min/max, patterns, required fields) and doc comments appear in
the docs automatically — there are no `@ApiProperty` decorators to keep in sync.

Docs are **on outside production and off inside it** — a public schema listing
every route on a health-data API is an unnecessary gift to anyone probing the
deployment. Override with `SWAGGER_ENABLED=true|false`.

---

## API

All routes are served under **`/api/v1`** (the prefix is `API_PREFIX`, the
version is a URI segment). Every route requires a `Bearer` JWT except
`POST /auth/login` and `GET /health`.

The JWT payload is `{ sub, role }` where role is `trainer` or `client`. A global
`JwtAuthGuard` rejects unauthenticated requests by default — a route is only
public if it is explicitly marked `@Public()`.

The tables below are a summary; `/api/docs` is the authoritative reference.

### Auth
| Method | Route | Role | Notes |
|---|---|---|---|
| POST | `/auth/login` | — | `{ email, password }` → `{ accessToken, role, user }` |
| GET | `/auth/me` | any | Restores a session on page reload |

### Clients
| Method | Route | Role |
|---|---|---|
| GET | `/clients` | trainer |
| POST | `/clients` | trainer |
| GET | `/clients/:id` | trainer |
| PATCH | `/clients/:id` | trainer |

`GET /clients/:id` returns the profile plus the active program, the active
nutrition plan and the latest daily log in one query — the trainer's detail view
without a request waterfall.

### Programs
| Method | Route | Role |
|---|---|---|
| GET / POST | `/clients/:id/programs` | trainer |
| GET | `/programs/:id` | trainer, owning client |
| PATCH / DELETE | `/programs/:id` | trainer |
| POST | `/programs/:id/days` | trainer |
| PATCH / DELETE | `/days/:id` | trainer |
| POST | `/days/:id/exercises` | trainer |
| PATCH / DELETE | `/exercises/:id` | trainer |
| GET | `/programs/active` | client |
| POST | `/exercises/:id/logs` | client |
| DELETE | `/exercises/logs/:logId` | trainer, owning client |

### Nutrition
| Method | Route | Role |
|---|---|---|
| GET / POST | `/clients/:id/nutrition-plan` | trainer |
| PATCH | `/nutrition-plan/:id` | trainer |
| GET | `/nutrition-plan/active` | client |

### Daily logs
| Method | Route | Role |
|---|---|---|
| POST | `/daily-logs` | client |
| GET | `/daily-logs/me` | client |
| GET | `/daily-logs/me/:date` | client |
| GET | `/clients/:id/daily-logs?from=&to=` | trainer |

### Summary
| Method | Route | Role |
|---|---|---|
| GET | `/clients/:id/weekly-summary?week=YYYY-Www` | trainer |
| GET | `/summary/weekly?week=YYYY-Www` | client |

### Errors

Every failure returns the same body:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "المتدرب غير موجود",
  "timestamp": "2026-08-29T16:47:29.967Z",
  "path": "/api/v1/clients/…"
}
```

Validation failures put an array of Arabic messages in `message`. Unexpected
errors are logged with a stack trace server-side and return a generic message,
so internals never reach the client.

---

## How it behaves

A few decisions worth knowing before building the frontend.

**One active program, one active plan.** Creating a program or a nutrition plan
retires the client's previous one, inside a transaction. `GET /programs/active`
and `GET /nutrition-plan/active` therefore always resolve to exactly one record,
or 404 when the trainer has not set one up yet.

**Daily logs are a full-day upsert.** `POST /daily-logs` is keyed on
`clientId + logDate`. Re-posting the same date **replaces** the record — a field
omitted on the second submission is cleared, not retained. Send the complete day
each time. Dates are `YYYY-MM-DD` in UTC and stored as a `DATE` column, so a
client's "today" does not shift with their timezone.

**Weekly summary is computed live**, with no stored aggregate (spec §F8):

- `week` is an ISO-8601 week (`2026-W35`), Monday to Sunday, defaulting to the
  current week.
- Nutrition `target` is the daily target × 7; `remaining` is floored at 0.
- Averages divide by the days that carry a value for *that* metric, not by 7 — a
  client who weighed in on 3 days gets the average of those 3, not one diluted
  by 4 blank days.
- `adherence.rate` is distinct exercises logged ÷ exercises planned in one pass
  through the active program, capped at 1. It is `null` (not 0) when nothing was
  planned, so the UI can distinguish "no program" from "missed everything".
- `null` consistently means "no data", never zero. Render it as such.

**Authorisation is checked per resource, not per route.** A trainer reaching a
client they do not own gets **404**, not 403 — a trainer should not be able to
probe which client IDs exist elsewhere. A client reaching another client's data
gets 403.

**Login is rate-limited** to `LOGIN_RATE_LIMIT` attempts per IP per
`LOGIN_RATE_TTL_MS` (default 5/minute); everything else to 120/minute. Raise the
login limit only for testing. An unknown email costs the same time as a wrong
password, so response timing does not reveal which emails are registered.

---

## Testing

```bash
npm test                      # 67 unit tests, no database needed
npm run test:e2e              # 35 e2e tests, needs a running migrated database
npm run lint
```

The e2e suite boots the real application with the same pipes, guards and filters
as production, walks the three end-to-end flows in spec §7.3 and the full role
matrix, then deletes everything it created. Run it against a scratch database:

```bash
DATABASE_URL=postgresql://…/wizzapp_test LOGIN_RATE_LIMIT=500 npm run test:e2e
```

`LOGIN_RATE_LIMIT` needs raising because the suite logs in more than five times.

---

## The web app

One Next.js app serves both roles, with a shared login that routes on the JWT
role. Arabic throughout, `dir="rtl"`, laid out with logical properties so the
mirroring is structural rather than a stack of overrides.

**Screens**

| Trainer | Client |
|---|---|
| Roster, add client | Today's workout, log each exercise |
| Client profile — 5 tabs | Nutrition plan with macro split |
| Program builder (days → exercises) | Daily log (full-day form) |
| Nutrition plan editor | Weekly progress |
| Weekly summary · daily-log history | |

**Design.** Near-black ground, one heat accent (`--color-blaze`) spent only on
the primary action and live state, steel blue for data. Cairo carries the Arabic;
Barlow Condensed sets the numerals, so weights and macros read like a scoreboard.
Committed single dark theme — it is a gym app.

**Two behaviours worth knowing before you change them:**

1. **The daily-log form loads the date before it renders.** `POST /daily-logs`
   replaces the whole day, so the form fetches `GET /daily-logs/me/:date` first,
   prefills every field, and always submits all of them. A partial submit would
   silently null out whatever the client entered earlier.
2. **The client picks their workout day.** `WorkoutDay` carries a label and an
   order but no weekday, so the backend cannot say which day is "today". The app
   remembers the last day logged (in `localStorage`, per program) and opens on
   the next one in the cycle — a suggestion the client can always override.

**Auth.** The API issues Bearer tokens and the web app is a static client, so the
token lives in `localStorage` and every request carries it. A 401 from anywhere
clears it and bounces to login. No server-side session to keep in sync.

## Deployment

```bash
docker compose up -d --build
```

Two containers: `api` and `postgres`. The API applies pending migrations at
start-up, so application code can never run against an older schema. Both bind
to `127.0.0.1` — put Nginx or Caddy in front for HTTPS, which spec §5 requires
in production.

`docker stop` sends SIGTERM, `dumb-init` forwards it, and Nest's shutdown hooks
close the HTTP server and disconnect Prisma before the container dies.

### Backups

Spec §5 and §12 call for a daily backup from day one — this is real health data
for a live pilot partner.

```bash
crontab -e
15 3 * * * /path/to/wizzapp/scripts/backup.sh >> /var/log/wizzapp-backup.log 2>&1
```

The script writes a gzipped `pg_dump` under `backups/`, keeps 14 days, and only
publishes the final filename once the dump completes, so a crashed run never
leaves a truncated file that looks valid. **Test a restore before you rely on
it** — the command is in the script's comments.

---

## Not built yet

- **Password change / reset** — a password is hashed once when the trainer
  creates the client and there is no route to change it. A client who loses
  theirs is locked out. Worth adding before the pilot.
- **Client archiving** — no `DELETE /clients/:id` and no active flag, so the
  roster only grows.
- Everything listed as out of scope in spec §1: WhatsApp, payments, multi-tenant,
  progress photos, push notifications, wearables

## Deviations from the spec

Small, deliberate, all in the same direction — making the described behaviour
unambiguous:

1. **Routes are prefixed `/api/v1`.** The spec lists bare paths. `packages/shared`
   exports `ApiRoutes` so the frontend never hardcodes them.
2. **`DailyLog.logDate` is a `DATE` column**, not a timestamp. The spec's
   "one record per client per date" is only well-defined without a time
   component.
3. **Cascade deletes and indexes** were added to the schema — deleting a program
   should not strand its days and exercises.
4. **Extra routes** beyond spec §9: `PATCH`/`DELETE` for days and exercises
   (required by §F3's "edit/delete an exercise or a day", but not listed),
   `GET /auth/me`, `GET /health`, and client-side read routes for their own
   history.
5. **Swagger UI at `/api/docs`** — not in the spec, but the frontend work ahead
   needs a live reference. Note it sits at `/api/docs`, outside the `/v1`
   version segment.
6. **NestJS 11, not 10.** NestJS 10's dependency tree carries open advisories,
   including an injection advisory in `@nestjs/core`. `npm audit` reports zero
   vulnerabilities on the current tree.
