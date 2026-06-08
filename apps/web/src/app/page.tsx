import Link from "next/link";
import { Activity, ShieldCheck, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-brand-50 to-white">
      <header className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-slate-900">KlinikOS</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-600"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Coba Gratis
          </Link>
        </nav>
      </header>

      <section className="container-page pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-medium text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
          Versi Beta — Khusus Klinik Indonesia
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Operasional klinik Anda, dalam satu sistem.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          Antrian, rekam medis elektronik (SOAP), e-resep dengan cek alergi &
          stok, billing & laporan harian — semua otomatis dan terintegrasi
          BPJS-ready.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-md bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Mulai 14 Hari Gratis
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            Sudah punya akun
          </Link>
        </div>
      </section>

      <section className="container-page grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
          >
            <f.icon className="h-6 w-6 text-brand-600" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              {f.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} KlinikOS. Semua data dienkripsi end-to-end.
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Users,
    title: "Antrian Realtime",
    desc: "WebSocket update otomatis untuk pasien & staf.",
  },
  {
    icon: Activity,
    title: "EMR SOAP + ICD-10",
    desc: "Rekam medis lengkap dengan riwayat alergi.",
  },
  {
    icon: ShieldCheck,
    title: "AES-256 PII",
    desc: "Data pasien terenkripsi sesuai UU PDP.",
  },
  {
    icon: Zap,
    title: "Multi-Tenant",
    desc: "Aman per klinik dengan isolasi data penuh.",
  },
];
