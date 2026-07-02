"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABEL,
  type InvoiceListItem,
  type InvoiceStatus,
} from "./billing-shared";
import { InvoiceDetailPanel } from "./invoice-detail-panel";

const FILTERS: Array<{ value: InvoiceStatus | ""; label: string }> = [
  { value: "", label: "Semua" },
  { value: "UNPAID", label: "Belum Dibayar" },
  { value: "PAID", label: "Lunas" },
  { value: "REFUNDED", label: "Refund" },
];

export function BillingContent() {
  const [status, setStatus] = useState<InvoiceStatus | "">("UNPAID");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ["invoices", status],
    queryFn: async () =>
      (
        await api.get<InvoiceListItem[]>("/invoices", {
          params: { status: status || undefined },
        })
      ).data,
  });

  const invoices = invoicesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-600">
          Proses pembayaran, cek invoice, dan refund.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 sm:max-w-md">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
              status === f.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">No. Invoice</th>
              <th className="px-4 py-3 font-medium">Pasien</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoicesQuery.isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : invoicesQuery.isError ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-rose-600"
                >
                  Gagal memuat data invoice.
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  {status
                    ? `Tidak ada invoice berstatus "${INVOICE_STATUS_LABEL[status]}".`
                    : "Belum ada invoice."}
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">
                      {inv.patient.name}
                    </span>
                    <span className="ml-1 font-mono text-xs text-slate-400">
                      {inv.patient.medicalRecordNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(inv.createdAt, true)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_BADGE[inv.status]}`}
                    >
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-brand-700">
                      Detail →
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InvoiceDetailPanel
        invoiceId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
