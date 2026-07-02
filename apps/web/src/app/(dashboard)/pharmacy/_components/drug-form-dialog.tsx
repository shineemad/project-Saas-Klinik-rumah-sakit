"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { DrugListItem } from "./pharmacy-shared";

const drugFormSchema = z.object({
  nameGeneric: z.string().min(1, "Nama generik wajib diisi"),
  nameBrand: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  unit: z.string().min(1, "Satuan wajib diisi (mis. tablet)"),
  purchasePrice: z.coerce.number().positive("Harga beli harus > 0"),
  sellingPrice: z.coerce.number().positive("Harga jual harus > 0"),
  minimumStock: z.coerce.number().min(0).optional(),
});

type DrugFormInput = z.infer<typeof drugFormSchema>;

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function DrugFormDialog({
  open,
  drug,
  onClose,
}: {
  open: boolean;
  drug: DrugListItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = drug !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DrugFormInput>({ resolver: zodResolver(drugFormSchema) });

  useEffect(() => {
    if (!open) return;
    if (drug) {
      reset({
        nameGeneric: drug.nameGeneric,
        nameBrand: drug.nameBrand ?? "",
        category: drug.category ?? "",
        unit: drug.unit,
        purchasePrice: Number(drug.purchasePrice),
        sellingPrice: Number(drug.sellingPrice),
        minimumStock: drug.minimumStock ?? 0,
      });
    } else {
      reset({
        nameGeneric: "",
        nameBrand: "",
        category: "",
        unit: "",
        purchasePrice: 0,
        sellingPrice: 0,
        minimumStock: 0,
      });
    }
  }, [open, drug, reset]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit
        ? api.put(`/drugs/${drug!.id}`, payload)
        : api.post("/drugs", payload),
    onSuccess: () => {
      toast.success(isEdit ? "Data obat diperbarui." : "Obat ditambahkan.");
      queryClient.invalidateQueries({ queryKey: ["drugs"] });
      queryClient.invalidateQueries({ queryKey: ["drugs-low-stock"] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = e?.response?.data?.message ?? "Gagal menyimpan obat.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  function onSubmit(values: DrugFormInput) {
    const payload: Record<string, unknown> = {
      nameGeneric: values.nameGeneric,
      unit: values.unit,
      purchasePrice: values.purchasePrice,
      sellingPrice: values.sellingPrice,
    };
    if (values.nameBrand) payload.nameBrand = values.nameBrand;
    if (values.category) payload.category = values.category;
    if (values.minimumStock !== undefined)
      payload.minimumStock = values.minimumStock;
    mutation.mutate(payload);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Obat" : "Tambah Obat"}
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

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nama Generik <span className="text-rose-500">*</span>
              </label>
              <input {...register("nameGeneric")} className={inputClass} />
              {errors.nameGeneric && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.nameGeneric.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nama Merek
              </label>
              <input {...register("nameBrand")} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Kategori
              </label>
              <input
                {...register("category")}
                className={inputClass}
                placeholder="mis. Antibiotik"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Satuan <span className="text-rose-500">*</span>
              </label>
              <input
                {...register("unit")}
                className={inputClass}
                placeholder="tablet / botol / strip"
              />
              {errors.unit && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Harga Beli <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                {...register("purchasePrice")}
                className={inputClass}
              />
              {errors.purchasePrice && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.purchasePrice.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Harga Jual <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                {...register("sellingPrice")}
                className={inputClass}
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.sellingPrice.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Min. Stok
              </label>
              <input
                type="number"
                min={0}
                {...register("minimumStock")}
                className={inputClass}
              />
            </div>
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
