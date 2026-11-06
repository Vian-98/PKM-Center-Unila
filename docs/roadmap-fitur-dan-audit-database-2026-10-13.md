# Roadmap Fitur & Audit Mendalam Database PKM-Center Unila
*(Penyelarasan Skema Database v2, Dataset Rekap 2026, dan Pembagian Kerja 4 Anggota Tim)*

> **Tanggal Pembaruan:** 13 Oktober 2026  
> **Penyusun / Penanggung Jawab (PIC):** Vian  
> **Status:** 🟢 **Dokumen Resmi Perencanaan & Panduan Pengembangan Arsitektur**  
> **Dokumen Rujukan:**
> 1. `docs/pkm - Sheet1.csv` (Pembagian Kerja Resmi: Aidil, Favian, Radhit, Dimas)
> 2. `docs/PKM UNILA 2026  - Sheet1.csv` (Dataset Riil 321 Proposal, 168 Dosen, 23 Reviewer)
> 3. `docs/UNTUK Nurkhawarizmi (1).xlsx` (Master Data Direktori Dosen & Tendik FT Unila)
> 4. `backend/migrations/0001_init_pkm_schema.sql` & `0002_direct_messages.sql` (Skema DB v2)

---

## 1. Audit Mendalam Skema Database (Deep-Dive Database Audit)

Dari audit terhadap 34 tabel skema PostgreSQL v2 (+ 1 view `v_scheme_stats`) di backend, ditemukan bahwa:
* **16 Tabel Sudah Aktif Terpakai** di handler backend (`auth.go`, `dosen.go`, `reviewer.go`, `pesan_feedback.go`, `feedback.go`, `main.go`).
* **18 Tabel Masih Berstatus "Hanya Model / Belum Terbaca"** (belum memiliki controller/handler dan belum terhubung ke antarmuka pengguna).

Berikut adalah audit tabel yang belum tersentuh beserta **bakal fitur besar** yang didukungnya:

### 1.1 Tabel yang Belum Terbaca & Potensi Bakal Fitur

| # | Nama Tabel | Kolom Kunci | Bakal Fitur yang Didukung | PIC yang Relevan |
|---|---|---|---|---|
| 1 | **`ai_analyses`** | `id`, `user_id`, `proposal_id`, `analysis_type`, `input_prompt`, `output_result` (JSONB), `model_name`, `tokens_used` | **Idea Lab (Brainstorming LLM):** Menyimpan histori chat konsultasi AI, analisis kelayakan ide, skor kebaruan (*novelty score*), dan rekomendasi skema PKM. | **Aidil** *(Anggota 1)* |
| 2 | **`expertise_fields`** | `id`, `name`, `category` | **Master Bidang Keahlian:** Taksonomi kepakaran (IoT, Bioteknologi, AI, Pangan, Hukum, dll) untuk filter pencarian. | **Aidil** *(Anggota 1)* |
| 3 | **`user_expertise`** | `user_id`, `field_id`, `level` (beginner/expert) | **Pencocokan Tim Multidisiplin:** Menghubungkan minat/keahlian mahasiswa dan dosen agar algoritma rekomendasi tim dapat bekerja. | **Aidil** *(Anggota 1)* |
| 4 | **`achievements`** | `user_id`, `title`, `event_name`, `level`, `year`, `medal`, `proof_url` | **Portofolio Prestasi Pengguna:** Mahasiswa & dosen menampilkan medali PIMNAS/lomba terdahulu di kartu profil pencarian tim. | **Aidil & Favian** |
| 5 | **`lecturer_profiles`** | `user_id`, `nip`, `nidn`, `faculty`, `department`, `max_mentoring_quota`, `current_mentoring_count` | **Profil Resmi Dosen & Kontrol Kuota:** Menyimpan NIP 18 digit dari Excel FT dan kuota maksimal bimbingan tim per dosen. | **Radhit & Dimas** |
| 6 | **`team_invitations`** | `team_id`, `inviter_id`, `invitee_id`, `role`, `status` (pending/accepted/rejected), `message` | **Sistem Undangan & Rekrutmen Tim:** Tombol *"Invite to Team"* saat mencari anggota di portal, lengkap dengan konfirmasi notifikasi. | **Aidil & Favian** |
| 7 | **`team_members`** | `team_id`, `user_id`, `role_in_team` (leader/member), `joined_at` | **Dukungan Multi-Anggota Tim:** Mengakomodasi tim PKM nyata yang terdiri dari 3–5 mahasiswa lintas fakultas/jurusan. | **Favian** *(Anggota 2)* ✅ |
| 8 | **`proposal_documents`** | `proposal_id`, `doc_type` (draft/pengesahan/kemajuan/akhir), `file_url`, `version`, `uploaded_by` | **Version Control Berkas Proposal:** Riwayat unggahan naskah usulan (Draft v1, Revisi v2, Final v3, Lembar Pengesahan). | **Favian** *(Anggota 2)* ✅ |
| 9 | **`logbook_comments`** | `logbook_entry_id`, `user_id`, `comment`, `created_at` | **Interaksi Bimbingan Catatan Harian:** Dosen pembimbing memberikan arahan/paraf digital langsung pada entri logbook mahasiswa. | **Favian** ✅ & Dimas |
| 10 | **`review_criteria`** | `scheme_id`, `name`, `weight`, `max_score` | **Rubrik Penilaian Terstandar:** Kriteria resmi penilaian proposal per skema (mengadopsi rubrik Google Form dari CSV). | **Dimas** *(Anggota 4)* |
| 11 | **`review_scores`** | `review_id`, `criterion_id`, `score`, `notes` | **Scoring Terkomputerisasi:** Nilai per butir penilaian oleh Reviewer 1 & 2 untuk menghasilkan total skor kelayakan otomatis. | **Dimas** *(Anggota 4)* |
| 12 | **`notifications`** | `user_id`, `title`, `message`, `type`, `is_read`, `action_url` | **Pusat Notifikasi Real-time In-App:** Lonceng notifikasi saat usulan disetujui, ada pesan masuk, ada undangan tim, atau jadwal review. | **Radhit** & **Favian** ✅ |
| 13 | **`pkm_periods`** | `year`, `theme`, `is_active`, `start_date`, `end_date` | **Manajemen Siklus Tahun PKM:** Mengatur tahun aktif (2026) dan mengarsipkan periode lampau secara dinamis. | **Radhit** *(Anggota 3)* |
| 14 | **`pkm_stages`** | `period_id`, `stage_name`, `order_index`, `start_date`, `end_date`, `is_active` | **Timeline Terintegrasi & Auto-Lock:** Tahapan submit, review internal, seleksi Belmawa yang otomatis mengunci form saat deadline. | **Radhit** *(Anggota 3)* |
| 15 | **`guidelines`** | `scheme_id`, `year`, `title`, `file_url`, `is_active` | **Katalog Panduan v2:** Menggantikan tabel transisional `pedoman` agar buku panduan terhubung langsung dengan skema resmi. | **Radhit** *(Anggota 3)* |
| 16 | **`content_posts`** | `title`, `slug`, `content`, `post_type` (news/announcement), `author_id` | **CMS Berita & Pengumuman v2:** Menggantikan tabel transisional `contents`. | **Radhit** *(Anggota 3)* |
| 17 | **`content_media`** | `post_id`, `media_type`, `media_url`, `caption`, `order_index` | **Galeri & Media Terstruktur:** Menggantikan kolom tunggal URL media lama. | **Radhit** *(Anggota 3)* |
| 18 | **`contact_infos`** | `address`, `email`, `phone`, `whatsapp`, `instagram`, `map_embed` | **Kontak Lembaga Dinamis:** Form pengaturan kontak sekretariat di panel admin. | **Radhit** *(Anggota 3)* |

---

## 2. Penyelarasan Rencana Fitur per Anggota Tim

Berdasarkan pembagian kerja di `docs/pkm - Sheet1.csv`, berikut adalah peta jalan kerja spesifik untuk masing-masing orang:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARSITEKTUR KERJA 4 ANGGOTA TIM                       │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Anggota 1: AIDIL     │ Anggota 2: FAVIAN    │ Anggota 3: RADHIT             │
│ • Idea Lab LLM Chat  │ • Dashboard Mhs      │ • Seeder Riil 321 Proposal    │
│ • Cari Tim & Dosen   │ • Form Multi-step    │ • Admin Akun & RBAC           │
│ • Gateway REST AI    │ • Logbook PKM        │ • Setting Kuota Dosen         │
│ (Tabel: ai_analyses, │ • Cek Status Usulan  │ • Auto-lock Timeline          │
│  expertise_fields,   │ (Tabel: proposals,   │ (Tabel: users, user_roles,    │
│  team_invitations)   │  team_members, docs, │  lecturer_profiles, stages,   │
│                      │  logbook_entries)    │  pkm_periods)                 │
├──────────────────────┴──────────────────────┴───────────────────────────────┤
│ Anggota 4: DIMAS                                                            │
│ • Dashboard Dosen Pembimbing (Hubungkan 168 Pembimbing Riil CSV)            │
│ • Dashboard Reviewer (Hubungkan Antrean Penugasan 23 Reviewer Riil CSV)     │
│ • Scoring Rubrik Digital & Direct Message Pesan-Revisi                      │
│ (Tabel: reviews, review_scores, review_criteria, guidance_sessions, DMs)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 👨‍💻 2.1 Aidil (Anggota 1): *Idea Lab AI, Pencarian Tim & Pembimbing*

* **Kondisi Basis Data Saat Ini:** Tabel `ai_analyses`, `expertise_fields`, `user_expertise`, dan `team_invitations` sudah siap di PostgreSQL, tetapi belum memiliki handler Go maupun antarmuka pengguna.
* **Integrasi Data Riil:** Memanfaatkan master 168 dosen pembimbing di CSV dan daftar dosen FT di Excel untuk mengisi direktori kepakaran.
* **Tugas Lanjutan:**
  1. **Backend Endpoints:**
     * `POST /api/ai/brainstorm`: Menerima input ide mahasiswa, memanggil LLM (Gemini/OpenAI), dan menyimpan riwayat ke tabel `ai_analyses`.
     * `GET /api/finder/lecturers`: Mengambil daftar dosen pembimbing dengan filter fakultas, jurusan, dan bidang bimbingan.
     * `GET /api/finder/students`: Mengambil mahasiswa yang membuka status mencari tim kolaborasi.
     * `POST /api/finder/invite`: Mengirim undangan tim ke tabel `team_invitations`.
  2. **Frontend UI:**
     * `IdeaLab.jsx` (`/#idealab`): Chat room brainstorming interaktif dengan visual kartu Idea Score.
     * `CariTim.jsx` (`/#caritim`): Grid kartu profil dosen dan mahasiswa, filter multidisiplin, tombol *Invite*, dan modal detail profil.

---

### 👨‍💻 2.2 Favian (Anggota 2): *Portal Mahasiswa, Pengajuan Proposal & Logbook* ✅ **SELESAI (13 Okt 2026)**

* **Kondisi Basis Data Saat Ini:** Tabel `proposals`, `proposal_documents`, `teams`, `team_members`, dan `logbook_entries` sudah ada, namun belum ada portal sisi mahasiswa.
* **Integrasi Data Riil:** 321 judul proposal riil, ketua, dan dosen pembimbing dari CSV dijadikan basis status usulan awal.
* **PIC/Penanggung Jawab:** **Favian (Vian)**: seluruh butir di bawah telah diimplementasikan, diuji, dan terhubung ke backend.
* **Status Implementasi:**
  1. **Dashboard Mahasiswa (`MahasiswaDashboard.jsx` di `/#mahasiswa`):** ✅
     * Visual Stepper 5 Tahap: `Draft` ➔ `Review Dosen` ➔ `Review Internal Reviewer 1 & 2` ➔ `Lolos Belmawa` ➔ `PIMNAS`.
     * Kartu ringkasan anggota tim dan dosen pembimbing (terhubung ke `GET /api/student/dashboard`).
     * Widget agenda terdekat & tenggat waktu tahapan, kartu capaian (`latestProgress`), dan tab ringkasan/status/agenda.
     * Lonceng notifikasi in-app (tabel `notifications`) di header portal.
  2. **Formulir Ajukan Proposal Multi-Step (`AjukanProposal.jsx`):** ✅
     * *Langkah 1:* Pilih 10 Skema PKM (`PKM-K, RE, RSH, PM, KC, AI, GFT, KI, VGK, PI`), Input Judul Usulan, Abstrak, Kata Kunci, dan Kriteria Bidang/Jurusan (`proposals.field_of_study`).
     * *Langkah 2:* **Pemilihan Anggota Tim Dinamis & Cerdas:**
       - Dropdown pemilihan anggota tim berbasis direktori akun mahasiswa aktif (`GET /api/student/students`).
       - Opsi **`+ Mahasiswa Belum Terdaftar (Input Manual Lengkap)`** yang memunculkan input lengkap (NPM, Nama, Prodi, Fakultas) saat dipilih.
       - Deteksi cerdas & auto-provisioning: jika mahasiswa belum terdaftar, akun mahasiswa dan profil `student_profiles` otomatis dibuatkan di backend serta langsung ditautkan ke `team_members` dengan status `pending`.
       - Dropdown pemilihan Dosen Pembimbing terintegrasi dari direktori (`GET /api/student/supervisors`).
     * *Langkah 3:* Upload berkas PDF/DOCX nyata (multipart, `POST /api/student/upload`) ke tabel `proposal_documents` dengan penomoran versi otomatis, atau lampirkan tautan Google Drive.
  3. **Modul Logbook PKM (`LogbookPKM.jsx`):** ✅
     * Form tambah catatan harian kegiatan (tanggal, uraian progres, **persentase capaian** `logbook_entries.progress_percentage`, upload bukti foto/nota/dokumen).
     * Timeline riwayat entri lengkap dengan progress bar dan komentar dosen pembimbing (`logbook_comments`).
  4. **Widget Cek Status Usulan Publik (`CekStatusUsulan.jsx`):** ✅
     * Antarmuka pencarian Neo-Glassmorphism transparan elegan (bebas kotak putih mengganggu).
     * Komponen pencarian cepat (`GET /api/proposals/track?q=`) untuk mengecek status 5 tahap, dosen pembimbing, dan penugasan reviewer cukup dengan NPM/nama.
* **Catatan Teknis:** Skema `PKM-VGK` ditambahkan ke seeder `pkm_schemes` (migrasi `0001`) agar genap 10 skema sesuai daftar resmi; migrasi aditif `0003_student_portal.sql` menambah `proposals.field_of_study` dan `logbook_entries.progress_percentage`.
* **Endpoint Baru (aktif & terverifikasi):** `GET /api/student/dashboard`, `GET /api/student/schemes`, `GET /api/student/supervisors`, `GET /api/student/students`, `POST /api/student/proposals`, `GET /api/student/proposals/:id`, `POST /api/student/proposals/upload`, `POST /api/student/upload`, `GET|POST /api/student/logbook`, `GET /api/student/notifications`, `POST /api/student/notifications/read`, `GET /api/proposals/track`.

---

### 👨‍💻 2.3 Radhit (Anggota 3): *Database Seeder Riil, Auth RBAC & Admin Kampus*

* **Kondisi Basis Data Saat Ini:** Auth JWT 4 role sudah berjalan, namun seeder backend masih men-generate proposal acak. Fitur admin di [AdminPanel.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/AdminPanel.jsx) baru mencakup CMS dan feedback.
* **Integrasi Data Riil:** Bertanggung jawab penuh memindahkan 321 baris CSV ke tabel riil database.
* **Tugas Lanjutan:**
  1. **Script Seeder Ingestion Data Riil (`backend/scripts/ingest_pkm_2026.go` / `main.go`):**
     * Mengimpor `PKM UNILA 2026  - Sheet1.csv`:
       * Insert 321 record ke `proposals` dengan judul, skema, dan fakultas asli.
       * Insert user mahasiswa ketua dan user dosen pembimbing ke `users` dan `user_roles`.
       * Insert penugasan Reviewer 1 & Reviewer 2 ke `reviews` dan `review_assignments`.
     * Memastikan view `v_scheme_stats` langsung menghitung statistik 10 skema riil secara otomatis.
  2. **Ekstensi Panel Admin Kampus ([AdminPanel.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/AdminPanel.jsx)):**
     * **Tab Kelola Pengguna (RBAC):** Menampilkan tabel user mahasiswa, dosen, reviewer, dan admin dengan aksi ubah role.
     * **Tab Alokasi Kuota Bimbingan:** Setting batas kuota bimbingan pada tabel `lecturer_profiles` (`max_mentoring_quota`).
     * **Tab Rekapitulasi & Ekspor:** Rekap usulan per fakultas dengan tombol unduh data Excel.
     * **Tab Timeline & Batas Waktu:** Setting jadwal tabel `pkm_stages` untuk mengunci pengajuan saat deadline habis.

---

### 👨‍💻 2.4 Dimas (Anggota 4): *Modul Dosen, Reviewer & Pesan Feedback*

* **Kondisi Basis Data Saat Ini:** Handlers `dosen.go`, `reviewer.go`, dan `pesan_feedback.go` sudah aktif, namun data penugasan masih generik.
* **Integrasi Data Riil:** Menghubungkan antrean reviewer dengan penugasan nyata 23 reviewer di CSV (seperti *M. Nur Khawarizmi*, *Hadi Prayitno*, *Bayu Saputra*, dll).
* **Tugas Lanjutan:**
  1. **Personalisasi Dashboard Reviewer ([ReviewerDashboard.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/ReviewerDashboard.jsx)):**
     * Menampilkan daftar proposal nyata yang ditugaskan ke reviewer login (berdasarkan kolom Reviewer 1 & 2 di CSV).
     * Tombol akses langsung ke draft proposal Google Drive dan form rubrik penilaian.
     * Scoring rubrik internal menggunakan tabel `review_criteria` dan `review_scores` (skor 1–100, kriteria kreativitas, kelayakan, bobot nilai).
  2. **Personalisasi Dashboard Dosen Pembimbing ([DosenDashboard.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/DosenDashboard.jsx)):**
     * Menampilkan daftar mahasiswa bimbingan asli dari 168 dosen di CSV.
     * Fitur ACC/Reject permintaan bimbingan tim mahasiswa baru.
     * Monitoring dan pemberian komentar pada entri logbook mahasiswa bimbingan (`logbook_comments`).
  3. **Pesan Direct Message & Catatan Revisi ([PesanFeedback.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/PesanFeedback.jsx)):**
     * Obrolan langsung antara tim mahasiswa, dosen pembimbing, dan reviewer.
     * Tab khusus rekap catatan revisi agar mahasiswa mengetahui bagian naskah mana yang harus diperbaiki.

---

## 3. Roadmap Eksekusi Bertahap (Sprint Execution Plan)

```text
Sprint 1: Ingestion Data & Quick Win Metrik Frontend (13–20 Okt 2026)
├── Radhit: Buat script ingest CSV 321 usulan ke PostgreSQL
├── Vian: Update StatsBar Beranda & fallbackStats ke angka riil 2026
└── Dimas: Hubungkan antrean reviewer ke data penugasan CSV

Sprint 2: Portal Mahasiswa & Direktori Kolaborasi (21–31 Okt 2026)
├── Favian: Buat MahasiswaDashboard.jsx & Form multi-step proposal ✅ (selesai 13 Okt 2026)
├── Aidil: Buat CariTimPembimbing.jsx (direktori 168 dosen & mahasiswa)
└── Favian: Buat widget publik "Cek Status Usulan PKM 2026" ✅ (selesai 13 Okt 2026)

Sprint 3: Modul AI Idea Lab & Logbook Bimbingan (01–10 Nov 2026)
├── Aidil: Implementasi IdeaLab.jsx chat LLM & tabel ai_analyses
├── Favian: Implementasi LogbookPKM.jsx untuk pelaporan progres ✅ (selesai 13 Okt 2026)
└── Dimas: Fitur paraf/komentar dosen di logbook & form scoring kriteria

Sprint 4: Admin RBAC, Kontrol Kuota & Notifikasi (11–20 Nov 2026)
├── Radhit: Tab Admin kelola akun user & batas kuota dosen
├── Radhit/Favian: Lonceng notifikasi in-app (tabel notifications) ✅ (sisi mahasiswa selesai 13 Okt 2026)
└── Dimas/Vian: Uji coba menyeluruh integrasi alur 4 role
```

---

## 4. Daftar Endpoint REST API Baru yang Perlu Ditambahkan

Berikut adalah daftar endpoint baru yang perlu dibuat pada file handler Go untuk melengkapi 18 tabel yang belum terbaca:

```text
1. Modul Mahasiswa & Proposal (Favian)
   GET    /api/student/dashboard         # Ringkasan stepper progres usulan mhs login
   POST   /api/student/proposals         # Submit usulan proposal baru (multi-step)
   GET    /api/student/proposals/:id     # Detail usulan mhs
   POST   /api/student/proposals/upload  # Unggah berkas ke proposal_documents
   GET    /api/student/logbook           # Daftar entri logbook tim mhs
   POST   /api/student/logbook           # Tambah catatan logbook kegiatan baru
   GET    /api/proposals/track?q=NPM     # Endpoint publik pencarian status proposal mhs

2. Modul AI & Kolaborasi (Aidil)
   POST   /api/ai/brainstorm             # Konsultasi chat ide PKM ke LLM (ai_analyses)
   GET    /api/finder/lecturers          # Direktori dosen pembimbing (fakultas/jurusan)
   GET    /api/finder/students           # Direktori mahasiswa pencari tim
   POST   /api/finder/invite             # Kirim undangan tim (team_invitations)
   PUT    /api/finder/invite/:id/respond # Terima/tolak undangan tim

3. Modul Admin Kampus (Radhit)
   GET    /api/admin/users               # Daftar seluruh akun user (users + roles)
   PUT    /api/admin/users/:id/role      # Ubah role pengguna (RBAC)
   GET    /api/admin/quotas              # Daftar kuota bimbingan dosen (lecturer_profiles)
   PUT    /api/admin/quotas/:lecturerId  # Atur batas kuota bimbingan dosen
   GET    /api/admin/rekap/export        # Unduh rekapitulasi proposal CSV/Excel
   PUT    /api/admin/stages/:id/deadline # Atur batas waktu tahapan timeline PKM
```

---

## 5. Kesimpulan

Dengan mengaktifkan **18 tabel database yang sebelumnya belum terbaca** dan mengisinya dengan **data riil 321 usulan PKM 2026 serta direktori master dosen FT Unila**, seluruh pembagian modul untuk Aidil, Favian, Radhit, dan Dimas kini memiliki pijakan yang jelas, tidak lagi beroperasi di atas data palsu, dan siap dibangun menjadi platform manajemen PKM terintegrasi paling lengkap di Universitas Lampung.
