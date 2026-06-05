import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PatientsService } from "./patients.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { AddAllergyDto } from "./dto/add-allergy.dto";
import { SearchPatientDto } from "./dto/search-patient.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Patients")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("patients")
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Query() query: SearchPatientDto, @CurrentUser() user: JwtPayload) {
    return this.patientsService.findAll(user.tenantId, query);
  }

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR, UserRole.OWNER)
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: JwtPayload) {
    return this.patientsService.create(user.tenantId, dto);
  }

  @Get(":id")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.findOne(user.tenantId, id);
  }

  @Put(":id")
  @Roles(UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR, UserRole.OWNER)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.update(user.tenantId, id, dto);
  }

  @Get(":id/medical-records")
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.OWNER)
  getMedicalRecords(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.getMedicalRecords(user.tenantId, id);
  }

  @Post(":id/allergies")
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  addAllergy(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddAllergyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.addAllergy(user.tenantId, id, dto, user.sub);
  }
}
