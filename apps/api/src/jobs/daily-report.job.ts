import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../database/prisma.service";
import { NotificationsService } from "../modules/notifications/notifications.service";
import * as dayjs from "dayjs";

@Injectable()
export class DailyReportJob {
  private readonly logger = new Logger(DailyReportJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Runs every day at 07:00 WIB (UTC+7 = 00:00 UTC)
  @Cron("0 0 * * *", { timeZone: "Asia/Jakarta" })
  async sendDailyReports() {
    this.logger.log("Running daily report job...");
    const yesterday = dayjs().subtract(1, "day");
    const start = yesterday.startOf("day").toDate();
    const end = yesterday.endOf("day").toDate();

    const tenants = await this.prisma.tenant.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      include: {
        users: {
          where: { role: "OWNER", isActive: true },
          select: { email: true },
        },
      },
    });

    for (const tenant of tenants) {
      try {
        const [patients, revenue, prescriptions] = await Promise.all([
          this.prisma.queue.count({
            where: { tenantId: tenant.id, queueDate: { gte: start, lte: end } },
          }),
          this.prisma.invoice.aggregate({
            where: {
              tenantId: tenant.id,
              status: "PAID",
              paidAt: { gte: start, lte: end },
            },
            _sum: { total: true },
          }),
          this.prisma.prescription.count({
            where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
          }),
        ]);

        const reportData = {
          date: yesterday.format("DD MMMM YYYY"),
          totalPatients: patients,
          totalRevenue: revenue._sum.total ?? 0,
          totalPrescriptions: prescriptions,
        };

        for (const owner of tenant.users) {
          await this.notifications.sendDailyReport(owner.email, reportData);
        }
      } catch (error) {
        this.logger.error(
          `Failed daily report for tenant ${tenant.id}: ${String(error)}`,
        );
      }
    }
  }
}
