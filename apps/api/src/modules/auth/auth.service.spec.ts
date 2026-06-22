import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../database/redis.service";
import { NotificationsService } from "../notifications/notifications.service";

jest.mock("bcrypt");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    tenant: { findUnique: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    incr: jest.Mock;
    expire: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verify: jest.Mock };
  let notifications: { sendEmail: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      },
      tenant: { findUnique: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(),
    };
    redis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      incr: jest.fn(),
      expire: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue("signed-token"),
      verify: jest.fn(),
    };
    notifications = { sendEmail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("test-value") },
        },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("login", () => {
    const loginDto = { email: "owner@klinikos.id", password: "Secret@123" };

    const activeUser = {
      id: "user-1",
      name: "Dr. Rina",
      email: "owner@klinikos.id",
      passwordHash: "hashed",
      role: "OWNER",
      tenantId: "tenant-1",
      isActive: true,
      twoFaEnabled: false,
      twoFaSecret: null,
      tenant: { name: "Klinik Demo" },
    };

    it("throws ACCOUNT_LOCKED when failed attempts reach the limit", async () => {
      redis.get.mockResolvedValue("5");

      await expect(service.login(loginDto, "127.0.0.1")).rejects.toMatchObject({
        response: { code: "ACCOUNT_LOCKED" },
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("throws INVALID_CREDENTIALS and increments counter when user not found", async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      redis.incr.mockResolvedValue(1);

      await expect(service.login(loginDto, "127.0.0.1")).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });
      expect(redis.incr).toHaveBeenCalledWith(`failed_login:${loginDto.email}`);
      expect(redis.expire).toHaveBeenCalledWith(
        `failed_login:${loginDto.email}`,
        900,
      );
    });

    it("throws INVALID_CREDENTIALS when password is wrong", async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);
      redis.incr.mockResolvedValue(2);

      await expect(service.login(loginDto, "127.0.0.1")).rejects.toMatchObject({
        response: { code: "INVALID_CREDENTIALS" },
      });
    });

    it("logs in successfully, clears counter and stores refresh token", async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = (await service.login(loginDto, "127.0.0.1")) as {
        accessToken: string;
        refreshToken: string;
        user: Record<string, unknown>;
      };

      expect(result).toHaveProperty("accessToken", "signed-token");
      expect(result).toHaveProperty("refreshToken", "signed-token");
      expect(result.user).toMatchObject({
        id: "user-1",
        email: "owner@klinikos.id",
        role: "OWNER",
        tenantId: "tenant-1",
        tenantName: "Klinik Demo",
      });
      expect(redis.del).toHaveBeenCalledWith(`failed_login:${loginDto.email}`);
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining("refresh:"),
        "signed-token",
        7 * 24 * 60 * 60,
      );
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("returns requires2FA when 2FA is enabled and no code provided", async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        twoFaEnabled: true,
        twoFaSecret: "SECRET",
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login(loginDto, "127.0.0.1");

      expect(result).toEqual({ requires2FA: true });
    });
  });

  describe("register", () => {
    it("throws EMAIL_ALREADY_EXISTS when email is taken", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        service.register({
          clinicName: "Klinik Baru",
          ownerName: "Budi",
          email: "owner@klinikos.id",
          phone: "081234567890",
          password: "Secret@123",
        }),
      ).rejects.toMatchObject({
        response: { code: "EMAIL_ALREADY_EXISTS" },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("refreshTokens", () => {
    const payload = {
      sub: "user-1",
      email: "owner@klinikos.id",
      role: "OWNER",
      tenantId: "tenant-1",
      sessionId: "session-1",
    };

    it("throws INVALID_REFRESH_TOKEN when stored token does not match", async () => {
      jwtService.verify.mockReturnValue(payload);
      redis.get.mockResolvedValue("a-different-token");

      await expect(
        service.refreshTokens("incoming-token"),
      ).rejects.toMatchObject({
        response: { code: "INVALID_REFRESH_TOKEN" },
      });
    });

    it("rotates and returns new tokens when stored token matches", async () => {
      jwtService.verify.mockReturnValue(payload);
      redis.get.mockResolvedValue("incoming-token");

      const result = await service.refreshTokens("incoming-token");

      expect(result).toEqual({
        accessToken: "signed-token",
        refreshToken: "signed-token",
      });
      expect(redis.set).toHaveBeenCalledWith(
        "refresh:session-1",
        "signed-token",
        7 * 24 * 60 * 60,
      );
    });
  });

  describe("resetPassword", () => {
    it("throws INVALID_RESET_TOKEN when token is missing", async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.resetPassword("bad-token", "NewPass@123"),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("updates the password and deletes the token when valid", async () => {
      redis.get.mockResolvedValue("user-1");
      mockedBcrypt.hash.mockResolvedValue("new-hash" as never);

      const result = await service.resetPassword("good-token", "NewPass@123");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "new-hash" },
      });
      expect(redis.del).toHaveBeenCalledWith("reset:good-token");
      expect(result).toEqual({ message: "Password berhasil diubah." });
    });
  });

  describe("forgotPassword", () => {
    it("returns generic message without sending email for unknown account", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword("unknown@klinikos.id");

      expect(result).toEqual({
        message: "Jika email terdaftar, link reset akan dikirim.",
      });
      expect(notifications.sendEmail).not.toHaveBeenCalled();
    });

    it("stores reset token and sends email for a valid account", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "owner@klinikos.id",
        isActive: true,
      });

      await service.forgotPassword("owner@klinikos.id");

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining("reset:"),
        "user-1",
        60 * 60,
      );
      expect(notifications.sendEmail).toHaveBeenCalled();
    });
  });
});
