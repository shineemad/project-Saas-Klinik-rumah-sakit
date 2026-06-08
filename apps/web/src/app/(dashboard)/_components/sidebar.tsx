"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Users,
  ListOrdered,
  Stethoscope,
  Pill,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth-store";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/patients",
    label: "Pasien",
    icon: Users,
    roles: ["OWNER", "DOCTOR", "RECEPTIONIST"],
  },
  { href: "/queue", label: "Antrian", icon: ListOrdered },
  {
    href: "/medical-records",
    label: "Rekam Medis",
    icon: Stethoscope,
    roles: ["OWNER", "DOCTOR"],
  },
  {
    href: "/pharmacy",
    label: "Farmasi",
    icon: Pill,
    roles: ["OWNER", "PHARMACIST"],
  },
  {
    href: "/billing",
    label: "Billing",
    icon: Receipt,
    roles: ["OWNER", "CASHIER"],
  },
  { href: "/reports", label: "Laporan", icon: BarChart3, roles: ["OWNER"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["OWNER"] },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <Activity className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold text-slate-900">KlinikOS</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
        v0.1.0 · Beta
      </div>
    </aside>
  );
}
