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
import { DrugsService } from "./drugs.service";
import { CreateDrugDto } from "./dto/create-drug.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Drugs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("drugs")
export class DrugsController {
  constructor(private readonly service: DrugsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query("q") q?: string) {
    return this.service.findAll(user.tenantId, q);
  }

  @Get("low-stock")
  @Roles(UserRole.PHARMACIST, UserRole.OWNER)
  getLowStock(@CurrentUser() user: JwtPayload) {
    return this.service.getLowStockDrugs(user.tenantId);
  }

  @Get("expiring-soon")
  @Roles(UserRole.PHARMACIST, UserRole.OWNER)
  getExpiringSoon(@CurrentUser() user: JwtPayload) {
    return this.service.getExpiringSoonDrugs(user.tenantId);
  }

  @Post()
  @Roles(UserRole.PHARMACIST, UserRole.OWNER)
  create(@Body() dto: CreateDrugDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, dto);
  }

  @Get(":id")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(user.tenantId, id);
  }

  @Put(":id")
  @Roles(UserRole.PHARMACIST, UserRole.OWNER)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateDrugDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Get(":id/stock-movements")
  @Roles(UserRole.PHARMACIST, UserRole.OWNER)
  getStockMovements(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getStockMovements(user.tenantId, id);
  }
}
