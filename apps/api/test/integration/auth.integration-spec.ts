import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../src/database/prisma.service";
import { RedisService } from "../../src/database/redis.service";
import { NotificationsService } from "../../src/modules/notifications/notifications.service";
import { AuthService } from "../../src/modules/auth/auth.service";

/**
 * Integration tests for AuthService against a REAL PostgreSQL database.
 *
 * These tests run only when TEST_DATABASE_URL is set (a dedicated test DB,
 * NEVER production). When it is absent the whole suite is skipped, so the
 * default `npm test` stays green and the production database is never touched.
 *
 * Run with:  npm run test:integration
 * Prereqs:   1) Set TEST_DATABASE_URL in the root .env (separate empty DB).
 *            2) Apply schema to it, e.g.:
 *               dotenv -e ../../.env -- cross-env DATABASE_URL=$TEST_DATABASE_URL \
 *                 prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma
 *
 * Redis and email are faked (in-memory / mock); the database is real.
 */

class InMemoryRedis {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async set(key: string, value: string, _ttlSeconds?: number): Promise<void> {
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

  async expire(_key: string, _ttlSeconds: number): Promise<void> {
    // no-op for tests
  }

  /** Returns the suffix of the first key matching the given prefix. */
  findSuffix(prefix: string): string | undefined {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) return key.slice(prefix.length);
    }
    return undefined;
  }

  clear(): void {
    this.store.clear();
  }
}

const configStub = {
  get: (key: string): string | undefined => {
    const map: Record<string, string> = {
      "jwt.accessSecret": process.env.JWT_ACCESS_SECRET ?? "test-access-secret",
      "jwt.refreshSecret":
        process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret",
      "jwt.accessExpiresIn": "15m",
      "jwt.refreshExpiresIn": "7d",
      "app.frontendUrl": "http://localhost:3000",
    };
    return map[key];
  },
};

const hasTestDb = !!process.env.TEST_DATABASE_URL;
const describeIf = hasTestDb ? describe : describe.skip;

describeIf("AuthService (integration, real DB)", () => {
  let prisma: PrismaService;
  let redis: InMemoryRedis;
  let service: AuthService;
  const notifications = { sendEmail: jest.fn().mockResolvedValue(undefined) };

  const registerDto = {
    clinicName: "Klinik Uji Integrasi",
    ownerName: "Dr. Uji",
    email: "uji.integrasi@klinik.test",
    phone: "081234567890",
    password: "Secret@123",
  };

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    redis = new InMemoryRedis();
    service = new AuthService(
      prisma,
      new JwtService({}),
      configStub as unknown as ConfigService,
      redis as unknown as RedisService,
      notifications as unknown as NotificationsService,
    );
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();
    redis.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("register creates a tenant + OWNER user and returns tokens", async () => {
    const result = (await service.register(registerDto)) as {
      accessToken: string;
      refreshToken: string;
      user: Record<string, unknown>;
    };

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toMatchObject({
      email: registerDto.email,
      role: "OWNER",
      tenantName: registerDto.clinicName,
    });

    const dbUser = await prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe("OWNER");
  });

  it("register rejects a duplicate email", async () => {
    await service.register(registerDto);

    await expect(service.register(registerDto)).rejects.toMatchObject({
      response: { code: "EMAIL_ALREADY_EXISTS" },
    });
  });

  it("login succeeds with the correct password and rejects a wrong one", async () => {
    await service.register(registerDto);

    const ok = (await service.login(
      { email: registerDto.email, password: registerDto.password },
      "127.0.0.1",
    )) as { user: { email: string } };
    expect(ok.user.email).toBe(registerDto.email);

    await expect(
      service.login(
        { email: registerDto.email, password: "WrongPass@123" },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject({ response: { code: "INVALID_CREDENTIALS" } });
  });

  it("refreshTokens rotates a valid token and rejects an invalid one", async () => {
    const reg = (await service.register(registerDto)) as {
      refreshToken: string;
    };

    const rotated = await service.refreshTokens(reg.refreshToken);
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();

    await expect(
      service.refreshTokens("not-a-real-token"),
    ).rejects.toMatchObject({ response: { code: "INVALID_REFRESH_TOKEN" } });
  });

  it("forgot + reset password updates the stored hash", async () => {
    await service.register(registerDto);

    await service.forgotPassword(registerDto.email);
    const token = redis.findSuffix("reset:");
    expect(token).toBeDefined();

    const newPassword = "BrandNew@456";
    await service.resetPassword(token as string, newPassword);

    // Old password no longer works
    await expect(
      service.login(
        { email: registerDto.email, password: registerDto.password },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject({ response: { code: "INVALID_CREDENTIALS" } });

    // New password works
    const ok = (await service.login(
      { email: registerDto.email, password: newPassword },
      "127.0.0.1",
    )) as { user: { email: string } };
    expect(ok.user.email).toBe(registerDto.email);
  });
});
