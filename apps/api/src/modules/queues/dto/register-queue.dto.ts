import { IsUUID } from "class-validator";

export class RegisterQueueDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;
}
