# Aturan Kerja untuk Project Ini (KlinikOS)

> **JANGAN mengubah kode apa pun selain yang diperintahkan secara eksplisit oleh user di prompt.**

- ✅ Kerjakan **HANYA** apa yang diminta dalam prompt — tidak lebih.
- ❌ Jangan menambah fitur, refactor, atau "perbaikan" yang tidak diminta.
- ❌ Jangan mengubah file/baris/fungsi lain yang tidak disebut dalam perintah.
- ❌ Jangan menambah komentar, docstring, atau anotasi pada kode yang tidak diubah.
- ❌ Jangan merapikan format/gaya kode di luar bagian yang sedang dikerjakan.
- ⚠️ Jika ada perbaikan tambahan yang menurutmu perlu, **usulkan dulu** dan tunggu persetujuan user — jangan langsung terapkan.
- ⚠️ Jika perintah/prompt **ambigu atau tidak jelas**, **tanya dulu** untuk klarifikasi sebelum mengerjakan — jangan menebak.
- 🚀 Jika user mengetik **"oke"** (sebagai konfirmasi setelah pekerjaan selesai), itu berarti perintah untuk **langsung commit & push** perubahan ke remote (`git add` → `git commit` → `git push`) tanpa perlu bertanya lagi.

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

### 2026-06-22 — E2E HTTP Test Auth (Supertest, Real DB, Ter-guard) (Backend)

**Tujuan:** Melengkapi piramida uji dengan **E2E HTTP test** untuk endpoint Auth — menembak server lewat `supertest` sehingga lapisan HTTP penuh ikut teruji: routing, **URI versioning `/v1`**, `ValidationPipe` (whitelist/forbidNonWhitelisted), `TransformInterceptor` (envelope `{success,data}`), dan `HttpExceptionFilter` (envelope `{success:false,error:{code,message}}`). Pola **ter-guard** sama seperti integration test: otomatis `describe.skip` bila `TEST_DATABASE_URL` kosong → `npm test` tetap hijau & DB Neon produksi tak tersentuh. Redis & email di-fake; database nyata. Scope: **Auth** (modul kritikal).

**File baru:**

- [apps/api/test/e2e/auth.e2e-spec.ts](apps/api/test/e2e/auth.e2e-spec.ts)
  - `const hasTestDb = !!process.env.TEST_DATABASE_URL; const describeIf = hasTestDb ? describe : describe.skip;`. `beforeAll`: rakit **testing module ringan** (`Test.createTestingModule`) yang hanya meng-import `ConfigModule.forRoot({ isGlobal, load: [appConfig, jwtConfig] })` + `DatabaseModule` + `RedisModule` + `AuthModule` (menghindari `RealtimeModule`/`JobsModule` agar boot cepat & tanpa socket/cron), lalu `.overrideProvider(RedisService).useValue(InMemoryRedis)` & `.overrideProvider(NotificationsService).useValue({ sendEmail })` (tak perlu Upstash/Resend). `createNestApplication()` lalu **mereplikasi setup global `main.ts`**: `enableVersioning(URI)`, `setGlobalPrefix("v1")`, `ValidationPipe`, `HttpExceptionFilter`, `TransformInterceptor`, `app.init()`. `beforeEach`: `prisma.cleanDatabase()` + reset Redis + `clearAllMocks`. `afterAll`: `app.close()`. Kelas **`InMemoryRedis`** meniru surface `RedisService`. Kasus uji (7): `POST /v1/auth/register` → 201 + envelope sukses + token + user OWNER; register duplikat → 400 `EMAIL_ALREADY_EXISTS`; body invalid → 400 (ValidationPipe); `POST /v1/auth/login` benar → 200, salah → 401 `INVALID_CREDENTIALS`; `POST /v1/auth/refresh` → 200 token baru; `GET /v1/auth/me` dengan Bearer → 200 (verifikasi `JwtAuthGuard` + `JwtStrategy` nyata); `GET /v1/auth/me` tanpa token → 401.
- [apps/api/test/jest-e2e.json](apps/api/test/jest-e2e.json)
  - Config Jest E2E: `rootDir: ".."`, `roots: ["<rootDir>/test/e2e"]`, `testMatch: ["**/*.e2e-spec.ts"]`, `setupFiles: ["<rootDir>/test/integration/set-test-db.ts"]` (reuse remap `DATABASE_URL`→`TEST_DATABASE_URL`), `ts-jest`, `testTimeout: 30000`. Penamaan `*.e2e-spec.ts` di luar `src/` → tak terjaring `npm test` default.

**File yang diubah:**

- [apps/api/package.json](apps/api/package.json)
  - Script `test:e2e` diubah dari `"jest --config ./test/jest-e2e.json"` menjadi `"dotenv -e ../../.env -- jest --config ./test/jest-e2e.json"` (memuat root `.env` → `TEST_DATABASE_URL` + JWT secret tersedia sebelum Jest). (Sebelumnya `jest-e2e.json` yang dirujuk script ini belum ada — kini dibuat.)

**Hasil uji:**

- `npm test` → tetap **2 suite, 14 test PASS** (unit).
- `npm run test:e2e` (tanpa `TEST_DATABASE_URL`) → **1 suite skipped, 7 test skipped**, exit 0 — DB produksi tak tersentuh.
- 0 error TypeScript.

**Cara menjalankan penuh (oleh user):** sama seperti integration — isi `TEST_DATABASE_URL` (DB Postgres kosong terpisah) di root `.env`, apply schema (`prisma migrate deploy` dengan `DATABASE_URL` menunjuk DB test), lalu `npm run test:e2e` → 7 test dijalankan terhadap server + DB nyata.

**Catatan teknis:** E2E sengaja merakit testing module sendiri (bukan import `AppModule` penuh) untuk menghindari inisialisasi `RealtimeModule` (socket.io) & `JobsModule` (cron) yang tak relevan untuk uji Auth dan bisa memperlambat/menyusahkan boot. Setup global `main.ts` direplikasi manual agar perilaku HTTP identik produksi. Verifikasi end-to-end terhadap DB nyata belum dijalankan (tak ada DB test di mesin) — test dipastikan **compile (0 error TS)** & **skip dengan benar**.

### 2026-06-22 — Integration Test AuthService (Real DB, Ter-guard) (Backend)

**Tujuan:** Membuat integration test pertama yang menjalankan `AuthService` terhadap **PostgreSQL sungguhan** (bukan mock Prisma) untuk alur kritikal register → login → refresh → forgot/reset. Karena di mesin ini **tidak ada Docker maupun Postgres lokal** dan **dilarang memakai DB Neon produksi** (test menulis/menghapus data nyata), test dirancang **ter-guard**: otomatis di-`describe.skip` bila `TEST_DATABASE_URL` belum diisi, sehingga `npm test` tetap aman & hijau dan DB produksi tak pernah tersentuh. Redis & email di-fake (in-memory / mock); hanya database yang nyata. Scope dibatasi ke **Auth** (modul paling kritikal & baru dibangun) sesuai kesepakatan.

**File baru:**

- [apps/api/test/integration/auth.integration-spec.ts](apps/api/test/integration/auth.integration-spec.ts)
  - `const hasTestDb = !!process.env.TEST_DATABASE_URL; const describeIf = hasTestDb ? describe : describe.skip;` — seluruh suite jalan **hanya** bila `TEST_DATABASE_URL` ada. `beforeAll`: instansiasi `PrismaService` nyata + `onModuleInit()` (connect), `JwtService` nyata, `configStub` (stub `get` mengembalikan JWT secret dari env + `app.frontendUrl`), `InMemoryRedis`, `NotificationsService` di-mock. `beforeEach`: `prisma.cleanDatabase()` (truncate semua tabel kecuali `_prisma_migrations`, guard anti-produksi sudah ada di PrismaService) + reset Redis + `clearAllMocks`. `afterAll`: `onModuleDestroy()` (disconnect). Kelas **`InMemoryRedis`** meniru surface `RedisService` (`get/set/del/incr/expire`) + helper `findSuffix(prefix)` (mengambil token reset dari key `reset:<uuid>`). Kasus uji: **register** → buat tenant + user OWNER, kembalikan token, verifikasi baris user di DB; **register duplikat** → `EMAIL_ALREADY_EXISTS`; **login** → sukses password benar, `INVALID_CREDENTIALS` password salah; **refreshTokens** → rotasi token valid, `INVALID_REFRESH_TOKEN` token asal; **forgot + reset** → ambil token via `findSuffix("reset:")`, `resetPassword`, lalu password lama gagal & password baru berhasil login (bukti hash benar-benar ter-update di DB).
- [apps/api/test/integration/set-test-db.ts](apps/api/test/integration/set-test-db.ts)
  - Jest `setupFile`: bila `TEST_DATABASE_URL` ada, set `process.env.DATABASE_URL` & `DIRECT_URL` ke nilai itu **sebelum** PrismaClient diinstansiasi → menjamin Prisma menunjuk DB test, bukan produksi.
- [apps/api/test/jest-integration.json](apps/api/test/jest-integration.json)
  - Config Jest terpisah: `rootDir: ".."` (root `apps/api`), `roots: ["<rootDir>/test/integration"]`, `testMatch: ["**/*.integration-spec.ts"]`, `setupFiles: set-test-db.ts`, `ts-jest`, `testTimeout: 30000` (antisipasi bcrypt rounds 12 + cold start). Penamaan `*.integration-spec.ts` & lokasi di luar `src/` membuatnya **tak terjaring** config default (`rootDir: src`, `testRegex: .*\.spec\.ts$`).

**File yang diubah:**

- [apps/api/package.json](apps/api/package.json)
  - Tambah script `"test:integration": "dotenv -e ../../.env -- jest --config ./test/jest-integration.json"` (dotenv-cli memuat root `.env` → `TEST_DATABASE_URL` & JWT secret tersedia sebelum Jest jalan).
- [.env](.env) & [.env.example](.env.example)
  - Tambah placeholder **ter-comment** `TEST_DATABASE_URL` dengan peringatan "DB terpisah, JANGAN tunjuk ke produksi". Dibiarkan komentar agar integration test default-nya skip.

**Hasil uji:**

- `npm test` → tetap **2 suite, 14 test PASS** (unit test tak terpengaruh; integration tak terjaring config default).
- `npm run test:integration` (tanpa `TEST_DATABASE_URL`) → **1 suite skipped, 5 test skipped**, exit 0 — DB produksi tidak tersentuh.
- 0 error TypeScript.

**Cara menjalankan penuh (oleh user, saat siap):** (1) isi `TEST_DATABASE_URL` di root `.env` dengan DB Postgres kosong terpisah (mis. Neon branch baru / Docker / Postgres lokal); (2) apply schema ke DB itu: `dotenv -e ../../.env -- cross-env DATABASE_URL=$env:TEST_DATABASE_URL prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma` (atau set `DATABASE_URL` sementara ke nilai test lalu `prisma:deploy`); (3) `npm run test:integration` → 5 test akan benar-benar dijalankan terhadap DB nyata.

**Catatan teknis:** Test ini sengaja menargetkan lapisan **service + DB** (bukan HTTP/E2E) — memakai `AuthService` langsung dengan Prisma nyata, bcrypt nyata, JWT nyata; Redis di-fake agar tak butuh Upstash. E2E HTTP (`supertest` + `INestApplication`) belum dibuat (bisa menyusul, pola DB-guard yang sama bisa dipakai ulang). Verifikasi end-to-end terhadap DB nyata belum dijalankan di sesi ini karena tidak ada DB test tersedia di mesin — test sudah dipastikan **compile (0 error TS)** & **skip dengan benar**.

### 2026-06-22 — Unit Test AuthService & ReportsService (Backend)

**Tujuan:** Membuat unit test pertama untuk modul paling kritikal yang baru dibangun (Auth + Redis) dan logika `lowStockCount` dashboard. Sebelumnya folder `apps/api/test/` (unit/integration/e2e) kosong walau Jest sudah dikonfigurasi (`rootDir: src`, `testRegex: .*\.spec\.ts$`). Scope sengaja dibatasi ke **unit test murni dengan mock penuh** (tanpa DB Neon / Redis nyata) sesuai kesepakatan — SATUSEHAT di-skip (butuh kredensial sandbox Kemenkes), cron notifikasi ternyata **sudah lengkap & terdaftar** (`StockAlertJob`, `DailyReportJob` di [apps/api/src/jobs/](apps/api/src/jobs/)) sehingga tidak perlu dikerjakan.

**File baru:**

- [apps/api/src/modules/auth/auth.service.spec.ts](apps/api/src/modules/auth/auth.service.spec.ts)
  - Membuat `TestingModule` dengan semua dependency AuthService di-mock: `PrismaService` (`user.findUnique/update/create`, `tenant.findUnique/create`, `$transaction`), `RedisService` (`get/set/del/incr/expire`), `JwtService` (`signAsync` → `"signed-token"`, `verify`), `ConfigService` (`get` → stub), `NotificationsService` (`sendEmail`). `bcrypt` di-`jest.mock` (control `compare`/`hash`). Kasus uji: **login** → `ACCOUNT_LOCKED` saat counter ≥ 5 (Prisma tak dipanggil), `INVALID_CREDENTIALS` + `incr`/`expire` saat user tak ditemukan, `INVALID_CREDENTIALS` saat password salah, sukses (kembalikan `accessToken`/`refreshToken`/`user`, `del` counter, `set` `refresh:*` TTL 7 hari, `update` lastLoginAt), `requires2FA` saat 2FA aktif tanpa kode; **register** → `EMAIL_ALREADY_EXISTS` (transaksi tak dijalankan); **refreshTokens** → `INVALID_REFRESH_TOKEN` saat token tersimpan ≠ token masuk, sukses rotasi (`set` token baru); **resetPassword** → `INVALID_RESET_TOKEN` saat token hilang (user tak di-`update`), sukses (`update` passwordHash + `del` token); **forgotPassword** → pesan generik tanpa kirim email untuk akun tak dikenal, simpan `reset:*` TTL 1 jam + kirim email untuk akun valid.
- [apps/api/src/modules/reports/reports.service.spec.ts](apps/api/src/modules/reports/reports.service.spec.ts)
  - Mock `PrismaService` (`queue.count`, `invoice.aggregate/count`, `drug.findMany`). Uji **`getDashboardKpis`**: agregasi KPI benar (`patientDelta`/`revenueDelta`) dan **`countLowStock`** (privat, diuji lewat publik) menghitung 2 obat dengan `Σ quantityOnHand ≤ minimumStock` (termasuk kasus `minimumStock null` dibandingkan terhadap 0); kasus kedua → `lowStockCount` 0 & revenue null→0.

**Hasil uji:** `cd apps/api; npm test` → **2 suite, 14 test, semua PASS**. 0 error TypeScript. (Perbaikan kecil: hasil `login` bertipe union `{requires2FA} | {…,user}`, di test sukses di-cast ke shape ber-`user` agar `tsc` lolos.)

**Catatan teknis:** Test 100% in-memory (mock) → cepat & tidak menyentuh Neon/Upstash. Warning Jest "worker process failed to exit gracefully" & `DEP0169 url.parse` berasal dari dependency (mis. `ioredis`/`jest`), bukan kode kita — tidak memengaruhi hasil. E2E test (butuh DB test terpisah) & integration test belum dibuat (perlu keputusan infra DB uji). SATUSEHAT Fase 2 tetap tertunda hingga ada kredensial sandbox Kemenkes.

### 2026-06-22 — Konsistensi Identitas Email (Email Unik Global) (Backend)

**Tujuan:** Menghilangkan inkonsistensi login email–tenant. Sebelumnya schema memakai `@@unique([email, tenantId])` (email boleh sama di tenant berbeda) tetapi `login`/`forgotPassword` mencari `findFirst` by email saja (ambigu jika email ada di >1 tenant), sedangkan `register` sudah menolak email secara global. Dipilih **Opsi A — email unik global** (paling sederhana & aman, sesuai form login yang hanya email+password, tanpa ubah UI), sejalan dengan perilaku `register`.

**File yang diubah:**

- [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
  - Model `User`: field `email` kini `@unique` (unik **global**); constraint majemuk `@@unique([email, tenantId])` dihapus (jadi redundant karena unik global lebih ketat). Tidak ada kode yang memakai compound key `email_tenantId` (sudah dicek), jadi aman.
- [packages/database/prisma/migrations/20260622143907_email_global_unique/migration.sql](packages/database/prisma/migrations/20260622143907_email_global_unique/migration.sql) (baru)
  - `DROP INDEX "users_email_tenantId_key";` lalu `CREATE UNIQUE INDEX "users_email_key" ON "users"("email");`. Sebelum apply, dilakukan pre-check (guard `DO $$` di Postgres) memastikan **tidak ada email duplikat** → lolos. Migrasi di-apply ke Neon via `prisma migrate deploy`, lalu `prisma generate`.
- [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts)
  - **`login`** — `findFirst({ email, isActive })` → `findUnique({ where: { email } })` (idiomatik karena email kini unik). Cek `isActive` dipindah ke kondisi gabungan: `!user || !user.isActive || password salah` → semua tetap menghasilkan `INVALID_CREDENTIALS` + increment lockout (perilaku identik dengan sebelumnya).
  - **`register`** — `findFirst({ email })` → `findUnique({ where: { email } })` (pre-check duplikat).
  - **`forgotPassword`** — `findFirst({ email, isActive })` → `findUnique({ where: { email } })` + cek `!user || !user.isActive` (tetap balas pesan generik anti email-enumeration).

**Hasil uji (live, backend `start:dev`, Redis connected, 0 error TS):**

- Login `owner@klinikos.id` → OK (`Dr. Rina (Owner)`, tenant `Klinik Demo`).
- Login password salah → `INVALID_CREDENTIALS`.
- Register email `owner@klinikos.id` (sudah ada) → `EMAIL_ALREADY_EXISTS` (kini juga dijaga unique index DB).
- Forgot-password → pesan generik "Jika email terdaftar, link reset akan dikirim."

**Catatan teknis:** Konsekuensi Opsi A — satu email = satu akun di seluruh sistem (seseorang tidak bisa jadi staf di 2 klinik dengan email sama). Jika kelak butuh multi-klinik per email (Opsi B), perlu kembalikan compound unique + tambah konteks tenant (slug) di form & alur login. Migrasi bersifat aditif & non-destruktif (hanya tukar index), data lama tetap utuh.

### 2026-06-22 — Perbaikan `lowStockCount` Dashboard (Backend)

**Tujuan:** Mengganti placeholder `lowStockCount` pada KPI dashboard yang sebelumnya hardcoded `0` (`Promise.resolve(0)`) dengan hitungan nyata jumlah obat yang stoknya ≤ stok minimum. Sebelumnya kartu "Stok Hampir Habis" di dashboard selalu menampilkan 0 walau ada obat menipis.

**File yang diubah:**

- [apps/api/src/modules/reports/reports.service.ts](apps/api/src/modules/reports/reports.service.ts)
  - **`getDashboardKpis(tenantId)`** — entri terakhir di `Promise.all` diganti dari `Promise.resolve(0)` (placeholder) menjadi `this.countLowStock(tenantId)`, sehingga `lowStockCount` pada response kini berisi angka real.
  - **`countLowStock(tenantId)`** (baru, privat) — ambil seluruh `drug` aktif milik tenant (select tipis: `minimumStock` + `stocks.quantityOnHand`), jumlahkan stok per obat (`totalStock = Σ quantityOnHand`), lalu hitung berapa obat yang `totalStock <= (minimumStock ?? 0)`. Logika ini **cermin langsung** dari `DrugsService.getLowStockDrugs` (sumber kebenaran endpoint `GET /v1/drugs/low-stock`) agar konsisten.

**Hasil uji (live, backend `start:dev`, Redis connected, 0 error TS):**

- Login `owner@klinikos.id` → `GET /v1/reports/dashboard` → `lowStockCount=0`.
- Bandingkan dengan `GET /v1/drugs/low-stock` → jumlah item `0`.
- **Konsisten** (0 = 0): Klinik Demo belum punya obat di bawah minimum, jadi 0 adalah nilai benar. Karena memakai filter identik dengan endpoint low-stock yang sudah terbukti, hitungan akan otomatis benar saat ada obat menipis.

**Catatan teknis:** Perhitungan dilakukan di sisi aplikasi (fetch lalu `filter` di JS) — sama seperti `getLowStockDrugs` — karena membandingkan agregat `Σ quantityOnHand` per obat terhadap `minimumStock` tidak praktis dilakukan murni lewat query Prisma `count`. Hanya field yang diperlukan yang di-`select` agar ringan.

### 2026-06-22 — Integrasi Redis (Upstash) untuk Auth (Backend)

**Tujuan:** Mengaktifkan fitur auth yang sebelumnya hanya `TODO`/stub karena butuh Redis: **login lockout**, **rotasi & revokasi refresh token**, **logout**, **forgot/reset password**. Memakai Upstash Redis (TCP `rediss://` via `ioredis`) yang sudah diisi user di `REDIS_URL`.

**File baru:**

- [apps/api/src/database/redis.service.ts](apps/api/src/database/redis.service.ts)
  - **`RedisService`** — wrapper `ioredis` (`implements OnModuleInit, OnModuleDestroy`). Constructor membuat client dari `redis.url` config dengan `lazyConnect: true` & `maxRetriesPerRequest: 3` (TLS otomatis aktif untuk skema `rediss://`), pasang handler `error`. `onModuleInit` → `client.connect()` + log "Redis connected." (gagal koneksi di-log tanpa crash). `onModuleDestroy` → `client.quit()`. Expose helper tipis: **`get`**, **`set(key, value, ttlSeconds?)`** (pakai `EX` bila TTL diberikan), **`del`**, **`incr`**, **`expire`**.
- [apps/api/src/database/redis.module.ts](apps/api/src/database/redis.module.ts)
  - **`RedisModule`** — `@Global()` module yang provide & export `RedisService` (pola sama dengan `DatabaseModule`), jadi tersedia di seluruh app.

**File yang diubah:**

- [apps/api/src/app.module.ts](apps/api/src/app.module.ts)
  - Import & daftarkan `RedisModule` di bagian Infrastructure (setelah `DatabaseModule`).
- [apps/api/src/modules/auth/auth.module.ts](apps/api/src/modules/auth/auth.module.ts)
  - Import `NotificationsModule` (agar `NotificationsService` bisa di-inject ke `AuthService` untuk email reset password).
- [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts)
  - **Constructor** — inject `RedisService` (`redis`) & `NotificationsService` (`notifications`) menggantikan komentar `// @InjectRedis()`. Tambah konstanta `REFRESH_TOKEN_TTL_SECONDS` (7 hari) & `RESET_TOKEN_TTL_SECONDS` (1 jam).
  - **`login(dto, ipAddress)`** — kini menegakkan lockout: cek `failed_login:<email>` di Redis, blokir (`ACCOUNT_LOCKED`) bila ≥ `MAX_FAILED_ATTEMPTS` (5); tiap kredensial salah → `incr` counter + `expire` 900 dtk pada increment pertama; login sukses → `del` counter, lalu simpan `refresh:<sessionId>` = refreshToken (TTL 7 hari).
  - **`register(dto)`** — setelah membuat token, ikut menyimpan `refresh:<sessionId>` ke Redis (konsisten dengan login).
  - **`refreshTokens(refreshToken)`** — verifikasi JWT, lalu **validasi terhadap nilai tersimpan di Redis** (`refresh:<sessionId>`); jika tidak cocok/tidak ada → `INVALID_REFRESH_TOKEN`. Susun ulang payload bersih (tanpa `iat/exp`), generate token baru, dan **rotasi**: timpa nilai Redis dengan refreshToken baru (TTL diperbarui).
  - **`logout(sessionId)`** — `del` `refresh:<sessionId>` (mencabut sesi secara nyata).
  - **`forgotPassword(email)`** — simpan `reset:<uuid>` = userId (TTL 1 jam) lalu kirim email berisi link `${frontendUrl}/reset-password?token=...` via `NotificationsService.sendEmail`. Tetap kembalikan pesan generik (anti email-enumeration).
  - **`resetPassword(token, newPassword)`** — ambil userId dari `reset:<token>`; bila tidak ada → `INVALID_RESET_TOKEN`. Bila valid → `bcrypt.hash` password baru, **`prisma.user.update` passwordHash** (sebelumnya ter-comment / non-fungsional), lalu `del` token.

**Hasil uji (live, backend `start:dev`, 0 error TS, app boot semua route ter-map):**

- **Lockout** → 6× login `locktest@example.com` (password salah) → semua tertahan `ACCOUNT_LOCKED` (counter `incr`/`expire`/`get` jalan).
- **Reset token invalid** → `POST /auth/reset-password` token acak → `INVALID_RESET_TOKEN` (Redis `get` miss).
- **Forgot password** → `owner@klinikos.id` → `{ success, message: "Jika email terdaftar, link reset akan dikirim." }`, email ter-log (Resend non-aktif → DEV-EMAIL).
- **Login owner** → sukses (`Dr. Rina (Owner)`), accessToken & refreshToken kembali; refresh token tersimpan di Redis.
- **Refresh** → `POST /auth/refresh` token valid → token baru (validasi Redis lolos).
- **Logout → refresh** → setelah logout (key Redis dihapus), refresh dengan token lama → `INVALID_REFRESH_TOKEN` (revokasi & validasi Redis terbukti).

**Catatan teknis:** Pada rotasi refresh, bila dua refresh terjadi dalam detik yang sama, JWT baru bisa **byte-identik** dengan yang lama (karena `iat` sama) sehingga "reuse" token lama masih cocok — ini sifat JWT deterministik, bukan bug; revokasi tetap terbukti via jalur logout. Kredensial REST Upstash (`UPSTASH_REDIS_REST_URL`/`TOKEN`) di `.env` tidak dipakai backend (hanya untuk SDK HTTP `@upstash/redis`); yang dibaca adalah `REDIS_URL` (TCP `rediss://`).

### 2026-06-21 — Halaman CRUD Pasien (Frontend)

**Tujuan:** Membangun halaman manajemen pasien pertama (route `/patients`, sudah ada di sidebar tapi belum punya page). Mendukung **list + cari + paginasi + tambah + edit** terhubung ke modul `patients` backend (`GET/POST /v1/patients`, `GET/PUT /v1/patients/:id`). Backend tidak mengekspos DELETE (hanya arsip via `isArchived`), jadi operasi destruktif tidak dibuat.

**File yang diubah:**

- [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts)
  - **Response success interceptor** — Ditambah baris additif: saat envelope `{ success, data, meta }` punya `meta`, nilai `meta` dilampirkan ke objek response Axios (`(res as { meta?: unknown }).meta = body.meta`) sebelum `res.data` di-unwrap ke `body.data`. Ini melengkapi TODO paginasi sebelumnya tanpa mengubah perilaku consumer lama (yang hanya membaca `res.data`).

**File baru:**

- [apps/web/src/app/(dashboard)/patients/page.tsx](<apps/web/src/app/(dashboard)/patients/page.tsx>)
  - **`PatientsPage`** — Server Component tipis: `export const metadata = { title: "Pasien" }` lalu render `<PatientsContent />`.
- [apps/web/src/app/(dashboard)/patients/\_components/patient-shared.ts](<apps/web/src/app/(dashboard)/patients/_components/patient-shared.ts>)
  - Tipe & konstanta bersama (bukan komponen): `Gender`, `BloodType`, `PatientListItem`, `PatientDetail`, `PaginationMeta`; peta label `GENDER_LABEL` (MALE→"Laki-laki", FEMALE→"Perempuan") & `BLOOD_TYPE_LABEL` (mis. `A_POS`→"A+"); `BLOOD_TYPE_OPTIONS` (urutan opsi dropdown); helper **`calcAge(birthDate)`** menghitung umur (tahun) dari tanggal lahir.
- [apps/web/src/app/(dashboard)/patients/\_components/patients-content.tsx](<apps/web/src/app/(dashboard)/patients/_components/patients-content.tsx>)
  - **`PatientsContent`** — Client Component utama. State lokal: `searchInput`/`q` (input vs query aktif), `page`, `dialogOpen`, `editingId`. `useQuery(["patients", q, page])` → `api.get("/patients", { params: { q, page, limit: 20 } })` mengembalikan `{ items: res.data, meta: res.meta }` (memakai `meta` dari interceptor); pakai `keepPreviousData` agar tabel tidak berkedip saat ganti halaman. Render tabel (No. RM, Nama, Gender, Tgl Lahir + umur via `calcAge`, Telepon, Gol. Darah, jumlah Alergi, tombol Edit) dengan state loading/error/empty. **`handleSearch`** reset page ke 1 & set `q`. Paginasi (Sebelumnya/Berikutnya + "Halaman X dari Y" + "Menampilkan a–b dari N"). Tombol "Tambah Pasien" (`openCreate`) & Edit (`openEdit`) mengontrol `<PatientFormDialog>`.
- [apps/web/src/app/(dashboard)/patients/\_components/patient-form-dialog.tsx](<apps/web/src/app/(dashboard)/patients/_components/patient-form-dialog.tsx>)
  - **`PatientFormDialog`** — Modal form create/edit (React Hook Form + Zod). `patientFormSchema` memvalidasi: `name` (wajib), `birthDate` (wajib, dikirim `YYYY-MM-DD` → cocok `@IsDateString`), `gender` (enum MALE/FEMALE), `phone` (regex 10–15 digit, opsional), `nik` (16 digit, opsional), `bpjsNumber`/`bloodType`/`address` opsional. Saat edit, `useQuery(["patient", id])` → `api.get("/patients/:id")` (findOne, field PII sudah ter-decrypt) untuk prefill via `reset`. **`onSubmit`** menyusun payload yang **menghapus field kosong** (string `""` → tidak dikirim) supaya lolos `@Matches`/`@IsEnum` whitelist backend. `useMutation` memilih `POST` (create) atau `PUT` (edit) berdasarkan `patientId`; `onSuccess` → toast + `invalidateQueries(["patients"])` (dan `["patient", id]` saat edit) + tutup modal; `onError` menampilkan pesan validasi backend.

**Hasil uji (live, via browser, login `owner@klinikos.id`):**

- **List** → "Belum ada pasien terdaftar." (Klinik Demo kosong), paginasi muncul saat ada data.
- **Create** → tambah "Andi Pratama" (L, 15 Mei 1990, HP 081234567890) → toast "Pasien baru ditambahkan." → baris muncul dengan MRN auto `KLN-2026-0001`, umur **36 th** (dihitung), telepon ter-decrypt, paginasi "Menampilkan 1–1 dari 1 pasien".
- **Edit** → ubah Gol. Darah → **O+** → toast "Data pasien diperbarui." → kolom Gol. Darah tabel ter-refresh jadi "O+" (invalidation jalan).
- **Cari** → "Andi" → tabel memfilter ke pasien yang cocok.

0 error TypeScript di seluruh file.

**Catatan teknis:** Endpoint `GET /patients` di backend mengembalikan envelope `{ success, data, meta }` sendiri; `TransformInterceptor` mendeteksi field `success` lalu melewatkannya tanpa membungkus ulang, sehingga `meta` paginasi sampai utuh ke frontend (kini dipertahankan oleh interceptor `api.ts`). DELETE pasien sengaja tidak dibuat (backend hanya soft-archive, belum ada route).

### 2026-06-21 — Sinkronisasi Field 2FA Login `totpCode` (Frontend)

**Tujuan:** Menyamakan nama field kode 2FA pada form login frontend dengan kontrak backend. `LoginDto` backend mengharapkan `totpCode`, sedangkan form login mengirim `twoFactorCode` — karena `ValidationPipe` mem-`whitelist` payload, field `twoFactorCode` dibuang diam-diam sehingga kode 2FA tidak pernah sampai ke server saat fitur 2FA aktif.

**File yang diubah:**

- [apps/web/src/app/(auth)/login/login-form.tsx](<apps/web/src/app/(auth)/login/login-form.tsx>)
  - **`loginSchema`** (Zod) — field opsional `twoFactorCode` diganti menjadi `totpCode` (tipe `string().optional()`), sehingga `LoginInput` dan objek `values` yang dikirim `api.post("/auth/login", values)` kini memakai key `totpCode` yang dikenali backend.
  - **Input kode 2FA** — atribut `htmlFor`, `id`, dan `register("…")` diubah dari `twoFactorCode` → `totpCode` (markup & gaya tidak berubah).

**Hasil uji:** 0 error TypeScript. Login dasar (`owner@klinikos.id`, 2FA non-aktif) tetap berfungsi → redirect `/dashboard` (terverifikasi pada uji #1 di sesi yang sama). Jalur kirim kode 2FA kini cocok dengan `LoginDto.totpCode` (`@Length(6,6)`); verifikasi end-to-end 2FA menunggu fitur 2FA diaktifkan.

### 2026-06-21 — Dashboard Widgets Terhubung ke API (Frontend)

**Tujuan:** Mengganti 4 kartu KPI dashboard & panel antrean yang sebelumnya hardcoded placeholder (`"—"`, `"Rp —"`) dengan data live dari backend (`GET /v1/reports/dashboard` + `GET /v1/queues/today`). Token disimpan di cookie (dibaca client via js-cookie), jadi fetching dilakukan client-side via TanStack Query memakai instance `api` (Axios) yang otomatis menyisipkan Bearer token.

**File baru:**

- [apps/web/src/app/(dashboard)/dashboard/\_components/dashboard-content.tsx](<apps/web/src/app/(dashboard)/dashboard/_components/dashboard-content.tsx>)
  - **`DashboardContent`** — Client Component (`"use client"`) yang merender seluruh isi dashboard. Dua query TanStack:
    - `useQuery(["dashboard-kpis"])` → `api.get("/reports/dashboard")` → tipe `DashboardKpis` (`todayPatients`, `patientDelta`, `todayRevenue`, `revenueDelta`, `pendingInvoices`, `lowStockCount`, dll). Endpoint ini **OWNER/DOCTOR-only** (RECEPTIONIST/PHARMACIST dapat 403 → kartu fallback ke `"—"`/`"Rp —"`).
    - `useQuery(["queues-today"])` → `api.get("/queues/today")` → array `QueueItem` (`id`, `queueNumber`, `status`, `patient{ name, medicalRecordNumber }`, `doctor{ name } | null`). Terbuka untuk semua user terautentikasi.
  - **Mapping 4 kartu KPI:** Pasien Hari Ini=`todayPatients`, Antrian Aktif=jumlah queue berstatus `WAITING`/`IN_PROGRESS` (dihitung dari `queues/today`), Pendapatan Hari Ini=`formatCurrency(todayRevenue)`, Stok Hampir Habis=`lowStockCount`.
  - **Helper `num(value)`** — privat dalam komponen: tampilkan `"…"` saat loading, `"—"` saat error/undefined, atau angka ter-`toLocaleString("id-ID")`.
  - **Panel "Antrian Saat Ini"** — render daftar antrean (nomor, nama pasien, no. RM, dokter, badge status) dengan state loading/error/empty ("Belum ada antrean hari ini."). Konstanta lokal: `STATUS_LABEL` & `STATUS_BADGE` (peta `QueueStatus` → label Bahasa Indonesia & kelas warna), `ACTIVE_STATUSES` (`WAITING`, `IN_PROGRESS`).

**File yang diubah:**

- [apps/web/src/app/(dashboard)/dashboard/page.tsx](<apps/web/src/app/(dashboard)/dashboard/page.tsx>)
  - Diramping menjadi **Server Component tipis**: tetap meng-`export const metadata = { title: "Dashboard" }` lalu hanya merender `<DashboardContent />`. Seluruh markup statis (array `stats` placeholder, kartu, panel) dipindah ke komponen client.

**Hasil uji (live, via browser):** Login `owner@klinikos.id` → redirect `/dashboard` → keempat kartu menampilkan data real backend: Pasien Hari Ini **0**, Antrian Aktif **0**, Pendapatan Hari Ini **Rp 0**, Stok Hampir Habis **0** (Klinik Demo belum punya antrean hari ini), panel antrean "Belum ada antrean hari ini." 0 error TypeScript.

**Catatan teknis:** Saat cold-start Neon, kartu KPI sempat menampilkan `"…"` lalu otomatis terisi setelah query selesai (UX loading sudah ditangani). `lowStockCount` di [apps/api/src/modules/reports/reports.service.ts](apps/api/src/modules/reports/reports.service.ts) **masih placeholder** (`Promise.resolve(0)`) — belum dihitung dari stok asli (perlu diperbaiki terpisah, usulkan dulu sebelum mengubah).

### 2026-06-20 — Endpoint Registrasi Klinik `POST /auth/register` (Backend)

**Tujuan:** Membuat endpoint registrasi klinik yang sebelumnya dipanggil [register-form.tsx](<apps/web/src/app/(auth)/register/register-form.tsx>) tapi belum ada di backend. Satu request membuat **Tenant** + **User OWNER** lalu auto-login.

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
- [apps/web/src/app/(auth)/login/login-form.tsx](<apps/web/src/app/(auth)/login/login-form.tsx>)
  - **`onSubmit`** — Flag cek 2FA disamakan dengan backend: `data?.requires2FA` (sebelumnya `data?.require2FA`).

**Hasil uji end-to-end (live, via browser):** Login `owner@klinikos.id` → toast "Selamat datang, Dr. Rina (Owner)" → redirect ke `/dashboard` menampilkan tenant "Klinik Demo", role OWNER. 0 error TypeScript.

**Catatan lanjutan (belum dikerjakan):**

- Endpoint `POST /auth/register` dipanggil [register-form.tsx](<apps/web/src/app/(auth)/register/register-form.tsx>) tapi **belum ada** di `auth.controller.ts` (registrasi klinik perlu dibuat).
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

- Frontend masih membaca `data.user` padahal data ada di `data.data.user` (akibat pembungkus `{ success, data }`). Perlu perbaikan di [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts) & [apps/web/src/app/(auth)/login/login-form.tsx](<apps/web/src/app/(auth)/login/login-form.tsx>).
- Redis untuk lockout login, rotasi refresh token, dan reset-password masih `TODO` di `auth.service.ts` (butuh keputusan infra: Redis server/Upstash).

<!-- Email: owner@klinikos.id
Password: Admin@123456
Frontend Next.js sudah berjalan -->
