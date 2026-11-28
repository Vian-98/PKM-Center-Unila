# PKM Center Unila

Portal digital resmi **Pusat Kreativitas Mahasiswa Universitas Lampung (PKM Center Unila)** untuk mendukung ekosistem Program Kreativitas Mahasiswa (PKM) — mulai dari pengembangan gagasan, pembentukan tim lintas fakultas, bimbingan dosen, hingga seleksi internal menuju PIMNAS.

🌐 **Portal Web:** [https://pkm.makroboi.site](https://pkm.makroboi.site)

---

## Ringkasan Fitur

### Portal Publik
- **Beranda & Timeline PKM:** Informasi ekosistem PKM Center Unila, statistik partisipasi, serta jadwal tahapan seleksi resmi.
- **Pedoman & Format Usulan:** Direktori buku panduan PKM SIMBELMAWA, ringkasan sistematika penulisan, ketentuan RAB, template lampiran, dan arsip contoh proposal.
- **Berita, Portofolio & Galeri:** Kabar terkini, dokumentasi kegiatan, serta rekam jejak karya mahasiswa Universitas Lampung.
- **Kontak & Masukan:** Informasi lokasi sekretariat dan formulir pertanyaan atau saran.

### Layanan Pengguna Terdaftar
- **Portal Mahasiswa:** Uji ide berbasis AI (**PKMATE**), pencarian rekan tim multidisiplin dan dosen pembimbing, pengajuan proposal, catatan logbook, serta pemantauan status usulan.
- **Portal Dosen Pembimbing:** Pengelolaan permohonan bimbingan, pemantauan progres tim, dan catatan sesi bimbingan.
- **Portal Reviewer:** Antrean penugasan penilaian ide maupun proposal lengkap dengan rubrik evaluasi.
- **Pusat Pesan & Administrasi:** Komunikasi antarperan serta pengelolaan konten, periode, berita, dan verifikasi akun oleh pengelola.

---

## Teknologi Utama

- **Frontend:** React + Vite
- **Backend:** Go + Gin + GORM
- **Database:** PostgreSQL
- **Kontainer:** Docker Compose

---

## Struktur Direktori

```text
.
├── frontend/            # Aplikasi web antarmuka pengguna (React + Vite)
├── backend/             # Layanan REST API dan migrasi basis data (Go)
├── 9router-app/         # Layanan gateway integrasi asisten AI
├── docs/                # Dokumentasi pengembangan dan referensi PKM
└── docker-compose.yml   # Konfigurasi menjalankan layanan dengan Docker
```

---

## Menjalankan di Lingkungan Lokal

Pastikan **Docker Desktop** sudah terpasang dan berjalan, lalu jalankan perintah berikut dari direktori utama proyek:

```bash
# Bangun dan jalankan seluruh layanan
docker compose up -d --build
```

Setelah container aktif, antarmuka web dapat diakses melalui:

- **Web Aplikasi:** `http://localhost:5173`

Untuk menghentikan seluruh layanan:

```bash
docker compose down
```

---

## Kontak Lembaga

**PKM Center Universitas Lampung**  
Gedung Rektorat Universitas Lampung  
Jl. Prof. Dr. Soemantri Brojonegoro No. 1, Gedong Meneng, Bandar Lampung 35145  
Email: `pkmcenter@unila.ac.id`
