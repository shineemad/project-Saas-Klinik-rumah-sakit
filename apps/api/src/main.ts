import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Load .env from monorepo root (cwd during `nest start` is apps/api)
loadEnv({ path: resolve(__dirname, "../../../.env") });
loadEnv({ path: resolve(__dirname, "../../../.env.local"), override: true });

import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import * as compression from "compression";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3001);
  const nodeEnv = config.get<string>("NODE_ENV", "development");

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const corsOrigins = config
    .get<string>("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  });

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── Versioning ──────────────────────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix("v1");

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filters & interceptors ───────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ── Swagger (dev/staging only) ──────────────────────────────────────────────
  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("KlinikOS API")
      .setDescription(
        "Platform SaaS Manajemen Klinik Terpadu — API Documentation",
      )
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("Auth")
      .addTag("Patients")
      .addTag("Medical Records")
      .addTag("Queues")
      .addTag("Drugs")
      .addTag("Stock")
      .addTag("Invoices")
      .addTag("Payments")
      .addTag("Reports")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(port);
  console.log(`[KlinikOS API] Running on http://localhost:${port}`);
  if (nodeEnv !== "production") {
    console.log(`[KlinikOS API] Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap();
