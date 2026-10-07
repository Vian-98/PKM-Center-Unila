# Perubahan UI: Redesign sesuai 4 gambar referensi

Tanggal: 7 Oktober 2026
Referensi: `docs/reference/Digitalisasi Manajemen PKM.png`, `-1.png`, `-2.png`, `-3.png`

## Yang diubah

### `frontend/src/main.jsx`
- Hapus `GlassNavbar` ganda. Ganti dengan `TopNavbar` tunggal atas sesuai gambar: logo kiri, menu tengah (Beranda, Tentang PKM, Timeline, Berita, Panduan), tombol `Masuk` navy kanan.
- Mobile: hamburger + drawer berisi semua rute (termasuk Portofolio, Galeri, Kontak).
- Footer baru navy sesuai gambar 4: logo + deskripsi platform + `© 2025 Universitas Lampung`.
- Rute `tentang` dan `timeline` me-render `Home` dengan scroll ke section terkait. Rute lain (berita, galeri, pedoman, portofolio, kontak, admin) tidak berubah.
- Hapus toggle dark-mode (referensi hanya light).

### `frontend/src/pages/Home.jsx` (rewrite)
- `HeroSection`: badge, H1 `Ide hebat dimulai dari langkah pertama.`, CTA `Mulai ajukan proposal` + `Pelajari PKM`, social proof `1.248 mahasiswa`, ilustrasi CSS (person + laptop PKM + kartu Idea Score 92 + kartu Tim terbaik).
- `StatsBar`: strip navy 4 kolom (438, 127, 64, 18) sesuai gambar 1.
- `Ecosystem` (id=tentang): 3 kartu sesuai gambar 2 (1 navy + 2 putih).
- `Timeline` (id=timeline): section navy, kiri copy + `Tambahkan ke kalender`, kanan timeline vertikal dari `useTimeline()` tahun 2025 (fallback 4 tahap sesuai gambar 3).
- `NewsPreview`: 3 kartu berita live dari API/fallback, cover `PKM 2025 / KLINIK IDE / PRESTASI` sesuai gambar 4.
- `PanduanBanner`: ambil pedoman terbaru dari `usePedoman()`, tombol unduh sesuai gambar 4.
- Section lama yang dihapus dari Beranda: Ticker, Stats per skema, Services lama, About/journey, GalleryPreview, FeedbackForm (fitur kontak tetap ada di halaman Kontak + admin Masukan).

### `frontend/src/ref.css` (baru, diimpor setelah `styles.css`)
- Token: `--navy #123B66`, `--navy-2 #0C3154`, `--sky #175B91`, `--gold #FFD700`.
- Semua komponen `ref-*`: topnav, hero, stats, eco, timeline, news, panduan, footer. Mobile-first, breakpoint 900px.
- `GlassNavbar` disembunyikan (`display:none`), `body padding-bottom` dinolkan.

### `frontend/src/styles.css` + `frontend/index.html`
- Token light sudah biru-putih sebelumnya; `theme-color` sudah `#123b66`. Tidak diubah lagi tahap ini.

## Dampak / kompatibilitas
- Hash routing lama tetap jalan: `#beranda #berita #berita/:id #galeri #pedoman #portofolio #kontak #admin`, plus `#tentang #timeline` (scroll ke section Home).
- API tidak berubah. Berita/timeline/pedoman di Beranda tetap live dari backend dengan fallback offline.
- Halaman Berita, Galeri, Pedoman, Portofolio, Kontak, AdminPanel tidak diubah strukturnya, hanya heading diselaraskan ke sans via `ref.css`.

## Verifikasi
- `docker compose up --build -d` sukses; frontend Vite ready; `GET /health` → `{"status":"ok"}`; `GET /` → 200.
- Cek manual: `http://localhost:5173/#beranda` (hero, stats, ekosistem, timeline, berita, panduan, footer), `#tentang`, `#timeline`, `#berita`, `#pedoman`, `#kontak`, `#admin`.

## Sisa / next
- Ganti angka stats (438/127/64/18) dengan endpoint ringkasan bila backend sudah menyediakan.
- Tambah foto/ilustrasi asli untuk hero-art bila sudah ada aset resmi (saat ini CSS murni).
- `docs/extract_colors*.py` bisa dihapus bila tidak diperlukan lagi.
