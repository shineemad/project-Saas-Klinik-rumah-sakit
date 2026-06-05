import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UpdateInvoiceItemsDto } from "./dto/update-invoice-items.dto";
import { RefundDto } from "./dto/refund.dto";

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId, ...(status && { status }) },
      include: {
        patient: {
          select: { id: true, name: true, medicalRecordNumber: true },
        },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: { id: true, name: true, medicalRecordNumber: true },
        },
        items: true,
        payments: true,
        queue: {
          include: { doctor: { select: { name: true } } },
        },
      },
    });
    if (!invoice)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Invoice tidak ditemukan.",
      });
    return invoice;
  }

  async createFromMedicalRecord(
    tenantId: string,
    patientId: string,
    queueId: string,
    items: Array<{
      itemType: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
    }>,
  ) {
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    const nextNumber = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split("-").pop() ?? "0") + 1
      : 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const invoiceNumber = `INV-${year}${month}-${String(nextNumber).padStart(4, "0")}`;

    const subtotal = items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );

    return this.prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        patientId,
        queueId,
        subtotal,
        discount: 0,
        total: subtotal,
        status: "UNPAID",
        items: {
          create: items.map((i) => ({
            ...i,
            totalPrice: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateItems(tenantId: string, id: string, dto: UpdateInvoiceItemsDto) {
    const invoice = await this.findOne(tenantId, id);

    // BR-04: Invoice immutability for paid invoices
    if (invoice.status === "PAID") {
      throw new BadRequestException({
        code: "INVOICE_PAID",
        message:
          "Invoice yang sudah lunas tidak dapat diubah. Gunakan mekanisme refund.",
      });
    }

    const subtotal = dto.items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );
    const total = subtotal - (invoice.discount ?? 0);

    await this.prisma.$transaction([
      this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
      this.prisma.invoice.update({
        where: { id },
        data: {
          subtotal,
          total,
          items: {
            create: dto.items.map((i) => ({
              ...i,
              totalPrice: i.quantity * i.unitPrice,
            })),
          },
        },
      }),
    ]);

    return this.findOne(tenantId, id);
  }

  // BR-12: Refund — only for PAID invoices, with reason and PIN validation
  async refund(tenantId: string, id: string, userId: string, dto: RefundDto) {
    const invoice = await this.findOne(tenantId, id);
    if (invoice.status !== "PAID") {
      throw new BadRequestException({
        code: "INVOICE_NOT_PAID",
        message: "Refund hanya dapat dilakukan untuk invoice berstatus Lunas.",
      });
    }

    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id },
        data: { status: "REFUNDED" },
      }),
      this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "INVOICE_REFUNDED",
          entityType: "Invoice",
          entityId: id,
          beforeData: { status: "PAID" },
          afterData: { status: "REFUNDED", reason: dto.reason },
        },
      }),
    ]);

    return { message: "Refund berhasil diproses." };
  }
}
