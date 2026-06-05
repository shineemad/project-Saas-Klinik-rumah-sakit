import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });
    if (existing)
      throw new ConflictException({
        code: "DUPLICATE_EMAIL",
        message: "Email sudah terdaftar.",
      });

    const passwordHash = await AuthService.hashPassword(dto.password);
    return this.prisma.user.create({
      data: { tenantId, ...dto, password: undefined, passwordHash },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "User tidak ditemukan.",
      });
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

  async deactivate(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "User tidak ditemukan.",
      });
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: "User berhasil dinonaktifkan." };
  }
}
