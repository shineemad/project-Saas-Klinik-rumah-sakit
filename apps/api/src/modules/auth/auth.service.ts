import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../database/redis.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload, UserRole } from "../../common/types";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 900; // 15 minutes
const REFRESH_TOKEN_PREFIX = "refresh:";
const RESET_TOKEN_PREFIX = "reset:";
const FAILED_LOGIN_PREFIX = "failed_login:";
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const RESET_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  async login(dto: LoginDto, ipAddress: string) {
    const lockoutKey = `${FAILED_LOGIN_PREFIX}${dto.email}`;

    const failedAttempts = await this.redis.get(lockoutKey);
    if (failedAttempts && parseInt(failedAttempts, 10) >= MAX_FAILED_ATTEMPTS) {
      throw new UnauthorizedException({
        code: "ACCOUNT_LOCKED",
        message: "Akun terkunci sementara. Coba lagi dalam 15 menit.",
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      const attempts = await this.redis.incr(lockoutKey);
      if (attempts === 1) {
        await this.redis.expire(lockoutKey, LOCKOUT_DURATION_SECONDS);
      }
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Email atau password salah.",
      });
    }

    await this.redis.del(lockoutKey);

    if (user.twoFaEnabled) {
      if (!dto.totpCode) {
        return { requires2FA: true };
      }
      await this.validateTotp(user.twoFaSecret!, dto.totpCode);
    }

    const sessionId = uuidv4();
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId: user.tenantId,
      sessionId,
    });

    await this.redis.set(
      `${REFRESH_TOKEN_PREFIX}${sessionId}`,
      tokens.refreshToken,
      REFRESH_TOKEN_TTL_SECONDS,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User ${user.email} logged in from ${ipAddress}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email sudah terdaftar. Silakan masuk.",
      });
    }

    const slug = await this.generateUniqueSlug(dto.clinicName);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const { tenant, user } = await this.prisma.$transaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: dto.clinicName, slug, phone: dto.phone },
        });
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            name: dto.ownerName,
            email: dto.email,
            passwordHash,
            role: "OWNER",
          },
        });
        return { tenant, user };
      },
      { maxWait: 10000, timeout: 20000 },
    );

    const sessionId = uuidv4();
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId: user.tenantId,
      sessionId,
    });

    await this.redis.set(
      `${REFRESH_TOKEN_PREFIX}${sessionId}`,
      tokens.refreshToken,
      REFRESH_TOKEN_TTL_SECONDS,
    );

    this.logger.log(`New clinic registered: ${tenant.name} (${user.email})`);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant.name,
      },
    };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "klinik";
    let slug = base;
    let attempt = 0;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }
    return slug;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>("jwt.refreshSecret"),
      });

      const storedKey = `${REFRESH_TOKEN_PREFIX}${payload.sessionId}`;
      const stored = await this.redis.get(storedKey);
      if (!stored || stored !== refreshToken) {
        throw new UnauthorizedException();
      }

      const newTokens = await this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        sessionId: payload.sessionId,
      });

      // Rotate: replace the stored refresh token with the new one
      await this.redis.set(
        storedKey,
        newTokens.refreshToken,
        REFRESH_TOKEN_TTL_SECONDS,
      );

      return newTokens;
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token tidak valid.",
      });
    }
  }

  async logout(sessionId: string) {
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${sessionId}`);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    // Always return success to prevent email enumeration
    if (!user || !user.isActive)
      return { message: "Jika email terdaftar, link reset akan dikirim." };

    const resetToken = uuidv4();
    await this.redis.set(
      `${RESET_TOKEN_PREFIX}${resetToken}`,
      user.id,
      RESET_TOKEN_TTL_SECONDS,
    );

    const frontendUrl = this.config.get<string>("app.frontendUrl");
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    await this.notifications.sendEmail(
      user.email,
      "[KlinikOS] Reset Password",
      `<p>Klik link berikut untuk mengatur ulang password Anda (berlaku 1 jam):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Abaikan email ini jika Anda tidak meminta reset password.</p>`,
    );

    return { message: "Jika email terdaftar, link reset akan dikirim." };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetKey = `${RESET_TOKEN_PREFIX}${token}`;
    const userId = await this.redis.get(resetKey);
    if (!userId) {
      throw new BadRequestException({
        code: "INVALID_RESET_TOKEN",
        message: "Token reset tidak valid atau kadaluarsa.",
      });
    }

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
    await this.redis.del(resetKey);

    return { message: "Password berhasil diubah." };
  }

  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const totp = new OTPAuth.TOTP({
      issuer: "KlinikOS",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    const secret = totp.secret.base32;
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFaSecret: secret },
    });
    const qrCode = await QRCode.toDataURL(totp.toString());
    return { secret, qrCode };
  }

  async verify2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    await this.validateTotp(user.twoFaSecret!, code);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFaEnabled: true },
    });
    return { message: "2FA berhasil diaktifkan." };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>("jwt.accessSecret"),
        expiresIn: this.config.get<string>("jwt.accessExpiresIn"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>("jwt.refreshSecret"),
        expiresIn: this.config.get<string>("jwt.refreshExpiresIn"),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async validateTotp(secret: string, code: string) {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new UnauthorizedException({
        code: "INVALID_TOTP",
        message: "Kode 2FA tidak valid.",
      });
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }
}
