import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  Matches,
  MaxLength,
} from "class-validator";
import { Gender, BloodType } from "@prisma/client";

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsDateString()
  birthDate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,15}$/, { message: "Nomor HP tidak valid" })
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{16}$/, { message: "NIK harus 16 digit angka" })
  nik?: string;

  @IsOptional()
  @IsString()
  bpjsNumber?: string;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
