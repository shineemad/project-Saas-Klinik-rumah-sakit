"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { api } from "@/lib/api";

interface Setup2faResponse {
  secret: string;
  qrCode: string; // data URL PNG
}

export function SecurityTab() {
  const [setup, setSetup] = useState<Setup2faResponse | null>(null);
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(false);

  const setupMutation = useMutation({
    mutationFn: async () =>
      (await api.post<Setup2faResponse>("/auth/2fa/setup")).data,
    onSuccess: (data) => setSetup(data),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal memulai setup 2FA.");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => api.post("/auth/2fa/verify", { code }),
    onSuccess: () => {
      toast.success("2FA berhasil diaktifkan.");
      setEnabled(true);
      setSetup(null);
      setCode("");
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Kode tidak valid. Coba lagi.");
    },
  });

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Autentikasi Dua Faktor (2FA)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tambahkan lapisan keamanan dengan kode TOTP dari aplikasi
              authenticator (Google Authenticator, Authy, dsb).
            </p>

            {enabled ? (
              <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                2FA aktif untuk akun Anda. Saat login berikutnya, masukkan kode
                dari aplikasi authenticator.
              </p>
            ) : !setup ? (
              <button
                type="button"
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
                className="mt-4 flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {setupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Aktifkan 2FA
              </button>
            ) : (
              <div className="mt-4 space-y-4">
                <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600">
                  <li>Buka aplikasi authenticator di HP Anda.</li>
                  <li>Scan QR code di bawah (atau masukkan secret manual).</li>
                  <li>Masukkan 6 digit kode untuk konfirmasi.</li>
                </ol>

                <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {/* qrCode adalah data URL dari backend */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setup.qrCode}
                    alt="QR code 2FA"
                    width={180}
                    height={180}
                    className="rounded-md bg-white p-2"
                  />
                  <p className="break-all text-center font-mono text-xs text-slate-500">
                    {setup.secret}
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (code.length !== 6) {
                      toast.error("Kode harus 6 digit.");
                      return;
                    }
                    verifyMutation.mutate();
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    placeholder="123456"
                    className="w-32 rounded-md border border-slate-300 px-3 py-2 text-center font-mono text-sm tracking-widest outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {verifyMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Verifikasi &amp; Aktifkan
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
