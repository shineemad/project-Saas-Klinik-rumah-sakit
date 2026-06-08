import type { Metadata } from "next";
import { Users, ListOrdered, Receipt, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

const stats = [
  {
    label: "Pasien Hari Ini",
    value: "—",
    icon: Users,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Antrian Aktif",
    value: "—",
    icon: ListOrdered,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    label: "Pendapatan Hari Ini",
    value: "Rp —",
    icon: Receipt,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Stok Hampir Habis",
    value: "—",
    icon: AlertTriangle,
    accent: "bg-rose-50 text-rose-600",
  },
];

export default function DashboardPage() {
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
          <p className="mt-2 text-sm text-slate-500">
            Endpoint{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              GET /v1/queue/today
            </code>{" "}
            belum terhubung. Realtime WebSocket akan otomatis update di sini.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Notifikasi</h2>
          <p className="mt-2 text-sm text-slate-500">Belum ada notifikasi.</p>
        </div>
      </div>
    </div>
  );
}
