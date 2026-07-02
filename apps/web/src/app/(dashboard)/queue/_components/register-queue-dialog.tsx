"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, X, UserRound } from "lucide-react";
import { api } from "@/lib/api";

interface PatientOption {
  id: string;
  name: string;
  medicalRecordNumber: string;
  birthDate: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface RegisterQueueDialogProps {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function RegisterQueueDialog({
  open,
  onClose,
}: RegisterQueueDialogProps) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(
    null,
  );
  const [doctorId, setDoctorId] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setQ("");
      setSelectedPatient(null);
      setDoctorId("");
    }
  }, [open]);

  const patientsQuery = useQuery({
    queryKey: ["queue-patient-search", q],
    queryFn: async () =>
      (
        await api.get<PatientOption[]>("/patients", {
          params: { q, page: 1, limit: 10 },
        })
      ).data,
    enabled: open && q.length > 0,
  });

  const doctorsQuery = useQuery({
    queryKey: ["users-doctors"],
    queryFn: async () => {
      const res = await api.get<UserOption[]>("/users");
      return res.data.filter((u) => u.role === "DOCTOR" && u.isActive);
    },
    enabled: open,
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: (payload: { patientId: string; doctorId: string }) =>
      api.post<{ queueNumber: number; patient: { name: string } }>(
        "/queues",
        payload,
      ),
    onSuccess: (res) => {
      const data = res.data;
      toast.success(
        `Pasien terdaftar. Nomor Antrean: ${String(data.queueNumber).padStart(3, "0")}`,
      );
      queryClient.invalidateQueries({ queryKey: ["queues-today"] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string; code?: string } };
      };
      toast.error(
        e?.response?.data?.message ?? "Gagal mendaftarkan pasien ke antrean.",
      );
    },
  });

  if (!open) return null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSelectedPatient(null);
    setQ(searchInput.trim());
  }

  function handleSubmit() {
    if (!selectedPatient) {
      toast.error("Pilih pasien terlebih dahulu.");
      return;
    }
    if (!doctorId) {
      toast.error("Pilih dokter tujuan.");
      return;
    }
    registerMutation.mutate({ patientId: selectedPatient.id, doctorId });
  }

  const doctors = doctorsQuery.data ?? [];

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
            Daftarkan Pasien ke Antrean
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

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Cari Pasien (nama) <span className="text-rose-500">*</span>
            </label>
            <form onSubmit={handleSearch} className="mt-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nama pasien…"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cari
              </button>
            </form>

            {q && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-200">
                {patientsQuery.isLoading ? (
                  <div className="flex justify-center py-4 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (patientsQuery.data ?? []).length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-slate-500">
                    Pasien tidak ditemukan. Daftarkan dulu di halaman Pasien.
                  </p>
                ) : (
                  (patientsQuery.data ?? []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatient(p)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-brand-50 ${
                        selectedPatient?.id === p.id
                          ? "bg-brand-50 font-medium text-brand-700"
                          : "text-slate-700"
                      }`}
                    >
                      <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {p.name}
                        <span className="ml-2 font-mono text-xs text-slate-400">
                          {p.medicalRecordNumber}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedPatient && (
              <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                Dipilih: {selectedPatient.name} (
                {selectedPatient.medicalRecordNumber})
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Dokter Tujuan <span className="text-rose-500">*</span>
            </label>
            {doctorsQuery.isError ? (
              <p className="mt-1 text-xs text-rose-600">
                Tidak dapat memuat daftar dokter (butuh akses Owner).
              </p>
            ) : (
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Pilih dokter —</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
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
              type="button"
              onClick={handleSubmit}
              disabled={registerMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Simpan &amp; Daftarkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
