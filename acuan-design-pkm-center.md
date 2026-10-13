# Acuan Desain & Sistem UI PKM-Center Unila
*(Dokumen Acuan Resmi & Terkini — Single Source of Truth)*

> **Status Dokumen:** Terakhir diperbarui Oktober 2026.  
> Menggabungkan identitas resmi **Statuta Universitas Lampung (Unila)**, implementasi referensi **Digitalisasi Manajemen PKM**, serta modul operasional **Dosen, Reviewer, Pesan, dan Admin**.  
> **Tech Stack UI:** Plain React + Vite (Vanilla CSS berbasis CSS Variables, tanpa dependensi Tailwind/shadcn eksternal).

---

## 1. Inti & Filosofi Desain (The Core Essence)

Inti dari desain PKM-Center Unila berpusat pada tiga pilar utama:
1. **Clean, Modern, & Authoritative (Navy & White + Gold Unila):**  
   Menggunakan dominasi warna biru navy mendalam (`#123B66`) berpadu dengan latar belakang putih kebiruan pucat (`#F7FBFF`), serta aksen emas resmi Unila (`#FFD700`). Desain menghindari tema gelap (*dark mode*) dan warna redup agar tampil resmi, segar, dan berwibawa khas perguruan tinggi negeri.
2. **Prinsip Mobile-First Mutlak:**  
   Karena mayoritas mahasiswa mengakses informasi PKM (jadwal, timeline, unduhan pedoman) melalui ponsel, semua komponen dibangun dengan gaya dasar (*base styles*) untuk layar kecil, kemudian diperluas ke tablet dan desktop menggunakan `@media (min-width: ...)`.
3. **Struktur Navigasi Konvensional & Terintegrasi:**  
   Navigasi utama menggunakan **Top Navbar tunggal** di bagian atas dengan *drawer menu* responsif pada layar sentuh. Konsep navigasi ganda / navbar apung bawah (*GlassNavbar lama*) telah resmi **ditinggalkan** demi kemudahan navigasi dan kesesuaian dengan referensi desain digitalisasi kampus.

---

## 2. Design Tokens & Sistem Warna

### 2.1 Palet Utama (Active Theme Tokens)

Semua token didefinisikan pada `:root` di [frontend/src/ref.css](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/ref.css) dan [frontend/src/styles.css](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/styles.css):

| Token CSS | Nilai Hex / HSL | Peruntukan & Panduan Penggunaan |
|---|---|---|
| `--navy` | `#123B66` | **Warna Utama (Primary):** Teks judul, tombol aksi utama (CTA), header statistik, bar footer, dan aksen brand. |
| `--navy-2` | `#0C3154` | **Dark Navy:** State hover tombol primary, gradien gelap header modul. |
| `--sky` | `#175B91` | **Aksen Biru:** Lencana (*badge*) hero, link hover, border aksen. |
| `--mist` | `#EAF7FD` | **Latar Lembut:** Background badge, highlight baris tabel, aksen kartu sekunder. |
| `--page` / `--page2` | `#F7FBFF` | **Background Halaman:** Putih kebiruan pucat yang memberi kesan bersih dan tidak silau. |
| `--surface-solid` | `#FFFFFF` | **Surface:** Latar belakang kartu putih, modal login, drawer navigasi. |
| `--gold` | `#FFD700` | **Aksen Emas Resmi Unila:** Garis bawah (*underline*) judul hero, indikator status aktif, aksen bintang/lencana prestasi. |
| `--ink` | `#0F172A` | **Teks Utama:** Kontras tinggi untuk kenyamanan membaca di atas background terang. |
| `--muted` | `#475569` | **Teks Sekunder:** Deskripsi subjudul, metadata tanggal, keterangan label. |
| `--faint` | `#64748B` | **Teks Tersier:** Placeholder form, border pembatas halus, watermark. |

### 2.2 Warna Identitas Fakultas (Statuta Unila BAB II Pasal 5)
Digunakan secara spesifik untuk *badge/tag filter* proposal atau portofolio berdasarkan fakultas pengusul:
* **FEB (Ekonomi & Bisnis):** `#2F4F4F` (Dark Slate Gray)
* **FH (Hukum):** `#FF0000` (Merah)
* **FKIP (Keguruan & Ilmu Pendidikan):** `#800080` (Ungu)
* **FP (Pertanian):** `#008000` (Hijau)
* **FT (Teknik):** `#00008B` (Biru Tua)
* **FISIP (Ilmu Sosial & Ilmu Politik):** `#FFA500` (Jingga)
* **FMIPA (Matematika & IPA):** `#000080` (Biru Laut)
* **FK (Kedokteran):** `#006400` (Hijau Lumut)
* **Pascasarjana:** `#8B0000` (Marun)

---

## 3. Tipografi & Tata Huruf

Menggunakan Google Fonts yang dideklarasikan di awal stylesheet:
1. **Font Antarmuka & Teks Utama:** `'DM Sans', system-ui, sans-serif`
   * Digunakan untuk seluruh navigasi, judul artikel, badan teks, tombol, formulir, dan kartu.
   * Karakter bersih, geometris modern, mudah dibaca di berbagai resolusi layar.
2. **Font Angka & Metrik:** `'DM Mono', monospace`
   * Digunakan untuk angka statistik, counter skor, ID proposal, atau kode skema.
3. **Hierarki Ukuran & Skala (Fluid Typography):**
   * **Hero Title (H1):** `font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 800; line-height: 1.05;`
   * **Section Heading (H2):** `font-size: clamp(1.6rem, 3.5vw, 2.3rem); font-weight: 700;`
   * **Card Title (H3):** `font-size: 1.15rem – 1.35rem; font-weight: 700;`
   * **Body Text:** `font-size: 0.95rem – 1.05rem; line-height: 1.6;`
   * **Meta/Small:** `font-size: 0.75rem – 0.85rem; font-weight: 600;`

---

## 4. Standar Layout & Responsivitas (Mobile-First)

### 4.1 Aturan Penulisan CSS
* **Gunakan `min-width`, Hindari `max-width`:**  
  CSS dasar yang ditulis di luar media query adalah tampilan ponsel (<640px). Tambahan kolom dan perluasan tata letak ditulis di dalam breakpoint `min-width`.
* **Breakpoint Acuan:**
  * **Base (Ponsel Portrait):** `< 640px` (Satu kolom penuh, navigasi hamburger drawer).
  * **Tablet Kecil / Lanskap (`sm`):** `≥ 640px`
  * **Tablet Portabel (`md`):** `≥ 768px` (Grid 2 kolom untuk kartu berita & portofolio).
  * **Laptop / Desktop (`lg`):** `≥ 1024px` (Grid 3 kolom, layout admin 2 kolom).
  * **Desktop Lebar Navigasi (`topnav-break`):** `≥ 1100px` (Titik menu horizontal penuh menggantikan burger).
* **Area Sentuh Aman (Touch Targets):**
  * Semua elemen interaktif di ponsel (tombol burger, tombol filter, link drawer, tombol tutup) wajib memiliki target sentuh minimal **44 × 44 px**.
* **Keamanan Overflow Horizontal:**
  * Wajib gunakan `min-width: 0` pada container flexbox teks judul/brand agar teks dapat terpotong (*ellipsis*) rapi tanpa mendorong header meluber keluar layar (`scrollWidth == clientWidth`).

---

## 5. Komponen Utama & Pola Antarmuka (UI Components)

### 5.1 Top Navbar (`.site-header.topnav`)
* **Posisi:** Melayang di atas (*sticky/fixed*), `height: 4.4rem`, berlatar `rgba(247,251,255, 0.9)` dengan efek `backdrop-filter: blur(12px)`.
* **Identitas Brand:** Logo Universitas Lampung + Logo PKM Center, diikuti teks judul brand:
  ```html
  <span class="brand-text">
    PKM CENTER
    <small>UNIVERSITAS LAMPUNG</small>
  </span>
  ```
  *(Pada layar ponsel ≤600px, teks disembunyikan dan hanya menampilkan logo agar tidak memakan ruang).*
* **Menu Pengunjung (Guest):** Beranda, Tentang PKM, Timeline, Berita, Panduan, Galeri, Kontak, serta tombol CTA Navy `"Masuk"`.
* **Menu Pengguna Terotentikasi:**
  * Navigasi peran (Dosen / Reviewer / Pesan / Kelola Konten).
  * Chip profil pengguna (Avatar inisial bulat + Nama + Badge Role).
  * Tombol alih peran cepat (*Switch button*) dan tombol keluar (*Logout*).
* **Drawer Mobile:** Saat layar <1100px, tombol burger membuka drawer vertikal dari atas dengan bayangan lembut, menampung seluruh tautan menu dan aksi login/logout.

### 5.2 Halaman Beranda ([pages/Home.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/Home.jsx))
1. **Hero Section:**
   * Badge kapsul atas: `PORTAL RESMI PKM UNILA 2026`.
   * Judul besar: *"Ide hebat dimulai dari langkah pertama."* dengan aksen garis bawah emas pada kata kunci.
   * Subjudul: Deskripsi pendampingan gagasan kreatif mahasiswa Unila menuju PIMNAS.
   * Aksi CTA: Tombol utama Navy (`.btn-primary`) berbayang tebal + Tombol outline.
   * Social proof: Metrik mahasiswa aktif terdaftar + preview kartu visual skor proposal.
2. **Stats Bar Navy:**
   * Strip penuh berwarna Navy gelap (`#123B66`) dengan 4 kolom counter metrik (Proposal Diajukan, Tim Lolos Pendanaan, Lolos PIMNAS, Medali).
3. **Ekosistem PKM (Section Tentang):**
   * 3 kartu alur pembinaan: 1 kartu navy bergradasi (highlight bimbingan) + 2 kartu putih bersih (klinik ide & simulasi monev).
4. **Timeline Vertikal:**
   * Section bertema Navy gelap dengan timeline vertikal interaktif yang terhubung langsung ke data backend (tahap submit, evaluasi, hingga PIMNAS).
5. **Preview Berita & Panduan Banner:**
   * 3 kartu artikel terbaru lengkap dengan thumbnail gambar nyata dan badge kategori.
   * Banner biru muda untuk unduhan langsung Buku Pedoman PKM tahun aktif.
6. **Footer Resmi:**
   * Latar Navy solid, menampung identitas kampus, alamat sekretariat PKM Center Unila, tautan pintas, dan hak cipta resmi.

### 5.3 Komponen Halaman Publik
* **Katalog Berita & Detail:** Grid kartu responsif rasio 16:9, paginasi per 3 artikel, dan tampilan halaman baca lengkap berformat tanggal Indonesia (`id-ID`).
* **Galeri Foto & Video:** Grid foto beresolusi tajam dilengkapi modal **Lightbox** (zoom foto, navigasi keyboard panah kiri/kanan dan tombol `Esc`) serta wadah embed video YouTube.
* **Pedoman PKM:** Pencarian instan judul pedoman/skema dengan tombol unduh dokumen PDF langsung.
* **Portofolio Lolos Pendanaan:** Filter ganda chip tahun pelaksanaan + kategori skema PKM, dilengkapi akordeon ringkasan intisari proposal.
* **Kontak & Pengaduan:** Formulir pengiriman pesan/kritik saran yang langsung terhubung ke panel admin, didampingi peta lokasi Google Maps responsif.

### 5.4 Modul Khusus Pengguna & Dashboard Operasional
* **Panel Admin (`/#admin`):** Tata kelola konten publik 7 tab (Berita/Video/Galeri, Timeline, Pedoman, Portofolio, Masukan Pengunjung, Statistik Terintegrasi, Kontak).
* **Dashboard Dosen (`/#dosen`):** Header biru gradien khas modul (`linear-gradient(135deg, #0b2149, #1d4ed8)`), rekap bimbingan aktif, persetujuan/penolakan permohonan tim, dan kuota bimbingan.
* **Dashboard Reviewer (`/#reviewer`):** Antrean penilaian proposal dengan form input skor rubrik penilaian serta rekomendasi lolos/revisi.
* **Modul Pesan & Feedback (`/#pesan`):** Sistem *direct message* dua arah antara tim mahasiswa, dosen pembimbing, dan reviewer beserta riwayat catatan perbaikan naskah.

---

## 6. Struktur File CSS & Panduan Pemeliharaan

Aplikasi memisahkan styling ke dalam tiga berkas terstruktur di [frontend/src/](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/):
```text
frontend/src/
├── styles.css   # Foundation: Reset, variabel warna dasar Unila, styling form, modal, tabel, dan halaman publik
├── ref.css      # Showcase & Shell: Layout referensi Digitalisasi PKM (TopNavbar, Hero, Stats, Ekosistem, Timeline, Footer)
└── modules.css  # Internal Modules: Styling khusus modul Dosen, Reviewer, Penilaian, dan Pesan Direct Message
```

### 🚨 Aturan Pengembangan (Do's & Don'ts):
- ❌ **DILARANG** mengaktifkan kembali `GlassNavbar` apung di bawah atau dark-mode toggle (kedua elemen tersebut sudah didegradasi demi kerapian tampilan putih-navy).
- ❌ **DILARANG** memakai utility framework berat (Tailwind/Bootstrap/shadcn CLI) tanpa persetujuan, karena fondasi CSS sudah sepenuhnya mandiri dan sangat ringan.
- ❌ **DILARANG** menggunakan warna neon acak; patuhi palet Navy (`#123B66`), Biru (`#175B91`), Putih Kebiruan (`#F7FBFF`), dan Emas Unila (`#FFD700`).
- ✅ **SELALU** uji responsivitas pada lebar ponsel ekstrem (320px – 390px) serta layar laptop menengah (1024px – 1280px) untuk memastikan tidak ada *overflow horizontal*.

---

## 7. Komponen Interaktif Tingkat Lanjut & Standar `/components/ui`

Untuk memberikan pengalaman visual modern yang memukau tanpa menambah beban dependensi eksternal, komponen interaktif atomik ditempatkan pada direktori `frontend/src/components/ui/` (dengan re-export di `frontend/src/components/` untuk kenyamanan impor).

### 7.1 Mengapa Folder `/components/ui` Penting?
1. **Pemisahan Komponen Atomik vs. Komponen Bisnis:**  
   Folder `/components/ui` menjadi konvensi standar (mengadopsi pola shadcn) khusus untuk komponen presentasi murni yang berdiri sendiri (*self-contained presentation components*), seperti kartu sorot, map folder, tombol, dan modal.
2. **Kemandirian & Portabilitas:**  
   Komponen di dalam `/components/ui/` tidak terikat langsung pada state bisnis atau endpoint API tertentu, sehingga dapat dipindahkan atau digunakan ulang (*reusable*) di halaman mana pun.
3. **Kompatibilitas Plain React + Vite (Opsi A):**  
   Meskipun komponen referensi asli menggunakan format TypeScript (`.tsx`) dan Tailwind CSS, di PKM-Center komponen diadaptasi ke **Plain React (`.jsx`) + Vanilla CSS/Inline SVG/Canvas**. Komponen tetap memiliki 100% animasi fisik, gradien kaca, dan shader canvas cair tanpa memerlukan instalasi Tailwind atau konfigurasi TypeScript yang berpotensi merusak CSS global.

---

### 7.2 Spotlight Glow Card (`GlowCard`)
* **File:** [frontend/src/components/ui/spotlight-card.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/ui/spotlight-card.jsx) (Re-export: [frontend/src/components/GlowCard.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/GlowCard.jsx))
* **Fungsi:** Kartu interaktif beraksen cahaya yang melacak pergerakan kursor mouse melalui variabel CSS `--x`, `--y` dan efek *border-mask*.
* **Palet Warna Terintegrasi Unila:**
  * `gold`: Kuning keemasan resmi Unila (`#FFD700`, Hue 51) — default.
  * `blue`: Biru Navy portal (`#123B66` / `#175B91`, Hue 210).
  * `green`: Hijau daun lada / status disetujui (`#0F6B32`, Hue 135).
  * `red`: Merah semangat / tenggat waktu (`#C1121F`, Hue 0).
* **Props Utama:**
  * `glowColor` (`'gold' | 'blue' | 'green' | 'red' | 'purple' | 'orange'`): Pilihan spektrum cahaya.
  * `customSize` (`boolean`): Jika `true`, membebaskan kartu dari rasio aspek default 3:4 agar dapat membungkus layout konten apa pun.
  * `size` (`'sm' | 'md' | 'lg'`): Ukuran prasetel kartu.
* **Penerapan Nyata:** Digunakan pada 3 kartu Ekosistem di Beranda ([frontend/src/pages/Home.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/Home.jsx)).

---

### 7.3 Glass Folder Cards (`GlassFolder`)
* **File:** [frontend/src/components/ui/glass-folder-cards.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/ui/glass-folder-cards.jsx) (Re-export: [frontend/src/components/GlassFolder.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/components/GlassFolder.jsx))
* **Fungsi:** Komponen map berkas realistis tiga dimensi berlapis kaca buram (*frosted glass*) dengan seni prosedural canvas cair (*liquid noise field*).
* **Interaksi:**
  * *Rest*: Tertutup rapi dengan sedikit bagian atas dokumen terlihat.
  * *Hover*: Panel kaca depan membengkok ke depan pada engsel bawahnya (*tilt* 3D).
  * *Open (Klik / Enter)*: Lembaran berkas mekar (*fan out*) dan dapat diklik untuk membuka/mengunduh dokumen PDF.
* **Prasetel Seni (Art Presets):**
  * `unila`: Gradien cair resmi Navy, Sky, Emas Unila, dan Biru Es (Prasetel default).
  * `glacier`, `aurora`, `ember`, `dusk`, `verdant`.
* **Props Utama:**
  * `label` (`string`): Judul map folder (contoh: `"Pedoman PKM 2026"`).
  * `meta` (`string`): Keterangan ringkas dokumen (contoh: `"3 berkas aktif"`).
  * `art` (`string`): Pilihan prasetel latar belakang canvas.
  * `files` (`Array<{ name, meta, art, image, href }>`): Daftar dokumen di dalam map.
  * `width` (`number`): Lebar map dalam pixel (otomatis diskalakan responsif).
* **Penerapan Nyata:** Digunakan pada Showcase Berkas Pedoman di halaman Pedoman ([frontend/src/pages/Pedoman.jsx](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/pages/Pedoman.jsx)).

---

## 8. Standar Bahasa Desain: Neo-Glassmorphism (Diresmikan 13 Oktober 2026)

> **Keputusan Resmi Desain (Vian / Favian - UI/UX Lead):**  
> "Bahasa desain resmi PKM Center Unila disepakati menggunakan konsep **Neo-Glassmorphism**. Estetika kaca buram (*frosted glass*) yang elegan dari versi awal dihidupkan kembali dan disempurnakan agar selaras dengan palet resmi Universitas Lampung (Navy, Sky, Emas Unila, Putih Es), dengan tetap menjamin kontras teks 100% terbaca (*WCAG AAA*) serta performa yang ringan tanpa dependensi berat."

### 8.1 Mengapa Neo-Glassmorphism?
1. **Mengembalikan Identitas Visual Awal yang Berkelas:**  
   Pada awal perancangan, estetika kaca buram (*frosted glass*) memberikan kesan aplikasi modern bertaraf internasional. Melalui **Neo-Glassmorphism**, efek kaca tidak lagi mengorbankan teks; kartu menggunakan *milk glass* semi-transparan dengan kontras tinggi, border halus bercahaya, dan bayangan difus (*ambient diffuse shadow*).
2. **Menghilangkan Kebosanan Desain Datar (*Flat*):**  
   Desain serba putih datar membuat antarmuka terasa kaku seperti formulir administrasi lama. Neo-Glassmorphism menghadirkan dimensi kedalaman (*depth*), tekstur cairan, pencahayaan dinamis (*light mesh*), dan mikro-refleksi kaca (*specular highlight*).
3. **Harmonisasi dengan Palet Warna Resmi Unila:**  
   Gradien kaca membiaskan perpaduan warna Navy (`#123B66`), Sky (`#175B91`), dan aksen Emas Unila (`#FFD700`), sehingga mencerminkan identitas almamater yang prestisius dan inovatif.

---

### 8.2 Pilar & Anatomi Neo-Glassmorphism

| Elemen Desain | Spesifikasi Teknis | Karakter Visual | File Implementasi |
| :--- | :--- | :--- | :--- |
| **Ambient Radial Light Mesh** | `radial-gradient(ellipse at 15% 0%, rgba(23, 91, 145, 0.12)...)` | Pendaran cahaya lembut di latar belakang yang membuat lapisan kaca di atasnya tampak menyala alami | [frontend/src/ref.css](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/ref.css#L10-L24) |
| **Floating Frosted Topbar** | `backdrop-filter: blur(14px) saturate(180%)`, `bg: rgba(255, 255, 255, 0.88)` | Bar navigasi mengambang dengan tepian kaca halus dan bayangan elevasi lembut | [frontend/src/ref.css](file:///Users/favian/Proyek%20/PKM-Center/frontend/src/ref.css#L30-L55) |
| **Translucent Milk Glass Cards** | `rgba(255, 255, 255, 0.78)` – `0.92`, `border: 1px solid rgba(255, 255, 255, 0.9)` | Kartu putih susu semi-transparan dengan pantulan cahaya halus (*specular top edge*) | `.glass-card`, `.eco-card`, `.news-card-new` |
| **Navy Glass Accent** | `linear-gradient(145deg, rgba(12, 49, 84, 0.94), rgba(23, 91, 145, 0.88))` | Panel kaca gelap bertema navy mendalam dengan border emas/sky halus untuk kartu fitur unggulan | `.glass-card-navy`, `.eco-card.dark` |
| **Frosted Glass Pills & Badges** | `background: rgba(255, 255, 255, 0.75)`, `border: 1px solid rgba(255, 255, 255, 0.9)` | Lencana kategori semi-transparan dengan teks tebal kontras tinggi | `.glass-pill`, `.pill` |
| **Glass Input Fields** | `bg: rgba(255, 255, 255, 0.65)` normal, `0.95` fokus, `ring: rgba(23, 91, 145, 0.2)` | Input formulir dengan efek kaca yang menyatu dengan latar belakang | `.glass-input`, `.ref-login-card input` |
| **Spotlight Border Masking** | Dynamic CSS Variables `--x`, `--y` + pointer detection | Kartu menyorotkan pendar keemasan/biru saat kursor mendekati tepian kartu | `GlowCard.jsx` |
| **3D Folders with Liquid Canvas** | 3-layer perspective tilt + procedural Perlin/Simplex fluid shader | Map berkas 3D interaktif yang mekar saat diklik untuk mengunduh pedoman | `GlassFolder.jsx` |

---

### 8.3 Utilitas CSS Siap Pakai (`ref.css`)

Semua anggota tim dapat langsung menggunakan kelas utilitas Neo-Glassmorphism berikut pada modul masing-masing:

```css
/* 1. Kartu Kaca Standar (Latar Terang) */
.glass-card {
  background: var(--glass-card-bg); /* rgba(255, 255, 255, 0.78) */
  backdrop-filter: var(--glass-blur); /* blur(16px) saturate(180%) */
  border: 1px solid var(--glass-border); /* rgba(255, 255, 255, 0.90) */
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-lg);
}

/* 2. Kartu Kaca Navy (Latar Gelap / Aksen) */
.glass-card-navy {
  background: var(--glass-navy-bg); /* linear-gradient(...) */
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-navy-border); /* rgba(255, 215, 0, 0.35) */
  box-shadow: 0 16px 36px rgba(12, 49, 84, 0.22);
  color: #fff;
}

/* 3. Panel Kaca Pembungkus Bagian (Section Container) */
.glass-panel {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: var(--radius-xl);
}

/* 4. Pil / Badge Kaca */
.glass-pill {
  background: var(--glass-pill-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
}

/* 5. Input Formulir Kaca */
.glass-input {
  background: var(--glass-input-bg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(203, 213, 225, 0.8);
}
```

---

### 8.4 Prinsip Performa & Aksesibilitas Mobile
1. **Lightweight Native CSS:** Efek kaca dibuat 100% menggunakan CSS standar browser tanpa library runtime berat.
2. **Mobile Optimization (`hover: none`):**
   - Efek kalkulasi koordinat mouse spotlight otomatis dimatikan pada layar sentuh.
   - Blur dikurangi menjadi `blur(8px)` pada viewport kecil untuk menjaga 60fps rendering di perangkat ponsel spesifikasi menengah ke bawah.
3. **Graceful Degradation:** Jika browser tidak mendukung `backdrop-filter`, fallback otomatis aktif dengan latar warna solid `rgba(255, 255, 255, 0.96)` sehingga keterbacaan tetap terjaga.

