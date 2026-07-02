"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, X, UserX, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Pemilik",
  DOCTOR: "Dokter",
  NURSE: "Perawat",
  RECEPTIONIST: "Resepsionis",
  PHARMACIST: "Apoteker",
  CASHIER: "Kasir",
};

const CREATABLE_ROLES = [
  "DOCTOR",
  "NURSE",
  "RECEPTIONIST",
  "PHARMACIST",
  "CASHIER",
];

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function UsersTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<UserItem[]>("/users")).data,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("User dinonaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Gagal menonaktifkan user.");
    },
  });

  function handleDeactivate(u: UserItem) {
    if (
      !window.confirm(
        `Nonaktifkan ${u.name}? User ini tidak akan bisa login lagi.`,
      )
    )
      return;
    deactivateMutation.mutate(u.id);
  }

  if (usersQuery.isError) {
    return (
      <p className="text-sm text-rose-600">
        Gagal memuat daftar pengguna (khusus Owner).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Login Terakhir</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersQuery.isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : (
              (usersQuery.data ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(u);
                          setDialogOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      {u.isActive && u.role !== "OWNER" && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(u)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Nonaktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserFormDialog
        open={dialogOpen}
        user={editing}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

function UserFormDialog({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: UserItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = user !== null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DOCTOR");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setIsActive(user.isActive);
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("DOCTOR");
      setIsActive(true);
    }
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return api.put(`/users/${user!.id}`, { name, role, isActive });
      }
      return api.post("/users", { name, email, password, role });
    },
    onSuccess: () => {
      toast.success(isEdit ? "User diperbarui." : "User baru ditambahkan.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = e?.response?.data?.message ?? "Gagal menyimpan user.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama wajib diisi.");
      return;
    }
    if (!isEdit && (!email.trim() || password.length < 8)) {
      toast.error("Email wajib & password minimal 8 karakter.");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nama <span className="text-rose-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Min. 8 karakter"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isEdit && user?.role === "OWNER"}
              className={`${inputClass} disabled:bg-slate-50`}
            >
              {(isEdit && user?.role === "OWNER"
                ? ["OWNER"]
                : CREATABLE_ROLES
              ).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r] ?? r}
                </option>
              ))}
            </select>
          </div>

          {isEdit && user?.role !== "OWNER" && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Akun aktif
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
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
