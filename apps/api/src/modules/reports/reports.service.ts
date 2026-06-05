import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as dayjs from "dayjs";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardKpis(tenantId: string) {
    const today = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const yesterday = dayjs().subtract(1, "day").startOf("day").toDate();
    const yesterdayEnd = dayjs().subtract(1, "day").endOf("day").toDate();

    const [
      todayPatients,
      yesterdayPatients,
      todayRevenue,
      yesterdayRevenue,
      pendingInvoices,
      lowStockCount,
    ] = await Promise.all([
      this.prisma.queue.count({
        where: { tenantId, queueDate: { gte: today, lte: todayEnd } },
      }),
      this.prisma.queue.count({
        where: { tenantId, queueDate: { gte: yesterday, lte: yesterdayEnd } },
      }),
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: "PAID",
          paidAt: { gte: today, lte: todayEnd },
        },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: "PAID",
          paidAt: { gte: yesterday, lte: yesterdayEnd },
        },
        _sum: { total: true },
      }),
      this.prisma.invoice.count({ where: { tenantId, status: "UNPAID" } }),
      // Low stock count placeholder
      Promise.resolve(0),
    ]);

    return {
      todayPatients,
      yesterdayPatients,
      patientDelta: todayPatients - yesterdayPatients,
      todayRevenue: todayRevenue._sum.total ?? 0,
      yesterdayRevenue: yesterdayRevenue._sum.total ?? 0,
      revenueDelta:
        (todayRevenue._sum.total ?? 0) - (yesterdayRevenue._sum.total ?? 0),
      pendingInvoices,
      lowStockCount,
    };
  }

  async getDailyReport(tenantId: string, dateStr?: string) {
    const date = dateStr ? dayjs(dateStr) : dayjs();
    const start = date.startOf("day").toDate();
    const end = date.endOf("day").toDate();

    const [queues, revenue, prescriptions] = await Promise.all([
      this.prisma.queue.count({
        where: { tenantId, queueDate: { gte: start, lte: end } },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, status: "PAID", paidAt: { gte: start, lte: end } },
        _sum: { total: true },
      }),
      this.prisma.prescription.count({
        where: { tenantId, createdAt: { gte: start, lte: end } },
      }),
    ]);

    return {
      date: date.format("YYYY-MM-DD"),
      totalPatients: queues,
      totalRevenue: revenue._sum.total ?? 0,
      totalPrescriptions: prescriptions,
    };
  }

  async getRevenueReport(tenantId: string, startDate: string, endDate: string) {
    const start = dayjs(startDate).startOf("day").toDate();
    const end = dayjs(endDate).endOf("day").toDate();

    return this.prisma.invoice.groupBy({
      by: ["paidAt"],
      where: { tenantId, status: "PAID", paidAt: { gte: start, lte: end } },
      _sum: { total: true },
      _count: true,
      orderBy: { paidAt: "asc" },
    });
  }
}
