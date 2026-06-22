import { Test, TestingModule } from "@nestjs/testing";
import { ReportsService } from "./reports.service";
import { PrismaService } from "../../database/prisma.service";

describe("ReportsService", () => {
  let service: ReportsService;
  let prisma: {
    queue: { count: jest.Mock };
    invoice: { aggregate: jest.Mock; count: jest.Mock };
    drug: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      queue: { count: jest.fn() },
      invoice: { aggregate: jest.fn(), count: jest.fn() },
      drug: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("getDashboardKpis", () => {
    it("aggregates KPIs and counts drugs at or below minimum stock", async () => {
      // Promise.all order: todayPatients, yesterdayPatients
      prisma.queue.count
        .mockResolvedValueOnce(4) // todayPatients
        .mockResolvedValueOnce(2); // yesterdayPatients
      // Promise.all order: todayRevenue, yesterdayRevenue
      prisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { total: 100000 } }) // today
        .mockResolvedValueOnce({ _sum: { total: 50000 } }); // yesterday
      prisma.invoice.count.mockResolvedValue(3); // pendingInvoices
      prisma.drug.findMany.mockResolvedValue([
        // total 5 <= 10 -> low
        {
          minimumStock: 10,
          stocks: [{ quantityOnHand: 3 }, { quantityOnHand: 2 }],
        },
        // total 10 > 5 -> not low
        { minimumStock: 5, stocks: [{ quantityOnHand: 10 }] },
        // minimumStock null -> compared against 0; total 0 <= 0 -> low
        { minimumStock: null, stocks: [{ quantityOnHand: 0 }] },
      ]);

      const result = await service.getDashboardKpis("tenant-1");

      expect(result).toEqual({
        todayPatients: 4,
        yesterdayPatients: 2,
        patientDelta: 2,
        todayRevenue: 100000,
        yesterdayRevenue: 50000,
        revenueDelta: 50000,
        pendingInvoices: 3,
        lowStockCount: 2,
      });
    });

    it("returns lowStockCount 0 when no drugs are below minimum", async () => {
      prisma.queue.count.mockResolvedValue(0);
      prisma.invoice.aggregate.mockResolvedValue({ _sum: { total: null } });
      prisma.invoice.count.mockResolvedValue(0);
      prisma.drug.findMany.mockResolvedValue([
        { minimumStock: 5, stocks: [{ quantityOnHand: 50 }] },
      ]);

      const result = await service.getDashboardKpis("tenant-1");

      expect(result.lowStockCount).toBe(0);
      expect(result.todayRevenue).toBe(0);
      expect(result.revenueDelta).toBe(0);
    });
  });
});
