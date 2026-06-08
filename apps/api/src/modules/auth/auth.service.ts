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
import { LoginDto } from "./dto/login.dto";
import { JwtPayload, UserRole } from "../../common/types";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 900; // 15 minutes
const REFRESH_TOKEN_PREFIX = "refresh:";
const RESET_TOKEN_PREFIX = "reset:";
const FAILED_LOGIN_PREFIX = "failed_login:";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    // @InjectRedis() private readonly redis: Redis,
  ) {}

  async login(dto: LoginDto, ipAddress: string) {
    const lockoutKey = `${FAILED_LOGIN_PREFIX}${dto.email}`;

    // TODO: check Redis for lockout
    // const failedAttempts = await this.redis.get(lockoutKey);
    // if (failedAttempts && parseInt(failedAttempts) >= MAX_FAILED_ATTEMPTS) {
    //   throw new UnauthorizedException({ code: 'ACCOUNT_LOCKED', message: 'Akun terkunci sementara. Coba lagi dalam 15 menit.' });
    // }

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      // TODO: increment failed attempts in Redis
      // await this.redis.incr(lockoutKey);
      // await this.redis.expire(lockoutKey, LOCKOUT_DURATION_SECONDS);
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Email atau password salah.",
      });
    }

    // TODO: await this.redis.del(lockoutKey);

    if (user.twoFaEnabled) {
      if (!dto.totpCode) {
        return { requires2fa: true };
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
        role: user.role,
        tenant: { id: user.tenantId, name: user.tenant.name },
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>("jwt.refreshSecret"),
      });

      // TODO: validate against Redis stored token
      const newTokens = await this.generateTokens(payload);
      return newTokens;
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token tidak valid.",
      });
    }
  }

  async logout(sessionId: string) {
    // TODO: await this.redis.del(`${REFRESH_TOKEN_PREFIX}${sessionId}`);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
    });
    // Always return success to prevent email enumeration
    if (!user)
      return { message: "Jika email terdaftar, link reset akan dikirim." };

    const resetToken = uuidv4();
    // TODO: store in Redis with 1 hour TTL
    // await this.redis.set(`${RESET_TOKEN_PREFIX}${resetToken}`, user.id, 'EX', 3600);
    // TODO: send email via NotificationsService

    return { message: "Jika email terdaftar, link reset akan dikirim." };
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: const userId = await this.redis.get(`${RESET_TOKEN_PREFIX}${token}`);
    // if (!userId) throw new BadRequestException({ code: 'INVALID_RESET_TOKEN', message: 'Token reset tidak valid atau kadaluarsa.' });
    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    // await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    // await this.redis.del(`${RESET_TOKEN_PREFIX}${token}`);
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
    return { access_token: accessToken, refresh_token: refreshToken };
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
