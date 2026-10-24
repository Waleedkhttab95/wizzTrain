import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import type { AppConfig } from './config/app.config';
import { setupSwagger } from './swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // The AllExceptionsFilter owns error logging; Nest's default logger covers
    // the rest.
    bufferLogs: true,
  });

  const config = app.get(ConfigService).getOrThrow<AppConfig>('app');
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix(config.apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Uploaded videos are served from disk. `crossOriginResourcePolicy` is
  // relaxed because the web app runs on a different origin and would otherwise
  // be blocked from loading them.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.useStaticAssets(resolve(process.cwd(), config.uploadDir), {
    prefix: '/uploads',
    // Videos are immutable once written — the filename is a fresh UUID.
    maxAge: '30d',
    index: false,
    dotfiles: 'deny',
  });

  // Behind Nginx/Caddy in production (spec §11): without this the rate limiter
  // sees the proxy's IP for every request.
  app.set('trust proxy', 1);

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip unknown properties and reject them outright, so a client cannot
      // smuggle fields like `trainerId` into a DTO.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Registered after the pipes and versioning above so the generated schema
  // reflects the routes as they are actually served.
  const docsPath = setupSwagger(app, config.apiPrefix);

  // Lets Nest close the HTTP server and disconnect Prisma on SIGTERM before the
  // container is killed — no half-finished writes during a deploy.
  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');

  logger.log(`API listening on http://localhost:${config.port}/${config.apiPrefix}/v1`);
  logger.log(`Environment: ${config.environment}`);

  if (docsPath) {
    logger.log(`API docs on http://localhost:${config.port}/${docsPath}`);
  }
}

void bootstrap();
