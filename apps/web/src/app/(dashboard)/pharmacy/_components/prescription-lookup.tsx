"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface PrescriptionDetail {
  id: string;
  status: "DRAFT" | "ACTIVE" | "DISPENSED" | "CANCELLED";
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    dosageInstruction: string;
    drug: {
      id: string;
      nameGeneric: string;
      unit: string;
      stocks: Array<{ quantityOnHand: number }>;
    };
  }>;
  medicalRecord: {
    patient: {
      name: string;
      medicalRecordNumber: string;
      allergies: Array<{ allergenName: string; allergenType: string }>;
    };
    attendingDoctor: { name: string } | null;
  };
}

const STATUS_LABEL: Record<PrescriptionDetail["status"], string> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif — siap diserahkan",
  DISPENSED: "Sudah diserahkan",
  CANCELLED: "Dibatalkan",
};

export function PrescriptionLookup() {
  const queryClient = useQueryClient();
  const [idInput, setIdInput] = useState("");
  const [rxId, setRxId] = useState("");

  const rxQuery = useQuery({
    queryKey: ["prescription", rxId],
    queryFn: async () =>
      (await api.get<PrescriptionDetail>(`/prescriptions/${rxId}`)).data,
    enabled: rxId.length > 0,
    retry: false,
  });

  const dispenseMutation = useMutation({
    mutationFn: () => api.patch(`/prescriptions/${rxId}/dispense`),
    onSuccess: () => {
      toast.success("Resep diserahkan. Stok otomatis berkurang.");
      queryClient.invalidateQueries({ queryKey: ["prescription", rxId] });
      queryClient.invalidateQueries({ queryKey: ["drugs"] });
      queryClient.invalidateQueries({ queryKey: ["drugs-low-stock"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal memproses resep.");
    },
  });

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setRxId(idInput.trim());
  }

  const rx = rxQuery.data;

  return (
    <div className="space-y-4">
      <form onSubmit={handleLookup} className="flex max-w-lg gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            placeholder="Tempel ID resep (dari rekam medis)…"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 font-mono text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cari Resep
        </button>
      </form>

      {rxId &&
        (rxQuery.isLoading ? (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rxQuery.isError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Resep tidak ditemukan. Periksa kembali ID resep.
          </p>
        ) : rx ? (
          <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {rx.medicalRecord.patient.name}{" "}
                  <span className="font-mono text-xs font-normal text-slate-500">
                    ({rx.medicalRecord.patient.medicalRecordNumber})
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Dokter: {rx.medicalRecord.attendingDoctor?.name ?? "—"} ·{" "}
                  {formatDate(rx.createdAt, true)}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  rx.status === "ACTIVE"
                    ? "bg-blue-50 text-blue-700"
                    : rx.status === "DISPENSED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {STATUS_LABEL[rx.status]}
              </span>
            </div>

            {rx.medicalRecord.patient.allergies.length > 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                Alergi:{" "}
                {rx.medicalRecord.patient.allergies
                  .map((a) => a.allergenName)
                  .join(", ")}
              </p>
            )}

            <table className="mt-4 w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Obat</th>
                  <th className="py-2 font-medium">Jumlah</th>
                  <th className="py-2 font-medium">Aturan Pakai</th>
                  <th className="py-2 font-medium">Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rx.items.map((item) => {
                  const stock = item.drug.stocks.reduce(
                    (sum, s) => sum + s.quantityOnHand,
                    0,
                  );
                  return (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium text-slate-900">
                        {item.drug.nameGeneric}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {item.quantity} {item.drug.unit}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {item.dosageInstruction}
                      </td>
                      <td
                        className={`py-2.5 ${
                          stock < item.quantity
                            ? "font-semibold text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        {stock}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {rx.status === "ACTIVE" && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => dispenseMutation.mutate()}
                  disabled={dispenseMutation.isPending}
                  className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {dispenseMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Serahkan Obat (Dispense)
                </button>
              </div>
            )}
          </div>
        ) : null)}

      {!rxId && (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          Masukkan ID resep untuk melihat detail &amp; memproses penyerahan
          obat. ID resep tersedia di halaman rekam medis pasien.
        </p>
      )}
    </div>
  );
}
