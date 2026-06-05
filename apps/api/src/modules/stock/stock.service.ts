import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AddStockDto } from "./dto/add-stock.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async addStock(tenantId: string, userId: string, dto: AddStockDto) {
    const drug = await this.prisma.drug.findFirst({
      where: { id: dto.drugId, tenantId },
    });
    if (!drug)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Obat tidak ditemukan.",
      });

    const [stockEntry, movement] = await this.prisma.$transaction([
      this.prisma.drugStock.create({
        data: {
          drugId: dto.drugId,
          batchNumber: dto.batchNumber,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          quantityOnHand: dto.quantity,
          location: dto.location,
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          drugId: dto.drugId,
          movementType: "IN",
          quantity: dto.quantity,
          referenceType: "PURCHASE",
          referenceId: dto.purchaseOrderId,
          performedById: userId,
          notes: dto.notes,
        },
      }),
    ]);

    return { stockEntry, movement };
  }

  async adjustStock(tenantId: string, userId: string, dto: AdjustStockDto) {
    const drug = await this.prisma.drug.findFirst({
      where: { id: dto.drugId, tenantId },
    });
    if (!drug)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Obat tidak ditemukan.",
      });

    const currentTotal = await this.prisma.drugStock.aggregate({
      where: { drugId: dto.drugId },
      _sum: { quantityOnHand: true },
    });
    const current = currentTotal._sum.quantityOnHand ?? 0;
    const delta = dto.newQuantity - current;

    // BR-03: Non-negative stock
    if (dto.newQuantity < 0) {
      throw new UnprocessableEntityException({
        code: "STOCK_NON_NEGATIVE",
        message: "Stok tidak boleh negatif.",
      });
    }

    await this.prisma.$transaction([
      this.prisma.drugStock.updateMany({
        where: { drugId: dto.drugId },
        data: { quantityOnHand: 0 },
      }),
      this.prisma.drugStock.create({
        data: { drugId: dto.drugId, quantityOnHand: dto.newQuantity },
      }),
      this.prisma.stockMovement.create({
        data: {
          drugId: dto.drugId,
          movementType: "ADJUSTMENT",
          quantity: Math.abs(delta),
          performedById: userId,
          notes: dto.notes,
        },
      }),
    ]);

    return {
      message: "Stok berhasil disesuaikan.",
      newQuantity: dto.newQuantity,
    };
  }

  async deductStockForPrescription(
    drugId: string,
    quantity: number,
    prescriptionId: string,
    userId: string,
  ) {
    // FIFO: deduct from oldest batch first
    const stocks = await this.prisma.drugStock.findMany({
      where: { drugId, quantityOnHand: { gt: 0 } },
      orderBy: { createdAt: "asc" },
    });

    let remaining = quantity;
    const updates: Promise<unknown>[] = [];

    for (const stock of stocks) {
      if (remaining <= 0) break;
      const deduct = Math.min(stock.quantityOnHand, remaining);
      updates.push(
        this.prisma.drugStock.update({
          where: { id: stock.id },
          data: { quantityOnHand: { decrement: deduct } },
        }),
      );
      remaining -= deduct;
    }

    if (remaining > 0) {
      throw new UnprocessableEntityException({
        code: "STOCK_INSUFFICIENT",
        message: "Stok tidak mencukupi.",
      });
    }

    await Promise.all(updates);
    await this.prisma.stockMovement.create({
      data: {
        drugId,
        movementType: "OUT",
        quantity,
        referenceType: "PRESCRIPTION",
        referenceId: prescriptionId,
        performedById: userId,
      },
    });
  }
}
