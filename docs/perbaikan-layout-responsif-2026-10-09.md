# Perbaikan Layout Responsif (Header, Login, Panel Admin)

Tanggal: 9 Oktober 2026
Konteks: laporan "modul login dll masih kepotong / ada yang gak pas" saat dipakai di desktop.
Pendekatan: tetap **mobile-first** (base = mobile, penyesuaian via `min-width`).

## Temuan (hasil audit DOM di 320–1440px)

| # | Masalah | Bukti | Dampak |
|---|---------|-------|--------|
| 1 | Header melebar keluar viewport | overflow 97–126px @320–390px; 18px @900px | scroll horizontal, elemen kepepet |
| 2 | Modal login terpotong di laptop pendek | konten kartu 683px; viewport ≤700px → terpotong 15–115px | tombol/teks bawah tidak terlihat |
| 3 | Panel admin terpotong di tablet/split-screen | `.admin-layout` butuh ~820px tapi 2 kolom aktif di 768px → overflow 32px | kolom kanan terpotong |

Temuan tambahan: `.brand` footer ikut menyusut setelah `min-width:0` diterapkan terlalu luas (diperbaiki dengan scope ke header).

## Perbaikan

### `frontend/src/ref.css`
- **Header (`.site-header.topnav`)**: gap bertingkat (`.6rem` → `1rem` @900 → `1.75rem` @1024), padding `1rem` → `5.5vw` @640.
- **Brand**: `.brand-text` disembunyikan ≤600px; ellipsis + `min-width:0` + logo `flex:none` **hanya di header**.
- **Menu**: `.topnav-links` muncul ≥900px dengan gap menyesuaikan (1.1rem → 1.6rem → 2rem) agar tidak melebar.
- **Akun mobile**: `.admin-link` & label role (`profile span`) disembunyikan di <900px.
- **Modal login**: padding/jarak diringkas (konten **683 → 575px**), `max-height` pakai `100dvh`, `overflow-y:auto`, `overscroll-behavior:contain`; di `max-height:720px` teks SSO disembunyikan.

### `frontend/src/styles.css`
- `.admin-layout` dua kolom baru aktif di **≥1024px** (sebelumnya 768px), kolom kanan `minmax(0, 1.15fr)` agar tidak memaksa lebar.

### `frontend/src/main.jsx`
- Drawer mobile: tambah akses **"Kelola konten"** dan tombol **"Keluar"** untuk pengguna yang sudah masuk (sebelumnya drawer hanya punya "Masuk" untuk guest).

## Verifikasi
- Beranda, Berita, Galeri, Pedoman, Portofolio, Kontak, detail Berita, dan panel admin: `pageOverflow = 0` di 320/360/390/600/768/900/1024/1280.
- Header: `scrollWidth == clientWidth` di semua lebar (guest & login admin).
- Modal login: muat mulai tinggi ~632px; di bawahnya scroll internal.
- Panel admin 7 tab (Konten, Timeline, Pedoman, Portofolio, Masukan, Statistik, Kontak) tanpa overflow.
- Tanpa error console.

## Catatan
- Menu penuh desktop tetap di **≥900px** (sesuai desain referensi) agar konsisten dengan breakpoint `ref-*` lainnya.
- Perubahan sudah live di dev stack (Vite HMR).
