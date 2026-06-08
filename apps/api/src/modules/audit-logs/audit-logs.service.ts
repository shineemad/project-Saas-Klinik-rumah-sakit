import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  // BR-06: Audit logs are immutable — no update or delete methods
  async log(
    tenantId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    beforeData?: Record<string, unknown>,
    afterData?: Record<string, unknown>,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        beforeData: (beforeData ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        afterData: (afterData ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });
  }

  async findAll(
    tenantId: string,
    filters: {
      page: number;
      limit: number;
      userId?: string;
      entityType?: string;
    },
  ) {
    const { page, limit, userId, entityType } = filters;
    const where = {
      tenantId,
      ...(userId && { userId }),
      ...(entityType && { entityType }),
    };

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return { data: logs, meta: { total, page, limit } };
  }
}
