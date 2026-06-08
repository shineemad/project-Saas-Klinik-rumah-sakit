"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const registerSchema = z
  .object({
    clinicName: z.string().min(3, "Nama klinik minimal 3 karakter"),
    ownerName: z.string().min(3, "Nama pemilik minimal 3 karakter"),
    email: z.string().email("Format email tidak valid"),
    phone: z
      .string()
      .regex(
        /^(\+62|62|0)8[1-9][0-9]{6,11}$/,
        "Format nomor HP Indonesia tidak valid",
      ),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Harus mengandung huruf besar")
      .regex(/[a-z]/, "Harus mengandung huruf kecil")
      .regex(/[0-9]/, "Harus mengandung angka"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    try {
      const { data } = await api.post("/auth/register", {
        clinicName: values.clinicName,
        ownerName: values.ownerName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      if (data?.accessToken) {
        setSession(data.user, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        toast.success("Klinik berhasil didaftarkan. Selamat datang!");
        router.push("/dashboard");
      } else {
        toast.success(
          "Pendaftaran berhasil. Silakan cek email untuk verifikasi.",
        );
        router.push("/login");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Gagal mendaftar.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Nama Klinik
        </label>
        <input
          {...register("clinicName")}
          className={inputClass}
          placeholder="Klinik Sehat Sentosa"
        />
        {errors.clinicName && (
          <p className="mt-1 text-xs text-red-600">
            {errors.clinicName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Nama Pemilik
        </label>
        <input
          {...register("ownerName")}
          className={inputClass}
          placeholder="Dr. Budi Santoso"
        />
        {errors.ownerName && (
          <p className="mt-1 text-xs text-red-600">
            {errors.ownerName.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            {...register("email")}
            className={inputClass}
            placeholder="anda@klinik.id"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            No. HP
          </label>
          <input
            {...register("phone")}
            className={inputClass}
            placeholder="08123456789"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            {...register("password")}
            className={inputClass}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Konfirmasi
          </label>
          <input
            type="password"
            {...register("confirmPassword")}
            className={inputClass}
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Dengan mendaftar, Anda setuju dengan Syarat &amp; Ketentuan dan
        Kebijakan Privasi KlinikOS.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Mulai Trial 14 Hari
      </button>
    </form>
  );
}
