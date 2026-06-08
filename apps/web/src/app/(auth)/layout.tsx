import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container-page flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-slate-900">KlinikOS</span>
        </Link>
      </div>
      <main className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center pb-16">
        {children}
      </main>
    </div>
  );
}
