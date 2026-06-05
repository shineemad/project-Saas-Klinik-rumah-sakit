import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { QueuesService } from "./queues.service";
import { RegisterQueueDto } from "./dto/register-queue.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Queues")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("queues")
export class QueuesController {
  constructor(private readonly service: QueuesService) {}

  @Get("today")
  getTodayQueues(
    @CurrentUser() user: JwtPayload,
    @Query("doctorId") doctorId?: string,
  ) {
    return this.service.getTodayQueues(user.tenantId, doctorId);
  }

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.OWNER)
  register(@Body() dto: RegisterQueueDto, @CurrentUser() user: JwtPayload) {
    return this.service.register(user.tenantId, dto);
  }

  @Patch(":id/call-next")
  @Roles(UserRole.DOCTOR)
  callNext(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateStatus(user.tenantId, id, "IN_PROGRESS");
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("status") status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateStatus(user.tenantId, id, status);
  }

  @Patch(":id/vital-signs")
  @Roles(UserRole.NURSE, UserRole.DOCTOR)
  updateVitalSigns(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() vitalSigns: Record<string, unknown>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateVitalSigns(user.tenantId, id, vitalSigns);
  }
}
