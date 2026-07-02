"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  MOVEMENT_LABEL,
  type DrugListItem,
  type StockMovementItem,
} from "./pharmacy-shared";

const MOVEMENT_BADGE: Record<StockMovementItem["movementType"], string> = {
  IN: "bg-emerald-50 text-emerald-700",
  OUT: "bg-blue-50 text-blue-700",
  ADJUSTMENT: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-rose-50 text-rose-700",
  RETURN: "bg-violet-50 text-violet-700",
};

export function MovementsDialog({
  drug,
  onClose,
}: {
  drug: DrugListItem | null;
  onClose: () => void;
}) {
  const movementsQuery = useQuery({
    queryKey: ["drug-movements", drug?.id],
    queryFn: async () =>
      (await api.get<StockMovementItem[]>(`/drugs/${drug!.id}/stock-movements`))
        .data,
    enabled: drug !== null,
  });

  if (!drug) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Riwayat Pergerakan Stok — {drug.nameGeneric}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Tanggal</th>
                <th className="px-4 py-2.5 font-medium">Jenis</th>
                <th className="px-4 py-2.5 font-medium">Jumlah</th>
                <th className="px-4 py-2.5 font-medium">Referensi</th>
                <th className="px-4 py-2.5 font-medium">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movementsQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (movementsQuery.data ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada pergerakan stok.
                  </td>
                </tr>
              ) : (
                (movementsQuery.data ?? []).map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5 text-slate-600">
                      {formatDate(m.createdAt, true)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${MOVEMENT_BADGE[m.movementType]}`}
                      >
                        {MOVEMENT_LABEL[m.movementType]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {m.movementType === "OUT" ? "−" : "+"}
                      {m.quantity} {drug.unit}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                      {m.referenceType
                        ? `${m.referenceType}${m.referenceId ? ` · ${m.referenceId.slice(0, 8)}…` : ""}`
                        : (m.notes ?? "—")}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {m.performedBy?.name ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
