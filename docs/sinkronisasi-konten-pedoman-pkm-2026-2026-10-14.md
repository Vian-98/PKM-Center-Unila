# Sinkronisasi Konten Pedoman dengan Panduan Resmi PKM 2026 (Belmawa)

Tanggal: 14 Oktober 2026
Konteks: konten halaman `#pedoman` masih memakai angka dan daftar yang tidak akurat (plafon dana, insentif, batas halaman, dan tautan portal generik). Halaman diselaraskan dengan **buku panduan resmi SIMBELMAWA Kemdiktisaintek tahun 2026**.
Sumber resmi: [Portal Unduh Panduan PKM 2026](https://simbelmawa.kemdiktisaintek.go.id/portal/unduh/panduan-pkm-2026/): 13 berkas PDF (`.../wp-content/uploads/2026/03/`).

## Ringkasan Koreksi (web lama → resmi 2026)

| # | Item | Sebelum | Sesudah (resmi) |
|---|------|---------|-----------------|
| 1 | Plafon dana Belmawa (8 bidang) | Rp 6.000.000 – Rp 10.000.000 | **Rp 6.000.000 – Rp 8.000.000** |
| 2 | Dana pendamping PT | tidak disebut | **Wajib, maks Rp 2.000.000** + institusi/mitra lain maks Rp 1.000.000 |
| 3 | Insentif PKM-AI | Rp 2.500.000 | **Rp 1.500.000** |
| 4 | Kuota internet | Rp 100.000/bulan **per orang** | Rp 100.000/bulan **per tim** |
| 5 | Batas halaman bagian inti | maks 10 halaman (semua) | **8 bidang maks 10**; **PKM-AI & PKM-GFT 8–15 halaman** |
| 6 | Judul proposal | tidak diatur | **Maks 20 kata**, kapital, hindari singkatan |
| 7 | Uji similaritas | tidak disebut | **Maks 25%** bagian inti (wajib dilampirkan) |
| 8 | Jumlah dokumentasi | 13 dokumen, label tahun 2025 | **17 dokumen tahun 2026** + arsip 2025/2024/2023 |
| 9 | Skema | 9 skema (tanpa PKM-KI) | **10 skema**: 8 pendanaan (RE, RSH, PM, PI, K, KC, **KI**, VGK) + 2 insentif (AI, GFT) |
| 10 | Tautan unduh | portal generik `kemdikbud.go.id` | **PDF resmi langsung** ke berkas per skema |

### Yang sudah benar (dipertahankan)
- Margin 4-3-3-3 cm, font TNR 12 pt, spasi 1,15, rata kiri-kanan, A4 satu kolom.
- Penomoran: Daftar Isi romawi (kanan bawah), bagian inti & lampiran angka Arab (kanan atas).
- Tanpa sampul/cover & tanpa lembar pengesahan (divalidasi digital di SIMBELMAWA).
- RAB 4 komponen: Bahan habis pakai maks 60%, Sewa & jasa maks 15%, Transportasi lokal maks 30%, Lain-lain maks 15%.

## Perubahan Teknis

### Backend (sumber data halaman Pedoman: API-driven)
- `internal/models/info.go`: `Pedoman` ditambah kolom `scheme`, `category`, `localDocUrl`, `funding`, `teamSize`.
- `internal/handlers/info.go`: `pedomanInput` + `Create`/`Update` menyimpan kolom baru.
- `cmd/api/main.go` (seeder): daftar pedoman diganti **17 entri resmi** (Umum, Versi Lengkap, Surat Tawaran, 8 skema pendanaan, AI, GFT, Teknis, arsip 2025–2023) dengan tautan PDF langsung; baris placeholder lama dibersihkan agar tidak duplikat.

### Frontend
- `src/lib/content.js`: `fallbackPedoman` diselaraskan (16 entri) + helper `pdf2026`; **`fallbackTimeline` ditambahkan** (sebelumnya referensi tak terdefinisi yang membuat Beranda/timeline error) memuat lini masa resmi 2026.
- `src/pages/Pedoman.jsx`: konstanta `SISTEMATIKA_USULAN_TEXT`, `FORMAT_RAB_TEXT`, `SURAT_PERNYATAAN_KETUA_TEXT`, banner RAB, kartu "Batas Halaman", tautan portal, dan daftar pos anggaran terlarang diperbarui.
- `public/docs/*.txt` (4 berkas): template Sistematika, RAB, Surat Pernyataan, dan Biodata disinkronkan.
- CSS: tab nav Pedoman satu baris (scroll horizontal di mobile), warna glow kartu (`green`/`gold`), dan overflow folder glassmorphism di layar kecil.

### Lini masa resmi PKM 2026 (Surat Tawaran No. 5/DST/B2/R/DT.01.00/2026)
Peluncuran 9 Mar · Sosialisasi 12 Mar · Seleksi internal 9 Mar–9 Apr · Penilaian April · Pengumuman 7 Mei · Pelaksanaan 7 Mei–11 Sep · PKP2 18–22 Agu · Unggah laporan 11–25 Sep · Pengumuman PIMNAS 28 Sep · PIMNAS 19–24 Okt 2026.

## Verifikasi
- `npx vite build` lolos.
- 13/13 tautan PDF resmi mengembalikan HTTP 200.
- `/api/pedoman` mengembalikan 17 baris; halaman `#pedoman` merender 17 kartu.
- Tanpa overflow di 320/390/1440; tab satu baris; tanpa error console.
- Beranda, timeline, dan portofolio kembali normal (perbaikan `fallbackTimeline`).
