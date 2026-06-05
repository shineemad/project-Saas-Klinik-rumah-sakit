import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { MedicalRecordsService } from "./medical-records.service";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";
import { UpdateSoapDto } from "./dto/update-soap.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Medical Records")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("medical-records")
export class MedicalRecordsController {
  constructor(private readonly service: MedicalRecordsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  create(@Body() dto: CreateMedicalRecordDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Get(":id")
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.OWNER)
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(":id")
  @Roles(UserRole.DOCTOR)
  updateSoap(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSoapDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateSoap(user.tenantId, id, dto);
  }

  @Post(":id/finalize")
  @Roles(UserRole.DOCTOR)
  finalize(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.finalize(user.tenantId, id, user.sub);
  }

  @Post(":id/prescriptions")
  @Roles(UserRole.DOCTOR)
  addPrescription(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: {
      items: Array<{
        drugId: string;
        quantity: number;
        dosageInstruction: string;
      }>;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.addPrescription(
      user.tenantId,
      id,
      user.sub,
      body.items,
    );
  }

  @Get(":id/attachments")
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  getAttachments(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getAttachments(user.tenantId, id);
  }
}
