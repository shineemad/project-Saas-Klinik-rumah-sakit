import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuditLogsService } from "./audit-logs.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Audit Logs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("page") page = 1,
    @Query("limit") limit = 50,
    @Query("userId") userId?: string,
    @Query("entityType") entityType?: string,
  ) {
    return this.service.findAll(user.tenantId, {
      page,
      limit,
      userId,
      entityType,
    });
  }
}
