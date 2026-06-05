import { Module } from "@nestjs/common";
import { DailyReportJob } from "./daily-report.job";
import { StockAlertJob } from "./stock-alert.job";
import { NotificationsModule } from "../modules/notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  providers: [DailyReportJob, StockAlertJob],
})
export class JobsModule {}
