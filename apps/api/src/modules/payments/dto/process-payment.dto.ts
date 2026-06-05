import { IsEnum, IsOptional, IsString } from "class-validator";

export class ProcessPaymentDto {
  @IsEnum(["CASH", "QRIS", "DEBIT_CARD", "CREDIT_CARD", "BPJS", "TRANSFER"])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;
}
