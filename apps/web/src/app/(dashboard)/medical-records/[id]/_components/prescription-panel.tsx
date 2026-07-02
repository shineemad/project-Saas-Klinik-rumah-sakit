"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Search, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { PatientAllergy } from "../../_components/medical-record-shared";

interface DrugOption {
  id: string;
  nameGeneric: string;
  nameBrand: string | null;
  unit: string;
  sellingPrice: string | number;
  stocks: Array<{ quantityOnHand: number }>;
}

interface RxItem {
  drugId: string;
  drugName: string;
  unit: string;
  totalStock: number;
  quantity: number;
  dosageInstruction: string;
}

interface PrescriptionPanelProps {
  open: boolean;
  recordId: string;
  drugAllergies: PatientAllergy[];
  onClose: () => void;
}

export function PrescriptionPanel({
  open,
  recordId,
  drugAllergies,
  onClose,
}: PrescriptionPanelProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RxItem[]>([]);
  const [allergyConflict, setAllergyConflict] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setItems([]);
      setAllergyConflict(null);
    }
  }, [open]);

  const drugsQuery = useQuery({
    queryKey: ["rx-drug-search", search],
    queryFn: async () =>
      (await api.get<DrugOption[]>("/drugs", { params: { q: search } })).data,
    enabled: open && search.length > 0,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/medical-records/${recordId}/prescriptions`, {
        items: items.map((i) => ({
          drugId: i.drugId,
          quantity: i.quantity,
          dosageInstruction: i.dosageInstruction,
        })),
      }),
    onSuccess: () => {
      toast.success("Resep tersimpan.");
      queryClient.invalidateQueries({ queryKey: ["medical-record", recordId] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string; code?: string } };
      };
      const data = e?.response?.data;
      if (data?.code === "ALLERGY_CONFLICT") {
        // BR-02: blocking modal merah
        setAllergyConflict(data.message ?? "Konflik alergi terdeteksi.");
        return;
      }
      toast.error(data?.message ?? "Gagal menyimpan resep.");
    },
  });

  if (!open) return null;

  const totalStockOf = (d: DrugOption) =>
    d.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0);

  const isAllergyRisk = (d: DrugOption) =>
    drugAllergies.some(
      (a) =>
        d.nameGeneric.toLowerCase().includes(a.allergenName.toLowerCase()) ||
        (d.nameBrand ?? "")
          .toLowerCase()
          .includes(a.allergenName.toLowerCase()),
    );

  function addDrug(d: DrugOption) {
    if (items.some((i) => i.drugId === d.id)) return;
    setItems([
      ...items,
      {
        drugId: d.id,
        drugName: d.nameGeneric,
        unit: d.unit,
        totalStock: totalStockOf(d),
        quantity: 1,
        dosageInstruction: "",
      },
    ]);
  }

  function updateItem(drugId: string, patch: Partial<RxItem>) {
    setItems(items.map((i) => (i.drugId === drugId ? { ...i, ...patch } : i)));
  }

  function handleSubmit() {
    if (items.length === 0) {
      toast.error("Tambahkan minimal satu obat.");
      return;
    }
    const invalid = items.find(
      (i) => i.quantity < 1 || !i.dosageInstruction.trim(),
    );
    if (invalid) {
      toast.error(`Lengkapi jumlah & aturan pakai untuk ${invalid.drugName}.`);
      return;
    }
    const overStock = items.find((i) => i.quantity > i.totalStock);
    if (overStock) {
      // BR-03: stok tidak boleh negatif — blokir sebelum kirim
      toast.error(
        `Stok ${overStock.drugName} tidak cukup (tersedia: ${overStock.totalStock}).`,
      );
      return;
    }
    submitMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      {/* Slide-over dari kanan (PRD 5.4D) */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Tambah Resep</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Cari Obat
            </label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama generik / merek…"
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {search && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-200">
                {drugsQuery.isLoading ? (
                  <div className="flex justify-center py-4 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (drugsQuery.data ?? []).length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-slate-500">
                    Obat tidak ditemukan.
                  </p>
                ) : (
                  (drugsQuery.data ?? []).map((d) => {
                    const stock = totalStockOf(d);
                    const outOfStock = stock <= 0;
                    const allergic = isAllergyRisk(d);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addDrug(d)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          outOfStock
                            ? `Stok ${d.nameGeneric} habis. Pilih obat alternatif atau hubungi apoteker.`
                            : undefined
                        }
                      >
                        <span
                          className={
                            allergic ? "text-rose-600" : "text-slate-700"
                          }
                        >
                          {d.nameGeneric}
                          {d.nameBrand ? ` (${d.nameBrand})` : ""}
                          {allergic && (
                            <AlertTriangle className="ml-1 inline h-3.5 w-3.5" />
                          )}
                        </span>
                        <span
                          className={`text-xs ${outOfStock ? "font-semibold text-rose-600" : "text-slate-500"}`}
                        >
                          Stok: {stock} {d.unit}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.drugId}
                  className={`rounded-lg border p-3 ${
                    item.quantity > item.totalStock
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {item.drugName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setItems(items.filter((i) => i.drugId !== item.drugId))
                      }
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                      aria-label={`Hapus ${item.drugName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500">
                        Jumlah ({item.unit})
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.drugId, {
                            quantity: Number(e.target.value),
                          })
                        }
                        className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500">
                        Aturan Pakai
                      </label>
                      <input
                        value={item.dosageInstruction}
                        onChange={(e) =>
                          updateItem(item.drugId, {
                            dosageInstruction: e.target.value,
                          })
                        }
                        placeholder="mis. 3×1 sesudah makan"
                        className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  {item.quantity > item.totalStock && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      Stok tidak cukup (tersedia: {item.totalStock}).
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Simpan Resep
          </button>
        </div>
      </div>

      {/* BR-02: blocking modal merah konflik alergi */}
      {allergyConflict && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl border-2 border-rose-500 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-rose-600" />
              <div>
                <h3 className="text-base font-bold text-rose-700">
                  PERINGATAN ALERGI
                </h3>
                <p className="mt-2 text-sm text-slate-700">{allergyConflict}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Penyimpanan resep diblokir oleh sistem (Allergy Safety Gate).
                  Ganti obat yang berkonflik lalu simpan ulang.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAllergyConflict(null)}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Mengerti, ubah resep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
