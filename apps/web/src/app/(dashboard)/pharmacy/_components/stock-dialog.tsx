"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { totalStock, type DrugListItem } from "./pharmacy-shared";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

type Mode = "in" | "adjust";

export function StockDialog({
  drug,
  onClose,
}: {
  drug: DrugListItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("in");
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (drug) {
      setMode("in");
      setQuantity("");
      setBatchNumber("");
      setExpiryDate("");
      setNotes("");
    }
  }, [drug]);

  const mutation = useMutation({
    mutationFn: () => {
      if (mode === "in") {
        const payload: Record<string, unknown> = {
          drugId: drug!.id,
          quantity: Number(quantity),
        };
        if (batchNumber) payload.batchNumber = batchNumber;
        if (expiryDate) payload.expiryDate = expiryDate;
        if (notes) payload.notes = notes;
        return api.post("/stock/in", payload);
      }
      return api.post("/stock/adjust", {
        drugId: drug!.id,
        newQuantity: Number(quantity),
        notes,
      });
    },
    onSuccess: () => {
      toast.success(
        mode === "in" ? "Stok berhasil ditambahkan." : "Stok disesuaikan.",
      );
      queryClient.invalidateQueries({ queryKey: ["drugs"] });
      queryClient.invalidateQueries({ queryKey: ["drugs-low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["drugs-expiring"] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = e?.response?.data?.message ?? "Gagal memproses stok.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  if (!drug) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 0 || (mode === "in" && qty <= 0)) {
      toast.error("Jumlah tidak valid.");
      return;
    }
    if (mode === "adjust" && notes.trim().length === 0) {
      toast.error("Alasan penyesuaian wajib diisi.");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Stok — {drug.nameGeneric}
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
        <p className="mt-1 text-sm text-slate-500">
          Stok saat ini:{" "}
          <span className="font-semibold text-slate-700">
            {totalStock(drug)} {drug.unit}
          </span>
        </p>

        <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
          {(
            [
              ["in", "Stok Masuk"],
              ["adjust", "Penyesuaian"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                mode === m
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {mode === "in" ? "Jumlah Masuk" : "Jumlah Baru (total)"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>

          {mode === "in" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nomor Batch
                </label>
                <input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tgl Expired
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Catatan{" "}
              {mode === "adjust" && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={
                mode === "adjust"
                  ? "Alasan penyesuaian (wajib)…"
                  : "Nomor PO / keterangan…"
              }
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
