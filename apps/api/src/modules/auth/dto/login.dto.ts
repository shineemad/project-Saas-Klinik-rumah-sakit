import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Length,
} from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Format email tidak valid" })
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}
