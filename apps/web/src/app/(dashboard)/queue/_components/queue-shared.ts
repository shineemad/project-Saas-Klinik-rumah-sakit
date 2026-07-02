export type QueueStatus =
  | "WAITING"
  | "IN_PROGRESS"
  | "DONE_WAITING_CASHIER"
  | "DONE"
  | "CANCELLED";

export interface QueueItem {
  id: string;
  queueNumber: number;
  status: QueueStatus;
  registeredAt: string;
  calledAt: string | null;
  completedAt: string | null;
  patient: { id: string; name: string; medicalRecordNumber: string };
  doctor: { id: string; name: string } | null;
}

export const STATUS_LABEL: Record<QueueStatus, string> = {
  WAITING: "Menunggu",
  IN_PROGRESS: "Sedang Diperiksa",
  DONE_WAITING_CASHIER: "Selesai — Kasir",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

/** Menit menunggu sejak registrasi (untuk kartu WAITING). */
export function waitedMinutes(registeredAt: string): number {
  return Math.floor((Date.now() - new Date(registeredAt).getTime()) / 60000);
}

/** PRD: < 20 mnt hijau | 20–45 mnt kuning | > 45 mnt merah blinking. */
export function waitTimerClass(minutes: number): string {
  if (minutes > 45) return "text-rose-600 animate-pulse font-semibold";
  if (minutes >= 20) return "text-amber-600 font-medium";
  return "text-emerald-600";
}
