# Aturan Kerja untuk Project Ini (KlinikOS)

> **JANGAN mengubah kode apa pun selain yang diperintahkan secara eksplisit oleh user di prompt.**

- ✅ Kerjakan **HANYA** apa yang diminta dalam prompt — tidak lebih.
- ❌ Jangan menambah fitur, refactor, atau "perbaikan" yang tidak diminta.
- ❌ Jangan mengubah file/baris/fungsi lain yang tidak disebut dalam perintah.
- ❌ Jangan menambah komentar, docstring, atau anotasi pada kode yang tidak diubah.
- ❌ Jangan merapikan format/gaya kode di luar bagian yang sedang dikerjakan.
- ⚠️ Jika ada perbaikan tambahan yang menurutmu perlu, **usulkan dulu** dan tunggu persetujuan user — jangan langsung terapkan.
- ⚠️ Jika perintah/prompt **ambigu atau tidak jelas**, **tanya dulu** untuk klarifikasi sebelum mengerjakan — jangan menebak.

---

## Struktur Project (KlinikOS Monorepo)

Project ini adalah **Turborepo monorepo** dengan npm workspaces. Patuhi struktur ini saat menambah/memodifikasi file — **jangan** membuat folder/file di luar konvensi ini tanpa persetujuan user.

```
Project Rumah sakit/                  # Root monorepo
├── .env                              # Env vars shared (DATABASE_URL, JWT secrets, dll) — gitignored
├── .env.example                      # Template env vars
├── package.json                      # Root workspace config (turbo scripts: dev, dev:web, dev:api, build, lint)
├── turbo.json                        # Turborepo pipeline config (v2 "tasks" syntax)
├── CLAUDE.md                         # Aturan kerja (file ini)
├── KlinikOS_PRD_v2.0_Production.docx # Product Requirements Document
│
├── apps/
│   ├── api/                          # Backend NestJS 10 (port 3001)
│   │   ├── src/
│   │   │   ├── main.ts               # Entry point (manual dotenv load → bootstrap NestFactory)
│   │   │   ├── app.module.ts         # Root module (ConfigModule, Prisma, semua feature modules)
│   │   │   ├── common/               # Shared cross-cutting concerns
│   │   │   │   ├── decorators/       # Custom decorators (@CurrentUser, @Roles, dll)
│   │   │   │   ├── filters/          # Exception filters (global error handler)
│   │   │   │   ├── guards/           # JwtAuthGuard, RolesGuard, TenantGuard
│   │   │   │   ├── interceptors/     # TransformInterceptor ({success, data} response)
│   │   │   │   ├── middleware/       # Tenant resolution, request logging
│   │   │   │   ├── pipes/            # Validation pipes
│   │   │   │   ├── types/            # Shared TS types
│   │   │   │   └── utils/            # Helper utilities
│   │   │   ├── config/               # Config schemas (app, database, jwt, redis)
│   │   │   ├── database/             # PrismaService, PrismaModule
│   │   │   ├── jobs/                 # Cron jobs (StockAlertJob, dll)
│   │   │   ├── realtime/             # WebSocket gateway (socket.io)
│   │   │   └── modules/              # Feature modules (1 folder per domain)
│   │   │       ├── auth/             # Login, register, JWT, refresh token
│   │   │       ├── users/            # User CRUD (multi-role: OWNER/DOCTOR/RECEPTIONIST/PHARMACIST)
│   │   │       ├── tenants/          # Multi-tenant management
│   │   │       ├── patients/         # Patient records
│   │   │       ├── medical-records/  # Rekam medis
│   │   │       ├── queues/           # Antrian pasien
│   │   │       ├── prescriptions/    # Resep dokter
│   │   │       ├── drugs/            # Master obat
│   │   │       ├── stock/            # Stok & inventory
│   │   │       ├── invoices/         # Faktur
│   │   │       ├── payments/         # Pembayaran
│   │   │       ├── reports/          # Laporan & analytics
│   │   │       ├── notifications/    # Email (Resend), in-app notif
│   │   │       ├── audit-logs/       # Audit trail
│   │   │       └── satusehat/        # Integrasi SATUSEHAT (Kemenkes RI)
│   │   ├── test/                     # E2E tests
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json              # Scripts: start:dev, prisma:generate, prisma:migrate, prisma:seed
│   │
│   └── web/                          # Frontend Next.js 14 App Router (port 3000)
│       ├── src/
│       │   ├── middleware.ts         # Route protection (JWT cookie check)
│       │   ├── app/
│       │   │   ├── layout.tsx        # Root layout
│       │   │   ├── page.tsx          # Landing page
│       │   │   ├── providers.tsx     # TanStack Query, Sonner toast, dll
│       │   │   ├── globals.css       # Tailwind base
│       │   │   ├── (auth)/           # Public route group
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── login/
│       │   │   │   └── register/
│       │   │   └── (dashboard)/      # Protected route group
│       │   │       ├── layout.tsx
│       │   │       ├── dashboard/
│       │   │       └── _components/  # Sidebar, Topbar
│       │   └── lib/                  # Client utilities
│       │       ├── api.ts            # Axios instance + JWT refresh interceptor
│       │       ├── auth-store.ts     # Zustand auth state + js-cookie
│       │       └── utils.ts          # formatCurrency (IDR), formatDate
│       ├── .env.local                # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       ├── postcss.config.mjs
│       └── package.json
│
├── packages/                         # Shared internal packages (workspaces)
│   ├── database/                     # @klinik-os/database
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 14 tables (Tenant, User, Patient, Queue, dll)
│   │   │   ├── migrations/
│   │   │   └── seed.ts               # Demo data (Klinik Demo, 4 users, 3 drugs)
│   │   └── src/                      # PrismaClient export
│   ├── shared/                       # @klinik-os/shared (types, constants, DTOs cross-app)
│   │   └── src/
│   └── email/                        # @klinik-os/email (Resend templates)
│       └── src/
│
└── infrastructure/
    └── nginx/                        # Reverse proxy config (production)
```

### Konvensi yang Wajib Dipatuhi

- **Feature module backend** → selalu di [apps/api/src/modules/](apps/api/src/modules/) dengan struktur: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/` (jika ada).
- **Halaman frontend** → gunakan **App Router** di [apps/web/src/app/](apps/web/src/app/). Route group `(auth)` untuk publik, `(dashboard)` untuk protected.
- **Component privat per route** → folder `_components/` (prefix underscore = Next.js opt-out routing).
- **Schema database** → hanya di [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma). Setelah ubah jalankan `npm run prisma:generate` + `prisma:migrate` dari `apps/api`.
- **Env vars** → root [.env](.env) untuk backend, [apps/web/.env.local](apps/web/.env.local) untuk frontend (prefix `NEXT_PUBLIC_` untuk yang diekspos ke browser).
- **Response API** → semua dibungkus `TransformInterceptor` → `{ success: boolean, data: T }`. Frontend harus mengakses `response.data.data`.
- **Versioning API** → URI versioning aktif (`/v1/...`).
- **Port** → Backend `3001`, Frontend `3000`. Jangan diubah tanpa update `.env` + `next.config`.

---

## Skills yang Wajib Dipakai (Auto-Aktif)

Skill berikut **sudah terinstall** dan **harus diaktifkan otomatis** sesuai konteks tugas. Sebelum menulis/mengubah kode pada area di bawah, **baca dan terapkan** skill yang relevan — jangan abaikan.

| Skill                           | Aktif ketika mengerjakan…                                                      |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **vercel-react-best-practices** | Komponen React, hooks, state, optimasi performa Next.js                        |
| **nextjs-app-router-patterns**  | Routing, Server/Client Components, layout, data fetching App Router            |
| **nestjs-best-practices**       | Module, controller, service, guard, interceptor, DTO di [apps/api/](apps/api/) |
| **prisma-client-api**           | Query, relasi, transaksi, filter Prisma (schema & service)                     |
| **frontend-design**             | Membangun/menata UI, halaman, komponen visual                                  |
| **web-design-guidelines**       | Review aksesibilitas & UX/UI                                                   |
| **browser-use**                 | Testing/validasi UI lewat browser                                              |

### Aturan Pemakaian Skill

- 🔹 Saat tugas menyentuh frontend Next.js → **wajib** pakai `vercel-react-best-practices` + `nextjs-app-router-patterns`.
- 🔹 Saat tugas menyentuh backend NestJS → **wajib** pakai `nestjs-best-practices`.
- 🔹 Saat tugas menyentuh database/Prisma → **wajib** pakai `prisma-client-api`.
- 🔹 Skill tetap tunduk pada aturan utama di atas: **jangan ubah kode di luar yang diperintahkan**, meski skill menyarankan perbaikan lain — usulkan dulu, tunggu persetujuan.

---

## Catatan Pekerjaan (Work Log)

> Riwayat perubahan signifikan beserta fungsi & definisinya. Tambahkan entri baru di paling atas setiap selesai mengerjakan tugas.

### 2026-06-20 — Endpoint Registrasi Klinik `POST /auth/register` (Backend)

**Tujuan:** Membuat endpoint registrasi klinik yang sebelumnya dipanggil [register-form.tsx](apps/web/src/app/(auth)/register/register-form.tsx) tapi belum ada di backend. Satu request membuat **Tenant** + **User OWNER** lalu auto-login.

**File baru:**

- [apps/api/src/modules/auth/dto/register.dto.ts](apps/api/src/modules/auth/dto/register.dto.ts)
  - **`RegisterDto`** — validasi payload registrasi (class-validator, pesan Bahasa Indonesia): `clinicName` (min 3), `ownerName` (min 3), `email` (format email), `phone` (regex HP Indonesia), `password` (min 8 + wajib huruf besar/kecil/angka).

**File yang diubah (terisolasi di modul `auth`):**

- [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts)
  - **`register(dto)`** — alur: (1) tolak jika `email` sudah dipakai (`BadRequestException` kode `EMAIL_ALREADY_EXISTS`); (2) generate slug unik; (3) `$transaction` membuat `tenant` (default plan STARTER/TRIAL) + `user` role `OWNER`, dengan opsi `{ maxWait: 10000, timeout: 20000 }` agar tahan cold-start Neon; (4) auto-login → kembalikan `{ accessToken, refreshToken, user }` (shape sama dengan `login`).
  - **`generateUniqueSlug(name)`** — fungsi privat: slugify nama klinik (lowercase, non-alfanumerik → `-`, potong 40 char), lalu cek `tenant.slug` (unik global) & tambah sufiks angka `-1`, `-2`, … bila bentrok.
- [apps/api/src/modules/auth/auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts)
  - **`register(@Body() dto)`** — endpoint `POST /v1/auth/register` (`@Public`, throttle 5 req/menit, status `201 CREATED`).

**Hasil uji (live):** Via API → klinik "Klinik Sehat Sentosa" + owner dibuat, token kembali; email duplikat ditolak (`EMAIL_ALREADY_EXISTS`). Via browser (register-form) → "Klinik Harapan Bunda" terdaftar → auto-login → redirect `/dashboard` (banner tenant + role OWNER). 0 error TypeScript.

**Catatan teknis:** Transaksi interaktif default timeout 5000ms sempat gagal (`Transaction already closed`) akibat cold-start Neon (~9s). Diperbaiki dengan menaikkan `timeout` transaksi ke 20000ms.

### 2026-06-20 — Perbaikan Frontend Auth: Unwrap Envelope (Frontend)

**Tujuan:** Membuat login berfungsi end-to-end. Backend membungkus semua response dengan `TransformInterceptor` → `{ success, data, meta? }`, tapi frontend membaca `data.user`/`data.accessToken` langsung (mengasumsikan payload sudah ter-unwrap), sehingga login gagal.

**File yang diubah (terisolasi di frontend `auth`):**

- [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts)
  - **Response success interceptor** — Ditambah logika unwrap: jika body berbentuk `{ success, data }`, `res.data` di-set ke `body.data`. Efeknya semua consumer (`api.post/get/...`) menerima payload murni, bukan envelope. (Catatan: field `meta` untuk paginasi belum dipertahankan — perlu ditangani saat membangun endpoint list.)
  - **Refresh-token block** — Pemanggilan `axios.post(/auth/refresh)` memakai `axios` mentah (bypass interceptor `api`), jadi membaca `body?.data ?? body` lalu ambil `accessToken`/`refreshToken`.
- [apps/web/src/app/(auth)/login/login-form.tsx](apps/web/src/app/(auth)/login/login-form.tsx)
  - **`onSubmit`** — Flag cek 2FA disamakan dengan backend: `data?.requires2FA` (sebelumnya `data?.require2FA`).

**Hasil uji end-to-end (live, via browser):** Login `owner@klinikos.id` → toast "Selamat datang, Dr. Rina (Owner)" → redirect ke `/dashboard` menampilkan tenant "Klinik Demo", role OWNER. 0 error TypeScript.

**Catatan lanjutan (belum dikerjakan):**

- Endpoint `POST /auth/register` dipanggil [register-form.tsx](apps/web/src/app/(auth)/register/register-form.tsx) tapi **belum ada** di `auth.controller.ts` (registrasi klinik perlu dibuat).
- Field 2FA: login-form mengirim `twoFactorCode`, sedangkan `LoginDto` backend mengharapkan `totpCode` — perlu disamakan saat fitur 2FA diaktifkan.
- Dashboard widgets & `GET /v1/queue/today` masih placeholder ("—"), belum terhubung API.

### 2026-06-20 — Standarisasi Kontrak Response Auth (Backend)

**Tujuan:** Menyamakan format response endpoint Auth agar konsisten `camelCase` dan cocok dengan ekspektasi frontend (sebelumnya `snake_case` → menyebabkan auth gagal).

**File yang diubah (terisolasi di modul `auth`):**

- [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts)
  - **`generateTokens(payload)`** — fungsi privat penghasil sepasang JWT. Sekarang mengembalikan `{ accessToken, refreshToken }` (sebelumnya `{ access_token, refresh_token }`). `accessToken` = token akses berumur pendek, `refreshToken` = token perpanjang sesi berumur panjang.
  - **`login(dto, ipAddress)`** — saat 2FA aktif tapi kode belum diisi, mengembalikan `{ requires2FA: true }` (sebelumnya `requires2fa`). Objek `user` kini **flat**: `{ id, name, email, role, tenantId, tenantName }` (sebelumnya `tenant` nested & tanpa `email`).
- [apps/api/src/modules/auth/auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts)
  - **`refresh(@Body("refreshToken"))`** — endpoint `POST /v1/auth/refresh` kini membaca field body `refreshToken` (sebelumnya `refresh_token`).
- [apps/api/src/modules/auth/strategies/refresh-token.strategy.ts](apps/api/src/modules/auth/strategies/refresh-token.strategy.ts)
  - **`RefreshTokenStrategy`** — Passport strategy `jwt-refresh` yang mengekstrak token dari body. Diubah `ExtractJwt.fromBodyField("refreshToken")` (sebelumnya `refresh_token`).

**Bentuk response final** (`POST /v1/auth/login`, sudah dibungkus `TransformInterceptor`):

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": { "id", "name", "email", "role", "tenantId", "tenantName" }
  }
}
```

**Status:** ✅ Terverifikasi via uji login live (owner@klinikos.id), 0 error TypeScript.

**Catatan lanjutan (belum dikerjakan):**

- Frontend masih membaca `data.user` padahal data ada di `data.data.user` (akibat pembungkus `{ success, data }`). Perlu perbaikan di [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts) & [apps/web/src/app/(auth)/login/login-form.tsx](apps/web/src/app/(auth)/login/login-form.tsx).
- Redis untuk lockout login, rotasi refresh token, dan reset-password masih `TODO` di `auth.service.ts` (butuh keputusan infra: Redis server/Upstash).

<!-- Email: owner@klinikos.id
Password: Admin@123456
Frontend Next.js sudah berjalan -->
