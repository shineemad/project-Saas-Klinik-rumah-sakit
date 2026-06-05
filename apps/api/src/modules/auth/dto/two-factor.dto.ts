import { IsString, Length } from "class-validator";

export class Setup2faDto {}

export class Verify2faDto {
  @IsString()
  @Length(6, 6)
  code: string;
}
