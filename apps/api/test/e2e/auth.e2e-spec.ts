import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AuthModule } from "../../src/modules/auth/auth.module";
import { DatabaseModule } from "../../src/database/database.module";
import { RedisModule } from "../../src/database/redis.module";
import { PrismaService } from "../../src/database/prisma.service";
import { RedisService } from "../../src/database/redis.service";
import { NotificationsService } from "../../src/modules/notifications/notifications.service";
import { HttpExceptionFilter } from "../../src/common/filters/http-exception.filter";
import { TransformInterceptor } from "../../src/common/interceptors/transform.interceptor";
import { appConfig } from "../../src/config/app.config";
import { jwtConfig } from "../../src/config/jwt.config";

/**
 * End-to-end HTTP tests for the Auth endpoints (real PostgreSQL + real HTTP
 * stack: routing, /v1 versioning, ValidationPipe, TransformInterceptor,
 * HttpExceptionFilter). Redis and email are faked.
 *
 * Runs only when TEST_DATABASE_URL is set (a dedicated test DB, NEVER
 * production). Otherwise the whole suite is skipped so `npm test` stays green.
 *
 * Run with:  npm run test:e2e   (after setting TEST_DATABASE_URL + migrating it)
 */

class InMemoryRedis {
  private store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  async set(key: string, value: string, _ttl?: number): Promise<void> {
    this.store.set(key, String(value));
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
  async incr(key: string): Promise<number> {
    const next = parseInt(this.store.get(key) ?? "0", 10) + 1;
    this.store.set(key, String(next));
    return next;
  }
  async expire(_key: string, _ttl: number): Promise<void> {
    // no-op
  }
  clear(): void {
    this.store.clear();
  }
}

const hasTestDb = !!process.env.TEST_DATABASE_URL;
const describeIf = hasTestDb ? describe : describe.skip;

describeIf("Auth (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: InMemoryRedis;
  const notifications = { sendEmail: jest.fn().mockResolvedValue(undefined) };

  const registerBody = {
    clinicName: "Klinik Uji E2E",
    ownerName: "Dr. E2E",
    email: "e2e@klinik.test",
    phone: "081234567890",
    password: "Secret@123",
  };

  const registerRequest = () =>
    request(app.getHttpServer()).post("/v1/auth/register").send(registerBody);

  beforeAll(async () => {
    redis = new InMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig, jwtConfig] }),
        DatabaseModule,
        RedisModule,
        AuthModule,
      ],
    })
      .overrideProvider(RedisService)
      .useValue(redis)
      .overrideProvider(NotificationsService)
      .useValue(notifications)
      .compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
    redis.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /v1/auth/register creates a clinic and returns tokens", async () => {
    const res = await registerRequest().expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user).toMatchObject({
      email: registerBody.email,
      role: "OWNER",
      tenantName: registerBody.clinicName,
    });
  });

  it("POST /v1/auth/register rejects a duplicate email", async () => {
    await registerRequest().expect(201);
    const res = await registerRequest().expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("POST /v1/auth/register rejects an invalid body with 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/auth/register")
      .send({ email: "not-an-email" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("POST /v1/auth/login succeeds and rejects a wrong password", async () => {
    await registerRequest().expect(201);

    const ok = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: registerBody.email, password: registerBody.password })
      .expect(200);
    expect(ok.body.data.accessToken).toBeDefined();

    const bad = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: registerBody.email, password: "WrongPass@123" })
      .expect(401);
    expect(bad.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("POST /v1/auth/refresh returns new tokens for a valid refresh token", async () => {
    const reg = await registerRequest().expect(201);

    const res = await request(app.getHttpServer())
      .post("/v1/auth/refresh")
      .send({ refreshToken: reg.body.data.refreshToken })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("GET /v1/auth/me returns the current user with a valid token", async () => {
    const reg = await registerRequest().expect(201);
    const token = reg.body.data.accessToken as string;

    const res = await request(app.getHttpServer())
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.email).toBe(registerBody.email);
  });

  it("GET /v1/auth/me without a token returns 401", async () => {
    await request(app.getHttpServer()).get("/v1/auth/me").expect(401);
  });
});
