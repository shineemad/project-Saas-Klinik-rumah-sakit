"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  BLOOD_TYPE_LABEL,
  BLOOD_TYPE_OPTIONS,
  type PatientDetail,
} from "./patient-shared";

const patientFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["MALE", "FEMALE"], {
    message: "Jenis kelamin wajib dipilih",
  }),
  phone: z
    .string()
    .regex(/^[0-9]{10,15}$/, "Nomor HP 10-15 digit angka")
    .optional()
    .or(z.literal("")),
  nik: z
    .string()
    .regex(/^[0-9]{16}$/, "NIK harus 16 digit angka")
    .optional()
    .or(z.literal("")),
  bpjsNumber: z.string().max(20).optional().or(z.literal("")),
  bloodType: z.string().optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

type PatientFormInput = z.infer<typeof patientFormSchema>;

interface PatientFormDialogProps {
  open: boolean;
  patientId: string | null;
  onClose: () => void;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function PatientFormDialog({
  open,
  patientId,
  onClose,
}: PatientFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = patientId !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormInput>({ resolver: zodResolver(patientFormSchema) });

  const detailQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () =>
      (await api.get<PatientDetail>(`/patients/${patientId}`)).data,
    enabled: open && isEdit,
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && detailQuery.data) {
      const p = detailQuery.data;
      reset({
        name: p.name,
        birthDate: p.birthDate ? p.birthDate.slice(0, 10) : "",
        gender: p.gender,
        phone: p.phone ?? "",
        nik: p.nik ?? "",
        bpjsNumber: p.bpjsNumber ?? "",
        bloodType: p.bloodType ?? "",
        address: p.address ?? "",
      });
    } else if (!isEdit) {
      reset({
        name: "",
        birthDate: "",
        gender: "MALE",
        phone: "",
        nik: "",
        bpjsNumber: "",
        bloodType: "",
        address: "",
      });
    }
  }, [open, isEdit, detailQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEdit
        ? api.put(`/patients/${patientId}`, payload)
        : api.post("/patients", payload),
    onSuccess: () => {
      toast.success(
        isEdit ? "Data pasien diperbarui." : "Pasien baru ditambahkan.",
      );
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      }
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal menyimpan data.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  function onSubmit(values: PatientFormInput) {
    const payload: Record<string, unknown> = {
      name: values.name,
      birthDate: values.birthDate,
      gender: values.gender,
    };
    if (values.phone) payload.phone = values.phone;
    if (values.nik) payload.nik = values.nik;
    if (values.bpjsNumber) payload.bpjsNumber = values.bpjsNumber;
    if (values.bloodType) payload.bloodType = values.bloodType;
    if (values.address) payload.address = values.address;
    mutation.mutate(payload);
  }

  if (!open) return null;

  const loadingDetail = isEdit && detailQuery.isLoading;

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
            {isEdit ? "Edit Pasien" : "Tambah Pasien"}
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

        {loadingDetail ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input {...register("name")} className={inputClass} />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("birthDate")}
                  className={inputClass}
                />
                {errors.birthDate && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <select {...register("gender")} className={inputClass}>
                  <option value="MALE">Laki-laki</option>
                  <option value="FEMALE">Perempuan</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nomor HP
                </label>
                <input
                  inputMode="numeric"
                  {...register("phone")}
                  className={inputClass}
                  placeholder="08xxxxxxxxxx"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Golongan Darah
                </label>
                <select {...register("bloodType")} className={inputClass}>
                  <option value="">—</option>
                  {BLOOD_TYPE_OPTIONS.map((bt) => (
                    <option key={bt} value={bt}>
                      {BLOOD_TYPE_LABEL[bt]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  NIK
                </label>
                <input
                  inputMode="numeric"
                  {...register("nik")}
                  className={inputClass}
                  placeholder="16 digit"
                />
                {errors.nik && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.nik.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  No. BPJS
                </label>
                <input {...register("bpjsNumber")} className={inputClass} />
                {errors.bpjsNumber && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.bpjsNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Alamat
              </label>
              <textarea
                {...register("address")}
                rows={2}
                className={inputClass}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.address.message}
                </p>
              )}
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
                disabled={isSubmitting || mutation.isPending}
                className="flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {(isSubmitting || mutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
