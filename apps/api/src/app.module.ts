import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { validationSchema } from './config/validation.schema';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { HealthModule } from './health/health.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgramsModule } from './programs/programs.module';
import { SummaryModule } from './summary/summary.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig],
      validationSchema,
      validationOptions: { abortEarly: false, allowUnknown: true },
      // Root .env first so a single file at the repo root configures the
      // whole stack, with an api-local override available if needed.
      envFilePath: ['.env', '../../.env'],
      cache: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
      errorMessage: 'عدد كبير من الطلبات، حاول مرة أخرى بعد قليل',
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    ProgramsModule,
    NutritionModule,
    DailyLogsModule,
    SummaryModule,
    TemplatesModule,
    HealthModule,
  ],
  providers: [
    // Order matters: guards run in registration order, so a request is
    // rate-limited, then authenticated, then role-checked.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
