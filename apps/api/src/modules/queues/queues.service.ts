import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RegisterQueueDto } from "./dto/register-queue.dto";
import * as dayjs from "dayjs";

@Injectable()
export class QueuesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayQueues(tenantId: string, doctorId?: string) {
    const today = dayjs().startOf("day").toDate();
    const tomorrow = dayjs().endOf("day").toDate();

    return this.prisma.queue.findMany({
      where: {
        tenantId,
        queueDate: { gte: today, lte: tomorrow },
        ...(doctorId && { doctorId }),
      },
      include: {
        patient: {
          select: { id: true, name: true, medicalRecordNumber: true },
        },
        doctor: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { queueNumber: "asc" }],
    });
  }

  async register(tenantId: string, dto: RegisterQueueDto) {
    // BR-08: Optimistic locking — prevent duplicate assignment
    const today = dayjs().startOf("day").toDate();

    const existingToday = await this.prisma.queue.findFirst({
      where: {
        tenantId,
        patientId: dto.patientId,
        queueDate: { gte: today },
        status: { not: "CANCELLED" },
      },
    });
    if (existingToday) {
      throw new ConflictException({
        code: "ALREADY_IN_QUEUE",
        message: "Pasien sudah terdaftar dalam antrean hari ini.",
        existingQueueId: existingToday.id,
      });
    }

    // Get next queue number
    const lastQueue = await this.prisma.queue.findFirst({
      where: { tenantId, queueDate: { gte: today } },
      orderBy: { queueNumber: "desc" },
    });
    const nextNumber = (lastQueue?.queueNumber ?? 0) + 1;

    return this.prisma.queue.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        queueDate: new Date(),
        queueNumber: nextNumber,
        status: "WAITING",
        registeredAt: new Date(),
      },
      include: {
        patient: {
          select: { id: true, name: true, medicalRecordNumber: true },
        },
      },
    });
  }

  async updateStatus(tenantId: string, queueId: string, status: string) {
    const queue = await this.prisma.queue.findFirst({
      where: { id: queueId, tenantId },
    });
    if (!queue)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Data antrean tidak ditemukan.",
      });

    const updateData: Record<string, unknown> = { status };
    if (status === "IN_PROGRESS") updateData.calledAt = new Date();
    if (status === "DONE") updateData.completedAt = new Date();

    return this.prisma.queue.update({
      where: { id: queueId },
      data: updateData,
    });
  }

  async updateVitalSigns(
    tenantId: string,
    queueId: string,
    vitalSigns: Record<string, unknown>,
  ) {
    const queue = await this.prisma.queue.findFirst({
      where: { id: queueId, tenantId },
    });
    if (!queue)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Data antrean tidak ditemukan.",
      });

    return this.prisma.queue.update({
      where: { id: queueId },
      data: { vitalSigns: vitalSigns as object },
    });
  }
}
