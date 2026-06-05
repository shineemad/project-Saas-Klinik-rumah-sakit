import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { ProcessPaymentDto } from "./dto/process-payment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("Payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post("invoices/:invoiceId/pay")
  @Roles(UserRole.CASHIER, UserRole.OWNER)
  processPayment(
    @Param("invoiceId", ParseUUIDPipe) invoiceId: string,
    @Body() dto: ProcessPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.processPayment(user.tenantId, invoiceId, user.sub, dto);
  }

  @Post("invoices/:invoiceId/qris")
  @Roles(UserRole.CASHIER, UserRole.OWNER)
  generateQris(
    @Param("invoiceId", ParseUUIDPipe) invoiceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.generateQrisPayment(user.tenantId, invoiceId);
  }
}
