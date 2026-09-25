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

const pedomanPortal = 'https://simbelmawa.kemdikbud.go.id/portals/buku-panduan/'

export const fallbackTimeline = [
  { id: 1, year: 2026, order: 1, stage: 'Sosialisasi & orientasi skema', label: 'Januari — Februari 2026', note: 'Pengenalan skema PKM dan sesi tanya jawab bagi calon pengusul.' },
  { id: 2, year: 2026, order: 2, stage: 'Pendampingan penyusunan proposal', label: 'Februari — Maret 2026', note: 'Kelas intensif, klinik proposal, dan konsultasi per kelompok.' },
  { id: 3, year: 2026, order: 3, stage: 'Pengusulan proposal (submit)', label: 'Akhir Maret 2026', note: 'Pengajuan proposal melalui sistem SIMBELMAWA.' },
  { id: 4, year: 2026, order: 4, stage: 'Review & penilaian proposal', label: 'April 2026', note: 'Penilaian oleh reviewer internal dan tingkat nasional.' },
  { id: 5, year: 2026, order: 5, stage: 'Penetapan proposal didanai', label: 'Mei 2026', note: 'Pengumuman proposal yang lolos pendanaan.' },
  { id: 6, year: 2026, order: 6, stage: 'Pelaksanaan & monitoring', label: 'Juni — Oktober 2026', note: 'Pelaksanaan kegiatan, monitoring, dan pelaporan kemajuan.' },
  { id: 7, year: 2026, order: 7, stage: 'PIMNAS', label: 'November 2026', note: 'Pekan Ilmiah Mahasiswa Nasional.' },
  { id: 8, year: 2025, order: 1, stage: 'Sosialisasi & orientasi skema', label: 'Januari 2025', note: 'Pengenalan skema PKM dan sesi tanya jawab bagi calon pengusul.' },
  { id: 9, year: 2025, order: 2, stage: 'Pendampingan penyusunan proposal', label: 'Januari — Februari 2025', note: 'Kelas intensif dan klinik proposal.' },
  { id: 10, year: 2025, order: 3, stage: 'Pengusulan proposal (submit)', label: 'Maret 2025', note: 'Batas akhir pengajuan proposal.' },
  { id: 11, year: 2025, order: 4, stage: 'Review & penilaian proposal', label: 'Maret — April 2025', note: 'Penilaian proposal tingkat nasional.' },
  { id: 12, year: 2025, order: 5, stage: 'Penetapan proposal didanai', label: 'April 2025', note: 'Pengumuman proposal yang lolos pendanaan.' },
  { id: 13, year: 2025, order: 6, stage: 'Pelaksanaan & monitoring', label: 'Mei — Oktober 2025', note: 'Pelaksanaan kegiatan dan monitoring pendanaan.' },
  { id: 14, year: 2025, order: 7, stage: 'PIMNAS', label: 'November 2025', note: 'Pekan Ilmiah Mahasiswa Nasional — tim Unila meraih 12 medali.' },
  { id: 15, year: 2024, order: 1, stage: 'Sosialisasi & orientasi skema', label: 'Januari 2024', note: 'Pengenalan skema PKM bagi mahasiswa baru.' },
  { id: 16, year: 2024, order: 2, stage: 'Pendampingan penyusunan proposal', label: 'Januari — Februari 2024', note: 'Kelas intensif dan klinik proposal.' },
  { id: 17, year: 2024, order: 3, stage: 'Pengusulan proposal (submit)', label: 'Maret 2024', note: 'Batas akhir pengajuan proposal.' },
  { id: 18, year: 2024, order: 4, stage: 'Review & penilaian proposal', label: 'Maret — April 2024', note: 'Penilaian proposal tingkat nasional.' },
  { id: 19, year: 2024, order: 5, stage: 'Penetapan proposal didanai', label: 'April 2024', note: 'Pengumuman proposal yang lolos pendanaan.' },
  { id: 20, year: 2024, order: 6, stage: 'Pelaksanaan & monitoring', label: 'Mei — Oktober 2024', note: 'Pelaksanaan kegiatan dan monitoring pendanaan.' },
  { id: 21, year: 2024, order: 7, stage: 'PIMNAS', label: 'November 2024', note: 'Pekan Ilmiah Mahasiswa Nasional.' },
]

export const fallbackPedoman = [
  { id: 1, year: 2026, title: 'Buku Panduan PKM 2026', source: 'SIMBELMAWA', fileUrl: pedomanPortal, note: 'Pedoman resmi pengusulan Program Kreativitas Mahasiswa tahun 2026.' },
  { id: 2, year: 2025, title: 'Buku Panduan PKM 2025', source: 'SIMBELMAWA', fileUrl: pedomanPortal, note: 'Pedoman resmi pengusulan Program Kreativitas Mahasiswa tahun 2025.' },
  { id: 3, year: 2024, title: 'Buku Panduan PKM 2024', source: 'SIMBELMAWA', fileUrl: pedomanPortal, note: 'Pedoman resmi pengusulan Program Kreativitas Mahasiswa tahun 2024.' },
  { id: 4, year: 2023, title: 'Buku Panduan PKM 2023', source: 'SIMBELMAWA', fileUrl: pedomanPortal, note: 'Arsip pedoman pengusulan PKM tahun 2023.' },
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
  { id: 1, scheme: 'PKM-K', count: 87 },
  { id: 2, scheme: 'PKM-PI', count: 92 },
  { id: 3, scheme: 'PKM-PM', count: 64 },
  { id: 4, scheme: 'PKM-KC', count: 41 },
  { id: 5, scheme: 'PKM-GFT', count: 12 },
  { id: 6, scheme: 'PKM-KI', count: 38 },
  { id: 7, scheme: 'PKM-AI', count: 9 },
  { id: 8, scheme: 'PKM-RE', count: 56 },
  { id: 9, scheme: 'PKM-RSH', count: 27 },
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
  'PKM-AI': 'Artikel Ilmiah',
  'PKM-RE': 'Riset Eksakta',
  'PKM-RSH': 'Riset Sosial Humaniora',
}