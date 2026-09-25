# PKM Center Unila

Frontend awal untuk **PKM Center Universitas Lampung**. Proyek ini menyediakan ruang informasi publik PKM, tampilan berita dan galeri, serta fondasi autentikasi berbasis peran untuk admin, mahasiswa, dan dosen.

Stack berjalan sepenuhnya melalui Docker Compose:

- Frontend: React + Vite
- Backend: Go + Gin + GORM
- Database: PostgreSQL 16
- Autentikasi: JWT

## Yang sudah tersedia

- **Beranda lengkap** (`/#beranda`): hero, statistik usulan per skema PKM, layanan "Apa yang Kami Lakukan", daftar jenis skema PKM, preview berita & galeri, timeline PKM per tahun (tahapan submit → review → pengumuman → PIMNAS), dan form Kritik & Saran.
- **Pedoman PKM** (`/#pedoman`): daftar dokumen per tahun + pencarian + tombol unduh (tautan resmi).
- **Portofolio** (`/#portofolio`): arsip proposal lolos pendanaan, filter tahun (chip) & skema, ringkasan per proposal.
- **Kontak** (`/#kontak`): info kontak, peta lokasi (embed), dan form pesan.
- **Berita** dengan pagination dan gambar sampul nyata: `/#berita`.
- Halaman detail artikel (`/#berita/1`) + halaman "berita tidak ditemukan" untuk URL tidak valid.
- **Video & galeri foto** dengan lightbox (tombol Sebelumnya/Berikutnya + keyboard `Esc`/panah): `/#galeri`.
- Navigasi **"⋯ Lainnya"** di navbar (Pedoman, Portofolio, Kontak) + breadcrumb di halaman tersebut.
- Login JWT dengan role `admin`, `mahasiswa`, dan `dosen`.
- **Panel admin** (`/#admin`) dengan **7 seksi**: Konten (berita/video/galeri), Timeline, Pedoman, Portofolio, Masukan (Kritik & Saran + pesan kontak), Statistik, dan Kontak.
- Migrasi tabel dan seed otomatis: **21 tahapan timeline, 4 pedoman, 10 proposal portofolio, 9 skema statistik, info kontak, 2 contoh masukan, 9 berita, 8 foto galeri, 3 video, dan 3 akun demo** — *upsert non-destruktif*, jadi konten yang pernah diubah/ditambah lewat panel admin tidak tertimpa saat backend dinyalakan ulang.
- PostgreSQL dengan volume Docker persisten.

> Konten berita, video, galeri, dan portofolio saat ini merupakan **data contoh** — termasuk gambar placeholder dari Unsplash — bukan pengumuman resmi Unila. Seluruh konten dapat diubah, ditambah, atau dihapus lewat panel admin di `/#admin` (login sebagai `admin`, lihat akun demo di bawah).

## Menjalankan secara lokal

Prasyarat: [Docker Desktop](https://www.docker.com/products/docker-desktop/) harus aktif.

```bash
docker compose up --build
```

Untuk menjalankan di background:

```bash
docker compose up --build -d
```

| Layanan | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8081 |
| Health check API | http://localhost:8081/health |

Port host API menggunakan `8081` karena `8080` dapat saja telah dipakai proses lain. Di dalam jaringan Docker, backend tetap berjalan pada port `8080`.

Untuk menghentikan layanan tanpa menghapus data PostgreSQL:

```bash
docker compose down
```

Untuk melihat log:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | `admin@pkm.unila.ac.id` | `admin123` |
| Mahasiswa | `mahasiswa@pkm.unila.ac.id` | `mahasiswa123` |
| Dosen | `dosen@pkm.unila.ac.id` | `dosen123` |

Gunakan hanya untuk development. Ganti semua kredensial dan `JWT_SECRET` sebelum aplikasi dipublikasikan.

## API saat ini

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/health` | Status API |
| `POST` | `/api/auth/login` | Login dan menerima token JWT |
| `GET` | `/api/auth/me` | Profil token aktif; butuh header `Authorization: Bearer <token>` |
| `GET` | `/api/content?type=news\|video\|gallery` | Daftar konten publik per jenis (berita, video, galeri) |
| `GET` | `/api/content/:id` | Detail satu konten publik |
| `GET` | `/api/timeline` | Timeline PKM per tahun (publik) |
| `GET` | `/api/pedoman` | Daftar pedoman PKM (publik) |
| `GET` | `/api/portfolio?year=&scheme=` | Arsip proposal lolos pendanaan, filter opsional (publik) |
| `GET` | `/api/stats` | Jumlah usulan per skema PKM (publik) |
| `GET` | `/api/contact` | Informasi kontak PKM Center (publik) |
| `POST` | `/api/feedback` | Kirim Kritik & Saran (`kind: "saran"`) atau pesan kontak (`kind: "kontak"`) |
| `GET` | `/api/admin/content` | Daftar semua konten (khusus `admin`) |
| `POST` | `/api/admin/content` | Tambah konten (khusus `admin`) |
| `PUT` | `/api/admin/content/:id` | Ubah konten (khusus `admin`) |
| `DELETE` | `/api/admin/content/:id` | Hapus konten (khusus `admin`) |
| `GET/POST/PUT/DELETE` | `/api/admin/timeline[/:id]` | CRUD timeline (khusus `admin`) |
| `GET/POST/PUT/DELETE` | `/api/admin/pedoman[/:id]` | CRUD pedoman (khusus `admin`) |
| `GET/POST/PUT/DELETE` | `/api/admin/portfolio[/:id]` | CRUD portofolio (khusus `admin`) |
| `GET` | `/api/admin/feedback` | Daftar masukan (khusus `admin`) |
| `PUT` | `/api/admin/feedback/:id/read` | Tandai masukan sudah dibaca (khusus `admin`) |
| `DELETE` | `/api/admin/feedback/:id` | Hapus masukan (khusus `admin`) |
| `GET/PUT` | `/api/admin/stats` | Lihat & perbarui statistik per skema (khusus `admin`) |
| `GET/PUT` | `/api/admin/contact` | Lihat & perbarui info kontak (khusus `admin`) |

Contoh login melalui terminal:

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@pkm.unila.ac.id","password":"admin123"}'
```

## Struktur proyek

```text
.
├── backend/                 # REST API Go/Gin
│   ├── cmd/api/             # titik masuk aplikasi (routing + seed data)
│   │   └── main.go
│   └── internal/
│       ├── config/          # koneksi DB, env config
│       ├── handlers/        # auth, content, info (timeline/pedoman/portfolio), feedback (masukan/stats/kontak)
│       ├── middleware/      # auth guard (JWT)
│       └── models/          # user, content, info (grup model baru)
├── frontend/                # React + Vite
│   ├── public/              # favicon dan aset logo
│   └── src/
│       ├── components/      # GlassNavbar, GlowCard, PageIntro, Breadcrumb
│       ├── lib/             # content.js: fallback data + hook API (useContent, useTimeline, usePedoman, …)
│       ├── pages/           # Home, News, Gallery, Pedoman, Portofolio, Kontak, AdminPanel
│       └── main.jsx         # shell aplikasi: hash routing + login
├── docker-compose.yml       # frontend, backend, dan PostgreSQL
├── pembagian-awal-halaman.md
├── daftar-fitur-pkm-center-unila.md
├── rencana-awal-proyek-pkm-center-unila.md
└── acuan-design-pkm-center.md
```

## Identitas visual

Pedoman identitas lengkap ada di [rencana awal proyek](rencana-awal-proyek-pkm-center-unila.md), yang mengacu pada **Statuta Unila BAB II Identitas (Pasal 2–5)**. Aplikasi menggunakan:

| Peran UI | Warna | Kode |
|---|---|---|
| Primary / aksen brand | Kuning keemasan Unila | `#FFD700` |
| Secondary / aksen struktural | Biru muda perisai lambang | `#1E90FF` |
| Teks utama | Hitam | `#000000` |
| Aksen simbolik | Merah lidah api | `#FF0000` |
| Aksen simbolik | Hijau daun lada | `#008000` |

Warna fakultas dan pascasarjana—abu-abu FEB, merah FH, ungu FKIP, hijau Pertanian, biru tua Teknik, jingga FISIP, biru laut MIPA, hijau lumut Kedokteran, dan merah marun Pascasarjana—bersifat opsional. Gunakan untuk badge, kategori, atau filter data berdasarkan fakultas.

> Pada kutipan Statuta, kode kuning keemasan tertulis `FF D7` pada empat elemen lambang serta bendera Unila. Komponen RGB ketiga tidak tampak akibat ekstraksi/OCR; `#FFD700` adalah nilai Gold yang paling mendekati dan digunakan sebagai nilai kerja. Konfirmasi ke berkas lambang resmi atau Peraturan Rektor diperlukan sebelum branding/cetak final.

## Dokumen kerja

- [Rencana awal proyek](rencana-awal-proyek-pkm-center-unila.md): scope, stack, fase, dan pedoman visual.
- [Pembagian awal halaman](pembagian-awal-halaman.md): pembagian PIC dan checklist pengerjaan — seluruh bagian (Home, Pedoman + Portofolio, Berita & Galeri, Kontak + Login) sudah selesai dan ditandai centang.
- [Daftar fitur](daftar-fitur-pkm-center-unila.md): backlog fitur proyek (admin CRUD & fitur lanjutan).
- [Acuan desain](acuan-design-pkm-center.md): bahasa visual & komponen UI yang dipakai di seluruh halaman.

## Tahap berikutnya

1. Ganti konten contoh (termasuk gambar placeholder Unsplash) dengan data dan dokumentasi PKM Center yang telah diverifikasi.
2. Pindahkan kata sandi, database URL, dan JWT secret ke `.env` yang tidak dilacak Git.
3. Tambahkan rate limiting login, reset kata sandi, pengujian API (unit test), dan konfigurasi production (Nginx/HTTPS).
4. Fitur lanjutan (opsional): login mahasiswa, submit & tracking status proposal, dashboard reviewer/dosen, serta notifikasi.

## Catatan keamanan

Konfigurasi saat ini diperuntukkan bagi development. Jangan memakai kata sandi demo, `JWT_SECRET` bawaan, atau password database yang ada di `docker-compose.yml` pada server production.
