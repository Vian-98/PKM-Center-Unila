# Acuan Design PKM-Center

> Dokumen acuan visual & komponen untuk project **PKM-Center** (base: React + Vite, plain JS, belum pakai TypeScript/Tailwind/shadcn). Pendekatan pengembangan UI mengikuti prinsip **mobile-first**.

---

## 1. Prinsip Mobile-First

Karena target pengguna PKM-Center kemungkinan besar mahasiswa yang sering akses lewat HP (buka info timeline, pedoman, berita di sela kuliah), semua komponen di dokumen ini didesain **mobile dulu, baru discale ke desktop** — bukan sebaliknya.

### 1.1 Kenapa Mobile-First, Bukan Desktop-First
- Layout mobile itu lebih terbatas (ruang sempit, satu kolom) → kalau didesain dari mobile dulu, kamu dipaksa fokus ke konten & fitur paling penting duluan
- Lebih gampang **menambah** elemen buat layar besar (nav lengkap, sidebar, grid multi-kolom) daripada **membongkar** layout desktop yang penuh supaya muat di layar kecil
- Performa: kode CSS default (base, tanpa media query) otomatis dikirim ke semua device, jadi kalau base-nya ringan (mobile), device kecil gak perlu "buang" style yang dioverride

### 1.2 Aturan CSS: `min-width`, Bukan `max-width`
Base style = mobile. Tambahan buat layar besar pakai `@media (min-width: ...)`, bukan sebaliknya.

```css
/* ❌ Desktop-first (yang dipakai di komponen asli) */
.card { width: 400px; }
@media (max-width: 768px) {
  .card { width: 100%; }
}

/* ✅ Mobile-first (yang dipakai di dokumen ini) */
.card { width: 100%; }
@media (min-width: 768px) {
  .card { width: 400px; }
}
```

### 1.3 Breakpoint yang Dipakai
| Nama | Lebar | Konteks |
|---|---|---|
| Base (mobile) | `< 640px` | Default, tanpa media query |
| `sm` | `≥ 640px` | HP landscape / phablet |
| `md` | `≥ 768px` | Tablet |
| `lg` | `≥ 1024px` | Desktop kecil / laptop |

### 1.4 Prinsip Teknis Tambahan
- **Touch target minimal 44×44px** (standar aksesibilitas iOS/Android) — tombol, tab navbar, ikon interaktif jangan lebih kecil dari itu di mobile
- **Hindari efek `hover`-only** sebagai satu-satunya cara berinteraksi — di HP gak ada hover, jadi state "aktif" harus tetap kebaca lewat tap/klik biasa
- **Nonaktifkan efek berat berbasis cursor** (seperti glow-tracking di Spotlight Card) di device tanpa mouse, pakai media query:
  ```css
  @media (hover: hover) and (pointer: fine) {
    /* efek cursor-tracking cuma aktif di device yang punya mouse presisi */
  }
  ```
- **`backdrop-filter: blur()`** cukup berat di HP low-end — pertimbangkan turunkan intensitas blur di mobile (misal `blur(10px)` bukan `blur(20px)`) untuk jaga performa scroll
- **Font & spacing pakai unit relatif** (`rem`, `%`, `clamp()`) supaya otomatis menyesuaikan ukuran layar, bukan `px` tetap

---

## 2. Spotlight Glow Card

### 2.1 Apa Itu
Card dengan efek **glow/spotlight** yang mengikuti posisi kursor mouse — mirip efek yang sering dipakai di landing page produk modern (cahaya warna-warni yang "menempel" di border card sesuai posisi mouse di layar).

### 2.2 Dependensi Asli
| Dependency | Fungsi |
|---|---|
| React (`useEffect`, `useRef`) | State & lifecycle |
| TypeScript | Type safety (`interface GlowCardProps`) |
| Tailwind CSS | Semua styling utility |
| shadcn project structure | Convention folder `@/components/ui/` |

**Tidak ada library animasi eksternal** — efeknya murni CSS + JS vanilla (CSS variables + `radial-gradient` + event listener).

### 2.3 Cara Kerja (Step by Step)
1. **Event listener global** di `document` untuk `pointermove` — mouse di mana pun di layar tetap ke-track (bukan cuma pas hover di card)
2. Posisi X/Y disimpan sebagai **CSS custom property** (`--x`, `--y`) langsung di elemen card
3. **`radial-gradient`** dipakai sebagai `backgroundImage`, titik pusatnya mengikuti `--x`/`--y` → efek cahaya "mengikuti" cursor
4. **Warna** dihitung dinamis pakai `hsl()` berdasarkan posisi mouse relatif ke lebar layar (`--xp`)
5. **Border glow** dibuat lewat pseudo-element `::before`/`::after`
6. **`backdrop-blur`** di card utama untuk efek kaca buram

### 2.4 Catatan Mobile-First
Efek glow-tracking cursor ini **secara alami tidak relevan di HP** (gak ada cursor/mouse). Dua pendekatan:
- **Opsi A (disarankan):** matikan `pointermove` listener di device tanpa mouse (deteksi lewat `matchMedia('(pointer: fine)')`), lalu tampilkan glow statis (posisi tetap di tengah/pojok card) sebagai gantinya — tetap dapat kesan visual "glow" tanpa buang resource
- **Opsi B:** ganti glow di mobile dengan efek `:active` sederhana (border menyala pas card di-tap), lebih ringan & terasa natural sebagai feedback sentuhan

### 2.5 Adaptasi ke Project Kamu (Plain React + Vite, Mobile-First)

`src/components/GlowCard.jsx`
```jsx
import { useEffect, useRef, useState } from 'react'

const glowColorMap = {
  gold: { base: 51, spread: 40 },   // #FFD700 — warna Unila
  blue: { base: 210, spread: 40 },  // #1E90FF — warna Unila
  green: { base: 120, spread: 40 },
  red: { base: 0, spread: 40 },
}

export function GlowCard({ children, glowColor = 'gold', className = '' }) {
  const cardRef = useRef(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    // deteksi apakah device punya mouse presisi (bukan touch-only)
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    setCanHover(mq.matches)

    if (!mq.matches) return // mobile/touch: skip listener, hemat resource

    const syncPointer = (e) => {
      if (!cardRef.current) return
      cardRef.current.style.setProperty('--x', e.clientX)
      cardRef.current.style.setProperty('--y', e.clientY)
      cardRef.current.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
    }
    document.addEventListener('pointermove', syncPointer)
    return () => document.removeEventListener('pointermove', syncPointer)
  }, [])

  const { base, spread } = glowColorMap[glowColor]

  return (
    <div
      ref={cardRef}
      className={`glow-card ${canHover ? 'glow-card--interactive' : 'glow-card--static'} ${className}`}
      style={{ '--base': base, '--spread': spread }}
    >
      {children}
    </div>
  )
}
```

`src/styles.css` (mobile-first)
```css
/* Base = mobile: efek glow statis, blur ringan */
.glow-card {
  position: relative;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(6px);
  background-color: hsl(0 0% 60% / 0.12);
  padding: 1rem;
  overflow: hidden;
  min-height: 44px; /* touch target aman */
}

.glow-card--static::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(
    120px 120px at 50% 0%,
    hsl(var(--base) 100% 70% / 0.25),
    transparent 70%
  );
}

.glow-card--static:active::before {
  background: radial-gradient(
    160px 160px at 50% 0%,
    hsl(var(--base) 100% 70% / 0.4),
    transparent 70%
  );
}

/* Tambahan = desktop: efek glow mengikuti cursor */
@media (hover: hover) and (pointer: fine) {
  .glow-card--interactive::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
      150px 150px at var(--x, 0px) var(--y, 0px),
      hsl(calc(var(--base) + (var(--xp, 0) * var(--spread))) 100% 70% / 0.35),
      transparent 70%
    );
    backdrop-filter: blur(5px);
  }
}
```

### 2.6 Props yang Tersedia
| Prop | Tipe | Default | Keterangan |
|---|---|---|---|
| `glowColor` | `'gold' \| 'blue' \| 'green' \| 'red'` | `'gold'` | Warna dasar glow, sesuai palet Unila |
| `className` | `string` | `''` | Class tambahan opsional |

---

## 3. Glassmorphism Navbar (dengan Dark Mode Toggle)

### 3.1 Apa Itu
Navigation bar melayang (floating) dengan efek **frosted glass** (kaca buram), indikator tab aktif yang bergerak smooth ("lamp" effect), dan tombol toggle dark/light mode dengan animasi rotate icon.

### 3.2 Dependensi Asli
| Dependency | Fungsi |
|---|---|
| React (`useState`, `useEffect`) | State tab aktif, theme, responsive |
| TypeScript | Type safety |
| Next.js (`"use client"`) | Directive client component (tidak relevan untuk Vite, bisa dihapus) |
| Tailwind CSS | Semua styling |
| shadcn (`cn()` helper) | Gabungin className kondisional |
| Framer Motion | Animasi "lamp" indicator + rotate icon Moon/Sun |
| lucide-react | Icon (Home, User, Briefcase, dst) |

### 3.3 Catatan Mobile-First (Penting)
Komponen aslinya sudah **punya niat mobile-first** dari posisinya:
```css
fixed bottom-0 sm:top-0   /* mobile: nempel bawah layar (mudah dijangkau ibu jari) */
                            /* desktop (sm ke atas): pindah ke atas, pola navbar biasa */
```
Ini pola bagus — dipertahankan di versi adaptasi. Tambahan penyesuaian mobile-first:
- **Base style (mobile)**: navbar full-width menempel bawah, teks label disembunyikan, cuma tampil icon (hemat ruang horizontal)
- **`min-width: 768px` ke atas (tablet/desktop)**: navbar berubah jadi pill mengambang di atas, teks label muncul, icon tetap ada sebagai pelengkap (opsional)
- Semua tombol tab & toggle theme dikasih `min-width`/`min-height: 44px` biar nyaman di-tap jempol

### 3.4 Adaptasi ke Project Kamu (Plain React + Vite, Mobile-First)

`src/components/GlassNavbar.jsx`
```jsx
import { useState, useEffect } from 'react'

export function GlassNavbar({ items, defaultTheme = 'light' }) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [theme, setTheme] = useState(defaultTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <nav className={`glass-navbar ${theme}`}>
      {items.map((item) => (
        <button
          key={item.name}
          onClick={() => setActiveTab(item.name)}
          className={`glass-navbar-tab ${activeTab === item.name ? 'active' : ''}`}
        >
          {item.icon && <span className="glass-navbar-icon">{item.icon}</span>}
          <span className="glass-navbar-label">{item.name}</span>
        </button>
      ))}
      <div className="glass-navbar-divider" />
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="glass-navbar-toggle"
        aria-label="Ganti tema"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  )
}
```

`src/styles.css` (mobile-first)
```css
/* Base = mobile: full-width, nempel bawah, icon-only */
.glass-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 0.25rem;
  padding: 0.5rem;
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  background: rgba(255,255,255,0.35);
  border-top: 1px solid rgba(0,0,0,0.05);
}
.glass-navbar.dark {
  background: rgba(20,20,20,0.5);
  border-color: rgba(255,255,255,0.1);
}

.glass-navbar-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0.4rem 0.6rem;
  border-radius: 12px;
  border: none;
  background: transparent;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}
.glass-navbar-tab.active {
  background: rgba(255, 215, 0, 0.18); /* aksen gold Unila */
  color: #b8860b;
}
.glass-navbar-label { display: none; } /* mobile: teks disembunyikan */

.glass-navbar-divider {
  width: 1px;
  height: 1.5rem;
  background: rgba(0,0,0,0.1);
}

.glass-navbar-toggle {
  min-width: 44px;
  min-height: 44px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 0.3s ease;
}
.glass-navbar-toggle:active { transform: scale(0.92); }

/* Tambahan = tablet/desktop (≥768px): pill mengambang di atas, teks muncul */
@media (min-width: 768px) {
  .glass-navbar {
    bottom: auto;
    top: 1.5rem;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    justify-content: center;
    gap: 0.75rem;
    padding: 0.35rem;
    border-radius: 9999px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
  .glass-navbar-tab {
    flex-direction: row;
    min-width: auto;
    padding: 0.5rem 1.25rem;
    border-radius: 9999px;
    font-size: 0.875rem;
  }
  .glass-navbar-label { display: inline; }
  .glass-navbar-icon { display: none; } /* desktop: teks aja cukup, tanpa icon */
}
```

> Catatan performa: intensitas `backdrop-filter` sengaja lebih rendah di mobile (`blur(12px)`) dibanding desktop (`blur(20px)`) — device HP low-end lebih sensitif terhadap beban render blur, apalagi navbar ini `position: fixed` dan selalu aktif saat scroll.

**Opsi tambahan animasi (Framer Motion)** — kalau tetap mau animasi "lamp" persis versi asli:
```bash
npm install framer-motion
```
Framer Motion sendiri sudah ringan & tidak menghambat prinsip mobile-first, tapi kalau prioritasnya performa maksimal di HP low-end, versi CSS `transition` di atas sudah cukup dan lebih hemat bundle size.

---

## 4. Ringkasan Perbandingan

| Aspek | Spotlight Card | Glassmorphism Navbar |
|---|---|---|
| Efek utama | Glow mengikuti cursor (desktop) / glow statis + `:active` (mobile) | Frosted glass, posisi adaptif (bawah di mobile, atas di desktop) |
| Tracking mouse | Ya, hanya jika `(hover: hover) and (pointer: fine)` | Tidak |
| Perlu deteksi device? | Ya (`matchMedia`) | Tidak perlu JS, cukup CSS media query |
| Butuh Framer Motion? | Tidak | Opsional (bisa diganti CSS transition) |
| Cocok dipakai di | Card berita/portofolio di Home | Navbar utama PKM-Center |

---

## 5. Rekomendasi Penerapan di PKM-Center

1. **Navbar**: ganti navbar biasa di `Header` (`main.jsx`) pakai `GlassNavbar` — posisi bawah di mobile pas banget buat pola navigasi thumb-friendly ala app mobile
2. **Card berita**: bungkus tiap `news-card` di `NewsIndex` pakai `GlowCard`, `glowColor` mengikuti warna kategori berita yang sudah ada (`gold`, `blue`, `red`, `green`)
3. **Palet warna**: `base`/`hue` di kedua komponen sudah disesuaikan ke warna Unila (`#FFD700` gold, `#1E90FF` biru), konsisten dengan `rencana-awal-proyek-pkm-center-unila.md`
4. **Urutan pengerjaan disarankan**: bangun & uji tampilan di lebar layar HP (≤480px) dulu sampai nyaman, baru cek & sesuaikan breakpoint `md`/`lg`
5. **Testing**: selalu test pakai Chrome DevTools device toolbar / HP asli — jangan cuma andalkan resize browser desktop, karena `pointer`/`hover` media query behavior beda antara "browser desktop di-resize kecil" vs "HP asli"

---

## 6. Yang TIDAK Perlu Diinstall
Karena project kamu plain React + Vite (bukan Next.js + shadcn + TypeScript), kamu **tidak perlu**:
- Setup shadcn CLI
- Install TypeScript
- Install Tailwind CSS (opsional, bukan keharusan)
- `@/lib/utils` (`cn()` helper) — cukup template string biasa buat conditional className
