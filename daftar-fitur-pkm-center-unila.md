# Daftar Fitur PKM-Center Unila

> Berisi fitur-fitur **di luar** 4 halaman yang sudah masuk pembagian awal (`pembagian-awal-halaman.md`: Home, Pedoman + Portofolio, Berita & Galeri, Kontak + Halaman Login).

---

## 1. Fitur Sisi Guest (Publik) — Tambahan

- [ ] Search bar untuk cari berita/pedoman
- [ ] Breadcrumb navigasi

---

## 2. Fitur Sisi Admin (Pengelola Konten)

### 2.1 Autentikasi
- [ ] Login admin (JWT) — *catatan: halaman login sudah masuk section 4 pembagian awal, ini bagian logic/dashboard setelah login*
- [ ] Manajemen role (opsional: super admin, editor)

### 2.2 Manajemen Konten
- [x] CRUD Berita (judul, isi, gambar sampul, kategori) — *via panel admin `/#admin`*
- [x] CRUD Video (judul, link/embed, deskripsi, thumbnail)
- [x] CRUD Galeri Foto (melalui URL; *upload berkas belum*)
- [ ] CRUD Timeline PKM per tahun (tahapan & tanggal)
- [ ] CRUD Pedoman PKM (upload file PDF per tahun)
- [ ] CRUD Portfolio/Arsip Proposal (judul, tim, tahun, file/link)

### 2.3 Statistik & Dashboard
- [x] Dashboard ringkasan konten (daftar + jumlah item yang terbit) — *di panel admin*
- [ ] Input/update jumlah usulan proposal per skema PKM (yang tampil di Home)

### 2.4 Kritik & Saran
- [ ] Lihat daftar masukan yang masuk dari form guest (Home)
- [ ] Tandai sudah dibaca/ditindaklanjuti (opsional)

---

## 3. Fitur Lanjutan (Opsional, di Luar Referensi)

Fitur ini tidak ada di situs referensi, tapi relevan kalau PKM-Center Unila mau lebih dari sekadar company profile:

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
| **Tahap 2 (setelah 4 halaman awal selesai)** | Admin CRUD dasar (berita, pedoman, portofolio), dashboard admin, statistik realtime di Home |
| **Tahap 3 (lanjutan)** | Login mahasiswa, upload proposal, tracking status, dashboard reviewer, notifikasi |

---

## Catatan
- Untuk daftar halaman guest & checklist-nya, lihat `pembagian-awal-halaman.md`.
- Untuk detail teknis (tech stack, folder, fase pengerjaan), lihat `rencana-awal-proyek-pkm-center-unila.md`.