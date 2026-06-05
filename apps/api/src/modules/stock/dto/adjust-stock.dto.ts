import { IsUUID, IsNumber, Min, IsString } from "class-validator";

export class AdjustStockDto {
  @IsUUID()
  drugId: string;

  @IsNumber()
  @Min(0)
  newQuantity: number;

  @IsString()
  notes: string;
}
