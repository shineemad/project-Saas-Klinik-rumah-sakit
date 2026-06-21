import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Setup2faDto, Verify2faDto } from "./dto/two-factor.dto";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtPayload } from "../../common/types";
import { Request } from "express";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip ?? "");
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body("refreshToken") token: string) {
    return this.authService.refreshTokens(token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.sessionId);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("2fa/setup")
  setup2fa(@CurrentUser() user: JwtPayload) {
    return this.authService.setup2fa(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("2fa/verify")
  verify2fa(@CurrentUser() user: JwtPayload, @Body() dto: Verify2faDto) {
    return this.authService.verify2fa(user.sub, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("me")
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }
}
