import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PaymentMethod } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ProcessPaymentDto } from "./dto/process-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processPayment(
    tenantId: string,
    invoiceId: string,
    userId: string,
    dto: ProcessPaymentDto,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Invoice tidak ditemukan.",
      });
    if (invoice.status === "PAID") {
      throw new BadRequestException({
        code: "INVOICE_ALREADY_PAID",
        message: "Invoice ini sudah dibayar.",
      });
    }

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId,
          amount: invoice.total,
          paymentMethod: dto.paymentMethod as PaymentMethod,
          referenceNumber: dto.referenceNumber,
          processedById: userId,
          processedAt: new Date(),
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID", paidAt: new Date() },
      }),
      // Update queue status to DONE after payment
      this.prisma.queue.updateMany({
        where: {
          tenantId,
          patientId: invoice.patientId,
          status: "DONE_WAITING_CASHIER",
        },
        data: { status: "DONE", completedAt: new Date() },
      }),
    ]);

    return { payment, message: "Pembayaran berhasil diproses." };
  }

  async generateQrisPayment(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Invoice tidak ditemukan.",
      });

    // Placeholder: integrate with payment gateway for real QRIS
    return {
      invoiceId,
      amount: invoice.total,
      qrisData: `QRIS_PLACEHOLDER_${invoiceId}`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };
  }
}
