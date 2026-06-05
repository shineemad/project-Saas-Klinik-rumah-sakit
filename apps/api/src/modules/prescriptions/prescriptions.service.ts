import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(tenantId: string, id: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { drug: { include: { stocks: true } } } },
        medicalRecord: {
          include: {
            patient: { include: { allergies: true } },
            attendingDoctor: { select: { name: true } },
          },
        },
      },
    });
    if (!prescription)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Resep tidak ditemukan.",
      });
    return prescription;
  }

  async dispense(tenantId: string, id: string, pharmacistId: string) {
    const prescription = await this.findOne(tenantId, id);
    if (prescription.status !== "ACTIVE") {
      throw new BadRequestException({
        code: "INVALID_STATUS",
        message: "Resep sudah diproses atau dibatalkan.",
      });
    }

    // Deduct stock for each item (FIFO)
    for (const item of prescription.items) {
      const stocks = await this.prisma.drugStock.findMany({
        where: { drugId: item.drugId, quantityOnHand: { gt: 0 } },
        orderBy: { createdAt: "asc" },
      });

      let remaining = item.quantity;
      for (const stock of stocks) {
        if (remaining <= 0) break;
        const deduct = Math.min(stock.quantityOnHand, remaining);
        await this.prisma.drugStock.update({
          where: { id: stock.id },
          data: { quantityOnHand: { decrement: deduct } },
        });
        remaining -= deduct;
      }

      await this.prisma.stockMovement.create({
        data: {
          drugId: item.drugId,
          movementType: "OUT",
          quantity: item.quantity,
          referenceType: "PRESCRIPTION",
          referenceId: id,
          performedById: pharmacistId,
        },
      });
    }

    return this.prisma.prescription.update({
      where: { id },
      data: { status: "DISPENSED" },
    });
  }

  async cancel(tenantId: string, id: string, userId: string, reason: string) {
    const prescription = await this.findOne(tenantId, id);
    if (prescription.status === "DISPENSED") {
      throw new BadRequestException({
        code: "ALREADY_DISPENSED",
        message: "Resep yang sudah diserahkan tidak dapat dibatalkan.",
      });
    }
    return this.prisma.prescription.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }
}
