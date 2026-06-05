import { Module } from "@nestjs/common";
import { SatusehatService } from "./satusehat.service";
import { SatusehatController } from "./satusehat.controller";

@Module({
  controllers: [SatusehatController],
  providers: [SatusehatService],
  exports: [SatusehatService],
})
export class SatusehatModule {}
