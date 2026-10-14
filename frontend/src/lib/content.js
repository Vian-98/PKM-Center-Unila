import { useEffect, useState } from 'react'

export const api = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`
const unsplashBig = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=75`

export const fallbackNews = [
  { id: 1, category: 'Pengumuman', date: '24 September 2026', title: 'Pendaftaran pendampingan proposal PKM segera dibuka', description: 'Siapkan ide terbaikmu dan ikuti sesi pendampingan awal bersama PKM Center.', thumbnailUrl: unsplash('1528605248644-14dd04022da1'), color: 'gold', body: 'PKM Center Universitas Lampung membuka kembali pendaftaran sesi pendampingan awal bagi mahasiswa yang ingin menyusun proposal Program Kreativitas Mahasiswa (PKM). Sesi ini terbuka untuk seluruh fakultas dan jenjang, tanpa perlu membawa draft final.\n\nPendampingan dipandu oleh fasilitator yang berpengalaman dalam pengelolaan PKM, mulai dari pemilihan skema, perumusan masalah, hingga strategi penyusunan luaran. Mahasiswa yang baru pertama kali mengenal PKM juga dipersilakan hadir untuk bertanya dan melihat contoh proposal yang pernah didanai.\n\nPendaftaran dilakukan melalui formulir daring yang akan diumumkan di halaman berita ini. Tempat terbatas sehingga peserta diprioritaskan berdasarkan urutan pendaftaran. Pantau kanal resmi PKM Center Unila untuk jadwal dan tata cara selengkapnya.' },
  { id: 2, category: 'Kegiatan', date: '17 September 2026', title: 'Meracik gagasan menjadi proposal yang berdampak', description: 'Catatan dari kelas intensif pengembangan proposal bagi mahasiswa Unila.', thumbnailUrl: unsplash('1531482615713-2afd69097998'), color: 'blue', body: 'Kelas intensif pengembangan proposal PKM kembali digelar PKM Center Unila. Peserta diajak menyusun kerangka proposal dari pertanyaan penelitian yang jernih, bukan sekadar menumpuk latar belakang.\n\nMateri mencakup cara membaca pedoman, menyusun metodologi yang realistis, serta menyelaraskan luaran dengan indikator keberhasilan. Setiap kelompok mendapat sesi konsultasi langsung sehingga revisi proposal berjalan lebih cepat dan terarah.\n\nKelas ditutup dengan presentasi singkat antarkelompok dan umpan balik dari fasilitator. Catatan dari kelas ini akan dibagikan sebagai panduan ringkas agar peserta bisa menerapkannya menjelang penutupan pengusulan.' },
  { id: 3, category: 'Prestasi', date: '10 September 2026', title: 'Merayakan karya dan kolaborasi mahasiswa Unila', description: 'Ruang apresiasi untuk perjalanan tim PKM dari kampus ke masyarakat.', thumbnailUrl: unsplash('1522071820081-009f0129c71c'), color: 'red', body: 'Perjalanan tim PKM Unila dari kampus menuju masyarakat kembali dirayakan dalam pertemuan apresiasi tahunan PKM Center. Kegiatan ini menjadi ruang bertukar cerita antartim yang telah menyelesaikan pendanaannya.\n\nBerbagai skema tampil berbagi pengalaman, dari pengabdian masyarakat, produk kewirausahaan, hingga karya inovatif. Banyak tim mengungkapkan bahwa kunci keberhasilan mereka adalah kolaborasi lintas disiplin dan konsistensi melakukan riset kecil sejak awal.\n\nMomen ini juga menjadi bahan evaluasi PKM Center untuk merancang pendampingan tahun berikutnya. Rekaman dan dokumentasi acara dapat dilihat pada halaman galeri.' },
  { id: 4, category: 'Info PKM', date: '03 September 2026', title: 'Mengenal lintasan skema Program Kreativitas Mahasiswa', description: 'Panduan awal memilih skema yang sesuai dengan pertanyaan dan gagasanmu.', thumbnailUrl: unsplash('1454165804606-c3d57bc86b40'), color: 'green', body: 'PKM memiliki beragam skema yang disesuaikan dengan jenis gagasan dan luaran yang ingin dicapai. Memahami lintasan skema sejak awal membantu mahasiswa memilih jalur yang paling sesuai dengan pertanyaan dan kapasitas timnya.\n\nSecara umum skema PKM terbagi dalam bidang riset, kewirausahaan, pengabdian masyarakat, karya inovatif, gagasan futuristik, serta penulisan ilmiah dan karsa cipta. Setiap skema memiliki pedoman, batasan anggota, dan luaran minimal yang berbeda.\n\nPKM Center Unila menyediakan pendampingan orientasi skema setiap awal periode pengusulan. Mahasiswa dapat datang ke sesi orientasi atau menghubungi kanal resmi untuk bertanya sebelum menentukan pilihan skema.' },
  { id: 5, category: 'Kegiatan', date: '27 Agustus 2026', title: 'Klinik proposal: dari riset ke aksi nyata', description: 'Belajar menyusun alur proposal yang kuat, jernih, dan mudah dipahami.', thumbnailUrl: unsplash('1517048676732-d65bc937f952'), color: 'gold', body: 'Klinik proposal PKM Center menghadirkan sesi konsultasi satu-per-satu bagi mahasiswa yang draft proposalnya telah mentok di tahap tertentu. Klinik ini dirancang untuk menjawab kebuntuan teknis, bukan sekadar ceramah umum.\n\nSetiap sesi dibatasi agar fasilitator dapat membaca naskah dan memberikan catatan yang spesifik: alur masalah, kesesuaian metode, anggaran, hingga jadwal pelaksanaan. Mahasiswa membawa draft digital dan pulang dengan daftar revisi yang jelas.\n\nKlinik diselenggarakan rutin menjelang tenggat pengusulan. Jadwal sesi diumumkan di halaman berita dan media sosial PKM Center Unila.' },
  { id: 6, category: 'Pengumuman', date: '20 Agustus 2026', title: 'Agenda PKM Center untuk semester ini', description: 'Simpan tanggal penting untuk pelatihan, klinik, dan sesi konsultasi.', thumbnailUrl: unsplash('1551836022-d5d88e9218df'), color: 'blue', body: 'PKM Center Unila merilis agenda kegiatan untuk semester ini: orientasi skema, kelas intensif, klinik proposal, pelatihan manajemen pendanaan, hingga sesi apresiasi karya.\n\nSemua agenda bersifat terbuka bagi mahasiswa Unila. Sebagian kegiatan terselenggara secara luring di kampus, sementara beberapa sesi orientasi dapat diikuti secara daring.\n\nSimpan tanggal pentingnya dan pantau pembaruan. Jadwal dapat berubah sewaktu-waktu, sehingga informasi resmi tetap merujuk pada pengumuman di halaman ini.' },
  { id: 7, category: 'Kegiatan', date: '13 Agustus 2026', title: 'Kolaborasi lintas fakultas memperkaya riset PKM', description: 'Tim lintas fakultas membawa perspektif baru dalam menyusun proposal yang berdampak.', thumbnailUrl: unsplash('1552664730-d307ca884978'), color: 'green', body: 'Tim PKM lintas fakultas semakin umum ditemukan di Unila. Perpaduan keahlian, misalnya ekonomi, hukum, dan teknik dalam satu tim, menghasilkan proposal dengan pendekatan yang lebih kaya.\n\nKolaborasi ini menuntut pembagian peran yang jelas dan komunikasi yang teratur. PKM Center mendorong mahasiswa membangun tim sejak proses perumusan gagasan, bukan hanya saat melengkapi administrasi.\n\nBagi yang ingin membentuk tim lintas fakultas, sesi orientasi menyediakan ruang perkenalan antarcalon peserta. Informasi jadwal tersedia di kanal resmi PKM Center Unila.' },
  { id: 8, category: 'Kegiatan', date: '06 Agustus 2026', title: 'Pelatihan penulisan proposal bagi pengusul baru', description: 'Panduan praktis menulis proposal PKM bagi mahasiswa yang baru pertama kali mengusulkan.', thumbnailUrl: unsplash('1523240795612-9a054b0db644'), color: 'red', body: 'PKM Center Unila mengadakan pelatihan penulisan proposal yang dikhususkan bagi pengusul pemula. Peserta belajar struktur proposal dari judul, pendahuluan, metode, hingga rencana anggaran.\n\nPelatihan menekankan kebiasaan menulis bertahap: menyusun kerangka di awal pekan, mengisi tiap bagian secara berturut-turut, lalu meminta umpan balik sebelum tenggat. Pendekatan ini mengurangi kebiasaan menyelesaikan proposal di menit terakhir.\n\nPeserta yang menyelesaikan pelatihan mendapat prioritas pada sesi klinik proposal berikutnya. Pendaftaran dibuka melalui formulir di halaman berita.' },
  { id: 9, category: 'Prestasi', date: '30 Juli 2026', title: 'Dari kampus untuk masyarakat: PKM pengabdian', description: 'Cerita tim PKM yang membawa ilmu kampus langsung ke tengah masyarakat.', thumbnailUrl: unsplash('1553877522-43269d4ea984'), color: 'gold', body: 'Salah satu wajah PKM yang paling dekat dengan masyarakat adalah skema pengabdian. Tim menyusun program yang menjawab persoalan nyata di lokasi mitra, mulai dari pelatihan keterampilan hingga pendampingan usaha.\n\nKunci keberhasilan program ini adalah komunikasi awal dengan mitra. Tim yang meluangkan waktu memahami kebutuhan lapangan cenderung menyusun program yang relevan dan berkelanjutan.\n\nPKM Center mendampingi tim pengabdian sejak penyusunan proposal hingga pelaporan akhir. Dokumentasi kegiatan dapat dilihat pada halaman galeri.' },
]

export const fallbackVideos = [
  { id: 1, title: 'Mengenal PKM Center', description: 'Tentang ruang tumbuh ide dan karya mahasiswa.', color: 'gold', category: 'Video kegiatan' },
  { id: 2, title: 'Kiat memulai proposal PKM', description: 'Langkah pertama dari gagasan menuju proposal.', color: 'blue', category: 'Video kegiatan' },
  { id: 3, title: 'Cerita dari tim PKM', description: 'Catatan proses, kolaborasi, dan pembelajaran.', color: 'red', category: 'Video kegiatan' },
]

export const fallbackGallery = [
  { id: 1, title: 'Kelas pengembangan ide', description: 'Sesi orientasi skema dan penyusunan gagasan awal.', mediaUrl: unsplashBig('1522202176988-66273c2fd55f'), color: 'gold' },
  { id: 2, title: 'Diskusi tim lintas disiplin', description: 'Ruang diskusi antartim dari berbagai fakultas.', mediaUrl: unsplashBig('1531545514256-b1400bc00f31'), color: 'blue' },
  { id: 3, title: 'Presentasi karya mahasiswa', description: 'Sesi presentasi dan umpan balik antartim.', mediaUrl: unsplashBig('1509869175650-a1d97972541a'), color: 'red' },
  { id: 4, title: 'Pendampingan proposal', description: 'Konsultasi satu-per-satu bersama fasilitator.', mediaUrl: unsplashBig('1521737604893-d14cc237f11d'), color: 'green' },
  { id: 5, title: 'Ruang kolaborasi PKM', description: 'Suasana kerja bersama di ruang PKM Center.', mediaUrl: unsplashBig('1577896851231-70ef18881754'), color: 'blue' },
  { id: 6, title: 'Belajar bersama mentor', description: 'Diskusi kecil bersama fasilitator berpengalaman.', mediaUrl: unsplashBig('1507537297725-24a1c029d3ca'), color: 'gold' },
  { id: 7, title: 'Perayaan proses dan karya', description: 'Apresiasi dan perayaan capaian tim PKM.', mediaUrl: unsplashBig('1524178232363-1fb2b075b655'), color: 'red' },
  { id: 8, title: 'Dari kampus untuk masyarakat', description: 'Kegiatan PKM yang menyentuh langsung masyarakat.', mediaUrl: unsplashBig('1571019613454-1cb2f99b2d8b'), color: 'green' },
]

export function useContent(type, fallback) {
  const [items, setItems] = useState(fallback)
  useEffect(() => {
    let alive = true
    fetch(`${api}/content?type=${type}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => { if (alive && result?.data?.length) setItems(result.data) })
      .catch(() => {})
    return () => { alive = false }
  }, [type])
  return items
}

export function formatDate(item) {
  if (item.publishedAt) {
    return new Date(item.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return item.date || 'Info PKM'
}

export function splitBody(body) {
  return (body || '').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
}

export function hideBrokenImage(event) { event.currentTarget.style.display = 'none' }

/* ------------------------------------------------------------------ */
/* Data & hook baru: timeline, pedoman, portofolio, statistik, kontak  */
/* ------------------------------------------------------------------ */

const simbelmawa2026 = 'https://simbelmawa.kemdiktisaintek.go.id/portal/wp-content/uploads/2026/03'
const pdf2026 = (name) => `${simbelmawa2026}/${name}`
const pedoman2025Portal = 'https://simbelmawa.kemdiktisaintek.go.id/portal/unduh-panduan/'
const pedoman2024Portal = 'https://simbelmawa.kemdiktisaintek.go.id/portal/panduan-pkm-2024/'
const panduanTeknisPortal = 'https://simbelmawa.kemdiktisaintek.go.id/portal/panduan-teknis-simbelmawa/'

export const fallbackPedoman = [
  {
    id: 1,
    year: 2026,
    scheme: 'UMUM',
    title: 'Buku Panduan Umum PKM 2026',
    category: 'Pedoman Umum',
    source: 'Ditjen Diktisaintek · SIMBELMAWA',
    fileUrl: pdf2026('PKM-Panduan-Umum-2026_fix.pdf'),
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Pedoman induk resmi PKM 2026: kriteria, karakteristik 10 bidang, ketentuan GenAI, uji similaritas, penilaian, pendanaan, dan PIMNAS.',
  },
  {
    id: 2,
    year: 2025,
    scheme: 'UMUM',
    title: 'Buku Panduan Umum PKM 2025',
    category: 'Pedoman Umum',
    source: 'Ditjen Diktisaintek · SIMBELMAWA',
    fileUrl: pedoman2025Portal,
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Rp 6.000.000 — Rp 10.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Panduan tata kelola, format usulan, kriteria penilaian, dan jadwal pelaksanaan PKM Pendanaan & Insentif tahun 2025.',
  },
  {
    id: 3,
    year: 2024,
    scheme: 'UMUM',
    title: 'Buku Panduan Umum PKM 2024',
    category: 'Pedoman Umum',
    source: 'Ditjen Diktisaintek · SIMBELMAWA',
    fileUrl: pedoman2024Portal,
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Rp 6.000.000 — Rp 10.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Dokumen acuan penetapan 10 skema PKM, ketentuan RAB 4 komponen, dan petunjuk penulisan tanpa cover proposal.',
  },
  {
    id: 4,
    year: 2026,
    scheme: 'UMUM',
    title: 'Panduan PKM 2026 (Versi Lengkap)',
    category: 'Pedoman Umum',
    source: 'Ditjen Diktisaintek · SIMBELMAWA',
    fileUrl: pdf2026('PANDUAN-PKM-2026_versi_full.pdf'),
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Kompilasi lengkap Panduan PKM 2026 untuk seluruh bidang (skema pendanaan & insentif) dalam satu berkas PDF resmi.',
  },
  {
    id: 5,
    year: 2026,
    scheme: 'UMUM',
    title: 'Surat Tawaran PKM 2026',
    category: 'Pengumuman',
    source: 'Ditjen Diktisaintek · No. 5/DST/B2/R/DT.01.00/2026',
    fileUrl: pdf2026('PKM-2026-Tawaran-PKM-2026-hn.pdf'),
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: '—',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Surat tawaran resmi PKM 2026: bidang yang dapat diikuti, persyaratan pengusul, lini masa penyelenggaraan, dan tautan pendaftaran.',
  },
  {
    id: 6,
    year: 2026,
    scheme: 'PKM-RE',
    title: 'Panduan PKM Riset Eksakta (PKM-RE) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Riset Laboratorium & Alam',
    fileUrl: pdf2026('PKM-RE-2026_fix.pdf'),
    localDocUrl: '/docs/proposal-nanomarine-pkm-re.pdf',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Riset eksakta: mengungkap hubungan sebab-akibat pada bidang sains, teknologi, kesehatan, dan keteknikan.',
  },
  {
    id: 7,
    year: 2026,
    scheme: 'PKM-RSH',
    title: 'Panduan PKM Riset Sosial Humaniora (PKM-RSH) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Sosial & Humaniora',
    fileUrl: pdf2026('PKM-RSH-2026_fix.pdf'),
    localDocUrl: '/docs/proposal-finsmart-pkm-pm.pdf',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Mengkaji dinamika sosial, budaya, seni, hukum, psikologi, ekonomi, kearifan lokal, dan perilaku masyarakat kontemporer.',
  },
  {
    id: 8,
    year: 2026,
    scheme: 'PKM-PM',
    title: 'Panduan PKM Pengabdian kepada Masyarakat (PKM-PM) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Pemberdayaan Mitra',
    fileUrl: pdf2026('PKM-PM-2026_fix.pdf'),
    localDocUrl: '/docs/proposal-finsmart-pkm-pm.pdf',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Pemberdayaan mitra non-profit (karang taruna, panti asuhan, kelompok tani, desa) melalui transfer inovasi dan pemecahan masalah sosial.',
  },
  {
    id: 9,
    year: 2026,
    scheme: 'PKM-PI',
    title: 'Panduan PKM Penerapan Iptek (PKM-PI) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Mitra Usaha Profit',
    fileUrl: pdf2026('PKM-PI-2026_fix.pdf'),
    localDocUrl: '/docs/proposal-agrosense-pkm-kc.pdf',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Penerapan teknologi atau manajemen mutu untuk meningkatkan produktivitas mitra usaha berskala mikro hingga menengah (UMKM).',
  },
  {
    id: 10,
    year: 2026,
    scheme: 'PKM-K',
    title: 'Panduan PKM Kewirausahaan (PKM-K) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Bisnis & Produk Komersial',
    fileUrl: pdf2026('PKM-K-2026_fix.pdf'),
    localDocUrl: '/docs/proposal-telangtea-pkm-k.pdf',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Menumbuhkan jiwa wirausaha berbasis komoditas iptek yang berorientasi laba, analisis pasar, serta keberlanjutan usaha rintisan (startup).',
  },
  {
    id: 11,
    year: 2026,
    scheme: 'PKM-KC',
    title: 'Panduan PKM Karsa Cipta (PKM-KC) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Prototipe & Rekayasa Sistem',
    fileUrl: pdf2026('PKM-KC-2026_fix.pdf'),
    localDocUrl: '/docs/proposal-padivision-pkm-kc.pdf',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Kreasi konstruktif berbasis nalar ilmiah menghasilkan sistem purwarupa fisik fungsional siap uji (hardware, software, IoT, AI).',
  },
  {
    id: 12,
    year: 2026,
    scheme: 'PKM-KI',
    title: 'Panduan PKM Karya Inovatif (PKM-KI) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Karya Kreatif & Kekayaan Intelektual',
    fileUrl: pdf2026('PKM-KI-2026_fix.pdf'),
    localDocUrl: '/docs/proposal-padivision-pkm-kc.pdf',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Karya kreatif dengan nilai kebaruan serta potensi kekayaan intelektual dan komersialisasi.',
  },
  {
    id: 13,
    year: 2026,
    scheme: 'PKM-VGK',
    title: 'Panduan PKM Video Gagasan Konstruktif (PKM-VGK) 2026',
    category: 'Pendanaan',
    source: 'SIMBELMAWA · Media Digital & Gagasan',
    fileUrl: pdf2026('PKM-VGK-2026_fix.pdf'),
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Rp 6.000.000 — Rp 8.000.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Mengomunikasikan isu pembangunan dan SDGs dalam video kreatif dengan konsep gagasan konstruktif yang berdampak.',
  },
  {
    id: 14,
    year: 2026,
    scheme: 'PKM-AI',
    title: 'Panduan PKM Artikel Ilmiah (PKM-AI) 2026',
    category: 'Insentif',
    source: 'SIMBELMAWA · Publikasi Ilmiah',
    fileUrl: pdf2026('PKM-AI-2026_fix.pdf'),
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Insentif Rp 1.500.000',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Artikel ilmiah berbasis kegiatan akademik yang telah selesai dilaksanakan (KKN, magang, tugas akhir, atau riset mandiri).',
  },
  {
    id: 15,
    year: 2026,
    scheme: 'PKM-GFT',
    title: 'Panduan PKM Gagasan Futuristik Tertulis (PKM-GFT) 2026',
    category: 'Insentif',
    source: 'SIMBELMAWA · Karya Tulis Visioner',
    fileUrl: pdf2026('PKM-GFT-2026_fix.pdf'),
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Insentif',
    teamSize: '3 — 5 Mahasiswa',
    note: 'Gagasan visioner futuristik berskala besar untuk menyelesaikan persoalan strategis bangsa dalam jangka panjang.',
  },
  {
    id: 16,
    year: 2026,
    scheme: 'TEKNIS',
    title: 'Buku Pintar Panduan Teknis Akun SIMBELMAWA',
    category: 'Panduan Teknis',
    source: 'SIMBELMAWA Kemdiktisaintek',
    fileUrl: panduanTeknisPortal,
    localDocUrl: '/docs/panduan-format-sistematika-proposal-belmawa.txt',
    funding: 'Akses Sistem',
    teamSize: 'Ketua / Dosen / Operator',
    note: 'Petunjuk teknis pengisian akun ketua pengusul, verifikasi dosen pendamping, pendaftaran anggota, hingga validasi perguruan tinggi.',
  },
]

export const fallbackPortfolio = [
  { id: 1, year: 2025, title: 'Optimalisasi Potensi Wisata Embung melalui Pengembangan Ekonomi Kreatif Berbasis Komunitas', team: 'Alya Rahma, Bagas Prasetyo, Citra Ayu, Dimas Aditya', scheme: 'PKM-PM', faculty: 'FISIP', prodi: 'Ilmu Komunikasi', description: 'Program pengabdian kepada masyarakat untuk mengembangkan ekonomi kreatif berbasis komunitas di kawasan wisata Embung, mencakup pelatihan tata kelola, pemasaran digital, dan pendampingan berkelanjutan.' },
  { id: 2, year: 2025, title: 'Sistem Monitoring Kualitas Air Budidaya Ikan Berbasis IoT', team: 'Raka Maulana, Sinta Dewi, Fajar Ramadhan, Nadia Putri', scheme: 'PKM-KC', faculty: 'FMIPA', prodi: 'Fisika', description: 'Purwarupa alat pemantau suhu, pH, dan oksigen terlarut kolam ikan secara real-time dengan notifikasi ke ponsel pembudidaya.' },
  { id: 3, year: 2025, title: 'Budpupuk: Pupuk Organik dari Limbah Rumah Tangga', team: 'Dewi Lestari, Eko Saputra, Fina Amelia, Galih Pratama', scheme: 'PKM-K', faculty: 'FEB', prodi: 'Manajemen', description: 'Usaha pupuk organik dari limbah rumah tangga dengan model kemitraan bersama bank sampah setempat.' },
  { id: 4, year: 2025, title: 'Aplikasi Belajar Membaca bagi Anak Usia Dini dengan Metode Fonik', team: 'Intan Permata, Joko Susilo, Kania Rahma', scheme: 'PKM-PI', faculty: 'FKIP', prodi: 'PG PAUD', description: 'Aplikasi pembelajaran membaca berbasis metode fonik yang dikembangkan bersama komunitas guru PAUD.' },
  { id: 5, year: 2025, title: 'Terapi Relaksasi Digital untuk Menurunkan Stres Akademik Mahasiswa', team: 'Laila Nur, Miftahul Huda, Nabila Salsabila, Oktavian Saputra', scheme: 'PKM-RE', faculty: 'Fakultas Kedokteran', prodi: 'Pendidikan Dokter', description: 'Studi eksperimental pengaruh terapi relaksasi digital terhadap tingkat stres akademik mahasiswa.' },
  { id: 6, year: 2024, title: 'Sekotong Pintar: Edukasi Pencegahan Stunting Berbasis Media Digital', team: 'Putri Maharani, Qori Aini, Reza Akbar, Salsabila Fitri', scheme: 'PKM-PM', faculty: 'Kedokteran', prodi: 'Ilmu Kesehatan Masyarakat', description: 'Edukasi pencegahan stunting melalui media digital bagi ibu balita di daerah pesisir Lampung.' },
  { id: 7, year: 2024, title: 'Klinik Tanaman: Deteksi Penyakit Daun Berbasis Citra', team: 'Taufik Hidayat, Umi Kalsum, Vina Agustina, Wildan Fauzi', scheme: 'PKM-KC', faculty: 'FMIPA', prodi: 'Ilmu Komputer', description: 'Sistem deteksi dini penyakit daun tanaman pangan menggunakan pengolahan citra dan pembelajaran mesin.' },
  { id: 8, year: 2024, title: 'Keripik Bayam Kaya Zat Besi sebagai Camilan Sehat Remaja', team: 'Yoga Pratama, Zainab Zahra, Andi Firmansyah, Bella Safitri', scheme: 'PKM-K', faculty: 'Fakultas Pertanian', prodi: 'Teknologi Hasil Pertanian', description: 'Inovasi olahan bayam menjadi keripik dengan kandungan zat besi tinggi yang disukai remaja.' },
  { id: 9, year: 2024, title: 'Robocar: Kendaraan Listrik Mini untuk Pembelajaran STEM', team: 'Candra Wijaya, Dimas Pangestu, Elsa Melati, Farhan Maulana', scheme: 'PKM-KI', faculty: 'Fakultas Teknik', prodi: 'Teknik Elektro', description: 'Prototipe kendaraan listrik mini sebagai media pembelajaran STEM di sekolah menengah.' },
  { id: 10, year: 2024, title: 'Gagasan Kota Hijau untuk Bandar Lampung Menuju Netralitas Karbon 2050', team: 'Gita Salsabilla, Haris Munandar, Ines Anggraini', scheme: 'PKM-GFT', faculty: 'Fakultas Teknik', prodi: 'Perencanaan Wilayah dan Kota', description: 'Gagasan futuristik tertulis tentang infrastruktur hijau dan regulasi menuju netralitas karbon kota.' },
]

export const fallbackStats = [
  { id: 1, scheme: 'PKM-K', count: 115 },
  { id: 2, scheme: 'PKM-RE', count: 58 },
  { id: 3, scheme: 'PKM-RSH', count: 41 },
  { id: 4, scheme: 'PKM-PM', count: 32 },
  { id: 5, scheme: 'PKM-KC', count: 28 },
  { id: 6, scheme: 'PKM-AI', count: 15 },
  { id: 7, scheme: 'PKM-GFT', count: 13 },
  { id: 8, scheme: 'PKM-KI', count: 7 },
  { id: 9, scheme: 'PKM-VGK', count: 6 },
  { id: 10, scheme: 'PKM-PI', count: 3 },
]

export const fallbackContact = {
  address: 'Gedung Rektorat Unila, Jl. Prof. Dr. Soemantri Brojonegoro No. 1, Gedong Meneng, Bandar Lampung 35145',
  email: 'pkmcenter@unila.ac.id',
  phone: '(0721) 704 947',
  whatsApp: '+62 812 7019 8888',
  instagram: '@pkmcenter.unila',
  facebook: 'PKM Center Universitas Lampung',
  mapEmbed: 'https://maps.google.com/maps?q=Universitas%20Lampung&t=&z=15&ie=UTF8&iwloc=&output=embed',
}

export function useApi(path, fallback) {
  const [items, setItems] = useState(fallback)
  useEffect(() => {
    let alive = true
    fetch(`${api}${path}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => { if (alive && result?.data) setItems(result.data) })
      .catch(() => {})
    return () => { alive = false }
  }, [path])
  return items
}

export const fallbackTimeline = [
  // 2026 — Lini masa resmi (Surat Tawaran PKM 2026 No. 5/DST/B2/R/DT.01.00/2026)
  { id: 101, year: 2026, order: 1, stage: 'Peluncuran PKM 2026', label: '9 Maret 2026', note: 'Peluncuran resmi PKM 2026 melalui portal SIMBELMAWA.' },
  { id: 102, year: 2026, order: 2, stage: 'Sosialisasi program', label: '12 Maret 2026', note: 'Sosialisasi PKM 2026 kepada perguruan tinggi.' },
  { id: 103, year: 2026, order: 3, stage: 'Seleksi internal & pengusulan', label: '9 Maret – 9 April 2026', note: 'Pendaftaran dan pengunggahan proposal melalui SIMBELMAWA.' },
  { id: 104, year: 2026, order: 4, stage: 'Penilaian proposal', label: 'April 2026', note: 'Penilaian proposal oleh reviewer tingkat nasional.' },
  { id: 105, year: 2026, order: 5, stage: 'Pengumuman pendanaan', label: '7 Mei 2026', note: 'Pengumuman proposal yang lolos pendanaan.' },
  { id: 106, year: 2026, order: 6, stage: 'Pelaksanaan kegiatan', label: '7 Mei – 11 September 2026', note: 'Pelaksanaan kegiatan PKM dan monitoring.' },
  { id: 107, year: 2026, order: 7, stage: 'PKP2 (Penilaian Kemajuan)', label: '18 – 22 Agustus 2026', note: 'Penilaian kemajuan pelaksanaan kegiatan.' },
  { id: 108, year: 2026, order: 8, stage: 'Unggah laporan akhir', label: '11 – 25 September 2026', note: 'Pengunggahan laporan akhir kegiatan.' },
  { id: 109, year: 2026, order: 9, stage: 'Pengumuman PIMNAS', label: '28 September 2026', note: 'Pengumuman tim yang lolos PIMNAS.' },
  { id: 110, year: 2026, order: 10, stage: 'PIMNAS', label: '19 – 24 Oktober 2026', note: 'Pekan Ilmiah Mahasiswa Nasional.' },
  // 2025
  { id: 201, year: 2025, order: 1, stage: 'Sosialisasi & orientasi skema', label: 'Januari 2025', note: 'Pengenalan skema PKM dan sesi tanya jawab bagi calon pengusul.' },
  { id: 202, year: 2025, order: 2, stage: 'Pendampingan penyusunan proposal', label: 'Januari — Februari 2025', note: 'Kelas intensif dan klinik proposal.' },
  { id: 203, year: 2025, order: 3, stage: 'Pengusulan proposal (submit)', label: 'Maret 2025', note: 'Batas akhir pengajuan proposal.' },
  { id: 204, year: 2025, order: 4, stage: 'Review & penilaian proposal', label: 'Maret — April 2025', note: 'Penilaian proposal tingkat nasional.' },
  { id: 205, year: 2025, order: 5, stage: 'Penetapan proposal didanai', label: 'April 2025', note: 'Pengumuman proposal yang lolos pendanaan.' },
  { id: 206, year: 2025, order: 6, stage: 'Pelaksanaan & monitoring', label: 'Mei — Oktober 2025', note: 'Pelaksanaan kegiatan dan monitoring pendanaan.' },
  { id: 207, year: 2025, order: 7, stage: 'PIMNAS', label: 'November 2025', note: 'Pekan Ilmiah Mahasiswa Nasional — tim Unila meraih 12 medali.' },
  // 2024
  { id: 301, year: 2024, order: 1, stage: 'Sosialisasi & orientasi skema', label: 'Januari 2024', note: 'Pengenalan skema PKM bagi mahasiswa baru.' },
  { id: 302, year: 2024, order: 2, stage: 'Pendampingan penyusunan proposal', label: 'Januari — Februari 2024', note: 'Kelas intensif dan klinik proposal.' },
  { id: 303, year: 2024, order: 3, stage: 'Pengusulan proposal (submit)', label: 'Maret 2024', note: 'Batas akhir pengajuan proposal.' },
  { id: 304, year: 2024, order: 4, stage: 'Review & penilaian proposal', label: 'Maret — April 2024', note: 'Penilaian proposal tingkat nasional.' },
  { id: 305, year: 2024, order: 5, stage: 'Penetapan proposal didanai', label: 'April 2024', note: 'Pengumuman proposal yang lolos pendanaan.' },
  { id: 306, year: 2024, order: 6, stage: 'Pelaksanaan & monitoring', label: 'Mei — Oktober 2024', note: 'Pelaksanaan kegiatan dan monitoring pendanaan.' },
  { id: 307, year: 2024, order: 7, stage: 'PIMNAS', label: 'November 2024', note: 'Pekan Ilmiah Mahasiswa Nasional.' },
]

export const useTimeline = () => useApi('/timeline', fallbackTimeline)
export const usePedoman = () => useApi('/pedoman', fallbackPedoman)
export const usePortfolio = () => useApi('/portfolio', fallbackPortfolio)
export const useStats = () => useApi('/stats', fallbackStats)
export const useContact = () => useApi('/contact', fallbackContact)

export async function submitFeedback(payload) {
  const response = await fetch(`${api}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Gagal mengirim pesan.')
  return result.data
}

export const schemeNames = {
  'PKM-K': 'Kewirausahaan',
  'PKM-PI': 'Penerapan Iptek',
  'PKM-PM': 'Pengabdian kepada Masyarakat',
  'PKM-KC': 'Karsa Cipta',
  'PKM-GFT': 'Gagasan Futuristik Tertulis',
  'PKM-KI': 'Karya Inovatif',
  'PKM-VGK': 'Video Gagasan Konstruktif',
  'PKM-AI': 'Artikel Ilmiah',
  'PKM-RE': 'Riset Eksakta',
  'PKM-RSH': 'Riset Sosial Humaniora',
}