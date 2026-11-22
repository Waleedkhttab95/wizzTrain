# منصة إدارة التدريب الشخصي — Personal Training Management Platform

MVP v0, implementing [`TECH_SPEC_EN.md`](TECH_SPEC_EN.md).

A single personal trainer manages their clients: builds a workout program and a
nutrition plan for each one, and reviews their daily and weekly adherence from
one place — replacing an Excel + WhatsApp + PDF workflow.

**Status:** both apps are built and verified — the NestJS API and the Next.js
web app (landing page + Trainer + Client, Arabic RTL).

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
        shell/          role-aware nav: side rail for the trainer; the client app
                        is a phone column with a bottom bar, and widens to a
                        top-bar layout from 1024px up
        trainer/        the trainer-only screens
        client/         the exercise card with inline logging
        marketing/      the public landing page at /
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

Everything below assumes **Node 20+** and a **PostgreSQL 14 or newer**. From a
fresh clone it is five commands and about two minutes.

### 1. Environment

```bash
cp .env.example .env
```

Three values need your attention before anything boots:

| Variable | What to put there |
|---|---|
| `JWT_SECRET` | 32 characters or more — `openssl rand -base64 48` |
| `SEED_TRAINER_PASSWORD` | the password you will sign in with |
| `SEED_DEMO_PASSWORD` | the password the demo clients share |

`DATABASE_URL` works as shipped if you use the bundled Postgres. Every variable
is validated at start-up, so a missing or malformed one fails the boot with a
clear message rather than surfacing on some later request.

### 2. Database

With Docker:

```bash
docker compose up -d postgres
```

Or point `DATABASE_URL` at a PostgreSQL you already run. The database named in
the URL must exist; the migration creates the tables, not the database.

### 3. Install, migrate, seed

```bash
npm install
npm run build --workspace @wizzapp/shared   # the API and web both compile against it
npm run prisma:migrate
npm run seed
```

### 4. Run

Two processes, two terminals:

```bash
npm run dev:api     # http://localhost:4000/api/v1
```

```bash
npm run dev:web     # http://localhost:3000
```

Open **http://localhost:3000**. That is the public landing page; the sign-in
link is in its header.

If port 3000 is taken, move the web app and tell the API about the new origin —
it rejects any origin it was not given:

```bash
WEB_PORT=3001 npm run dev:web     # then add http://localhost:3001 to CORS_ORIGINS
```

---

## Seed data

`npm run seed` always creates the single pilot trainer. With `SEED_DEMO=true`
in your `.env` — which `.env.example` ships with — it also creates a worked
example, so no screen opens empty:

| | |
|---|---|
| **A workout template** | «تقسيم دفع/سحب/أرجل», three days, four exercises each |
| **Three clients** | each with a program copied from that template, a nutrition plan with four meals, and three weeks of daily logs |
| **Exercise logs** | on the most recent training days, so the weekly summary has an adherence rate to report |

The three clients deliberately sit in the three different adherence states the
roster colours by, so the dashboard is not a wall of one status:

| Client | Email | State |
|---|---|---|
| ريم القحطاني | `reem@wizzapp.local` | منتظم — logs almost every day |
| فهد الحربي | `fahad@wizzapp.local` | متقطع — about half the week |
| نور إبراهيم | `nour@wizzapp.local` | متأخر — stopped two weeks ago |

**Signing in.** The trainer uses `SEED_TRAINER_EMAIL` / `SEED_TRAINER_PASSWORD`.
All three clients use their email above with `SEED_DEMO_PASSWORD`. The API
routes you to the trainer console or the client app based on the role in the
JWT — same login screen for both.

The seed is idempotent. Re-running it updates the trainer and rebuilds each
demo client from scratch rather than stacking a second program onto the same
person, so it is safe to run whenever you want the data back to a known state.

**Leave `SEED_DEMO` unset anywhere real data lives.** The demo half deletes and
recreates any client holding one of those three emails.

## Interactive API docs

| | |
|---|---|
| **Swagger UI** | http://localhost:4000/api/docs |
| **OpenAPI JSON** | http://localhost:4000/api/docs/json |

To try a request: call `POST /auth/login` with your `SEED_TRAINER_EMAIL` /
`SEED_TRAINER_PASSWORD` (or a demo client's email and `SEED_DEMO_PASSWORD` to
see the client-side routes), copy `accessToken`, click **Authorize**, paste it.
The token persists across page reloads.

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
npm test                      # 286 unit tests (106 API + 180 web), no database needed
npm run test:e2e              # 50 e2e tests, needs a running migrated database
npm run lint
```

The e2e suite boots the real application with the same pipes, guards and filters
as production, walks the three end-to-end flows in spec §7.3 and the full role
matrix, then deletes everything it created. It raises the login rate limit for
itself in `test/e2e-env.ts`, because it signs in far more than five times a
minute. Run it against a scratch database:

```bash
DATABASE_URL=postgresql://…/wizzapp_test npm run test:e2e
```

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

**Design.** The Let's Ops identity. The signed-in app runs on Midnight Navy
with Ice Tint type, Vibrant Magenta on the primary action, Cyber Cyan for
success and Amber Gold for warnings — Electric Blue stays a ground and a
gradient stop, because it measures 1.5:1 against the navy and cannot be read as
a foreground. Brando Arabic is self-hosted from the brand files with IBM Plex
Sans Arabic behind it; numerals come from Plex, which carries the tabular Latin
figures Brando's Arabic cuts do not.

The public landing page at `/` is the one exception: it runs the light half of
the same identity — white ground, navy ink, magenta and amber — following
`wizztrain-redesign/HANDOFF.md`. Every colour pair in both halves was checked
for colour-blind separation before it shipped.

All tokens live in `apps/web/src/app/globals.css`. The handful of places that
cannot read a CSS variable — SVG `stroke` and `fill` attributes — take their
values from `apps/web/src/lib/palette.ts`, which mirrors that stylesheet and
has to be edited alongside it.

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

- **Deployment and CI** — `docker compose up` works locally, but nothing runs
  the tests on push and the platform has no host yet.
- Everything listed as out of scope in spec §1: WhatsApp, payments, multi-tenant,
  progress photos, push notifications, wearables

### Before a pilot

- Change `SEED_TRAINER_PASSWORD`. The value in `.env.example` is a placeholder
  and the one in a developer's `.env` is not a secret.
- Unset `SEED_DEMO` and remove the three demo clients.

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
