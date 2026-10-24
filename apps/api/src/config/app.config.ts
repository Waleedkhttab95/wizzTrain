import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  environment: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Where uploaded exercise videos are written. Must be a mounted volume in production. */
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  /**
   * Absolute origin the API is reached at, used to build video URLs. Without
   * it a stored filename can't become a link the client app can open.
   */
  publicUrl: (process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? '4000'}`).replace(
    /\/$/,
    '',
  ),
}));

export type AppConfig = ReturnType<typeof appConfig>;
