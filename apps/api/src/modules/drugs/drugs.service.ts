import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateDrugDto } from "./dto/create-drug.dto";
import * as dayjs from "dayjs";

@Injectable()
export class DrugsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, q?: string) {
    return this.prisma.drug.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(q && {
          OR: [
            { nameGeneric: { contains: q, mode: "insensitive" } },
            { nameBrand: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        stocks: {
          select: { quantityOnHand: true, expiryDate: true, batchNumber: true },
        },
      },
      orderBy: { nameGeneric: "asc" },
    });
  }

  async create(tenantId: string, dto: CreateDrugDto) {
    return this.prisma.drug.create({ data: { tenantId, ...dto } });
  }

  async findOne(tenantId: string, id: string) {
    const drug = await this.prisma.drug.findFirst({
      where: { id, tenantId, isActive: true },
      include: { stocks: true },
    });
    if (!drug)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Obat tidak ditemukan.",
      });
    return drug;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateDrugDto>) {
    await this.findOne(tenantId, id);
    return this.prisma.drug.update({ where: { id }, data: dto });
  }

  async getLowStockDrugs(tenantId: string) {
    const drugs = await this.prisma.drug.findMany({
      where: { tenantId, isActive: true },
      include: { stocks: true },
    });

    return drugs
      .map((d) => ({
        ...d,
        totalStock: d.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0),
      }))
      .filter((d) => d.totalStock <= (d.minimumStock ?? 0));
  }

  async getExpiringSoonDrugs(tenantId: string) {
    const thirtyDaysFromNow = dayjs().add(30, "day").toDate();
    return this.prisma.drugStock.findMany({
      where: {
        drug: { tenantId },
        expiryDate: { lte: thirtyDaysFromNow },
        quantityOnHand: { gt: 0 },
      },
      include: { drug: true },
      orderBy: { expiryDate: "asc" },
    });
  }

  async getStockMovements(tenantId: string, drugId: string) {
    await this.findOne(tenantId, drugId);
    return this.prisma.stockMovement.findMany({
      where: { drugId },
      include: { performedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
