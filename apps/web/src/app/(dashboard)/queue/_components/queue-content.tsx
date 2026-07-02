"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  PhoneCall,
  Loader2,
  Stethoscope,
  Receipt,
  XCircle,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { RegisterQueueDialog } from "./register-queue-dialog";
import {
  STATUS_LABEL,
  waitTimerClass,
  waitedMinutes,
  type QueueItem,
  type QueueStatus,
} from "./queue-shared";

const KANBAN_COLUMNS: Array<{
  status: QueueStatus;
  title: string;
  accent: string;
}> = [
  { status: "WAITING", title: "Menunggu", accent: "border-t-amber-400" },
  {
    status: "IN_PROGRESS",
    title: "Sedang Diperiksa",
    accent: "border-t-blue-500",
  },
  {
    status: "DONE_WAITING_CASHIER",
    title: "Selesai — Kasir",
    accent: "border-t-violet-500",
  },
];

export function QueueContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [dialogOpen, setDialogOpen] = useState(false);

  const queuesQuery = useQuery({
    queryKey: ["queues-today"],
    queryFn: async () => (await api.get<QueueItem[]>("/queues/today")).data,
    refetchInterval: 5000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QueueStatus }) =>
      api.patch(`/queues/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queues-today"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal mengubah status.");
    },
  });

  const queues = queuesQuery.data ?? [];
  const byStatus = (status: QueueStatus) =>
    queues
      .filter((q) => q.status === status)
      .sort((a, b) => a.queueNumber - b.queueNumber);

  const doneCount = byStatus("DONE").length;
  const isDoctor = user?.role === "DOCTOR";

  function callNext() {
    const next = byStatus("WAITING")[0];
    if (!next) {
      toast.info("Tidak ada pasien yang menunggu.");
      return;
    }
    statusMutation.mutate(
      { id: next.id, status: "IN_PROGRESS" },
      {
        onSuccess: () => {
          toast.success(
            `Memanggil antrean #${next.queueNumber} — ${next.patient.name}`,
          );
        },
      },
    );
  }

  function cancelQueue(q: QueueItem) {
    if (
      !window.confirm(
        `Batalkan antrean #${q.queueNumber} (${q.patient.name})? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    statusMutation.mutate({ id: q.id, status: "CANCELLED" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Antrian</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola antrean pasien hari ini.
            {doneCount > 0 && ` ${doneCount} pasien selesai.`}
          </p>
        </div>
        <div className="flex gap-2">
          {(isDoctor || user?.role === "OWNER") && (
            <button
              type="button"
              onClick={callNext}
              disabled={statusMutation.isPending}
              className="flex items-center gap-2 rounded-md border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
            >
              <PhoneCall className="h-4 w-4" />
              Panggil Berikutnya
            </button>
          )}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Daftar Pasien
          </button>
        </div>
      </div>

      {queuesQuery.isLoading ? (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : queuesQuery.isError ? (
        <p className="py-16 text-center text-sm text-rose-600">
          Gagal memuat data antrean.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {KANBAN_COLUMNS.map((col) => {
            const items = byStatus(col.status);
            return (
              <div
                key={col.status}
                className={`rounded-xl border border-slate-200 border-t-4 bg-slate-50 ${col.accent}`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {col.title}
                  </h2>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3 px-3 pb-3">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                      {col.status === "WAITING"
                        ? "Belum ada pasien menunggu."
                        : "Kosong."}
                    </p>
                  ) : (
                    items.map((q) => (
                      <QueueCard
                        key={q.id}
                        queue={q}
                        pending={statusMutation.isPending}
                        onCall={() =>
                          statusMutation.mutate({
                            id: q.id,
                            status: "IN_PROGRESS",
                          })
                        }
                        onExamine={() =>
                          router.push(
                            `/medical-records/new?patientId=${q.patient.id}&patientName=${encodeURIComponent(q.patient.name)}`,
                          )
                        }
                        onToCashier={() => router.push("/billing")}
                        onCancel={() => cancelQueue(q)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RegisterQueueDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

function QueueCard({
  queue,
  pending,
  onCall,
  onExamine,
  onToCashier,
  onCancel,
}: {
  queue: QueueItem;
  pending: boolean;
  onCall: () => void;
  onExamine: () => void;
  onToCashier: () => void;
  onCancel: () => void;
}) {
  const minutes = waitedMinutes(queue.registeredAt);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-2xl font-bold leading-none text-slate-900">
          {String(queue.queueNumber).padStart(3, "0")}
        </span>
        {queue.status === "WAITING" && (
          <span
            className={`flex items-center gap-1 text-xs ${waitTimerClass(minutes)}`}
            title="Lama menunggu"
          >
            <Clock className="h-3 w-3" />
            {minutes} mnt
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">
        {queue.patient.name}
      </p>
      <p className="text-xs text-slate-500">
        {queue.patient.medicalRecordNumber}
        {queue.doctor ? ` · ${queue.doctor.name}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {queue.status === "WAITING" && (
          <>
            <button
              type="button"
              onClick={onCall}
              disabled={pending}
              className="flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <PhoneCall className="h-3 w-3" />
              Panggil
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <XCircle className="h-3 w-3" />
              Batal
            </button>
          </>
        )}
        {queue.status === "IN_PROGRESS" && (
          <button
            type="button"
            onClick={onExamine}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Stethoscope className="h-3 w-3" />
            Isi Rekam Medis
          </button>
        )}
        {queue.status === "DONE_WAITING_CASHIER" && (
          <button
            type="button"
            onClick={onToCashier}
            className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700"
          >
            <Receipt className="h-3 w-3" />
            Proses Pembayaran
          </button>
        )}
      </div>
    </div>
  );
}
