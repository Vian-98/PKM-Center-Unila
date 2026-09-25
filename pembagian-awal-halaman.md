# Pembagian Awal Halaman

> Dibagi jadi 4 section utama untuk tahap awal pengerjaan, dengan checklist per halaman/fitur.

---

## 1. Home — **PIC: Radhit**

- [ ] Hero/banner utama
- [ ] Ringkasan "Tentang Kami" (deskripsi singkat PKM Center)
- [ ] Statistik jumlah usulan proposal per skema PKM (PKM-K, PKM-PI, PKM-PM, PKM-KC, PKM-GFT, PKM-KI, PKM-AI, PKM-RE, PKM-RSH, dst)
- [ ] Preview berita/update terbaru (beberapa item + tombol "lihat semua")
- [ ] Section "Apa yang Kami Lakukan" (poin-poin layanan/peran PKM Center)
- [ ] Preview galeri foto kegiatan
- [ ] Form Kritik & Saran (feedback pengunjung)
- [ ] About PKM (latar belakang, tujuan, sejarah jenis-jenis PKM)
- [ ] Timeline PKM (daftar timeline per tahun, tahapan submit–review–pengumuman–PIMNAS)

---

## 2. Pedoman + Portofolio — **PIC: Dimas**

### Pedoman PKM
- [ ] Daftar dokumen pedoman PKM per tahun
- [ ] Link/tombol download PDF
- [ ] Info versi/tahun terbit pedoman

### Portofolio
- [ ] Arsip proposal yang lolos pendanaan per tahun
- [ ] Filter/kategori berdasarkan tahun pendanaan
- [ ] Detail per proposal (judul, tim, skema PKM, fakultas/prodi — opsional)

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

## 4. Kontak + Halaman Login — **PIC: Aidil**

### Kontak
- [ ] Info kontak (alamat, email, telepon/WhatsApp, media sosial)
- [ ] Peta lokasi (opsional, embed Google Maps)
- [ ] Form kontak (opsional, terpisah dari Kritik & Saran)

### Halaman Login
- [ ] Form login admin/pengelola
- [ ] Validasi & auth (JWT)
- [ ] Redirect ke dashboard admin setelah login berhasil
- [ ] Halaman lupa password (opsional)

---

## Catatan
- Dokumen ini pelengkap dari `rencana-awal-proyek-pkm-center-unila.md` — detail teknis (tech stack, folder, fase pengerjaan) tetap merujuk ke dokumen tersebut.
- Fitur admin CRUD (kelola berita, pedoman, portofolio, dsb.) belum dimasukkan di sini karena fokus tahap awal ini ke halaman guest/publik — bisa ditambahkan sebagai section 5 kalau sudah waktunya.
