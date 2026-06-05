import {
  IsString,
  IsUUID,
  IsOptional,
  IsObject,
  IsArray,
} from "class-validator";

export class CreateMedicalRecordDto {
  @IsUUID()
  patientId: string;

  @IsString()
  chiefComplaint: string;

  @IsOptional()
  @IsObject()
  soapNotes?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, unknown>;
}
