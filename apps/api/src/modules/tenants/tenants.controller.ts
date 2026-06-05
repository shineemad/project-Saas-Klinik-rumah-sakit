import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { TenantsService } from "./tenants.service";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Tenants")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("tenants")
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get("me")
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  getMyTenant(@CurrentUser() user: JwtPayload) {
    return this.service.findById(user.tenantId);
  }

  @Patch("me")
  @Roles(UserRole.OWNER)
  update(@Body() dto: UpdateTenantDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(user.tenantId, dto);
  }
}
