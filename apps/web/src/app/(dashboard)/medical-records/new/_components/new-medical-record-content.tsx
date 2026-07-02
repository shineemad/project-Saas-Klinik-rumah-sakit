"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export function NewMedicalRecordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const patientId = params.get("patientId") ?? "";
  const patientName = params.get("patientName") ?? "";
  const [chiefComplaint, setChiefComplaint] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: { patientId: string; chiefComplaint: string }) =>
      api.post<{ id: string }>("/medical-records", payload),
    onSuccess: (res) => {
      toast.success("Kunjungan baru dibuat. Silakan isi SOAP notes.");
      router.replace(`/medical-records/${res.data.id}`);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal membuat kunjungan.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      toast.error("Pasien tidak valid. Mulai dari halaman Antrian.");
      return;
    }
    if (chiefComplaint.trim().length < 3) {
      toast.error("Keluhan utama wajib diisi.");
      return;
    }
    mutation.mutate({ patientId, chiefComplaint: chiefComplaint.trim() });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/queue"
          className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Antrian
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Mulai Pemeriksaan
        </h1>
        {patientName && (
          <p className="mt-1 text-sm text-slate-600">
            Pasien: <span className="font-medium">{patientName}</span>
          </p>
        )}
      </div>

      {!patientId ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tidak ada pasien terpilih. Buka halaman{" "}
          <Link href="/queue" className="font-semibold underline">
            Antrian
          </Link>{" "}
          lalu klik &quot;Isi Rekam Medis&quot; pada pasien yang sedang
          diperiksa.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Keluhan Utama <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={3}
              placeholder="Misal: Demam 3 hari, batuk berdahak…"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Mulai Pemeriksaan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
