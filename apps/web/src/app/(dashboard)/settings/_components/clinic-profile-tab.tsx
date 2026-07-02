"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  planTier: string;
  subscriptionStatus: string;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function ClinicProfileTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const tenantQuery = useQuery({
    queryKey: ["tenant-me"],
    queryFn: async () => (await api.get<TenantProfile>("/tenants/me")).data,
  });

  useEffect(() => {
    const t = tenantQuery.data;
    if (t) {
      setName(t.name);
      setAddress(t.address ?? "");
      setPhone(t.phone ?? "");
    }
  }, [tenantQuery.data]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {};
      if (name) payload.name = name;
      if (address) payload.address = address;
      if (phone) payload.phone = phone;
      return api.patch("/tenants/me", payload);
    },
    onSuccess: () => {
      toast.success("Profil klinik diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["tenant-me"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal menyimpan profil.");
    },
  });

  if (tenantQuery.isLoading) {
    return (
      <div className="flex justify-center py-10 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (tenantQuery.isError) {
    return (
      <p className="text-sm text-rose-600">
        Gagal memuat profil klinik (khusus Owner).
      </p>
    );
  }

  const tenant = tenantQuery.data!;

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Informasi Klinik
          </h2>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {tenant.planTier} · {tenant.subscriptionStatus}
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nama Klinik
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Alamat
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Telepon
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
