# Pembagian Awal Halaman

> Dibagi jadi 4 section utama untuk tahap awal pengerjaan, dengan checklist per halaman/fitur.

---

## 1. Home — **PIC: Radhit** ✅

> **Status: selesai** (dikerjakan bersamaan dengan bagian lain; lihat catatan di bawah).

- [x] Hero/banner utama
- [x] Ringkasan "Tentang Kami" (deskripsi singkat PKM Center)
- [x] Statistik jumlah usulan proposal per skema PKM (PKM-K, PKM-PI, PKM-PM, PKM-KC, PKM-GFT, PKM-KI, PKM-AI, PKM-RE, PKM-RSH) — *diatur lewat panel admin (seksi Statistik)*
- [x] Preview berita/update terbaru (beberapa item + tombol "lihat semua")
- [x] Section "Apa yang Kami Lakukan" (poin-poin layanan/peran PKM Center)
- [x] Preview galeri foto kegiatan
- [x] Form Kritik & Saran (feedback pengunjung) — *masuk ke panel admin (seksi Masukan)*
- [x] About PKM (latar belakang, tujuan, sejarah + daftar jenis skema PKM)
- [x] Timeline PKM (per tahun, tahapan submit–review–pengumuman–PIMNAS) — *diatur lewat panel admin (seksi Timeline)*

---

## 2. Pedoman + Portofolio — **PIC: Dimas** ✅

> **Status: selesai.** Halaman publik `/#pedoman` (dengan pencarian) dan `/#portofolio` (filter tahun + skema, ringkasan dapat dibuka) sudah berjalan; data dikelola lewat panel admin seksi Pedoman & Portofolio.

### Pedoman PKM
- [x] Daftar dokumen pedoman PKM per tahun
- [x] Link/tombol download PDF (tautan ke katalog resmi SIMBELMAWA; URL dapat diganti lewat admin)
- [x] Info versi/tahun terbit pedoman

### Portofolio
- [x] Arsip proposal yang lolos pendanaan per tahun
- [x] Filter/kategori berdasarkan tahun pendanaan (chip) + skema PKM
- [x] Detail per proposal (judul, tim, skema PKM, fakultas/prodi + ringkasan)

---

## 3. Berita & Galeri — **PIC: Favian** ✅

> **Status: selesai.** Menampilkan gambar nyata dan isi artikel lengkap (data contoh), semua URL gambar terverifikasi termuat di browser. Sumber data: seed `backend/cmd/api/main.go` (server) dan `frontend/src/lib/content.js` (fallback offline).

### Berita (News)
- [x] Daftar artikel berita dengan pagination (3 per halaman)
- [x] Gambar sampul nyata di kartu berita (fallback blok warna jika gambar gagal dimuat)
- [x] Halaman detail 1 artikel: judul, tanggal (format `id-ID`), kategori, gambar, lead, dan isi paragraf
- [x] Halaman "berita tidak ditemukan" untuk ID/URL yang tidak valid
- [x] Urutan terbaru → terlama berdasarkan tanggal terbit

### Video
- [x] Daftar video kegiatan (wadah UI siap diisi embed YouTube/player)
- [x] Thumbnail otomatis dari YouTube (`i.ytimg.com`) atau URL thumbnail manual
- [x] Preview embed YouTube (iframe `youtube-nocookie`) dengan fallback "video belum ditautkan"

### Galeri Foto
- [x] Grid foto dengan gambar nyata (fallback blok warna)
- [x] Lightbox: foto besar, penanda posisi (`02 / 09`), tombol Sebelumnya/Berikutnya
- [x] Navigasi keyboard: `Esc` menutup, panah kiri/kanan berpindah foto

### Catatan
- Konten saat ini data contoh UI (termasuk gambar Unsplash) — dapat diubah melalui panel admin di `/#admin`.
- Item galeri milik pengguna (misal "test") yang dibuat lewat panel admin tetap dipertahankan karena seed bersifat non-destruktif.

---

## 4. Kontak + Halaman Login — **PIC: Aidil** ✅

> **Status: selesai.** Halaman publik `/#kontak` lengkap; login tetap berupa modal di header (bukan halaman terpisah) dan masuk ke panel admin `/#admin`.

### Kontak
- [x] Info kontak (alamat, email, telepon/WhatsApp, media sosial) — *diatur lewat panel admin (seksi Kontak)*
- [x] Peta lokasi (embed Google Maps tanpa API key, URL embed editable di admin)
- [x] Form kontak (pesan masuk ke panel admin seksi Masukan, terpisah dari Kritik & Saran via `kind`)

### Halaman Login
- [x] Form login admin/pengelola (modal di header; validasi email & kata sandi)
- [x] Validasi & auth (JWT 24 jam; sesi kadaluarsa → otomatis ke halaman akses terbatas + prompt login)
- [x] Redirect ke dashboard admin setelah login berhasil (link "Kelola konten" muncul di header; halaman `/#admin`)
- [ ] Halaman lupa password (opsional — belum dikerjakan)

---

## Catatan
- Dokumen ini pelengkap dari `rencana-awal-proyek-pkm-center-unila.md` — detail teknis (tech stack, folder, fase pengerjaan) tetap merujuk ke dokumen tersebut.
- Fitur admin CRUD (kelola berita, timeline, pedoman, portofolio, statistik, masukan, kontak) sudah diimplementasikan sebagai seksi-seksi pada panel admin `/#admin` — daftar per fitur ada di `daftar-fitur-pkm-center-unila.md`.
