import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
} from "class-validator";

export class CreateDrugDto {
  @IsString()
  nameGeneric: string;

  @IsOptional()
  @IsString()
  nameBrand?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  unit: string;

  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @IsNumber()
  @IsPositive()
  sellingPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;
}
