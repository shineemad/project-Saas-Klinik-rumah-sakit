import { IsObject, IsOptional, IsArray, IsString } from "class-validator";

export class UpdateSoapDto {
  @IsObject()
  soapNotes: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };

  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  icd10Codes?: string[];
}
