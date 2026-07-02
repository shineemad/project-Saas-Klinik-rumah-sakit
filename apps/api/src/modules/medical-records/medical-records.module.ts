import { Module } from "@nestjs/common";
import { MedicalRecordsController } from "./medical-records.controller";
import { MedicalRecordsService } from "./medical-records.service";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [InvoicesModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
