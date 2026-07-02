"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, UserRound, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  RECORD_STATUS_BADGE,
  RECORD_STATUS_LABEL,
  type MedicalRecordListItem,
} from "./medical-record-shared";

interface PatientOption {
  id: string;
  name: string;
  medicalRecordNumber: string;
  birthDate: string;
}

export function MedicalRecordsContent() {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PatientOption | null>(null);

  const patientsQuery = useQuery({
    queryKey: ["mr-patient-search", q],
    queryFn: async () =>
      (
        await api.get<PatientOption[]>("/patients", {
          params: { q, page: 1, limit: 10 },
        })
      ).data,
    enabled: q.length > 0,
  });

  const historyQuery = useQuery({
    queryKey: ["patient-medical-records", selected?.id],
    queryFn: async () =>
      (
        await api.get<MedicalRecordListItem[]>(
          `/patients/${selected!.id}/medical-records`,
        )
      ).data,
    enabled: selected !== null,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSelected(null);
    setQ(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Rekam Medis</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cari pasien untuk melihat riwayat kunjungan &amp; rekam medisnya.
          Kunjungan baru dimulai dari halaman Antrian.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama pasien…"
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

      {q && !selected && (
        <div className="max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white">
          {patientsQuery.isLoading ? (
            <div className="flex justify-center py-6 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (patientsQuery.data ?? []).length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Tidak ada pasien yang cocok dengan &quot;{q}&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(patientsQuery.data ?? []).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-brand-50"
                  >
                    <span className="flex items-center gap-3">
                      <UserRound className="h-4 w-4 text-slate-400" />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">
                          {p.name}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          {p.medicalRecordNumber}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Riwayat Kunjungan — {selected.name}{" "}
              <span className="font-mono text-sm font-normal text-slate-500">
                ({selected.medicalRecordNumber})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Ganti pasien
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tgl Kunjungan</th>
                  <th className="px-4 py-3 font-medium">Keluhan Utama</th>
                  <th className="px-4 py-3 font-medium">Dokter</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                ) : historyQuery.isError ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-rose-600"
                    >
                      Gagal memuat riwayat kunjungan.
                    </td>
                  </tr>
                ) : (historyQuery.data ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Belum ada kunjungan untuk pasien ini.
                    </td>
                  </tr>
                ) : (
                  (historyQuery.data ?? []).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(r.visitDate, true)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {r.chiefComplaint}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.attendingDoctor?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RECORD_STATUS_BADGE[r.status]}`}
                        >
                          {RECORD_STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/medical-records/${r.id}`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                        >
                          Buka
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
