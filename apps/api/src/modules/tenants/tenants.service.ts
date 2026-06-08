import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Klinik tidak ditemukan.",
      });
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const { settings, ...rest } = dto;
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...rest,
        ...(settings !== undefined && {
          settings: settings as Prisma.InputJsonValue,
        }),
      },
    });
  }
}
