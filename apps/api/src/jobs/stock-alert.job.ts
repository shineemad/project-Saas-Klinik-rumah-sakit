import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../database/prisma.service";
import { NotificationsService } from "../modules/notifications/notifications.service";
import * as dayjs from "dayjs";

@Injectable()
export class StockAlertJob {
  private readonly logger = new Logger(StockAlertJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Runs every 2 hours
  @Cron("0 */2 * * *")
  async checkLowStock() {
    this.logger.log("Checking low stock levels...");

    const tenants = await this.prisma.tenant.findMany({
      where: { subscriptionStatus: "ACTIVE" },
    });

    for (const tenant of tenants) {
      const drugs = await this.prisma.drug.findMany({
        where: { tenantId: tenant.id, isActive: true },
        include: { stocks: true },
      });

      const pharmacists = await this.prisma.user.findMany({
        where: {
          tenantId: tenant.id,
          role: { in: ["PHARMACIST", "OWNER"] },
          isActive: true,
        },
        select: { email: true },
      });

      for (const drug of drugs) {
        const totalStock = drug.stocks.reduce(
          (sum, s) => sum + s.quantityOnHand,
          0,
        );
        if (drug.minimumStock !== null && totalStock <= drug.minimumStock) {
          for (const user of pharmacists) {
            await this.notifications.sendLowStockAlert(
              user.email,
              drug.nameGeneric,
              totalStock,
              drug.minimumStock,
            );
          }
        }
      }
    }
  }

  // Check expiring drugs daily at 08:00 WIB
  @Cron("0 1 * * *", { timeZone: "Asia/Jakarta" })
  async checkExpiringDrugs() {
    this.logger.log("Checking expiring drugs...");
    const thirtyDaysFromNow = dayjs().add(30, "day").toDate();

    const expiringSoon = await this.prisma.drugStock.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow },
        quantityOnHand: { gt: 0 },
      },
      include: {
        drug: {
          include: {
            tenant: {
              include: {
                users: {
                  where: {
                    role: { in: ["PHARMACIST", "OWNER"] },
                    isActive: true,
                  },
                  select: { email: true },
                },
              },
            },
          },
        },
      },
    });

    for (const stock of expiringSoon) {
      for (const user of stock.drug.tenant.users) {
        await this.notifications.sendExpiryAlert(
          user.email,
          stock.drug.nameGeneric,
          stock.batchNumber ?? "N/A",
          stock.expiryDate!,
        );
      }
    }
  }
}
