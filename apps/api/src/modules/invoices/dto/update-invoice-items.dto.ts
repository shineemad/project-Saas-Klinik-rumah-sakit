import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsPositive,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

class InvoiceItemDto {
  @IsEnum(["CONSULTATION", "PROCEDURE", "DRUG", "OTHER"])
  itemType: string;

  @IsString()
  itemName: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;
}

export class UpdateInvoiceItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
