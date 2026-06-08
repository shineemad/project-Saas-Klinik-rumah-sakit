import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Masuk ke KlinikOS
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Gunakan akun klinik Anda untuk melanjutkan.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-600 hover:underline"
          >
            Daftar klinik baru
          </Link>
        </p>
      </div>
    </div>
  );
}
