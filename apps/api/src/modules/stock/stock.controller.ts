import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { StockService } from "./stock.service";
import { AddStockDto } from "./dto/add-stock.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Stock")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("stock")
export class StockController {
  constructor(private readonly service: StockService) {}

  @Post("in")
  @Roles(UserRole.PHARMACIST, UserRole.OWNER)
  addStock(@Body() dto: AddStockDto, @CurrentUser() user: JwtPayload) {
    return this.service.addStock(user.tenantId, user.sub, dto);
  }

  @Post("adjust")
  @Roles(UserRole.PHARMACIST, UserRole.OWNER)
  adjustStock(@Body() dto: AdjustStockDto, @CurrentUser() user: JwtPayload) {
    return this.service.adjustStock(user.tenantId, user.sub, dto);
  }
}
