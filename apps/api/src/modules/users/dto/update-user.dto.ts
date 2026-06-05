import { IsString, IsEnum, IsBoolean, IsOptional } from "class-validator";
import { UserRole } from "../../../common/types";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
