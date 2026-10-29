# Integrasi Modul Dosen/Reviewer/Pesan + Perbaikan Bug Auth & Header

Tanggal: 13 Oktober 2026
Konteks: setelah `git pull` masuk commit `8983ac2` (modul dashboard dosen/reviewer, pesan & revisi, direct messages). Dilakukan rebuild stack + verifikasi, ditemukan dan diperbaiki dua bug.

## 1. Rebuild & migrasi
- `docker compose up --build -d` berhasil (backend Go, frontend Vite).
- Migrasi `backend/migrations/0002_direct_messages.sql` otomatis dijalankan saat startup → tabel `direct_messages` (+ index).
- Total tabel: **38** (sebelumnya 37). Health `GET /health` → 200.

## 2. Bug backend: semua endpoint dosen/reviewer/pesan balas 401

**Gejala**
- Login OK (`/api/auth/login` mengembalikan token), `/api/auth/me` juga OK.
- Tetapi `/api/dosen/*`, `/api/reviewer/*`, `/api/messages/*` → **401 "Akses tidak diizinkan"**, padahal role pada token sudah tepat (`dosen`/`reviewer`/`admin`).

**Akar masalah**
- `middleware.RequireAuth` menyimpan klaim ke context sebagai `jwt.MapClaims`.
- Helper `getUserIDFromContext` (dipakai semua handler dosen/reviewer/pesan) meng-assert nilai itu ke tipe `gin.H`: tipe bernama yang **berbeda** dari `jwt.MapClaims`: sehingga assertion selalu gagal.
- Selain itu helper membaca key `"id"`, padahal ID pengguna ada pada klaim **`"sub"`**.

**Perbaikan**
- `backend/internal/middleware/auth.go`: setelah validasi, set konteks kanonik
  `c.Set("user", claims)`, `c.Set("userID", claims["sub"])`, `c.Set("role", role)`.
- `backend/internal/handlers/dosen.go`: `getUserIDFromContext` kini membaca `c.GetString("userID")` terlebih dahulu, lalu fallback ke `jwt.MapClaims`/`gin.H` dengan key `"sub"`/`"id"`.

**Hasil** (semua 200)
- `/api/dosen/overview`, `/proposals`, `/requests`, `/guidance`
- `/api/reviewer/overview`, `/assignments`
- `/api/messages/conversations`, `/api/messages/thread/:contactId`, `/api/messages/send`

> Catatan: grup pesan sebenarnya di `/api/messages/*` (bukan `/api/auth/messages/*`).

## 3. Regresi layout header (akibat header akun baru)

**Gejala**
- Setelah commit `8983ac2`, saat login header **melebar keluar layar 87–148px** pada lebar ~1024px (rentang ~900–1150), dan elemen `.brand` menyusut hingga lebar 0 (logo meluber keluar kotaknya).

**Akar masalah**
- Header kini memuat `.nav-user-chip` (nama + role) dan label navigasi panjang khusus peran (mis. "Dashboard Reviewer", "Portal Informasi"), sehingga total melebihi lebar viewport.

**Perbaikan**
- `frontend/src/ref.css`
  - `.site-header.topnav .brand { flex: 0 0 auto; }`: brand tidak lagi menyusut.
  - Titik muncul menu penuh digeser **900px → 1100px**; di bawahnya pakai burger.
  - Chip akun diringkas di `<1100px` (sembunyikan nama+role), tombol switch dashboard disembunyikan `<1100px` dengan `!important` (karena inline style), teks tombol "Keluar" disembunyikan `≤420px`.
- `frontend/src/main.jsx`
  - Label nav peran dipendekkan: "Dashboard Dosen"→"Dosen", "Dashboard Reviewer"→"Reviewer", "Pesan & Revisi"→"Pesan", "Portal Informasi"→"Beranda".
  - Tautan switch dosen↔reviewer diberi `className="nav-switch-btn"`.

**Hasil**
- `scrollWidth == clientWidth` header di **semua** lebar (320–1440) untuk guest, dosen, reviewer, dan admin.
- Halaman (beranda, kontak, dosen, pesan, reviewer, admin) **tanpa overflow** horizontal.

## Verifikasi
- Audit DOM via browser pada 320/360/390/768/1024/1100/1280/1440 px: `pageOverflow = 0` untuk semua rute & peran.
- Konten dashboard ter-render: #dosen (Bimbingan/Proposal/Permintaan/Kuota/Jadwal), #reviewer (Penugasan/Review/Nilai), #pesan (Kirim/Percakapan/Revisi), #admin (7 tab).
- Tidak ada error console; Vite HMR normal.
