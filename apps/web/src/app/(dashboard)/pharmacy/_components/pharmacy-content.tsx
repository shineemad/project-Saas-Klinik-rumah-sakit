"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  CalendarClock,
  Pill,
  PackagePlus,
  History,
  ClipboardList,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  totalStock,
  type DrugListItem,
  type ExpiringStockItem,
} from "./pharmacy-shared";
import { DrugFormDialog } from "./drug-form-dialog";
import { StockDialog } from "./stock-dialog";
import { MovementsDialog } from "./movements-dialog";
import { PrescriptionLookup } from "./prescription-lookup";

type Tab = "drugs" | "low-stock" | "expiring" | "prescriptions";

const TABS: Array<{ id: Tab; label: string; icon: typeof Pill }> = [
  { id: "drugs", label: "Master Obat", icon: Pill },
  { id: "low-stock", label: "Stok Menipis", icon: AlertTriangle },
  { id: "expiring", label: "Segera Expired", icon: CalendarClock },
  { id: "prescriptions", label: "Resep", icon: ClipboardList },
];

export function PharmacyContent() {
  const [tab, setTab] = useState<Tab>("drugs");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [drugDialogOpen, setDrugDialogOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<DrugListItem | null>(null);
  const [stockDrug, setStockDrug] = useState<DrugListItem | null>(null);
  const [movementsDrug, setMovementsDrug] = useState<DrugListItem | null>(null);

  const drugsQuery = useQuery({
    queryKey: ["drugs", q],
    queryFn: async () =>
      (
        await api.get<DrugListItem[]>("/drugs", {
          params: { q: q || undefined },
        })
      ).data,
    enabled: tab === "drugs",
  });

  const lowStockQuery = useQuery({
    queryKey: ["drugs-low-stock"],
    queryFn: async () =>
      (
        await api.get<Array<DrugListItem & { totalStock: number }>>(
          "/drugs/low-stock",
        )
      ).data,
    enabled: tab === "low-stock",
  });

  const expiringQuery = useQuery({
    queryKey: ["drugs-expiring"],
    queryFn: async () =>
      (await api.get<ExpiringStockItem[]>("/drugs/expiring-soon")).data,
    enabled: tab === "expiring",
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Farmasi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola master obat, stok, dan penyerahan resep.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingDrug(null);
            setDrugDialogOpen(true);
          }}
          className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Obat
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition",
              tab === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "drugs" && (
        <>
          <form onSubmit={handleSearch} className="flex max-w-sm gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama obat…"
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cari
            </button>
          </form>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Obat</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Harga Jual</th>
                  <th className="px-4 py-3 font-medium">Stok</th>
                  <th className="px-4 py-3 font-medium">Min. Stok</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drugsQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                ) : drugsQuery.isError ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-rose-600"
                    >
                      Gagal memuat data obat.
                    </td>
                  </tr>
                ) : (drugsQuery.data ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      {q
                        ? `Tidak ada obat yang cocok dengan "${q}".`
                        : "Belum ada obat terdaftar."}
                    </td>
                  </tr>
                ) : (
                  (drugsQuery.data ?? []).map((d) => {
                    const stock = totalStock(d);
                    const low = stock <= (d.minimumStock ?? 0);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            {d.nameGeneric}
                          </span>
                          {d.nameBrand && (
                            <span className="ml-1 text-xs text-slate-500">
                              ({d.nameBrand})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.category ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatCurrency(d.sellingPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "font-medium",
                              low ? "text-rose-600" : "text-slate-700",
                            )}
                          >
                            {stock} {d.unit}
                          </span>
                          {low && (
                            <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-rose-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.minimumStock ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setStockDrug(d)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              <PackagePlus className="h-3.5 w-3.5" />
                              Stok
                            </button>
                            <button
                              type="button"
                              onClick={() => setMovementsDrug(d)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              <History className="h-3.5 w-3.5" />
                              Riwayat
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDrug(d);
                                setDrugDialogOpen(true);
                              }}
                              className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "low-stock" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Obat</th>
                <th className="px-4 py-3 font-medium">Sisa Stok</th>
                <th className="px-4 py-3 font-medium">Min. Stok</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (lowStockQuery.data ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Tidak ada obat di bawah batas minimum. 👍
                  </td>
                </tr>
              ) : (
                (lowStockQuery.data ?? []).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {d.nameGeneric}
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-600">
                      {d.totalStock} {d.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.minimumStock ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setStockDrug(d)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Tambah Stok
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "expiring" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Obat</th>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Tgl Expired</th>
                <th className="px-4 py-3 font-medium">Sisa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiringQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (expiringQuery.data ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Tidak ada obat yang akan expired dalam 30 hari.
                  </td>
                </tr>
              ) : (
                (expiringQuery.data ?? []).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {s.drug.nameGeneric}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {s.batchNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-700">
                      {formatDate(s.expiryDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.quantityOnHand} {s.drug.unit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "prescriptions" && <PrescriptionLookup />}

      <DrugFormDialog
        open={drugDialogOpen}
        drug={editingDrug}
        onClose={() => setDrugDialogOpen(false)}
      />
      <StockDialog drug={stockDrug} onClose={() => setStockDrug(null)} />
      <MovementsDialog
        drug={movementsDrug}
        onClose={() => setMovementsDrug(null)}
      />
    </div>
  );
}
