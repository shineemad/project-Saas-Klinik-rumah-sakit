"use client";

import { useState } from "react";
import { Building2, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClinicProfileTab } from "./clinic-profile-tab";
import { UsersTab } from "./users-tab";
import { SecurityTab } from "./security-tab";

type Tab = "clinic" | "users" | "security";

const TABS: Array<{ id: Tab; label: string; icon: typeof Building2 }> = [
  { id: "clinic", label: "Profil Klinik", icon: Building2 },
  { id: "users", label: "Pengguna", icon: Users },
  { id: "security", label: "Keamanan", icon: ShieldCheck },
];

export function SettingsContent() {
  const [tab, setTab] = useState<Tab>("clinic");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola profil klinik, pengguna, dan keamanan akun.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition",
              tab === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "clinic" && <ClinicProfileTab />}
      {tab === "users" && <UsersTab />}
      {tab === "security" && <SecurityTab />}
    </div>
  );
}
