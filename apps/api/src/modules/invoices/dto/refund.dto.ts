import { IsString, IsEnum, MinLength } from "class-validator";

export class RefundDto {
  @IsEnum(["WRONG_ITEM", "DUPLICATE_PAYMENT", "PATIENT_REQUEST", "OTHER"])
  reasonType: string;

  @IsString()
  @MinLength(10)
  reason: string;
}
