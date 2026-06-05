import { registerAs } from "@nestjs/config";

export const jwtConfig = registerAs("jwt", () => ({
  accessSecret:
    process.env.JWT_ACCESS_SECRET ?? "fallback_dev_secret_change_me",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ?? "fallback_refresh_secret_change_me",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
}));
