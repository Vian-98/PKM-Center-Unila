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
- Halaman berita dengan pagination: `/#berita`.
- Halaman detail artikel: `/#berita/1`.
- Halaman video dan galeri dengan lightbox: `/#galeri`.
- Login JWT dan role `admin`, `mahasiswa`, serta `dosen`.
- Endpoint khusus admin sebagai contoh otorisasi role.
- Migrasi tabel pengguna dan seed tiga akun demo saat backend pertama kali menyala.
- PostgreSQL dengan volume Docker persisten.

> Konten berita, video, dan galeri saat ini merupakan data contoh UI—bukan pengumuman resmi Unila. Halaman tersebut disiapkan agar nantinya dapat dihubungkan ke CMS/dashboard admin.

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
│   ├── cmd/api/             # titik masuk aplikasi
│   └── internal/            # config, handler, middleware, model
├── frontend/                # React + Vite
│   ├── public/              # favicon dan aset logo
│   └── src/                 # halaman, routing hash, stylesheet
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

1. Ganti konten contoh dengan data dan dokumentasi PKM Center yang telah diverifikasi.
2. Tambahkan model dan endpoint CRUD untuk berita, video, serta galeri.
3. Buat dashboard admin untuk mengelola konten tersebut.
4. Pindahkan kata sandi, database URL, dan JWT secret ke `.env` yang tidak dilacak Git.
5. Tambahkan rate limiting login, reset kata sandi, pengujian API, dan konfigurasi production (Nginx/HTTPS).

## Catatan keamanan

Konfigurasi saat ini diperuntukkan bagi development. Jangan memakai kata sandi demo, `JWT_SECRET` bawaan, atau password database yang ada di `docker-compose.yml` pada server production.
