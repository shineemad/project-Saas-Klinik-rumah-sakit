import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SatusehatService } from "./satusehat.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload, UserRole } from "../../common/types";

@ApiTags("SATUSEHAT Integration")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("satusehat")
export class SatusehatController {
  constructor(private readonly service: SatusehatService) {}

  @Get("status")
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  getSyncStatus(@CurrentUser() user: JwtPayload) {
    return this.service.getSyncStatus(user.tenantId);
  }

  @Post("sync/medical-record/:id")
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  syncMedicalRecord(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.syncMedicalRecord(user.tenantId, id);
  }
}
