"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function handleLogout() {
    try {
      await api.post("/auth/logout").catch(() => null);
    } finally {
      clearSession();
      toast.success("Berhasil keluar");
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">
        {user?.tenantName ?? "Klinik"}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-slate-900">
              {user?.name}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">
              {user?.role}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </div>
    </header>
  );
}
