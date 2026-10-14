# PKM Center Unila

Platform digital manajemen **Program Kreativitas Mahasiswa (PKM) Universitas Lampung**. Proyek ini menyediakan ruang informasi publik, direktori pedoman dan portofolio, pengelolaan tim dan bimbingan dosen, peninjauan proposal oleh reviewer, sistem pesan langsung (*direct messages*), serta panel administrasi berbasis peran (*Role-Based Access Control* / RBAC).

Aplikasi dibangun dengan stack:
* **Frontend:** React + Vite (Vanilla CSS berbasis Token & Neo-Glassmorphism, tanpa Tailwind/shadcn CLI)
* **Backend:** Go 1.22 + Gin + GORM
* **Database:** PostgreSQL 16 (Skema v2 dengan 34 tabel terkelola migrasi SQL otomatis)
* **Autentikasi:** JSON Web Token (JWT)

---

## 📚 Indeks Dokumentasi Proyek (Documentation Hub)

Repository ini memiliki dokumentasi arsitektur, desain, basis data, dan riwayat sprint yang sangat terperinci di direktori [`docs/`](docs/). Gunakan indeks di bawah ini sebagai pintu masuk navigasi:

### 1. Desain Sistem & Panduan Visual (UI/UX)
| Dokumen | Keterangan & Cakupan | PIC / Tanggal |
| :--- | :--- | :--- |
| 📘 [**Acuan Desain PKM Center**](acuan-design-pkm-center.md) <br> *(Mirror: [docs/acuan-design-pkm-center.md](docs/acuan-design-pkm-center.md))* | **Single Source of Truth (SSOT) Desain UI/UX.** Menjelaskan standar resmi **Neo-Glassmorphism**, palet warna almamater (Navy `#123B66`, Sky `#175B91`, Emas Unila `#FFD700`, Putih Es `#F7FBFF`), komponen atomik `/components/ui/` (`GlowCard`, `GlassFolder`), serta kelas utilitas CSS. | Vian <br> *13 Okt 2026* |
| 🎨 [**Acuan Warna Referensi**](docs/acuan-warna-referensi.md) | Ekstraksi palet warna asli dari 4 berkas visual acuan dan warna fakultas berdasarkan Statuta Unila BAB II. | Tim UI/UX |
| 📱 [**Perbaikan Layout Responsif**](docs/perbaikan-layout-responsif-2026-10-09.md) | Catatan refactoring header mengambang, modal login, dan drawer navigasi mobile (320px – 1024px). | Tim Frontend <br> *09 Okt 2026* |
| 🖼️ [**Perubahan UI Sesuai Desain**](docs/perubahan-ui-sesuaikan-desain-2026-10-07.md) | Catatan penyesuaian tema biru-putih dan restrukturisasi kartu seksi Beranda. | Tim Frontend <br> *07 Okt 2026* |

---

### 2. Perencanaan, Roadmap & Pembagian Kerja Tim
| Dokumen | Keterangan & Cakupan | PIC / Tanggal |
| :--- | :--- | :--- |
| 🚀 [**Roadmap Fitur & Audit Database**](docs/roadmap-fitur-dan-audit-database-2026-10-13.md) | **Audit Mendalam 34 Tabel Database v2** (16 aktif vs 18 model-only). Pemetaan tugas resmi 4 anggota tim berdasarkan `docs/pkm - Sheet1.csv`: **Aidil** (AI Idea Lab & Cari Tim), **Vian** (UI/UX, Portal Mhs, Logbook), **Radhit** (Auth, DB Migration, Admin Kampus), dan **Dimas** (Modul Dosen, Reviewer, Pesan). | Vian <br> *13 Okt 2026* |
| 📋 [**Laporan Eksekusi Desain & Fitur**](docs/laporan-eksekusi-desain-dan-fitur-2026-10-13.md) | Rekapitulasi lengkap eksekusi desain Neo-Glassmorphism, komponen baru, perbaikan grid responsif, eliminasi teks terpotong pada berita, dan integrasi metrik 2026. | Vian <br> *13 Okt 2026* |
| 📊 [**Rencana Dinamisasi Data Riil 2026**](docs/rencana-dinamisasi-data-riil-pkm-2026-10-13.md) | Analisis rekapitulasi data nyata **321 Proposal PKM Unila 2026**, 168 dosen pembimbing unik, 23 reviewer internal, dan master direktori dosen FT. | Vian <br> *13 Okt 2026* |
| 📑 [**Daftar Fitur PKM-Center Unila**](docs/daftar-fitur-pkm-center-unila.md) | Backlog fitur komprehensif (fitur publik, panel admin, serta modul lanjutan mahasiswa, dosen, dan reviewer) beserta log pembaruan. | Vian & Tim <br> *13 Okt 2026* |
| 📌 [**Rencana Awal Proyek**](docs/rencana-awal-proyek-pkm-center-unila.md) | Gambaran awal proyek, arsitektur teknis, pemilihan tech stack, dan sasaran luaran. | Tim PKM-Center |
| ✅ [**Pembagian Awal Halaman**](docs/pembagian-awal-halaman.md) | Pembagian tugas awal 4 halaman publik utama (seluruh checklist telah selesai). | Tim Frontend |

---

### 3. Arsitektur Database & Modul Internal
| Dokumen | Keterangan & Cakupan | PIC / Tanggal |
| :--- | :--- | :--- |
| 🗄️ [**Revisi Struktur Database v2**](docs/revisi-struktur-db-pkm-center.md) | Skema database relasional PostgreSQL v2, Entity-Relationship Diagram (ERD), kamus 34 tabel, relasi GORM, dan panduan migrasi. | Radhit & Tim DB <br> *09 Okt 2026* |
| 💬 [**Integrasi Modul Dosen, Reviewer & Pesan**](docs/integrasi-modul-dosen-reviewer-2026-10-13.md) | Implementasi endpoint `/api/dosen/*`, `/api/reviewer/*`, tabel `direct_messages` (`0002_direct_messages.sql`), dan perbaikan autentikasi token JWT. | Dimas & Tim Backend <br> *13 Okt 2026* |

---

### 4. Berkas Data Rujukan (Datasets)
* [`docs/pkm - Sheet1.csv`](docs/pkm%20-%20Sheet1.csv): Matriks pembagian kerja resmi 4 anggota tim pengembang.
* [`docs/PKM UNILA 2026  - Sheet1.csv`](docs/PKM%20UNILA%202026%20%20-%20Sheet1.csv): Rekapitulasi nyata 321 usulan proposal mahasiswa Unila tahun 2026 lintas 8 fakultas.
* [`docs/UNTUK Nurkhawarizmi (1).xlsx`](docs/UNTUK%20Nurkhawarizmi%20%281%29.xlsx): Direktori master dosen & tendik Fakultas Teknik (FT) Universitas Lampung lengkap dengan NIP 18 digit.

---

## 🚀 Fitur & Halaman yang Tersedia

### A. Portal Publik (Guest)
* **Beranda (`/#beranda`):** Hero section dinamis, statistik riil usulan 321 proposal PKM Unila 2026, 3 kartu Ekosistem interaktif berbingkai cahaya (`GlowCard`), timeline tahapan, kabar terkini, dan banner unduh panduan.
* **Pedoman & Format Usulan PKM (`/#pedoman`):** Hub rujukan resmi SIMBELMAWA Kemdiktisaintek dengan 5 tab interaktif:
  1. *Buku Panduan Resmi:* Showcase map berkas 3D interaktif (`GlassFolder`) + direktori filter 13 buku panduan resmi (Umum & 10 Skema) dengan tautan langsung ke portal SIMBELMAWA.
  2. *Format & Sistematika Usulan:* Peringatan Anti-Gugur Evaluasi Tahap 1 (wajib tanpa cover & tanpa lembar pengesahan), spesifikasi margin 4-3-3-3 cm, font TNR 12 pt, spasi 1.15, batas 10 halaman inti, dan breakdown Bab 1 s.d. Bab 4.
  3. *Format RAB 4 Komponen:* Rincian plafon dana (Rp 6–10 Juta & Insentif Rp 2.5 Juta), batasan persentase 4 komponen (Bahan Habis Pakai maks 60%, Sewa & Jasa maks 15%, Transportasi Lokal maks 30%, Lain-lain maks 15%), kotak peringatan pos anggaran terlarang, serta template tabel Bab 4 & Lampiran 2.
  4. *Template Lampiran Baku:* Format Surat Pernyataan Ketua Tim bermeterai Rp 10.000 (dilengkapi klausul kepatuhan Generative AI Belmawa), Biodata Ketua/Anggota/Dosen, susunan organisasi tim, dan kesediaan mitra dengan tombol salin teks ke clipboard & unduh file (.txt).
  5. *Arsip Proposal Lolos PIMNAS:* Koleksi 5 berkas PDF utuh proposal peraih medali & didanai Belmawa asal Unila (PadiVision, NanoMarine, TelangTea, FinSmart, AgroSense) yang dapat langsung dibaca dan diunduh.
* **Portofolio Proposal (`/#portofolio`):** Arsip proposal yang lolos seleksi dan pendanaan, filter chip tahun, skema, dan ringkasan proposal.
* **Kabar & Berita (`/#berita`):** Grid 3 kolom responsif dengan kartu Neo-Glassmorphism, penomoran halaman (pagination), dan halaman detail artikel lengkap (`/#berita/:id`).
* **Galeri Foto & Video (`/#galeri`):** Video kegiatan tersemat dan galeri dokumentasi dengan interaksi lightbox foto.
* **Kontak & Masukan (`/#kontak`):** Peta kampus tersemat, detail sekretariat, serta formulir pengiriman kritik & saran langsung ke database.

### B. Modul Terautentikasi (Internal)
* **Panel Admin (`/#admin`):** 7 sub-seksi manajemen konten (Berita, Video, Galeri), Timeline tahapan, Pedoman PDF, Portofolio, Masukan pengguna, Statistik per skema (otomatis dari tabel `proposals`), dan Info Kontak.
* **Dashboard Dosen Pembimbing (`/#dosen`):** Ringkasan kuota bimbingan, verifikasi permohonan bimbingan tim mahasiswa, riwayat proposal bimbingan, dan log bimbingan.
* **Dashboard Reviewer (`/#reviewer`):** Antrean penugasan review proposal, lembar penilaian rubrik terstandar, dan pemberian catatan evaluasi per butir kriteria.
* **Pusat Pesan / Direct Messages (`/#pesan`):** Komunikasi langsung dua arah antara mahasiswa, dosen pembimbing, dan reviewer.

---

## 💻 Menjalankan Secara Lokal

Prasyarat: [Docker Desktop](https://www.docker.com/products/docker-desktop/) telah terpasang dan berjalan di komputer Anda.

```bash
# Jalankan seluruh stack (Frontend, Backend, Database)
docker compose up --build

# Atau jalankan di latar belakang (background daemon)
docker compose up --build -d
```

| Layanan | URL Lokal | Keterangan |
| :--- | :--- | :--- |
| **Frontend Web** | http://localhost:5173 | Antarmuka React + Vite |
| **Backend REST API** | http://localhost:8081 | API Go Gin |
| **Health Check API** | http://localhost:8081/health | Pengecekan status backend & koneksi DB |
| **Database PostgreSQL** | `localhost:5432` | Database persisten (`pkm_center_unila`) |

Untuk menghentikan layanan:
```bash
docker compose down
```

Untuk melihat log kontainer:
```bash
docker compose logs -f frontend
docker compose logs -f backend
```

---

## 🔄 Auto-Deploy dari GitHub (Server)

Server pengembangan ini menarik pembaruan otomatis dari GitHub **setiap 2 menit**.

- Skrip: `scripts/autodeploy.sh`
- Unit systemd: `pkm-autodeploy.timer` → memanggil `pkm-autodeploy.service`

Cara kerja: `git fetch` ringan → bila ada commit baru di `origin/main`, jalankan `git pull --ff-only`. Rebuild (`docker compose up -d --build`) hanya dilakukan bila perubahan menyentuh **`backend/`**, **`frontend/`**, atau **`docker-compose.yml`** — perubahan dokumen/skrip cukup di-pull tanpa rebuild. Bila tidak ada perubahan, skrip keluar seketika (beban nyaris nol).

Bila berkas dependensi berubah (`frontend/package.json`, `frontend/package-lock.json`, `backend/go.mod`, `backend/go.sum`), rebuild otomatis memakai `--renew-anon-volumes` agar `node_modules`/modul Go di dalam container ikut diperbarui (mencegah dependensi basi).

```bash
# Lihat jadwal & status timer
systemctl list-timers pkm-autodeploy.timer
systemctl status pkm-autodeploy.timer

# Picu deploy sekarang (tanpa menunggu jadwal)
sudo systemctl start pkm-autodeploy.service

# Pantau log deploy
journalctl -u pkm-autodeploy.service -f
```

Variabel lingkungan opsional: `PKM_REPO` (path repo), `PKM_BRANCH` (default `main`), `PKM_BUILD_PATTERN` (regex path pemicu rebuild), dan `FORCE=1` untuk memaksa rebuild walau tidak ada commit baru.

---

## 🔑 Akun Uji Coba Demo

Sistem dilengkapi pendeteksian otomatis peran pengguna saat login melalui formulir modal topbar:

| Peran Akun | Identitas Email | Kata Sandi | Akses Modul |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@pkm.unila.ac.id` | `admin123` | Panel Admin Konten & Master Data (`/#admin`) |
| **Dosen Pembimbing** | `dosen@pkm.unila.ac.id` | `dosen123` | Portal Bimbingan & Validasi (`/#dosen`) |
| **Reviewer Internal** | `reviewer@pkm.unila.ac.id` | `reviewer123` | Antrean & Scoring Proposal (`/#reviewer`) |
| **Mahasiswa** | `mahasiswa@pkm.unila.ac.id` | `mahasiswa123` | Portal Pengusulan Tim & Logbook |

*(Kredensial di atas hanya untuk lingkungan pengembangan lokal).*

---

## 🌐 Daftar Endpoint REST API Utama

| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Status server dan konektivitas database | Publik |
| `POST` | `/api/auth/login` | Login akun & penerbitan token JWT | Publik |
| `GET` | `/api/auth/me` | Informasi profil pengguna yang sedang login | Bearer Token |
| `GET` | `/api/content?type=news\|video\|gallery` | Daftar konten berita, video, atau foto galeri | Publik |
| `GET` | `/api/timeline` | Daftar agenda tahapan PKM per tahun | Publik |
| `GET` | `/api/pedoman` | Berkas dan tautan buku panduan PKM | Publik |
| `GET` | `/api/portfolio?year=&scheme=` | Arsip proposal didanai dengan filter tahun & skema | Publik |
| `GET` | `/api/stats` | Agregasi statistik usulan 10 skema PKM (`v_scheme_stats`) | Publik |
| `GET` | `/api/contact` | Informasi alamat dan kontak resmi lembaga | Publik |
| `POST` | `/api/feedback` | Pengiriman kritik, saran, atau pesan kontak | Publik |
| `GET` | `/api/proposals/track?q=` | Pelacakan status 5 tahap usulan publik via NPM/Nama | Publik |
| `GET` | `/api/student/dashboard` | Ringkasan usulan, timeline progres, tim & dosen mhs login | Khusus Mhs |
| `GET` | `/api/student/schemes` | Daftar 10 skema PKM aktif untuk pengajuan | Khusus Mhs |
| `GET` | `/api/student/supervisors` | Direktori dosen pembimbing Unila | Khusus Mhs |
| `GET` | `/api/student/students` | Direktori dinamis akun mahasiswa aktif untuk anggota tim | Khusus Mhs |
| `POST` | `/api/student/proposals` | Pengajuan proposal baru (multi-step, auto-provisioning mhs) | Khusus Mhs |
| `GET` | `/api/student/proposals/:id` | Detail lengkap usulan proposal mahasiswa | Khusus Mhs |
| `POST` | `/api/student/upload` | Unggah berkas dokumen proposal (PDF/DOCX) | Khusus Mhs |
| `GET/POST` | `/api/student/logbook` | Catatan harian logbook & riwayat progres tim | Khusus Mhs |
| `GET/POST` | `/api/student/notifications` | Notifikasi in-app real-time mahasiswa | Khusus Mhs |
| `GET/POST/PUT/DELETE` | `/api/admin/*` | Manajemen CRUD konten, timeline, pedoman, portofolio | Khusus Admin |
| `GET` | `/api/dosen/overview` | Ringkasan statistik dan kuota bimbingan dosen | Khusus Dosen |
| `GET` | `/api/dosen/requests` | Daftar permohonan bimbingan tim mahasiswa | Khusus Dosen |
| `GET` | `/api/dosen/proposals` | Daftar proposal yang sedang dibimbing | Khusus Dosen |
| `GET` | `/api/reviewer/overview` | Metrik penugasan dan status penilaian reviewer | Khusus Reviewer |
| `GET` | `/api/reviewer/assignments` | Daftar proposal yang ditugaskan untuk dinilai | Khusus Reviewer |
| `POST` | `/api/reviewer/reviews` | Input skor kriteria dan evaluasi kelayakan proposal | Khusus Reviewer |
| `GET/POST` | `/api/messages/*` | Pengiriman dan pengambilan riwayat pesan langsung | Dosen / Reviewer / Mhs |

---

## 📂 Struktur Direktori Proyek

```text
.
├── backend/                       # REST API Backend (Go 1.22 + Gin)
│   ├── cmd/api/                   # Titik masuk utama (routing, seeder, server)
│   ├── internal/
│   │   ├── config/                # Konfigurasi database & environment
│   │   ├── handlers/              # Controllers: auth, dosen, reviewer, pesan, admin, content
│   │   ├── middleware/            # Auth guard JWT & role-based validation
│   │   └── models/                # GORM Models PostgreSQL v2 (34 Tabel)
│   └── migrations/                # SQL DDL Migration scripts (0001, 0002)
├── frontend/                      # Web Single Page Application (React + Vite)
│   ├── public/                    # Favicon, lambang institusi, dan aset publik
│   └── src/
│       ├── components/            # Komponen reaktif: GlowCard, GlassFolder, PageIntro, TopNavbar
│       │   └── ui/                # Presentation atomic components (spotlight-card, glass-folder-cards)
│       ├── lib/                   # content.js (API client, fallback stats 321 proposal, helper)
│       ├── pages/                 # Home, News, Gallery, Pedoman, Portofolio, Kontak, AdminPanel, Dosen, Reviewer, Pesan
│       ├── ref.css                # Sistem Desain Neo-Glassmorphism resmi
│       └── styles.css             # Stylesheet pendukung dan utilitas modul
├── docs/                          # Knowledge Base & Dokumentasi Lengkap
│   ├── acuan-design-pkm-center.md # Standardisasi desain Neo-Glassmorphism (Bab 1–8)
│   ├── roadmap-fitur-dan-audit-database-2026-10-13.md # Audit 34 tabel & WBS 4 anggota tim
│   ├── laporan-eksekusi-desain-dan-fitur-2026-10-13.md # Laporan hasil eksekusi resmi (PIC: Vian)
│   ├── rencana-dinamisasi-data-riil-pkm-2026-10-13.md # Dinamisasi 321 proposal riil 2026
│   ├── revisi-struktur-db-pkm-center.md # Kamus tabel skema database v2
│   ├── integrasi-modul-dosen-reviewer-2026-10-13.md # Integrasi modul internal & pesan
│   ├── daftar-fitur-pkm-center-unila.md # Backlog fitur lengkap
│   ├── PKM UNILA 2026  - Sheet1.csv # Dataset riil 321 proposal Unila 2026
│   ├── pkm - Sheet1.csv           # Matriks kerja tim (Aidil, Vian, Radhit, Dimas)
│   └── UNTUK Nurkhawarizmi (1).xlsx # Master direktori dosen FT Unila
├── acuan-design-pkm-center.md     # Mirror acuan desain di root repository
├── docker-compose.yml             # Orkestrasi multi-container Docker
└── README.md                      # Dokumentasi utama & indeks navigasi repository
```

