# Rencana Awal Proyek PKM Center Unila

> Catatan: dokumen ini disusun sebagai rencana kerja awal. Sesuaikan bagian **Fitur** dan **Timeline** seiring progres.

---

## 1. Ringkasan Proyek

| Item | Keterangan |
|---|---|
| Nama Proyek | **PKM-Center** |
| Tujuan | Aplikasi web pusat informasi & manajemen Program Kreativitas Mahasiswa (PKM), frontend React + backend REST API Golang |
| Referensi Fitur | Struktur & konten sejenis [PKM Center ITNY](https://pkmcenter.itny.ac.id/pkm-sttnas/) |
| Referensi Identitas Visual | Statuta Universitas Lampung (Unila), BAB II Identitas, Pasal 2–5 |
| Target Deploy | Server Linux, menggunakan Docker & Docker Compose |
| Estimasi Durasi | *(isi, misal 4–8 minggu)* |

---

## 2. Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend | React (Vite) | SPA, fetch data via REST API |
| Backend | Golang + Gin | REST API, JWT auth |
| Database | PostgreSQL / MySQL | via GORM atau `sqlx` |
| Auth | JWT (`golang-jwt`) | Token-based, cocok untuk SPA |
| Containerization | Docker + Docker Compose | Multi-stage build, image kecil |
| Reverse Proxy | Nginx | Serve frontend build + proxy API |
| CI/CD (opsional) | GitHub Actions | Build & push image otomatis |

---

## 3. Identitas Visual & Palet Warna

Mengacu pada **Statuta Universitas Lampung (Unila), BAB II Identitas (Pasal 2–5)**.

### 3.1 Identitas Dasar Unila (Pasal 2)
| Item | Keterangan |
|---|---|
| Nama | Universitas Lampung (Unila) |
| Kedudukan | Kota Bandar Lampung, Provinsi Lampung |
| Berdiri | 23 September 1965, berdasarkan Keputusan Menteri PTIP No. 195 Tahun 1965, dikukuhkan Keppres RI No. 73 Tahun 1966 |

### 3.2 Lambang Unila (Pasal 3)
Lambang berbentuk **perisai persegi lima**, warna dasar **biru muda**, terdiri dari beberapa elemen dengan warna & makna masing-masing:

| Elemen | Warna | Kode RGB (Statuta) | Hex | Makna (Pasal 3 ayat 2) |
|---|---|---|---|---|
| Perisai persegi lima (dasar) | Biru muda | 1E 90 FF | `#1E90FF` | Alam kehidupan perguruan tinggi |
| Tulisan "Universitas Lampung" | Hitam | 00 00 00 | `#000000` | — |
| Lidah api | Merah | FF 00 00 | `#FF0000` | Penerang dalam kegelapan |
| Bejana penopang | Abu-abu | 2F 4F 4F | `#2F4F4F` | Penerang dalam kegelapan |
| Obor & tangkai | Hitam | 00 00 00 | `#000000` | Penerang dalam kegelapan |
| Mahkota siger | Kuning keemasan | FF D7 (00)* | `#FFD700` | Sifat harga diri |
| Pintu gerbang | Kuning keemasan | FF D7 (00)* | `#FFD700` | Tempat lahir & berkembang manusia terdidik |
| Buku terbuka | Kuning keemasan | FF D7 (00)* | `#FFD700` | Sumber ilmu pengetahuan, teknologi & seni |
| Meja pepadun | Kuning keemasan | FF D7 (00)* | `#FFD700` | Tempat bermusyawarah |
| Lima lembar daun lada | Hijau | 00 80 00 | `#008000` | Kemakmuran |

> \* Kode RGB "kuning keemasan" di teks statuta konsisten tertulis terpotong ("FF D7") di **empat elemen berbeda** (mahkota siger, pintu gerbang, buku terbuka, meja pepadun) — pola ini kemungkinan besar karena proses ekstraksi/OCR dokumen yang membuang byte terakhir. Nilai penuh yang paling mendekati adalah **`#FFD700` (Gold)**. Tetap disarankan dikonfirmasi ke dokumen statuta resmi/lambang asli sebelum dipakai final di branding.

### 3.3 Bendera Unila (Pasal 4)
- Bentuk persegi panjang, rasio panjang : lebar = **3 : 2**
- Warna dasar: **kuning keemasan** (`#FFD700`, dengan catatan yang sama seperti di atas)
- Di tengah terdapat lambang Unila (lihat 3.2)

### 3.4 Warna Aksen per Fakultas & Pascasarjana (Pasal 5) — opsional, untuk badge/kategori/filter
| Fakultas / Unit | Warna | Kode RGB (Statuta) | Hex |
|---|---|---|---|
| Ekonomi dan Bisnis | Abu-abu | 2F 4F 4F | `#2F4F4F` |
| Hukum | Merah | FF 00 00 | `#FF0000` |
| Keguruan dan Ilmu Pendidikan (FKIP) | Ungu | 80 00 80 | `#800080` |
| Pertanian | Hijau | 00 80 00 | `#008000` |
| Teknik | Biru tua | 00 00 8B | `#00008B` |
| Ilmu Sosial dan Ilmu Politik (FISIP) | Jingga | FF A5 00 | `#FFA500` |
| Matematika dan IPA (MIPA) | Biru laut | 00 00 80 | `#000080` |
| Kedokteran | Hijau lumut | 00 64 00 | `#006400` |
| Pascasarjana | Merah marun | 8B 00 00 | `#8B0000` |
| Teks label (semua fakultas) | Hitam | 00 00 00 | `#000000` |

> Catatan: kode abu-abu Fakultas Ekonomi & Bisnis di statuta tertulis "2F 4F 4F D7" — ekor "D7" ini kemungkinan artefak salah tempel dari baris kuning keemasan di dekatnya (bukan bagian warna abu-abu), sehingga tabel di atas memakai `#2F4F4F` (DarkSlateGray) sebagai nilai bersih.

### 3.5 Rekomendasi Penerapan di UI
- **Primary color (navbar, tombol utama, aksen brand):** `#FFD700` (kuning keemasan Unila)
- **Secondary/aksen struktural (opsional, dari elemen lambang):** `#1E90FF` (biru muda perisai)
- **Text/neutral:** `#000000` (hitam) untuk teks, `#FFFFFF` untuk background/kontras
- **Warna fakultas** dipakai sebagai *tag/badge* saat menampilkan proposal/kegiatan PKM per fakultas
- Simpan sebagai CSS variables / Tailwind config di frontend, misalnya:
  ```css
  :root {
    --color-primary: #FFD700;   /* kuning keemasan Unila */
    --color-secondary: #1E90FF; /* biru muda lambang */
    --color-text: #000000;
    --faculty-ekonomi: #2F4F4F;
    --faculty-hukum: #FF0000;
    --faculty-fkip: #800080;
    --faculty-pertanian: #008000;
    --faculty-teknik: #00008B;
    --faculty-fisip: #FFA500;
    --faculty-mipa: #000080;
    --faculty-kedokteran: #006400;
    --faculty-pascasarjana: #8B0000;
  }
  ```

---

## 4. Fitur Awal (MVP)

Mengacu pada struktur menu **PKM Center ITNY** yang dijadikan referensi sebelumnya:

| Fitur | Deskripsi | Prioritas |
|---|---|---|
| **Home** | Landing page, ringkasan info PKM terbaru | Tinggi |
| **About PKM** | Halaman statis: penjelasan PKM, sejarah, jenis-jenis PKM | Tinggi |
| **Timeline PKM** | Jadwal/tahapan PKM per tahun (submit, review, pengumuman, PIMNAS) | Tinggi |
| **Pedoman PKM** | Halaman unduh dokumen panduan PKM (PDF) | Tinggi |
| **Berita & Gallery** | Daftar berita/kegiatan + galeri foto/video | Sedang |
| **Portfolio** | Arsip proposal/kegiatan PKM yang lolos pendanaan per tahun | Sedang |
| **Contact** | Info kontak PKM Center | Rendah |

> Untuk pembagian halaman & PIC pengerjaan tahap awal, lihat `pembagian-awal-halaman.md`. Untuk fitur admin & lanjutan, lihat `daftar-fitur-pkm-center-unila.md`.

---

## 5. Struktur Folder Proyek

```
project/
├── backend/
│   ├── main.go
│   ├── go.mod / go.sum
│   ├── internal/
│   │   ├── handlers/      # HTTP handler per fitur
│   │   ├── models/        # Struct data & GORM model
│   │   ├── routes/        # Definisi routing
│   │   ├── middleware/    # Auth, CORS, logging
│   │   └── config/        # Koneksi DB, env config
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/       # axios/fetch API calls
│   │   ├── styles/          # palet warna / theme (lihat bagian 3)
│   │   └── App.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## 6. Tahapan Pengerjaan (Fase)

### Fase 1 — Persiapan & Desain (Minggu 1)
- [ ] Finalisasi ruang lingkup fitur (lihat bagian 4) & user flow
- [ ] Rancang ERD / struktur database (berita, timeline, portfolio, pedoman/file, kontak)
- [ ] Rancang wireframe/UI dasar dengan palet warna Unila (bagian 3)
- [ ] Setup repository Git (backend, frontend, atau monorepo)

### Fase 2 — Setup Environment (Minggu 1–2)
- [ ] Inisialisasi project Golang (`go mod init`) + Gin
- [ ] Inisialisasi project React (Vite) + setup theme warna (CSS variables)
- [ ] Setup Docker & Docker Compose untuk development
- [ ] Setup database (migration awal)
- [ ] Setup CORS & koneksi dasar frontend ↔ backend (uji endpoint `/health`)

### Fase 3 — Backend Development (Minggu 2–4)
- [ ] Desain skema database & model (GORM): berita, timeline, pedoman, portfolio, kontak
- [ ] Implementasi autentikasi admin (JWT) untuk kelola konten
- [ ] Implementasi endpoint CRUD tiap fitur (berita, timeline, pedoman, portfolio)
- [ ] Middleware: auth guard, validasi input, error handling
- [ ] Unit testing untuk handler/service penting

### Fase 4 — Frontend Development (Minggu 3–5, paralel dengan backend)
- [ ] Setup routing (React Router): Home, About, Timeline, Pedoman, Berita & Gallery, Portfolio, Contact
- [ ] Setup state management (Context API / Zustand, sesuai kebutuhan)
- [ ] Buat service layer untuk konsumsi API (axios instance)
- [ ] Implementasi halaman publik sesuai fitur MVP
- [ ] Implementasi dashboard admin sederhana (kelola berita/timeline/pedoman)

### Fase 5 — Integrasi & Testing (Minggu 5–6)
- [ ] Integrasi penuh frontend ↔ backend
- [ ] Testing manual seluruh alur (happy path & edge case)
- [ ] Perbaikan bug hasil testing
- [ ] Load testing dasar (opsional)

### Fase 6 — Dockerisasi & Deployment (Minggu 6–7)
- [ ] Buat Dockerfile production (multi-stage) untuk backend & frontend
- [ ] Setup `docker-compose.yml` untuk production (backend, frontend, db, nginx)
- [ ] Setup Nginx sebagai reverse proxy (satu domain/port untuk FE+BE)
- [ ] Setup environment variable production (`.env.production`)
- [ ] Deploy ke server Linux, uji berjalan via domain/IP server

### Fase 7 — Finalisasi & Dokumentasi (Minggu 7–8)
- [ ] Tulis dokumentasi API (Swagger/Postman collection)
- [ ] Tulis README (cara install, run, deploy)
- [ ] Review keamanan dasar (validasi input, rate limiting, HTTPS)
- [ ] Serah terima / demo ke pengguna

---

## 7. Rencana Arsitektur Deployment (Docker)

```
                ┌─────────────────────┐
   Internet --> │  Nginx (reverse     │
                │  proxy, port 80/443)│
                └─────┬─────────┬─────┘
                      │         │
             /api/*   │         │  /*
                      ▼         ▼
          ┌────────────────┐ ┌──────────────────┐
          │ Golang Backend │ │ React (static     │
          │ (container)    │ │ build, served     │
          │ port 8080      │ │ by nginx/serve)   │
          └───────┬────────┘ └──────────────────┘
                  │
                  ▼
          ┌────────────────┐
          │ PostgreSQL/     │
          │ MySQL (container)│
          └────────────────┘
```

---

## 8. Checklist Keamanan Dasar
- [ ] Semua endpoint sensitif (admin) pakai auth middleware (JWT verify)
- [ ] Validasi & sanitasi input di backend
- [ ] Gunakan HTTPS di production (Let's Encrypt via Nginx/Certbot)
- [ ] Environment variable (DB password, JWT secret) tidak di-hardcode / tidak masuk Git
- [ ] Rate limiting untuk endpoint login (hindari brute force)
- [ ] CORS dikonfigurasi hanya untuk origin yang diizinkan

---

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Belum familiar Golang | Alokasikan waktu belajar di awal fase 2, mulai dari endpoint sederhana |
| Kode warna kuning keemasan di statuta tidak lengkap (`FF D7`) di beberapa elemen lambang | Konfirmasi ke lambang/statuta resmi Unila atau bagian Humas sebelum branding final; sementara pakai `#FFD700` |
| Struktur folder Go berantakan seiring project besar | Ikuti pola `internal/` (handlers, models, routes) sejak awal |
| Docker image besar/lambat build | Gunakan multi-stage build & base image alpine/scratch |
| Koneksi FE-BE gagal (CORS) | Setup CORS middleware di awal, uji sejak Fase 2 |

---

## 10. Catatan Tambahan
- Dokumen ini bisa diperbarui seiring progres — tandai checklist yang sudah selesai.
- Warna aksen fakultas (bagian 3.4) bersifat opsional — dipakai hanya jika PKM-Center menampilkan data per fakultas (misal filter proposal berdasarkan fakultas pengusul).
- Dokumen terkait: `pembagian-awal-halaman.md` (PIC & checklist per halaman), `daftar-fitur-pkm-center-unila.md` (fitur admin & lanjutan).