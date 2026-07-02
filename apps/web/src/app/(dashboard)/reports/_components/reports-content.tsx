"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, Receipt, Pill } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DailyReport {
  date: string;
  totalPatients: number;
  totalRevenue: string | number;
  totalPrescriptions: number;
}

interface RevenueRow {
  paidAt: string;
  _sum: { total: string | number | null };
  _count: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function ReportsContent() {
  const [date, setDate] = useState(todayStr());
  const [startDate, setStartDate] = useState(daysAgoStr(7));
  const [endDate, setEndDate] = useState(todayStr());

  const dailyQuery = useQuery({
    queryKey: ["report-daily", date],
    queryFn: async () =>
      (await api.get<DailyReport>("/reports/daily", { params: { date } })).data,
  });

  const revenueQuery = useQuery({
    queryKey: ["report-revenue", startDate, endDate],
    queryFn: async () =>
      (
        await api.get<RevenueRow[]>("/reports/revenue", {
          params: { startDate, endDate },
        })
      ).data,
    enabled: Boolean(startDate && endDate),
  });

  const daily = dailyQuery.data;

  // Agregasi pendapatan per hari (endpoint mengembalikan per timestamp paidAt).
  const revenueByDay = (() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const row of revenueQuery.data ?? []) {
      const day = row.paidAt.slice(0, 10);
      const prev = map.get(day) ?? { total: 0, count: 0 };
      map.set(day, {
        total: prev.total + Number(row._sum.total ?? 0),
        count: prev.count + row._count,
      });
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  })();

  const revenueTotal = revenueByDay.reduce((sum, [, v]) => sum + v.total, 0);
  const maxDaily = Math.max(...revenueByDay.map(([, v]) => v.total), 1);

  const dailyCards = [
    {
      label: "Total Pasien",
      value: daily ? daily.totalPatients.toLocaleString("id-ID") : "—",
      icon: Users,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pendapatan",
      value: daily ? formatCurrency(daily.totalRevenue) : "Rp —",
      icon: Receipt,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Resep Dikeluarkan",
      value: daily ? daily.totalPrescriptions.toLocaleString("id-ID") : "—",
      icon: Pill,
      accent: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Laporan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Laporan harian dan pendapatan klinik.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Laporan Harian
          </h2>
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            aria-label="Pilih tanggal laporan harian"
          />
        </div>

        {dailyQuery.isLoading ? (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : dailyQuery.isError ? (
          <p className="text-sm text-rose-600">
            Gagal memuat laporan harian (khusus Owner).
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {dailyCards.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{c.label}</span>
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-md ${c.accent}`}
                  >
                    <c.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {c.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Laporan Pendapatan
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
              aria-label="Tanggal mulai"
            />
            <span>s.d.</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayStr()}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
              aria-label="Tanggal akhir"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {revenueQuery.isLoading ? (
            <div className="flex justify-center py-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : revenueQuery.isError ? (
            <p className="text-sm text-rose-600">
              Gagal memuat laporan pendapatan (khusus Owner).
            </p>
          ) : revenueByDay.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Tidak ada pembayaran pada periode ini.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Total periode:{" "}
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(revenueTotal)}
                </span>
              </p>
              <div className="mt-4 space-y-2">
                {revenueByDay.map(([day, v]) => (
                  <div key={day} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 text-slate-600">
                      {formatDate(day)}
                    </span>
                    <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                      <div
                        className="h-full rounded bg-brand-600"
                        style={{
                          width: `${Math.max((v.total / maxDaily) * 100, 2)}%`,
                        }}
                      />
                    </div>
                    <span className="w-32 shrink-0 text-right font-medium text-slate-900">
                      {formatCurrency(v.total)}
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs text-slate-500">
                      {v.count} inv.
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
