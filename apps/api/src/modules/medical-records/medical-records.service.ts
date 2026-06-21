import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";
import { UpdateSoapDto } from "./dto/update-soap.dto";

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    doctorId: string,
    dto: CreateMedicalRecordDto,
  ) {
    // Validate patient belongs to tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId, isArchived: false },
    });
    if (!patient)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Pasien tidak ditemukan.",
      });

    return this.prisma.medicalRecord.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        attendingDoctorId: doctorId,
        visitDate: new Date(),
        chiefComplaint: dto.chiefComplaint,
        soapNotes: (dto.soapNotes ?? {}) as Prisma.InputJsonValue,
        vitalSigns: (dto.vitalSigns ?? {}) as Prisma.InputJsonValue,
        status: "DRAFT",
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.prisma.medicalRecord.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          include: { allergies: true },
        },
        attendingDoctor: { select: { id: true, name: true } },
        prescriptions: {
          include: {
            items: { include: { drug: true } },
          },
        },
      },
    });
    if (!record)
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Rekam medis tidak ditemukan.",
      });
    return record;
  }

  async updateSoap(tenantId: string, id: string, dto: UpdateSoapDto) {
    const record = await this.findOne(tenantId, id);
    if (!["DRAFT", "ACTIVE"].includes(record.status)) {
      throw new BadRequestException({
        code: "RECORD_FINALIZED",
        message: "Rekam medis sudah difinalisasi dan tidak dapat diubah.",
      });
    }
    return this.prisma.medicalRecord.update({
      where: { id },
      data: {
        soapNotes: dto.soapNotes as Prisma.InputJsonValue,
        vitalSigns: (dto.vitalSigns ??
          Prisma.JsonNull) as Prisma.InputJsonValue,
        icd10Codes: dto.icd10Codes,
      },
    });
  }

  async finalize(tenantId: string, id: string, _doctorId: string) {
    const record = await this.findOne(tenantId, id);
    if (record.status === "FINALIZED") {
      throw new BadRequestException({
        code: "ALREADY_FINALIZED",
        message: "Rekam medis sudah difinalisasi.",
      });
    }

    const updated = await this.prisma.medicalRecord.update({
      where: { id },
      data: { status: "FINALIZED" },
    });

    // Trigger invoice creation via queue update
    await this.prisma.queue.updateMany({
      where: { patientId: record.patientId, tenantId, status: "IN_PROGRESS" },
      data: { status: "DONE_WAITING_CASHIER" },
    });

    return updated;
  }

  async addPrescription(
    tenantId: string,
    medicalRecordId: string,
    doctorId: string,
    items: Array<{
      drugId: string;
      quantity: number;
      dosageInstruction: string;
    }>,
  ) {
    const record = await this.findOne(tenantId, medicalRecordId);
    if (record.status === "FINALIZED") {
      throw new BadRequestException({
        code: "RECORD_FINALIZED",
        message: "Rekam medis sudah difinalisasi.",
      });
    }

    // BR-02: Check allergies for all drugs in prescription
    const patientAllergies = record.patient.allergies;
    const drugIds = items.map((i) => i.drugId);
    const drugs = await this.prisma.drug.findMany({
      where: { id: { in: drugIds } },
    });

    const conflicts = drugs.filter((d) =>
      patientAllergies.some(
        (a) =>
          a.allergenType === "DRUG" &&
          (d.nameGeneric.toLowerCase().includes(a.allergenName.toLowerCase()) ||
            d.nameBrand?.toLowerCase().includes(a.allergenName.toLowerCase())),
      ),
    );

    if (conflicts.length > 0) {
      throw new UnprocessableEntityException({
        code: "ALLERGY_CONFLICT",
        message: `PERINGATAN: Pasien memiliki riwayat alergi terhadap obat: ${conflicts.map((c) => c.nameGeneric).join(", ")}.`,
        conflicting_drugs: conflicts.map((c) => ({
          id: c.id,
          name: c.nameGeneric,
        })),
        requires_override: true,
      });
    }

    // BR-03: Check stock before creating prescription
    for (const item of items) {
      const totalStock = await this.prisma.drugStock.aggregate({
        where: { drugId: item.drugId },
        _sum: { quantityOnHand: true },
      });
      const available = totalStock._sum.quantityOnHand ?? 0;
      if (available < item.quantity) {
        const drug = drugs.find((d) => d.id === item.drugId);
        throw new UnprocessableEntityException({
          code: "STOCK_INSUFFICIENT",
          message: `Stok ${drug?.nameGeneric ?? "obat"} tidak cukup.`,
          available,
          requested: item.quantity,
        });
      }
    }

    return this.prisma.prescription.create({
      data: {
        tenantId,
        medicalRecordId,
        createdById: doctorId,
        status: "ACTIVE",
        items: {
          create: items.map((i) => ({
            drugId: i.drugId,
            quantity: i.quantity,
            dosageInstruction: i.dosageInstruction,
          })),
        },
      },
      include: { items: { include: { drug: true } } },
    });
  }

  async getAttachments(tenantId: string, medicalRecordId: string) {
    await this.findOne(tenantId, medicalRecordId);
    return this.prisma.attachment.findMany({
      where: { medicalRecordId },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
      },
    });
  }
}
