import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Interactive API reference, mounted at `/{prefix}/docs`.
 *
 * Deliberately opt-in via `SWAGGER_ENABLED`: this documents an API holding
 * health data, and a public schema listing every route is a gift to anyone
 * probing the deployment. It defaults on outside production and off inside it.
 */
export function setupSwagger(app: INestApplication, apiPrefix: string): string | null {
  const environment = process.env.NODE_ENV ?? 'development';
  const explicit = process.env.SWAGGER_ENABLED;

  const enabled = explicit === undefined ? environment !== 'production' : explicit === 'true';
  if (!enabled) return null;

  const config = new DocumentBuilder()
    .setTitle('Personal Training Management Platform — API')
    .setDescription(
      [
        'MVP v0 backend. Two roles: **trainer** (a single seeded account) and **client**',
        '(created only by the trainer — there is no public sign-up).',
        '',
        '### Trying a request',
        '1. Call `POST /auth/login` with the trainer credentials from your `.env`',
        '   (`SEED_TRAINER_EMAIL` / `SEED_TRAINER_PASSWORD`).',
        '2. Copy `accessToken` from the response.',
        '3. Click **Authorize** above and paste it — every other route needs it.',
        '',
        'A client token is obtained the same way, using credentials the trainer set',
        'when creating that client. Role restrictions are enforced per route: a',
        'trainer token on a client-only route returns 403, and vice versa.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'bearer')
    .addTag('auth', 'Login and session')
    .addTag('clients', 'Client management (trainer)')
    .addTag('programs', 'Workout programs, days, exercises and logs')
    .addTag('nutrition', 'Nutrition plans and meals')
    .addTag('daily-logs', 'The client daily log — one record per date')
    .addTag('summary', 'Weekly summary, computed live')
    .addTag('health', 'Liveness and database check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const path = `${apiPrefix}/docs`;

  SwaggerModule.setup(path, app, document, {
    jsonDocumentUrl: `${path}/json`,
    swaggerOptions: {
      // Keeps the pasted token across page reloads while building the frontend.
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
    },
    customSiteTitle: 'Wizzapp API',
  });

  return path;
}
