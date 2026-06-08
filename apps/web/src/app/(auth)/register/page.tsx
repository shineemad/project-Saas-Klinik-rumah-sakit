import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Daftar Klinik Baru" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Daftarkan klinik Anda
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Trial 14 hari, tanpa kartu kredit.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
