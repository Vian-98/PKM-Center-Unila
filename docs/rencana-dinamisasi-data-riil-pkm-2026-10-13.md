# Rencana Dinamisasi Data Riil PKM Unila 2026
*(Integrasi Dataset Rekap PKM 2026 & Master Dosen FT Unila)*

> **Tanggal Pembaruan:** 13 Oktober 2026  
> **Penyusun / Penanggung Jawab (PIC):** Vian  
> **Status Dokumen:** 🟡 **Dalam Perencanaan & Analisis (Fase 1 Siap Eksekusi)**  
> **Referensi Sumber Data:**
> 1. `docs/PKM UNILA 2026  - Sheet1.csv` (Rekap Pengajuan 321 Proposal PKM Unila 2026)
> 2. `docs/UNTUK Nurkhawarizmi (1).xlsx` (Master Data Dosen & Tendik FT Unila per Jurusan)

---

## 1. Ringkasan Eksekutif & Status Saat Ini

Saat ini, aplikasi web PKM-Center Unila telah memiliki antarmuka yang lengkap dan modern (Beranda, Pedoman interaktif, Galeri, Berita, Portofolio, Panel Admin, Dashboard Dosen, Dashboard Reviewer, dan Pesan). Namun, **data operasional yang tampil di sistem saat ini masih berupa data mock/dummy** (misalnya: counter statistik di Beranda masih bernilai fiktif 438 proposal, seeder database masih men-generate proposal acak, dan antrean review dosen belum memuat data mahasiswa aslinya).

Ditemukannya dua file data riil di folder `docs/` memberikan peluang besar untuk **mengubah sistem PKM-Center dari sekadar prototipe UI menjadi sistem operasional yang 100% dinamis dan valid** berbasis data pengajuan tahun aktif 2026.

---

## 2. Analisis & Temuan Data Riil

### 2.1 File: `PKM UNILA 2026 - Sheet1.csv`
Dataset ini memuat **321 data pengajuan proposal mahasiswa aktif Unila tahun 2026** dengan struktur atribut lengkap:
* **Entitas Mahasiswa:** Nama Lengkap Ketua, NPM, Program Studi/Jurusan, dan Fakultas.
* **Entitas Usulan:** Judul Proposal, Bidang/Skema PKM, dan Tautan Draft Dokumen Google Drive.
* **Entitas Dosen Pembimbing:** Nama Dosen Pembimbing & NUPTK/NIP (total **168 dosen pembimbing unik**).
* **Entitas Reviewer:** Penugasan Reviewer 1 & Reviewer 2 (total **23 reviewer internal unik**), dilengkapi tautan Google Forms penilaian per skema.

#### A. Sebaran Riil per Skema PKM (Total: 321 Proposal)
| Skema PKM | Jumlah Usulan | Persentase | Kategori Bidang |
|---|---|---|---|
| **PKM-K** | **115** | 35.8% | Kewirausahaan |
| **PKM-RE** | **58** | 18.1% | Riset Eksakta |
| **PKM-RSH** | **41** | 12.8% | Riset Sosial Humaniora |
| **PKM-PM** | **32** | 10.0% | Pengabdian Masyarakat |
| **PKM-KC** | **28** | 8.7% | Karsa Cipta |
| **PKM-AI** | **15** | 4.7% | Artikel Ilmiah |
| **PKM-GFT** | **13** | 4.0% | Gagasan Futuristik Tertulis |
| **PKM-KI** | **7** | 2.2% | Karya Inovatif |
| **PKM-VGK** | **6** | 1.9% | Video Gagasan Konstruktif |
| **PKM-PI** | **3** | 0.9% | Penerapan Iptek |

#### B. Sebaran Riil per Fakultas (Total: 8 Fakultas Unila)
| Fakultas | Jumlah Usulan | Warna Statuta Unila | Aksen Badge Hex |
|---|---|---|---|
| **FKIP** | 71 proposal | Ungu | `#800080` |
| **FISIP** | 65 proposal | Jingga | `#FFA500` |
| **FAPERTA** | 64 proposal | Hijau | `#008000` |
| **FT** | 50 proposal | Biru Tua | `#00008B` |
| **FMIPA** | 34 proposal | Biru Laut | `#000080` |
| **FEB** | 16 proposal | Abu-abu | `#2F4F4F` |
| **FK** | 10 proposal | Hijau Lumut | `#006400` |
| **FH** | 8 proposal | Merah | `#FF0000` |

### 2.2 File: `UNTUK Nurkhawarizmi (1).xlsx`
Memuat master direktori Tenaga Pendidik (Dosen) dan Tenaga Kependidikan (Tendik) Fakultas Teknik Unila per jurusan:
* **7 Jurusan FT:** Teknik Sipil (53 dosen), Teknik Kimia (24 dosen), Teknik Mesin, Teknik Elektro (63 dosen), Teknik Geofisika, Teknik Geodesi & Geomatika, dan Arsitektur.
* Memuat nama lengkap dengan gelar resmi dan NIP 18 digit standar BKN/Kemdikbud.
* Terhubung langsung dengan nama reviewer dan pembimbing di CSV (misal: *Muhammad Nur Khawarizmi, S.Si., M.T.*, *Hadi Prayitno, S.T., M.T.*, *Prof. Chatarina Niken*, *Darmansyah, Ph.D.*, dll).

---

## 3. Matriks Status Saat Ini vs. Target Dinamisasi

| Komponen / Modul | Status Saat Ini | Status Target | Keterangan Rencana |
|---|---|---|---|
| **StatsBar Beranda** | ⚠️ Statis (438/127/64/18) | 🟢 Dinamis & Valid | Tampilkan angka riil 2026: 321 Proposal, 168 Dosen Pembimbing, 23 Reviewer, 8 Fakultas. |
| **Statistik per Skema** | ⚠️ Mock acak | 🟢 Agregasi Riil | Sinkronkan ke 10 skema riil (PKM-K: 115 s.d. PKM-PI: 3) di `content.js` dan endpoint `/api/stats`. |
| **Seeder Database** | ⚠️ Random loop 426 usulan | 🟢 Parser CSV Riil | Ingest 321 judul proposal asli, ketua, NPM, prodi, dan link draft ke database PostgreSQL. |
| **Dashboard Dosen** | 🟡 UI siap, data generic | 🟢 Terhubung Mahasiswa Riil | Dosen (168 orang) melihat daftar mahasiswa bimbingan aslinya sesuai CSV. |
| **Dashboard Reviewer** | 🟡 UI siap, antrean mock | 🟢 Terhubung Antrean Riil | 23 Reviewer melihat daftar proposal yang ditugaskan padanya (Reviewer 1 & 2). |
| **Pelacakan Usulan (Publik)** | 🔴 Belum tersedia | 🟢 Widget Cek Proposal | Mahasiswa bisa mencari usulannya via input NPM / Nama untuk melihat status penugasan reviewer. |
| **Filter Fakultas Portofolio** | 🟡 Baru filter tahun & skema | 🟢 Filter 8 Fakultas | Tambahkan chip filter fakultas berpalet warna Statuta Unila. |

---

## 4. Rencana Kerja & Roadmap ke Depan (Roadmap Dinamisasi)

Rencana implementasi dibagi menjadi 4 tahap terukur:

### 🔹 Tahap 1: Sinkronisasi Frontend & Data Agregasi Riil *(Quick Win)*
* **Target Waktu:** Oktober 2026
* **Status:** 🟡 Siap Eksekusi
* **Rincian Tindakan:**
  1. Perbarui `fallbackStats` di `frontend/src/lib/content.js` dengan data sebaran 10 skema riil PKM 2026.
  2. Perbarui bar metrik `StatsBar` di `frontend/src/pages/Home.jsx` agar menampilkan angka riil (321 Proposal Diajukan, 321 Tim Terdaftar, 168 Dosen Pembimbing, 23 Reviewer).
  3. Perbarui `fallbackPortfolio` dengan mengambil 10 proposal nyata terbaik lintas skema dan fakultas dari CSV.

### 🔹 Tahap 2: Script Ingestion CSV ke Database PostgreSQL *(Backend Migration)*
* **Target Waktu:** Oktober 2026
* **Status:** ⚪ Rencana Teknis
* **Rincian Tindakan:**
  1. Buat script seeder/migrasi (Go atau Python script di `backend/scripts/ingest_pkm_2026.py`) untuk membaca `PKM UNILA 2026  - Sheet1.csv`.
  2. Parsing dan simpan data:
     * Buat akun user mahasiswa (NPM + Nama) dan dosen pembimbing/reviewer jika belum ada.
     * Masukkan 321 record ke tabel `proposals` (judul, skema, fakultas, file link drive).
     * Masukkan penugasan reviewer ke tabel `reviews` (Reviewer 1 dan Reviewer 2).
  3. Memastikan view `v_scheme_stats` di database otomatis menghasilkan angka agregasi 321 proposal.

### 🔹 Tahap 3: Fitur Portal Cek Status & Pelacakan Usulan Mahasiswa
* **Target Waktu:** Oktober – November 2026
* **Status:** ⚪ Rencana Fitur Baru
* **Rincian Tindakan:**
  1. Tambahkan widget/halaman *"Cek Status Usulan PKM 2026"* pada portal publik (di menu Beranda atau Panduan).
  2. Mahasiswa memasukkan **NPM** atau **Nama Ketua**:
     * Muncul kartu interaktif yang menampilkan Judul Proposal, Skema PKM, Fakultas, Dosen Pembimbing, Reviewer 1 & 2 yang ditugaskan, serta status draft.
  3. Mengurangi beban administrasi panitia karena mahasiswa dapat mengecek penugasan reviewer secara mandiri.

### 🔹 Tahap 4: Personalisasi Dashboard Dosen Pembimbing & Reviewer
* **Target Waktu:** November 2026
* **Status:** ⚪ Rencana Lanjutan
* **Rincian Tindakan:**
  1. Generate kredensial login dev untuk reviewer kunci (contoh: akun Nur Khawarizmi, Yusuf Perdana, May Roni, Bayu Saputra, dll).
  2. Saat login sebagai Reviewer, dashboard [ReviewerDashboard.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/ReviewerDashboard.jsx) langsung memuat antrean proposal riil yang ditugaskan di CSV, lengkap dengan link draft Google Drive dan form rubrik penilaian.
  3. Saat login sebagai Dosen, [DosenDashboard.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/DosenDashboard.jsx) menampilkan daftar tim mahasiswa yang mencantumkan namanya sebagai pembimbing.

---

## 5. Kesimpulan & Rekomendasi Tindak Lanjut

Data rekap `PKM UNILA 2026  - Sheet1.csv` dan master dosen FT `UNTUK Nurkhawarizmi (1).xlsx` adalah pondasi nyata yang sangat berharga. Memanfaatkan data ini akan mengubah PKM-Center dari sekadar tampilan antarmuka menjadi **pusat informasi dan pemantauan digital PKM yang benar-benar hidup dan bermanfaat langsung bagi sivitas akademika Universitas Lampung**.

> **Rekomendasi Langkah Berikutnya:**  
> Lakukan eksekusi **Tahap 1 (Sinkronisasi Metrik & Fallback Data Frontend)** terlebih dahulu agar tampilan publik langsung mencerminkan data riil 2026, kemudian dilanjutkan dengan pembuatan parser database di backend.
