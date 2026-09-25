# PKM Center Unila

Frontend awal untuk **PKM Center Universitas Lampung**. Proyek ini menyediakan ruang informasi publik PKM, tampilan berita dan galeri, serta fondasi autentikasi berbasis peran untuk admin, mahasiswa, dan dosen.

Stack berjalan sepenuhnya melalui Docker Compose:

- Frontend: React + Vite
- Backend: Go + Gin + GORM
- Database: PostgreSQL 16
- Autentikasi: JWT

## Yang sudah tersedia

- Landing page PKM Center dengan identitas visual Unila.
- Logo PKM Center di header dan favicon (ikon pada tab browser).
- Halaman berita dengan pagination dan **gambar sampul nyata**: `/#berita`.
- Halaman detail artikel berisi judul, tanggal (format Indonesia), kategori, gambar, dan isi paragraf; ada halaman *"berita tidak ditemukan"* untuk URL yang tidak valid: `/#berita/1`.
- Halaman video dan galeri foto dengan lightbox (navigasi tombol Sebelumnya/Berikutnya + keyboard `Esc`/panah): `/#galeri`.
- Login JWT dan role `admin`, `mahasiswa`, serta `dosen`.
- Panel admin untuk menambah, mengubah, dan menghapus konten berita, video, dan galeri: `/#admin`.
- Endpoint khusus admin sebagai contoh otorisasi role.
- Migrasi tabel dan seed otomatis: **9 berita, 8 foto galeri, 3 video, dan 3 akun demo** — *upsert non-destruktif*, jadi konten yang pernah diubah/ditambah lewat panel admin tidak tertimpa saat backend dinyalakan ulang.
- PostgreSQL dengan volume Docker persisten.

> Konten berita, video, dan galeri saat ini merupakan **data contoh** — termasuk gambar placeholder dari Unsplash — bukan pengumuman resmi Unila. Seluruh konten dapat diubah, ditambah, atau dihapus lewat panel admin di `/#admin` (login sebagai `admin`, lihat akun demo di bawah).

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
| `GET` | `/api/admin/content` | Daftar semua konten (khusus `admin`) |
| `POST` | `/api/admin/content` | Tambah konten (khusus `admin`) |
| `PUT` | `/api/admin/content/:id` | Ubah konten (khusus `admin`) |
| `DELETE` | `/api/admin/content/:id` | Hapus konten (khusus `admin`) |
| `GET` | `/api/admin/overview` | Contoh endpoint khusus `admin` |

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
│   └── internal/            # config, handler, middleware, model
├── frontend/                # React + Vite
│   ├── public/              # favicon dan aset logo
│   └── src/
│       ├── components/      # GlassNavbar, GlowCard, PageIntro
│       ├── lib/             # data fallback, hook useContent, helper format
│       ├── pages/           # News (berita), Gallery (video + galeri foto)
│       └── main.jsx         # shell aplikasi: routing hash, Home, Admin, Login
├── docker-compose.yml       # frontend, backend, dan PostgreSQL
├── pembagian-awal-halaman.md
├── daftar-fitur-pkm-center-unila.md
└── rencana-awal-proyek-pkm-center-unila.md
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
- [Pembagian awal halaman](pembagian-awal-halaman.md): pembagian PIC dan checklist pengerjaan; bagian Berita & Galeri sudah ditandai selesai untuk UI awal.
- [Daftar fitur](daftar-fitur-pkm-center-unila.md): backlog fitur proyek.

## Tahap berikutnya

1. Ganti konten contoh (termasuk gambar placeholder Unsplash) dengan data dan dokumentasi PKM Center yang telah diverifikasi.
2. Perluas panel admin: CRUD timeline PKM, pedoman (upload PDF), portofolio, dan kelola masukan kritik & saran.
3. Lengkapi halaman publik yang belum ada: Home penuh (statistik per skema PKM, form kritik & saran), Pedoman, Portofolio, dan Kontak.
4. Pindahkan kata sandi, database URL, dan JWT secret ke `.env` yang tidak dilacak Git.
5. Tambahkan rate limiting login, reset kata sandi, pengujian API, dan konfigurasi production (Nginx/HTTPS).
6. Fitur lanjutan (opsional): login mahasiswa, submit & tracking status proposal, dashboard reviewer/dosen, serta notifikasi.

## Catatan keamanan

Konfigurasi saat ini diperuntukkan bagi development. Jangan memakai kata sandi demo, `JWT_SECRET` bawaan, atau password database yang ada di `docker-compose.yml` pada server production.
