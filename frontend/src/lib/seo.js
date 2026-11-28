const SITE_ORIGIN = 'https://pkm.makroboi.site'

const PUBLIC_CLEAN_PATHS = new Set([
  'beranda',
  'tentang',
  'timeline',
  'berita',
  'pedoman',
  'portofolio',
  'galeri',
  'kontak',
  'pkmate',
  'idealab',
])

const BASE_KEYWORDS =
  'pkm unila, pkm center unila, pkm, pkm center, pkm center lampung, pkm universitas lampung, pusat kreativitas mahasiswa universitas lampung, program kreativitas mahasiswa unila, pkm lampung, portal pkm unila, pimnas unila, panduan pkm unila, pkmate unila, simbelmawa unila, klinik proposal pkm lampung'

export const ROUTE_SEO = {
  beranda: {
    title: 'PKM Center Unila — Pusat Kreativitas Mahasiswa Universitas Lampung',
    description:
      'Portal resmi PKM Center Unila (Pusat Kreativitas Mahasiswa Universitas Lampung / PKM Center Lampung). Ajukan proposal PKM, uji ide lewat PKMATE AI, temukan tim multidisiplin, dosen pembimbing, panduan SIMBELMAWA, dan info PIMNAS Unila.',
    keywords: BASE_KEYWORDS,
    path: '/',
  },
  tentang: {
    title: 'Tentang Ekosistem PKM Center Unila | PKM Universitas Lampung',
    description:
      'Mengenal ekosistem PKM Center Unila (PKM Center Lampung): uji kelayakan ide berbasis AI PKMATE, kolaborasi tim lintas fakultas, dan pendampingan dosen pembimbing PKM Universitas Lampung.',
    keywords: `${BASE_KEYWORDS}, ekosistem pkm unila, mentor pkm unila`,
    path: '/tentang',
  },
  timeline: {
    title: 'Timeline & Jadwal PKM Unila 2025–2026 | PKM Center Universitas Lampung',
    description:
      'Jadwal resmi seleksi internal PKM Unila, pengusulan SIMBELMAWA, PKP2, hingga PIMNAS bersama PKM Center Universitas Lampung.',
    keywords: `${BASE_KEYWORDS}, jadwal pkm unila, timeline pkm 2026, seleksi internal pkm unila`,
    path: '/timeline',
  },
  berita: {
    title: 'Berita & Pengumuman PKM Center Unila | Info PKM Lampung Terbaru',
    description:
      'Kabar terkini, pengumuman pendaftaran, klinik proposal, sosialisasi skema, dan prestasi mahasiswa PKM Center Universitas Lampung.',
    keywords: `${BASE_KEYWORDS}, berita pkm unila, pengumuman pkm unila, prestasi pkm lampung`,
    path: '/berita',
  },
  pedoman: {
    title: 'Panduan & Pedoman Resmi PKM 2026 | PKM Center Unila',
    description:
      'Unduh Buku Panduan Umum PKM 2026, sistematika proposal 10 skema PKM (PKM-RE, PKM-RSH, PKM-K, PKM-PM, PKM-PI, PKM-KC, PKM-KI, PKM-VGK, PKM-GFT, PKM-AI), dan aturan SIMBELMAWA di PKM Center Unila.',
    keywords: `${BASE_KEYWORDS}, panduan pkm 2026, pedoman belmawa pkm, sistematika proposal pkm`,
    path: '/pedoman',
  },
  portofolio: {
    title: 'Portofolio Karya & Prestasi PKM Unila | PKM Center Lampung',
    description:
      'Etalase karya inovatif, riset, pengabdian masyarakat, dan rekam jejak prestasi mahasiswa Universitas Lampung menuju PIMNAS.',
    keywords: `${BASE_KEYWORDS}, portofolio pkm unila, juara pimnas unila, karya mahasiswa unila`,
    path: '/portofolio',
  },
  galeri: {
    title: 'Galeri Kegiatan & Dokumentasi PKM Center Unila',
    description:
      'Dokumentasi foto dan video klinik proposal, kelas pengembangan ide, diskusi multidisiplin, dan perayaan karya PKM Center Universitas Lampung.',
    keywords: `${BASE_KEYWORDS}, galeri pkm unila, kegiatan pkm center lampung`,
    path: '/galeri',
  },
  pkmate: {
    title: 'PKMATE & Idea Lab AI | Asisten Uji Ide PKM Center Unila',
    description:
      'Uji kebaruan, dampak, dan kesesuaian skema gagasan PKM Anda bersama PKMATE AI di portal PKM Center Universitas Lampung.',
    keywords: `${BASE_KEYWORDS}, pkmate, ai pkm unila, cek ide pkm, idea lab unila`,
    path: '/pkmate',
  },
  idealab: {
    title: 'PKMATE & Idea Lab AI | Asisten Uji Ide PKM Center Unila',
    description:
      'Uji kebaruan, dampak, dan kesesuaian skema gagasan PKM Anda bersama PKMATE AI di portal PKM Center Universitas Lampung.',
    keywords: `${BASE_KEYWORDS}, pkmate, ai pkm unila, cek ide pkm, idea lab unila`,
    path: '/pkmate',
  },
  kontak: {
    title: 'Kontak & Lokasi PKM Center Unila | Universitas Lampung',
    description:
      'Hubungi sekretariat PKM Center Universitas Lampung di Gedung Rektorat Unila, Jl. Prof. Dr. Soemantri Brojonegoro No. 1, Gedong Meneng, Bandar Lampung.',
    keywords: `${BASE_KEYWORDS}, kontak pkm center unila, alamat pkm center lampung, sekretariat pkm unila`,
    path: '/kontak',
  },
}

/**
 * Menentukan hash rute awal dari URL hash atau clean path (untuk crawlability SEO).
 */
export function getInitialRouteHash() {
  if (typeof window === 'undefined') return '#beranda'
  if (window.location.hash) return window.location.hash
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase()
  const firstSegment = slug.split('/')[0]
  if (PUBLIC_CLEAN_PATHS.has(firstSegment)) {
    return `#${slug}`
  }
  return '#beranda'
}

function upsertMeta(attrName, attrValue, content) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

/**
 * Memperbarui title, meta description, keywords, Open Graph, Twitter Card,
 * dan canonical URL secara dinamis sesuai rute aktif.
 */
export function applyRouteSeo(routeKey, isPrivatePortal = false) {
  const entry = ROUTE_SEO[routeKey] || ROUTE_SEO.beranda
  const canonicalUrl = `${SITE_ORIGIN}${entry.path}`

  document.title = entry.title
  upsertMeta('name', 'title', entry.title)
  upsertMeta('name', 'description', entry.description)
  upsertMeta('name', 'keywords', entry.keywords)
  upsertMeta(
    'name',
    'robots',
    isPrivatePortal
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  )

  upsertMeta('property', 'og:title', entry.title)
  upsertMeta('property', 'og:description', entry.description)
  upsertMeta('property', 'og:url', canonicalUrl)
  upsertMeta('name', 'twitter:title', entry.title)
  upsertMeta('name', 'twitter:description', entry.description)
  upsertCanonical(canonicalUrl)
}
