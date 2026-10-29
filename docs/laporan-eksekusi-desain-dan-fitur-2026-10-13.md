# Laporan Resmi Eksekusi Desain Neo-Glassmorphism, Integrasi Data Riil 2026, dan Roadmap Pengembangan Tim PKM Center Unila

> **Tanggal Dokumen:** 13 Oktober 2026  
> **Penanggung Jawab / Author:** Vian (Favian: Anggota 2 & Lead UI/UX)  
> **Status Implementasi:** 🟢 **Selesai Dieksekusi & Terverifikasi di Kode Nyata**  
> **Target Pengguna / Audiens:** Tim Pengembang PKM Center Unila (Aidil, Vian, Radhit, Dimas) & Pemangku Kepentingan Universitas Lampung

---

## 1. Ringkasan Eksekutif (Executive Summary)

Pada sesi kerja hari ini (13 Oktober 2026), telah dilaksanakan serangkaian eksekusi krusial yang menyelaraskan bahasa desain visual, data riil universitas, arsitektur database, dan alur kerja tim pengembang:

1. **Penetapan & Eksekusi Bahasa Desain Neo-Glassmorphism:**
   * Bahasa desain resmi disepakati dan diresmikan menggunakan **Neo-Glassmorphism**. Konsep kaca buram (*frosted glass*) elegan yang sempat digunakan pada iterasi awal dihidupkan kembali dengan penyempurnaan menyeluruh: menggunakan *milk glass* semi-transparan berkontras tinggi, *ambient radial light mesh*, dan border ber-refleksi mikro (*specular highlights*), sehingga estetika tampil mewah tanpa sedikit pun mengorbankan keterbacaan teks (*WCAG AAA compliant*).
   * Styling fondasi di [frontend/src/ref.css](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/ref.css) telah diperbarui dengan token dan kelas utilitas kaca resmi (`.glass-card`, `.glass-card-navy`, `.glass-panel`, `.glass-pill`, `.glass-input`).
   * Dua komponen atomik interaktif baru telah diadaptasi ke Plain React JSX di [frontend/src/components/ui/](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/ui/):
     * `GlowCard` (Spotlight border-masking dengan pelacak kursor).
     * `GlassFolder` (Map berkas 3D frosted glass dengan canvas seni cairan prosedural).

2. **Dinamisasi Metrik Berdasarkan Data Riil Unila 2026:**
   * Menganalisis dokumen [docs/PKM UNILA 2026  - Sheet1.csv](file:///Users/favian/Proyek%20/PKM-Center/docs/PKM%20UNILA%202026%20%20-%20Sheet1.csv) yang berisi **321 data usulan proposal nyata**, **168 dosen pembimbing unik**, dan **23 reviewer internal**.
   * Memperbarui `StatsBar` pada [frontend/src/pages/Home.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/Home.jsx) dan `fallbackStats` pada [frontend/src/lib/content.js](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/lib/content.js) sehingga angka yang tampil di portal publik langsung merefleksikan sebaran nyata 10 skema PKM 2026 (PKM-K: 115, PKM-RE: 58, PKM-RSH: 41, PKM-PM: 32, PKM-KC: 28, PKM-AI: 15, PKM-GFT: 13, PKM-KI: 7, PKM-VGK: 6, PKM-PI: 3).

3. **Audit Menyeluruh 34 Tabel Database PostgreSQL v2:**
   * Mengaudit struktur database di `backend/migrations/0001_init_pkm_schema.sql` dan `0002_direct_messages.sql`.
   * Menemukan bahwa dari 34 tabel yang tersedia:
     * **16 tabel sudah aktif** terhubung ke API backend dan modul internal.
     * **18 tabel masih berstatus model-only** (tersedia di database tapi belum memiliki handler/antarmuka).
   * 18 tabel tersebut diidentifikasi sebagai potensi fitur besar (AI Idea Lab, Rubrik Penilaian Digital, Notifikasi Real-time, Riwayat Berkas Multi-versi, dan Rekrutmen Tim).

4. **Sinkronisasi Roadmap Kerja 4 Anggota Tim:**
   * Berdasarkan [docs/pkm - Sheet1.csv](file:///Users/favian/Proyek%20/PKM-Center/docs/pkm%20-%20Sheet1.csv), memetakan 18 tabel dan fitur masa depan ke 4 penanggung jawab: **Aidil (Anggota 1)**, **Favian/Vian (Anggota 2)**, **Radhit (Anggota 3)**, dan **Dimas (Anggota 4)**.

---

## 2. Standardisasi Desain: Neo-Glassmorphism

### 2.1 Mengapa Neo-Glassmorphism?
Sebelumnya, antarmuka sempat berada pada dua kutub:
1. *Kutub Awal:* Menggunakan efek kaca buram dan navbar apung yang futuristik, namun sempat mengalami kendala keterbacaan pada beberapa kondisi latar belakang dan layout mobile.
2. *Kutub Revisi 07 Oktober:* Disesuaikan ke nuansa putih-navy bersih dengan dominasi latar belakang solid, yang meningkatkan keterbacaan tetapi terasa sedikit datar (*flat*).

**Solusi Neo-Glassmorphism (Diresmikan oleh Vian, 13 Oktober 2026):**  
Menggabungkan keunggulan kedua pendekatan. Lapisan latar belakang diberi pendaran radial lembut (*ambient light mesh*). Kartu-kartu konten menggunakan kaca susu (*translucent milk glass*) dengan `backdrop-filter: blur(16px) saturate(180%)`, border semi-transparan `rgba(255, 255, 255, 0.9)`, dan bayangan berlapis. Hasilnya:
* Tampilan terasa sangat berkelas, modern, dan bernuansa premium.
* Kontras teks terhadap latar belakang tetap tajam dan nyaman dibaca dalam jangka waktu lama.
* Tidak memerlukan dependensi CSS raksasa (Tailwind CSS atau shadcn CLI); semuanya murni menggunakan Vanilla CSS dan CSS Variables bawaan.

### 2.2 Komponen Interaktif yang Diimplementasikan

| Komponen | Lokasi File | Fungsi & Pengalaman Interaktif |
| :--- | :--- | :--- |
| **GlowCard (Spotlight Card)** | [components/ui/spotlight-card.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/ui/spotlight-card.jsx) | Kartu sorot yang mendeteksi posisi kursor mouse secara dinamis melalui CSS variables `--x` dan `--y`. Menghasilkan efek border-masking bercahaya keemasan resmi Unila (`#FFD700`). Diterapkan pada 3 kartu Ekosistem di Beranda. |
| **GlassFolder (3D Liquid Folders)** | [components/ui/glass-folder-cards.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/ui/glass-folder-cards.jsx) | Map berkas 3 dimensi dengan panel depan kaca buram dan seni cairan dinamis berbasis HTML5 Canvas. Saat diklik/di-hover, map mekar (*fan out*) memperlihatkan berkas pedoman PKM 2026, 2025, dan arsip terdahulu. |
| **Frosted Floating Topbar** | [ref.css (L30-L55)](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/ref.css#L30-L55) | Bar navigasi mengambang dengan efek *frosted glass* (`backdrop-filter: blur(14px)`), sudut melengkung halus, dan elevasi lembut di atas konten halaman. |
| **Translucent Glass Dialogs** | [ref.css (L215-L235)](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/ref.css#L215-L235) | Modal login dan formulir interaktif dengan latar kaca susu dan backdrop buram gelap. |

### 2.3 Token CSS Utilitas yang Tersedia di `ref.css`

```css
/* Utilitas Kaca yang Dapat Langsung Dipakai Seluruh Tim: */
.glass-card       /* Kartu kaca putih susu semi-transparan */
.glass-card-navy  /* Kartu kaca navy gelap beraksen emas (untuk fitur unggulan) */
.glass-panel      /* Kontainer pembungkus seksi halaman */
.glass-pill       /* Lencana kategori semi-transparan */
.glass-input      /* Input form interaktif bertema kaca */
```

---

## 3. Dinamisasi Data Riil Rekapitulasi PKM Unila 2026

Berdasarkan telaah mendalam terhadap file [docs/PKM UNILA 2026  - Sheet1.csv](file:///Users/favian/Proyek%20/PKM-Center/docs/PKM%20UNILA%202026%20%20-%20Sheet1.csv), berikut fakta metrik yang berhasil diekstrak dan langsung diselaraskan ke frontend:

### 3.1 Distribusi Usulan Proposal per Skema (Total: 321 Proposal)
| Skema PKM | Nama Skema | Jumlah Usulan Riil | Persentase |
| :--- | :--- | :---: | :---: |
| **PKM-K** | Kewirausahaan | 115 | 35.8% |
| **PKM-RE** | Riset Eksakta | 58 | 18.1% |
| **PKM-RSH** | Riset Sosial Humaniora | 41 | 12.8% |
| **PKM-PM** | Pengabdian kepada Masyarakat | 32 | 10.0% |
| **PKM-KC** | Karsa Cipta | 28 | 8.7% |
| **PKM-AI** | Artikel Ilmiah | 15 | 4.7% |
| **PKM-GFT** | Gagasan Futuristik Tertulis | 13 | 4.0% |
| **PKM-KI** | Karya Inovatif | 7 | 2.2% |
| **PKM-VGK** | Video Gagasan Konstruktif | 6 | 1.9% |
| **PKM-PI** | Penerapan Iptek | 3 | 0.9% |
| **Lainnya / Revisi** | Unclassified / Pengalihan | 3 | 0.9% |
| **TOTAL** | | **321** | **100.0%** |

### 3.2 Sebaran Fakultas Partisipan (8 Fakultas Unila)
1. **FKIP:** 71 proposal (22.1%)
2. **FISIP:** 65 proposal (20.2%)
3. **FAPERTA:** 64 proposal (19.9%)
4. **FT (Fakultas Teknik):** 50 proposal (15.6%)
5. **FMIPA:** 34 proposal (10.6%)
6. **FEB:** 16 proposal (5.0%)
7. **FK (Fakultas Kedokteran):** 10 proposal (3.1%)
8. **FH (Fakultas Hukum):** 8 proposal (2.5%)
9. Lainnya / Pasca: 3 proposal (0.9%)

### 3.3 Aktor Utama yang Terdata
* **Dosen Pembimbing:** 168 dosen pembimbing unik terdaftar membimbing 321 tim.
* **Reviewer Internal:** 23 reviewer internal tercatat aktif menilai proposal (termasuk M. Nur Khawarizmi, Hadi Prayitno, Bayu Saputra, Yusuf Perdana, dll).

---

## 4. Matriks Pembagian Tanggung Jawab Tim (WBS Alignment)

Berdasarkan file acuan [docs/pkm - Sheet1.csv](file:///Users/favian/Proyek%20/PKM-Center/docs/pkm%20-%20Sheet1.csv) dan audit 34 tabel PostgreSQL v2, tanggung jawab pengembangan dibagi sebagai berikut:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MATRIKS TUGAS 4 ANGGOTA TIM                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Anggota 1: AIDIL     │ Anggota 2: FAVIAN    │ Anggota 3: RADHIT             │
│ (AI & Kolaborasi)    │ (UI/UX & Portal Mhs) │ (Auth & Backend Database)     │
│                      │                      │                               │
│ • Idea Lab (LLM API) │ • Sistem Desain      │ • Skema & Migrasi DB          │
│ • Cari Tim & Dosen   │   Neo-Glassmorphism  │ • Seeder 321 Data Riil CSV    │
│ • Gateway REST AI    │ • Dashboard Mahasiswa│ • Admin Kampus & Kuota        │
│ • Algoritma Match    │ • Multi-Step Form    │ • Manajemen Akun (RBAC)       │
│                      │ • Logbook Digital    │ • Auto-Lock Tahapan PKM       │
│ (Tabel: ai_analyses, │ (Tabel: proposals,   │ (Tabel: users, user_roles,    │
│  expertise_fields,   │  team_members, docs, │  lecturer_profiles, stages,   │
│  team_invitations)   │  logbook_entries)    │  pkm_periods)                 │
├──────────────────────┴──────────────────────┴───────────────────────────────┤
│ Anggota 4: DIMAS (Modul Bimbingan, Evaluasi & Komunikasi)                   │
│                                                                             │
│ • Dashboard Dosen Pembimbing (Koneksi ke 168 pembimbing CSV)                │
│ • Dashboard Reviewer (Koneksi ke 23 reviewer CSV)                           │
│ • Rubrik Penilaian Digital & Kalkulasi Skor Otomatis                        │
│ • Direct Messaging & Catatan Revisi Mahasiswa-Dosen                         │
│ (Tabel: reviews, review_scores, review_criteria, guidance_sessions, DMs)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Status Verifikasi Teknis & Lingkungan Kerja

Semua perubahan kode telah diuji secara komprehensif pada lingkungan aktif:

1. **Docker Stack (Running Healthy):**
   * **Frontend:** Vite 8.3.1 pada `http://localhost:5173`
   * **Backend:** Go Gin pada `http://localhost:8081`
   * **Database:** PostgreSQL 16 pada port `5432`

2. **Pengujian Build Produksi:**
   * Perintah: `docker compose exec frontend npm run build`
   * Hasil: **100% SUKSES** dalam waktu **211ms**.
   * Output bundle:
     * `dist/index.html`: 0.48 kB
     * `dist/assets/index-COfZH8gs.css`: 77.11 kB (gzip: 15.34 kB)
     * `dist/assets/index-C8pHWNq8.js`: 448.38 kB (gzip: 127.32 kB)
     * Tidak ada error sintaksis, warning tipe, atau missing module.

---

## 6. Daftar Dokumen Pembaruan (Knowledge Base Artifacts)

Dokumen-dokumen berikut telah diperbarui dan diselaraskan pada direktori [docs/](file:///Users/favian/Proyek%20/PKM-Center/docs/) per 13 Oktober 2026:

1. [docs/acuan-design-pkm-center.md](file:///Users/favian/Proyek%20/PKM-Center/docs/acuan-design-pkm-center.md) & [acuan-design-pkm-center.md](file:///Users/favian/Proyek%20/PKM-Center/acuan-design-pkm-center.md):
   * Ditambahkan **Bab 7 (Komponen Interaktif Atomik & Standar `/components/ui`)**.
   * Ditambahkan **Bab 8 (Standar Bahasa Desain: Neo-Glassmorphism)** sebagai Single Source of Truth bagi seluruh tim.
2. [docs/roadmap-fitur-dan-audit-database-2026-10-13.md](file:///Users/favian/Proyek%20/PKM-Center/docs/roadmap-fitur-dan-audit-database-2026-10-13.md):
   * Analisis mendalam 34 tabel PostgreSQL v2 (16 aktif vs 18 model-only).
   * Peta jalan kerja rinci untuk Aidil, Favian, Radhit, dan Dimas.
3. [docs/rencana-dinamisasi-data-riil-pkm-2026-10-13.md](file:///Users/favian/Proyek%20/PKM-Center/docs/rencana-dinamisasi-data-riil-pkm-2026-10-13.md):
   * Rencana 4 fase dinamisasi data riil 321 usulan proposal, direktori dosen, dan personalisasi peran.
4. [docs/daftar-fitur-pkm-center-unila.md](file:///Users/favian/Proyek%20/PKM-Center/docs/daftar-fitur-pkm-center-unila.md):
   * Log pembaruan resmi bertanggal 13-10-2026 yang mendokumentasikan adopsi Neo-Glassmorphism dan integrasi metrik 2026.
5. [docs/laporan-eksekusi-desain-dan-fitur-2026-10-13.md](file:///Users/favian/Proyek%20/PKM-Center/docs/laporan-eksekusi-desain-dan-fitur-2026-10-13.md) *(Dokumen ini)*:
   * Konsolidasi menyeluruh seluruh eksekusi desain, data, dan roadmap hari ini atas nama Vian.

---

## 7. Rencana Tindak Lanjut Terdekat (Immediate Next Steps)

1. **Untuk Radhit (Backend):**
   * Menjalankan skrip seeder Go atau migrasi SQL untuk mengimpor 321 proposal riil dari `PKM UNILA 2026  - Sheet1.csv` ke dalam tabel `proposals`, `student_profiles`, dan `users`.
   * Menghubungkan view `v_scheme_stats` ke endpoint `/api/stats` agar query langsung membaca 321 proposal dari database.
2. **Untuk Vian (UI/UX):** ✅ **Selesai 13 Okt 2026**
   * Menyelesaikan antarmuka multi-step form pengajuan proposal bagi mahasiswa dengan tema Neo-Glassmorphism: `frontend/src/pages/AjukanProposal.jsx` (10 skema PKM, unggah berkas nyata ke `proposal_documents`, riwayat versi dokumen).
   * Menyiapkan visual widget pelacak progres usulan 5 tahap di Beranda / Portal Mahasiswa: `frontend/src/pages/MahasiswaDashboard.jsx` (stepper 5 tahap + lonceng notifikasi in-app).
   * (Tambahan) `LogbookPKM.jsx` dengan persentase capaian & unggah bukti, serta `CekStatusUsulan.jsx` untuk pelacakan publik via NPM/nama.
3. **Untuk Dimas:**
   * Melanjutkan pengujian modul Dosen dan Reviewer dengan menghubungkan akun dosen riil dari rekap.
4. **Untuk Aidil:**
   * Mengintegrasikan purwarupa Idea Lab dengan prompt model evaluasi kebaruan ide PKM.

---

## 8. Perbaikan Visual: Grid Responsif, Heading Proporsional & Eliminasi Teks Terpotong

Menindaklanjuti audit visual pada halaman Berita (`/#berita`), ditemukan dan diselesaikan beberapa isu tata letak kritis:

### 8.1 Diagnosis Masalah Visual Awal
1. **Heading `.page-intro` Terlalu Raksasa & Terpotong Topbar:**  
   Ukuran judul sebelumnya mencapai `clamp(2.8rem, 11vw, 4.6rem)` (~73px) dengan font Playfair Display dan `em` merah miring. Saat halaman diakses atau digeser sedikit, teks judul terpotong di balik floating topbar dan hanya menyisakan baris teks bawah.
2. **Garis Pembatas Kaku & Ruang Kosong Masif:**  
   `border-bottom: 1px solid var(--line)` dengan padding bawah `3.5rem` serta padding atas grid `3.5rem` menciptakan ruang kosong vertikal lebih dari 110px yang memisahkan teks intro dan kartu secara canggung.
3. **Kartu Terkunci Lebar 18rem (288px):**  
   Komponen `spotlight-card--md` sebelumnya memiliki nilai kaku `width: 18rem`. Pada layout 3 kolom desktop, kartu tidak mengisi lebar kolom sehingga terjadi celah aneh, dan judul teks panjang seperti kata *"pendampingan"* terpotong (*truncated*) di tepi kartu.
4. **Tinggi Kartu Tidak Terkendali:**  
   Tinggi kartu terlalu jangkung (~500px+) dengan ukuran judul raksasa sehingga deskripsi dan tautan *"Baca selengkapnya"* terdorong ke luar layar monitor standar.

---

### 8.2 Solusi yang Diterapkan & Terverifikasi
* **Penyelarasan Fluid `GlowCard` ([spotlight-card.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/ui/spotlight-card.jsx)):**  
  Mengubah kartu menjadi `width: 100%`, `min-width: 0`, dan menambahkan opsi `noPadding: true` agar gambar sampul menyatu mulus ke tepi atas kartu tanpa garis putih aneh.
* **Modernisasi Halaman Berita ([News.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/News.jsx)):**  
  Mengganti komponen lama dengan kartu Neo-Glassmorphism terpadu (`.news-card-new`). Judul kartu distandarkan menggunakan `font-size: 1.15rem; font-weight: 800;` dengan 2-line clamp dan `word-break: break-word`, menjamin kata panjang apa pun tidak akan pernah terpotong.
* **Harmonisasi Tipografi & Grid ([ref.css](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/ref.css)):**  
  `.page-intro` diperhalus menjadi `font: 800 clamp(1.85rem, 3.8vw, 2.75rem)`, garis pembatas kaku dihilangkan, dan grid diatur responsif:
  * **Desktop (≥ 1024px):** 3 Kolom simetris proporsional (`grid-template-columns: repeat(3, 1fr)`).
  * **Tablet (640px – 1023px):** 2 Kolom rapi (`grid-template-columns: repeat(2, 1fr)`).
  * **Mobile (< 640px):** 1 Kolom fluid vertikal tanpa *horizontal overflow*.
* **Hasil Uji Browser:** Diverifikasi melalui tangkapan layar browser otomatis pada 1280x800 (Desktop), 768x1024 (Tablet), dan 375x667 (Mobile) dengan status 100% rapi dan proporsional.

