# Palet warna dari referensi

Gambar: `C:\Aidil\PKM-Center-Unila\docs\Digitalisasi Manajemen PKM.png`

Warna dominan hasil ekstraksi (k-means/top-colors, sample 256px):

| Hex | RGB | Count |
|---|---|---|
| `#F7FBFF` | `rgb(247,251,255)` | 58413 |
| `#123B66` | `rgb(18,59,102)` | 26151 |
| `#FFFFFF` | `rgb(255,255,255)` | 8425 |
| `#0C3154` | `rgb(12,49,84)` | 5303 |
| `#EAF7FD` | `rgb(234,247,253)` | 3459 |
| `#175B91` | `rgb(23,91,145)` | 2063 |
| `#F6FAFE` | `rgb(246,250,254)` | 539 |
| `#FDFEFE` | `rgb(253,254,254)` | 519 |
| `#F8FCFF` | `rgb(248,252,255)` | 456 |
| `#EBF7FD` | `rgb(235,247,253)` | 392 |

## Interpretasi

- **Background dominan**: `#F7FBFF` (putih kebiruan sangat pucat) → cocok untuk `--page`
- **Primary**: `#123B66` (navy biru) → cocok untuk `--accent` (tombol/link/heading aksen)
- **Primary hover**: `#175B91` (biru menengah) → `--accent-strong`
- **Surface**: `#FFFFFF`
- **Ink (teks utama)**: `#0F172A` (disarankan untuk kontras tinggi terhadap background pucat)
- **Aksen brand Unila (tetap dipertahankan)**: `#FFD700` (gold) untuk CTA/tab aktif, sesuai Statuta Unila

## Penerapan di CSS (light mode)

```css
:root {
  --page: #f7fbff;
  --surface-solid: #ffffff;
  --surface: rgba(255,255,255,0.88);
  --ink: #0f172a;
  --muted: #475569;
  --accent: #123b66;
  --accent-strong: #175b91;
  --accent-soft: rgba(23,91,145,0.10);
  --gold: #FFD700;
}
```

## Catatan

- Gambar referensi disimpan di: `docs/Digitalisasi Manajemen PKM.png`
- Palet ini digunakan untuk menyelaraskan tema dengan desain yang diberikan, sambil tetap konsisten dengan identitas visual Unila (emas dipertahankan sebagai aksen brand).