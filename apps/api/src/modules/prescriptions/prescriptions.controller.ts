import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PrescriptionsService } from "./prescriptions.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Prescriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("prescriptions")
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Get(":id")
  @Roles(UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.NURSE)
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(":id/dispense")
  @Roles(UserRole.PHARMACIST)
  dispense(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.dispense(user.tenantId, id, user.sub);
  }

  @Patch(":id/cancel")
  @Roles(UserRole.DOCTOR, UserRole.PHARMACIST)
  cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("reason") reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cancel(user.tenantId, id, user.sub, reason);
  }
}
