import { IsEmail, IsString, MinLength, Matches } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: "Nama klinik minimal 3 karakter" })
  clinicName: string;

  @IsString()
  @MinLength(3, { message: "Nama pemilik minimal 3 karakter" })
  ownerName: string;

  @IsEmail({}, { message: "Format email tidak valid" })
  email: string;

  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, {
    message: "Format nomor HP Indonesia tidak valid",
  })
  phone: string;

  @IsString()
  @MinLength(8, { message: "Password minimal 8 karakter" })
  @Matches(/[A-Z]/, { message: "Password harus mengandung huruf besar" })
  @Matches(/[a-z]/, { message: "Password harus mengandung huruf kecil" })
  @Matches(/[0-9]/, { message: "Password harus mengandung angka" })
  password: string;
}
