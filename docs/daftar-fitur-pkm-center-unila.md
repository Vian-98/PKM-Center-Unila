# Daftar Fitur PKM-Center Unila

> Berisi fitur-fitur **di luar** 4 halaman yang sudah masuk pembagian awal (`pembagian-awal-halaman.md`: Home, Pedoman + Portofolio, Berita & Galeri, Kontak + Halaman Login).

---

## 1. Fitur Sisi Guest (Publik): Tambahan

- [x] Search bar untuk cari pedoman (filternya di halaman `/#pedoman`)
- [x] Breadcrumb navigasi (halaman Pedoman, Portofolio, Kontak)

---

## 2. Fitur Sisi Admin (Pengelola Konten)

### 2.1 Autentikasi
- [x] Login admin (JWT): *modal di header + panel admin `/#admin`; sesi kedaluwarsa 24 jam*
- [ ] Manajemen role (opsional: super admin, editor)

### 2.2 Manajemen Konten
- [x] CRUD Berita (judul, isi, gambar sampul, kategori): *via panel admin `/#admin`*
- [x] CRUD Video (judul, link/embed, deskripsi, thumbnail)
- [x] CRUD Galeri Foto (melalui URL; *upload berkas belum*)
- [x] CRUD Timeline PKM per tahun (tahapan & tanggal): *seksi Timeline di panel admin; seed non-destruktif (create-if-missing)*
- [x] CRUD Pedoman PKM (tautan PDF/unduhan per tahun): *seksi Pedoman di panel admin*
- [x] CRUD Portfolio/Arsip Proposal (judul, tim, tahun, skema, fakultas, prodi, ringkasan): *seksi Portofolio di panel admin*

### 2.3 Statistik & Dashboard
- [x] Dashboard ringkasan konten (daftar + jumlah item yang terbit): *di panel admin*
- [~] ~~Input/update jumlah usulan proposal per skema PKM (yang tampil di Home)~~: **diubah (v3, 09-10-2026):** statistik kini **turunan otomatis** dari data `proposals` (`v_scheme_stats`), **read-only**; edit manual dihapus agar angka selalu konsisten. Lihat `docs/revisi-struktur-db-pkm-center.md`.

### 2.4 Kritik & Saran
- [x] Lihat daftar masukan yang masuk dari form guest (Home) & form Kontak: *seksi Masukan di panel admin*
- [x] Tandai sudah dibaca/ditindaklanjuti: *tombol "Tandai dibaca" per pesan*

---

## 3. Fitur Lanjutan (Opsional, di Luar Referensi)

Fitur ini tidak ada di situs referensi, tapi relevan kalau PKM-Center Unila mau lebih dari sekadar company profile:

> **Fondasi data (skema v2) sudah tersedia** untuk fitur-fitur ini: `teams`/`team_members`, `proposals`/`proposal_documents`, `supervisor_requests`, `reviews`, `logbook_entries`, `notifications`, dan `ai_analyses`: tinggal handler/endpoint & UI. Lihat `docs/revisi-struktur-db-pkm-center.md`.

- [ ] **Login mahasiswa**: untuk submit proposal PKM langsung lewat sistem
- [ ] **Upload & tracking status proposal**: mahasiswa bisa lihat status (submitted, direview, lolos, ditolak)
- [ ] **Dashboard reviewer/dosen pembimbing**: untuk menilai/memberi feedback proposal
- [ ] **Notifikasi**: email/in-app saat status proposal berubah
- [ ] **Kategorisasi per fakultas**: filter proposal/portfolio berdasarkan fakultas (pakai palet warna fakultas Unila, lihat dokumen rencana proyek)
- [ ] **Kalender kegiatan PKM**: sinkron dengan Timeline PKM
- [ ] **Export laporan**: misal rekap jumlah proposal per skema/fakultas (PDF/Excel)

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
- Update 09-10-2026: **implementasi skema database v2**: model GORM baru (user/role, periode/skema/tahap, tim, proposal, review, logbook, notifikasi, AI, CMS posts/media), migrasi SQL otomatis saat startup, auth pindah ke `users` ber-UUID + `user_roles`/`roles`, dan **statistik per skema jadi turunan** dari `proposals` (read-only). Rincian: `docs/revisi-struktur-db-pkm-center.md`.
- Update 09-10-2026: **perbaikan layout responsif**: header, modal login, dan panel admin tidak lagi terpotong; drawer mobile menambah akses "Kelola konten" & "Keluar". Rincian: `docs/perbaikan-layout-responsif-2026-10-09.md`.
- Update 13-10-2026: **modul dosen/reviewer & pesan** (dari commit `8983ac2`) + perbaikan: (a) bug auth, semua endpoint `/api/dosen/*`, `/api/reviewer/*`, `/api/messages/*` sebelumnya 401 karena helper membaca klaim salah tipe/key; (b) regresi header saat login (overflow di ~1024px) diperbaiki. Migrasi `0002_direct_messages.sql` → tabel `direct_messages`. Rincian: `docs/integrasi-modul-dosen-reviewer-2026-10-13.md`.
- Update 13-10-2026: **analisis & rencana dinamisasi data riil PKM 2026** (PIC: Vian): telaah 321 usulan proposal PKM 2026 (`PKM UNILA 2026  - Sheet1.csv`) dan master dosen FT (`UNTUK Nurkhawarizmi (1).xlsx`), roadmap 4 tahap integrasi metrik riil, seeder database, fitur pelacakan proposal mahasiswa, dan personalisasi dashboard dosen/reviewer. Rincian: `docs/rencana-dinamisasi-data-riil-pkm-2026-10-13.md`.
- Update 13-10-2026: **standardisasi Neo-Glassmorphism & roadmap audit DB** (PIC: Vian): penetapan Neo-Glassmorphism sebagai bahasa desain resmi (ambient light mesh, floating frosted topbar, milk glass cards, spotlight cards, 3D liquid glass folder), penyelarasan statistik frontend dengan 321 proposal riil, dan pemetaan roadmap 34 tabel PostgreSQL ke 4 anggota tim (Aidil, Vian, Radhit, Dimas). Rincian: `docs/acuan-design-pkm-center.md`, `docs/roadmap-fitur-dan-audit-database-2026-10-13.md`, dan `docs/laporan-eksekusi-desain-dan-fitur-2026-10-13.md`.
- Update 13-10-2026: **Portal Mahasiswa (Favian/Anggota 2) selesai** ✅: `MahasiswaDashboard.jsx` (stepper 5 tahap, kartu tim/pembimbing, agenda, lonceng notifikasi in-app), `AjukanProposal.jsx` (multi-step 3 langkah, 10 skema PKM, pendaftaran anggota tim via NPM, unggah berkas nyata + riwayat versi `proposal_documents`), `LogbookPKM.jsx` (persentase capaian + unggah bukti), dan `CekStatusUsulan.jsx` (pelacakan publik). Backend: handler `student.go`, migrasi aditif `0003_student_portal.sql` (`proposals.field_of_study`, `logbook_entries.progress_percentage`), endpoint upload/notifikasi, serta skema `PKM-VGK` ke-10 pada seeder. Seluruh endpoint terverifikasi end-to-end.
- Update 13-10-2026: **auto-deploy server**: `scripts/autodeploy.sh` + systemd timer `pkm-autodeploy.timer` tiap 2 menit; rebuild hanya bila `backend/`, `frontend/`, atau `docker-compose.yml` berubah. Dokumentasi di `README.md`.
