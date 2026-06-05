import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { UpdateInvoiceItemsDto } from "./dto/update-invoice-items.dto";
import { RefundDto } from "./dto/refund.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Invoices")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query("status") status?: string) {
    return this.service.findAll(user.tenantId, status);
  }

  @Get(":id")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(":id/items")
  @Roles(UserRole.CASHIER, UserRole.OWNER)
  updateItems(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceItemsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateItems(user.tenantId, id, dto);
  }

  @Post(":id/refund")
  @Roles(UserRole.CASHIER, UserRole.OWNER)
  refund(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RefundDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.refund(user.tenantId, id, user.sub, dto);
  }
}
