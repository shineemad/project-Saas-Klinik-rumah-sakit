import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("dashboard")
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.service.getDashboardKpis(user.tenantId);
  }

  @Get("daily")
  @Roles(UserRole.OWNER)
  getDailyReport(
    @CurrentUser() user: JwtPayload,
    @Query("date") date?: string,
  ) {
    return this.service.getDailyReport(user.tenantId, date);
  }

  @Get("revenue")
  @Roles(UserRole.OWNER)
  getRevenueReport(
    @CurrentUser() user: JwtPayload,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.service.getRevenueReport(user.tenantId, startDate, endDate);
  }
}
