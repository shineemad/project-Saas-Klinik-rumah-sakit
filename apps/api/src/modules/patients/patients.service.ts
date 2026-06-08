import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { AddAllergyDto } from "./dto/add-allergy.dto";
import { SearchPatientDto } from "./dto/search-patient.dto";
import { encrypt, decrypt } from "../../common/utils/encryption.util";
import {
  buildPaginationMeta,
  buildPrismaSkipTake,
} from "../../common/utils/pagination.util";

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: SearchPatientDto) {
    const { q, page = 1, limit = 20 } = query;

    const where = {
      tenantId,
      isArchived: false,
      ...(q && {
        name: { contains: q, mode: "insensitive" as const },
      }),
    };

    const [total, patients] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({
        where,
        ...buildPrismaSkipTake(page, limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          medicalRecordNumber: true,
          name: true,
          birthDate: true,
          gender: true,
          phone: true,
          bloodType: true,
          createdAt: true,
          _count: { select: { allergies: true, medicalRecords: true } },
        },
      }),
    ]);

    // Decrypt PII fields
    const decryptedPatients = patients.map((p) => ({
      ...p,
      phone: p.phone ? decrypt(p.phone) : null,
    }));

    return {
      success: true,
      data: decryptedPatients,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async create(tenantId: string, dto: CreatePatientDto) {
    // Check duplicate NIK
    if (dto.nik) {
      const encryptedNik = encrypt(dto.nik);
      const existing = await this.prisma.patient.findFirst({
        where: { tenantId, nik: encryptedNik, isArchived: false },
      });
      if (existing) {
        throw new ConflictException({
          code: "DUPLICATE_NIK",
          message: "Pasien dengan NIK ini sudah terdaftar.",
          existing_patient_id: existing.id,
        });
      }
    }

    const lastPatient = await this.prisma.patient.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    const nextNumber = lastPatient
      ? parseInt(lastPatient.medicalRecordNumber.split("-").pop() ?? "0") + 1
      : 1;
    const year = new Date().getFullYear();
    const mrn = `KLN-${year}-${String(nextNumber).padStart(4, "0")}`;

    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        medicalRecordNumber: mrn,
        name: dto.name,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        phone: dto.phone ? encrypt(dto.phone) : null,
        nik: dto.nik ? encrypt(dto.nik) : null,
        bpjsNumber: dto.bpjsNumber ? encrypt(dto.bpjsNumber) : null,
        bloodType: dto.bloodType ?? null,
        address: dto.address,
      },
    });

    return { ...patient, phone: dto.phone, nik: dto.nik };
  }

  async findOne(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId, isArchived: false },
      include: { allergies: true },
    });
    if (!patient) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Pasien tidak ditemukan.",
      });
    }
    return {
      ...patient,
      phone: patient.phone ? decrypt(patient.phone) : null,
      nik: patient.nik ? decrypt(patient.nik) : null,
      bpjsNumber: patient.bpjsNumber ? decrypt(patient.bpjsNumber) : null,
    };
  }

  async update(tenantId: string, id: string, dto: UpdatePatientDto) {
    await this.findOne(tenantId, id); // Validates ownership

    return this.prisma.patient.update({
      where: { id },
      data: {
        name: dto.name,
        gender: dto.gender,
        bloodType: dto.bloodType ?? undefined,
        address: dto.address,
        phone: dto.phone ? encrypt(dto.phone) : undefined,
        nik: dto.nik ? encrypt(dto.nik) : undefined,
        bpjsNumber: dto.bpjsNumber ? encrypt(dto.bpjsNumber) : undefined,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async getMedicalRecords(tenantId: string, patientId: string) {
    await this.findOne(tenantId, patientId); // Validates ownership
    return this.prisma.medicalRecord.findMany({
      where: { tenantId, patientId },
      orderBy: { visitDate: "desc" },
      include: { attendingDoctor: { select: { name: true } } },
    });
  }

  async addAllergy(
    tenantId: string,
    patientId: string,
    dto: AddAllergyDto,
    userId: string,
  ) {
    await this.findOne(tenantId, patientId); // Validates ownership
    return this.prisma.patientAllergy.create({
      data: { patientId, ...dto, recordedByUserId: userId },
    });
  }
}
