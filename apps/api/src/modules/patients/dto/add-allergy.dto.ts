import { IsString, IsEnum, IsOptional, MaxLength } from "class-validator";

export enum AllergenType {
  DRUG = "DRUG",
  FOOD = "FOOD",
  OTHER = "OTHER",
}

export enum AllergySeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
}

export class AddAllergyDto {
  @IsEnum(AllergenType)
  allergenType: AllergenType;

  @IsString()
  @MaxLength(255)
  allergenName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reactionDescription?: string;

  @IsEnum(AllergySeverity)
  severity: AllergySeverity;
}
