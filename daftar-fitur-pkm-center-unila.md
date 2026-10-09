# Daftar Fitur PKM-Center Unila

> Berisi fitur-fitur **di luar** 4 halaman yang sudah masuk pembagian awal (`pembagian-awal-halaman.md`: Home, Pedoman + Portofolio, Berita & Galeri, Kontak + Halaman Login).

---

## 1. Fitur Sisi Guest (Publik) — Tambahan

- [x] Search bar untuk cari pedoman (filternya di halaman `/#pedoman`)
- [x] Breadcrumb navigasi (halaman Pedoman, Portofolio, Kontak)

---

## 2. Fitur Sisi Admin (Pengelola Konten)

### 2.1 Autentikasi
- [x] Login admin (JWT) — *modal di header + panel admin `/#admin`; sesi kedaluwarsa 24 jam*
- [ ] Manajemen role (opsional: super admin, editor)

### 2.2 Manajemen Konten
- [x] CRUD Berita (judul, isi, gambar sampul, kategori) — *via panel admin `/#admin`*
- [x] CRUD Video (judul, link/embed, deskripsi, thumbnail)
- [x] CRUD Galeri Foto (melalui URL; *upload berkas belum*)
- [x] CRUD Timeline PKM per tahun (tahapan & tanggal) — *seksi Timeline di panel admin; seed non-destruktif (create-if-missing)*
- [x] CRUD Pedoman PKM (tautan PDF/unduhan per tahun) — *seksi Pedoman di panel admin*
- [x] CRUD Portfolio/Arsip Proposal (judul, tim, tahun, skema, fakultas, prodi, ringkasan) — *seksi Portofolio di panel admin*

### 2.3 Statistik & Dashboard
- [x] Dashboard ringkasan konten (daftar + jumlah item yang terbit) — *di panel admin*
- [~] ~~Input/update jumlah usulan proposal per skema PKM (yang tampil di Home)~~ — **diubah (v3, 09-10-2026):** statistik kini **turunan otomatis** dari data `proposals` (`v_scheme_stats`), **read-only**; edit manual dihapus agar angka selalu konsisten. Lihat `docs/revisi-struktur-db-pkm-center.md`.

### 2.4 Kritik & Saran
- [x] Lihat daftar masukan yang masuk dari form guest (Home) & form Kontak — *seksi Masukan di panel admin*
- [x] Tandai sudah dibaca/ditindaklanjuti — *tombol "Tandai dibaca" per pesan*

---

## 3. Fitur Lanjutan (Opsional, di Luar Referensi)

Fitur ini tidak ada di situs referensi, tapi relevan kalau PKM-Center Unila mau lebih dari sekadar company profile:

> **Fondasi data (skema v2) sudah tersedia** untuk fitur-fitur ini: `teams`/`team_members`, `proposals`/`proposal_documents`, `supervisor_requests`, `reviews`, `logbook_entries`, `notifications`, dan `ai_analyses` — tinggal handler/endpoint & UI. Lihat `docs/revisi-struktur-db-pkm-center.md`.

- [ ] **Login mahasiswa** — untuk submit proposal PKM langsung lewat sistem
- [ ] **Upload & tracking status proposal** — mahasiswa bisa lihat status (submitted, direview, lolos, ditolak)
- [ ] **Dashboard reviewer/dosen pembimbing** — untuk menilai/memberi feedback proposal
- [ ] **Notifikasi** — email/in-app saat status proposal berubah
- [ ] **Kategorisasi per fakultas** — filter proposal/portfolio berdasarkan fakultas (pakai palet warna fakultas Unila, lihat dokumen rencana proyek)
- [ ] **Kalender kegiatan PKM** — sinkron dengan Timeline PKM
- [ ] **Export laporan** — misal rekap jumlah proposal per skema/fakultas (PDF/Excel)

---

## 4. Prioritas yang Disarankan

| Prioritas | Fitur |
|---|---|
| **Tahap 2** ✅ | Admin CRUD dasar (berita, pedoman, portofolio), dashboard admin, statistik per skema (otomatis dari data proposal) |
| **Tahap 3 (lanjutan)** | Login mahasiswa, upload proposal, tracking status, dashboard reviewer, notifikasi |

---

## Catatan
- Untuk daftar halaman guest & checklist-nya, lihat `pembagian-awal-halaman.md`.
- Untuk detail teknis (tech stack, folder, fase pengerjaan), lihat `rencana-awal-proyek-pkm-center-unila.md`.
- Update 07-10-2026: redesign Beranda sesuai referensi (lihat `docs/perubahan-ui-sesuaikan-desain-2026-10-07.md`). Fungsionalitas lama (Berita, Galeri, Pedoman, Portofolio, Kontak, Admin) tetap dipertahankan.
- Update 09-10-2026: **implementasi skema database v2** — model GORM baru (user/role, periode/skema/tahap, tim, proposal, review, logbook, notifikasi, AI, CMS posts/media), migrasi SQL otomatis saat startup, auth pindah ke `users` ber-UUID + `user_roles`/`roles`, dan **statistik per skema jadi turunan** dari `proposals` (read-only). Rincian: `docs/revisi-struktur-db-pkm-center.md`.