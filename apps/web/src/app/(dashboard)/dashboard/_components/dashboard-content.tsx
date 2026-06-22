"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, ListOrdered, Receipt, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface DashboardKpis {
  todayPatients: number;
  yesterdayPatients: number;
  patientDelta: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueDelta: number;
  pendingInvoices: number;
  lowStockCount: number;
}

type QueueStatus =
  | "WAITING"
  | "IN_PROGRESS"
  | "DONE_WAITING_CASHIER"
  | "DONE"
  | "CANCELLED";

interface QueueItem {
  id: string;
  queueNumber: number;
  status: QueueStatus;
  patient: { id: string; name: string; medicalRecordNumber: string };
  doctor: { id: string; name: string } | null;
}

const ACTIVE_STATUSES: QueueStatus[] = ["WAITING", "IN_PROGRESS"];

const STATUS_LABEL: Record<QueueStatus, string> = {
  WAITING: "Menunggu",
  IN_PROGRESS: "Diperiksa",
  DONE_WAITING_CASHIER: "Menunggu Kasir",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_BADGE: Record<QueueStatus, string> = {
  WAITING: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  DONE_WAITING_CASHIER: "bg-violet-50 text-violet-700",
  DONE: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export function DashboardContent() {
  const kpisQuery = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () =>
      (await api.get<DashboardKpis>("/reports/dashboard")).data,
  });

  const queuesQuery = useQuery({
    queryKey: ["queues-today"],
    queryFn: async () => (await api.get<QueueItem[]>("/queues/today")).data,
  });

  const kpis = kpisQuery.data;
  const queues = queuesQuery.data ?? [];
  const activeCount = queues.filter((q) =>
    ACTIVE_STATUSES.includes(q.status),
  ).length;

  const num = (value: number | undefined) => {
    if (kpisQuery.isLoading) return "…";
    if (kpisQuery.isError || value === undefined) return "—";
    return value.toLocaleString("id-ID");
  };

  const stats = [
    {
      label: "Pasien Hari Ini",
      value: num(kpis?.todayPatients),
      icon: Users,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Antrian Aktif",
      value: queuesQuery.isLoading
        ? "…"
        : queuesQuery.isError
          ? "—"
          : activeCount.toLocaleString("id-ID"),
      icon: ListOrdered,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Pendapatan Hari Ini",
      value:
        kpisQuery.isLoading || kpisQuery.isError || kpis === undefined
          ? "Rp —"
          : formatCurrency(kpis.todayRevenue),
      icon: Receipt,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Stok Hampir Habis",
      value: num(kpis?.lowStockCount),
      icon: AlertTriangle,
      accent: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan operasional klinik hari ini.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{s.label}</span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-md ${s.accent}`}
              >
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-900">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Antrian Saat Ini
          </h2>

          {queuesQuery.isLoading ? (
            <p className="mt-2 text-sm text-slate-500">Memuat antrean…</p>
          ) : queuesQuery.isError ? (
            <p className="mt-2 text-sm text-rose-600">
              Gagal memuat data antrean.
            </p>
          ) : queues.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Belum ada antrean hari ini.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {queues.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                      {q.queueNumber}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {q.patient.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {q.patient.medicalRecordNumber}
                        {q.doctor ? ` · ${q.doctor.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[q.status]}`}
                  >
                    {STATUS_LABEL[q.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Notifikasi</h2>
          <p className="mt-2 text-sm text-slate-500">Belum ada notifikasi.</p>
        </div>
      </div>
    </div>
  );
}
