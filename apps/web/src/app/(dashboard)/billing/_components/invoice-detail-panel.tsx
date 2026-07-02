"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X, QrCode, Banknote, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  type InvoiceListItem,
  type PaymentMethod,
} from "./billing-shared";

interface QrisData {
  invoiceId: string;
  amount: string | number;
  qrisData: string;
  expiresAt: string;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function InvoiceDetailPanel({
  invoiceId,
  onClose,
}: {
  invoiceId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [qris, setQris] = useState<QrisData | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReasonType, setRefundReasonType] = useState("PATIENT_REQUEST");
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    if (!invoiceId) {
      setMethod("CASH");
      setQris(null);
      setRefundOpen(false);
      setRefundReason("");
    }
  }, [invoiceId]);

  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () =>
      (await api.get<InvoiceListItem>(`/invoices/${invoiceId}`)).data,
    enabled: invoiceId !== null,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    queryClient.invalidateQueries({ queryKey: ["queues-today"] });
  };

  const payMutation = useMutation({
    mutationFn: () =>
      api.post(`/payments/invoices/${invoiceId}/pay`, {
        paymentMethod: method,
      }),
    onSuccess: () => {
      toast.success("Pembayaran berhasil. Invoice lunas.");
      setQris(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal memproses pembayaran.");
    },
  });

  const qrisMutation = useMutation({
    mutationFn: async () =>
      (await api.post<QrisData>(`/payments/invoices/${invoiceId}/qris`)).data,
    onSuccess: (data) => setQris(data),
    onError: () => toast.error("Gagal membuat QRIS."),
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      api.post(`/invoices/${invoiceId}/refund`, {
        reasonType: refundReasonType,
        reason: refundReason,
      }),
    onSuccess: () => {
      toast.success("Refund berhasil diproses.");
      setRefundOpen(false);
      invalidate();
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = e?.response?.data?.message ?? "Gagal memproses refund.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  if (!invoiceId) return null;

  const inv = invoiceQuery.data;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Detail Invoice
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

        <div className="flex-1 overflow-y-auto p-5">
          {invoiceQuery.isLoading || !inv ? (
            <div className="flex justify-center py-16 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {inv.invoiceNumber}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {inv.patient.name}{" "}
                    <span className="font-mono text-xs text-slate-400">
                      ({inv.patient.medicalRecordNumber})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(inv.createdAt, true)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_BADGE[inv.status]}`}
                >
                  {INVOICE_STATUS_LABEL[inv.status]}
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Harga
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inv.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-slate-700">
                          {item.itemName}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-sm font-medium text-slate-600"
                      >
                        Total
                      </td>
                      <td className="px-3 py-2 text-right text-base font-bold text-slate-900">
                        {formatCurrency(inv.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {inv.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Riwayat Pembayaran
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {inv.payments.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>
                          {PAYMENT_METHOD_LABEL[p.paymentMethod]} ·{" "}
                          {formatDate(p.processedAt, true)}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(p.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inv.status === "UNPAID" && (
                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Proses Pembayaran
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Metode Pembayaran
                    </label>
                    <select
                      value={method}
                      onChange={(e) =>
                        setMethod(e.target.value as PaymentMethod)
                      }
                      className={inputClass}
                    >
                      {(
                        Object.entries(PAYMENT_METHOD_LABEL) as Array<
                          [PaymentMethod, string]
                        >
                      ).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    {method === "QRIS" && (
                      <button
                        type="button"
                        onClick={() => qrisMutation.mutate()}
                        disabled={qrisMutation.isPending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-md border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                      >
                        {qrisMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="h-4 w-4" />
                        )}
                        Tampilkan QRIS
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => payMutation.mutate()}
                      disabled={payMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {payMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Banknote className="h-4 w-4" />
                      )}
                      Konfirmasi Bayar
                    </button>
                  </div>

                  {qris && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-sm font-semibold text-slate-900">
                        Scan QRIS — {formatCurrency(qris.amount)}
                      </p>
                      <p className="mt-2 break-all rounded bg-white px-3 py-4 font-mono text-xs text-slate-500">
                        {qris.qrisData}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Berlaku sampai {formatDate(qris.expiresAt, true)}.
                        Setelah pasien membayar, klik &quot;Konfirmasi
                        Bayar&quot;.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {inv.status === "PAID" && (
                <div className="rounded-xl border border-slate-200 p-4">
                  {!refundOpen ? (
                    <button
                      type="button"
                      onClick={() => setRefundOpen(true)}
                      className="flex items-center gap-2 text-sm font-medium text-rose-600 hover:underline"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Proses Refund
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Refund Invoice
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          Alasan Refund <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={refundReasonType}
                          onChange={(e) => setRefundReasonType(e.target.value)}
                          className={inputClass}
                        >
                          <option value="WRONG_ITEM">Item salah</option>
                          <option value="DUPLICATE_PAYMENT">
                            Pembayaran ganda
                          </option>
                          <option value="PATIENT_REQUEST">
                            Permintaan pasien
                          </option>
                          <option value="OTHER">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          Keterangan (min. 10 karakter){" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          rows={2}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRefundOpen(false)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (refundReason.trim().length < 10) {
                              toast.error(
                                "Keterangan refund minimal 10 karakter.",
                              );
                              return;
                            }
                            refundMutation.mutate();
                          }}
                          disabled={refundMutation.isPending}
                          className="flex items-center gap-2 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {refundMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Konfirmasi Refund
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
