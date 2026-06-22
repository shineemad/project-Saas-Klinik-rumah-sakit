import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./database/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { UsersModule } from "./modules/users/users.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { MedicalRecordsModule } from "./modules/medical-records/medical-records.module";
import { PrescriptionsModule } from "./modules/prescriptions/prescriptions.module";
import { QueuesModule } from "./modules/queues/queues.module";
import { DrugsModule } from "./modules/drugs/drugs.module";
import { StockModule } from "./modules/stock/stock.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { SatusehatModule } from "./modules/satusehat/satusehat.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { JobsModule } from "./jobs/jobs.module";
import { appConfig } from "./config/app.config";
import { databaseConfig } from "./config/database.config";
import { jwtConfig } from "./config/jwt.config";
import { redisConfig } from "./config/redis.config";
import { storageConfig } from "./config/storage.config";

@Module({
  imports: [
    // ── Core Configuration ────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env", "../../.env.local", "../../.env"],
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, storageConfig],
    }),

    // ── Rate Limiting (anti-brute-force) ──────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 60000, // 1 minute
        limit: 100, // 100 req/min per user (general)
      },
      {
        name: "auth",
        ttl: 60000,
        limit: 10, // 10 req/min for auth endpoints
      },
    ]),

    // ── Scheduler (cron jobs) ─────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Infrastructure ────────────────────────────────────────────────────────
    DatabaseModule,
    RedisModule,
    RealtimeModule,
    JobsModule,

    // ── Feature Modules ───────────────────────────────────────────────────────
    AuthModule,
    TenantsModule,
    UsersModule,
    PatientsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    QueuesModule,
    DrugsModule,
    StockModule,
    InvoicesModule,
    PaymentsModule,
    NotificationsModule,
    ReportsModule,
    AuditLogsModule,
    SatusehatModule,
  ],
})
export class AppModule {}
