"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Save,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  RECORD_STATUS_BADGE,
  RECORD_STATUS_LABEL,
  SEVERITY_LABEL,
  type MedicalRecordDetail,
  type SoapNotes,
  type VitalSigns,
} from "../../_components/medical-record-shared";
import { PrescriptionPanel } from "./prescription-panel";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

function calcAge(birthDate: string): number {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function SoapEditor({ recordId }: { recordId: string }) {
  const queryClient = useQueryClient();
  const [soap, setSoap] = useState<SoapNotes>({});
  const [vitals, setVitals] = useState<VitalSigns>({});
  const [icdInput, setIcdInput] = useState("");
  const [icdCodes, setIcdCodes] = useState<string[]>([]);
  const [rxOpen, setRxOpen] = useState(false);

  const recordQuery = useQuery({
    queryKey: ["medical-record", recordId],
    queryFn: async () =>
      (await api.get<MedicalRecordDetail>(`/medical-records/${recordId}`)).data,
  });

  const record = recordQuery.data;
  const editable = record ? record.status !== "FINALIZED" : false;

  useEffect(() => {
    if (!record) return;
    setSoap(record.soapNotes ?? {});
    setVitals(record.vitalSigns ?? {});
    setIcdCodes(record.icd10Codes ?? []);
  }, [record]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/medical-records/${recordId}`, {
        soapNotes: soap,
        vitalSigns: vitals,
        icd10Codes: icdCodes,
      }),
    onSuccess: () => {
      toast.success(
        `Tersimpan pukul ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      );
      queryClient.invalidateQueries({ queryKey: ["medical-record", recordId] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal menyimpan SOAP notes.");
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      // Simpan draft terakhir dulu agar tidak ada perubahan yang hilang.
      await api.patch(`/medical-records/${recordId}`, {
        soapNotes: soap,
        vitalSigns: vitals,
        icd10Codes: icdCodes,
      });
      return api.post(`/medical-records/${recordId}/finalize`);
    },
    onSuccess: () => {
      toast.success("Rekam medis difinalisasi. Pasien diarahkan ke kasir.");
      queryClient.invalidateQueries({ queryKey: ["medical-record", recordId] });
      queryClient.invalidateQueries({ queryKey: ["queues-today"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal memfinalisasi.");
    },
  });

  function addIcdCode(e: React.FormEvent) {
    e.preventDefault();
    const code = icdInput.trim().toUpperCase();
    if (!code) return;
    if (!icdCodes.includes(code)) setIcdCodes([...icdCodes, code]);
    setIcdInput("");
  }

  function handleFinalize() {
    if (
      !window.confirm(
        "Selesai & kirim ke kasir? Rekam medis yang sudah final tidak dapat diubah lagi.",
      )
    )
      return;
    finalizeMutation.mutate();
  }

  if (recordQuery.isLoading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (recordQuery.isError || !record) {
    return (
      <p className="py-20 text-center text-sm text-rose-600">
        Rekam medis tidak ditemukan atau Anda tidak memiliki akses.
      </p>
    );
  }

  const drugAllergies = record.patient.allergies.filter(
    (a) => a.allergenType === "DRUG",
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/medical-records"
            className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Rekam Medis
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-slate-900">
            SOAP Notes
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RECORD_STATUS_BADGE[record.status]}`}
            >
              {RECORD_STATUS_LABEL[record.status]}
            </span>
          </h1>
        </div>
        {editable && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {finalizeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Selesai &amp; Kirim ke Kasir
            </button>
          </div>
        )}
      </div>

      {/* BR-02: banner alergi merah di atas editor */}
      {record.patient.allergies.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div className="text-sm text-rose-800">
            <p className="font-semibold">
              Pasien memiliki {record.patient.allergies.length} riwayat alergi:
            </p>
            <ul className="mt-1 list-inside list-disc">
              {record.patient.allergies.map((a) => (
                <li key={a.id}>
                  {a.allergenName}{" "}
                  <span className="text-xs">
                    (
                    {a.allergenType === "DRUG"
                      ? "Obat"
                      : a.allergenType === "FOOD"
                        ? "Makanan"
                        : "Lainnya"}
                    , {SEVERITY_LABEL[a.severity]})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-10">
        {/* Panel info pasien (30%, sticky) */}
        <div className="lg:col-span-3">
          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Pasien</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Nama</dt>
                  <dd className="font-medium text-slate-900">
                    {record.patient.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">No. RM</dt>
                  <dd className="font-mono text-slate-700">
                    {record.patient.medicalRecordNumber}
                  </dd>
                </div>
                <div className="flex gap-6">
                  <div>
                    <dt className="text-xs text-slate-500">Umur</dt>
                    <dd className="text-slate-700">
                      {calcAge(record.patient.birthDate)} th
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Gender</dt>
                    <dd className="text-slate-700">
                      {record.patient.gender === "MALE"
                        ? "Laki-laki"
                        : "Perempuan"}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Kunjungan</dt>
                  <dd className="text-slate-700">
                    {formatDate(record.visitDate, true)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Keluhan Utama</dt>
                  <dd className="text-slate-700">{record.chiefComplaint}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Dokter</dt>
                  <dd className="text-slate-700">
                    {record.attendingDoctor?.name ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Tanda Vital
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(
                  [
                    ["bloodPressure", "Tensi (mmHg)"],
                    ["heartRate", "Nadi (/mnt)"],
                    ["respiratoryRate", "Napas (/mnt)"],
                    ["temperature", "Suhu (°C)"],
                    ["weight", "Berat (kg)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-500">
                      {label}
                    </label>
                    <input
                      value={(vitals[key] as string) ?? ""}
                      onChange={(e) =>
                        setVitals({ ...vitals, [key]: e.target.value })
                      }
                      disabled={!editable}
                      className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Editor SOAP (70%) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="space-y-4">
              {(
                [
                  ["subjective", "S — Subjective (keluhan pasien)"],
                  ["objective", "O — Objective (pemeriksaan fisik)"],
                  ["assessment", "A — Assessment (diagnosis)"],
                  ["plan", "P — Plan (rencana terapi)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700">
                    {label}
                  </label>
                  <textarea
                    value={soap[key] ?? ""}
                    onChange={(e) =>
                      setSoap({ ...soap, [key]: e.target.value })
                    }
                    disabled={!editable}
                    rows={3}
                    className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Kode ICD-10
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {icdCodes.map((code) => (
                    <span
                      key={code}
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-xs font-medium text-brand-700"
                    >
                      {code}
                      {editable && (
                        <button
                          type="button"
                          onClick={() =>
                            setIcdCodes(icdCodes.filter((c) => c !== code))
                          }
                          aria-label={`Hapus ${code}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {editable && (
                    <form onSubmit={addIcdCode} className="flex gap-1">
                      <input
                        value={icdInput}
                        onChange={(e) => setIcdInput(e.target.value)}
                        placeholder="mis. J06.9"
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs outline-none focus:border-brand-500"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Tambah
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resep */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Resep</h2>
              {editable && (
                <button
                  type="button"
                  onClick={() => setRxOpen(true)}
                  className="flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Resep
                </button>
              )}
            </div>

            {record.prescriptions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Belum ada resep.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {record.prescriptions.map((rx) => (
                  <li
                    key={rx.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-500">
                        {rx.id.slice(0, 8)}…
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          rx.status === "DISPENSED"
                            ? "bg-emerald-50 text-emerald-700"
                            : rx.status === "CANCELLED"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {rx.status === "DISPENSED"
                          ? "Diserahkan"
                          : rx.status === "CANCELLED"
                            ? "Dibatalkan"
                            : "Aktif"}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {rx.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-medium">
                            {item.drug.nameGeneric}
                          </span>{" "}
                          × {item.quantity} — {item.dosageInstruction}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <PrescriptionPanel
        open={rxOpen}
        recordId={recordId}
        drugAllergies={drugAllergies}
        onClose={() => setRxOpen(false)}
      />
    </div>
  );
}
