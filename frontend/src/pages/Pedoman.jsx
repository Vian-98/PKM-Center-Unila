import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { Breadcrumb } from '../components/Breadcrumb'
import GlassFolder from '../components/GlassFolder'
import GlowCard from '../components/GlowCard'
import { usePedoman } from '../lib/content'
import {
  BookOpen,
  FileText,
  DollarSign,
  Paperclip,
  Award,
  Copy,
  Check,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Info
} from 'lucide-react'

// Official Plain Text Templates sourced directly from Belmawa Kemdiktisaintek Guidelines
const SURAT_PERNYATAAN_KETUA_TEXT = `SURAT PERNYATAAN KETUA TIM PENGUSUL
PROGRAM KREATIVITAS MAHASISWA (PKM)
KEMDIKTISAINTEK / SIMBELMAWA

Yang bertanda tangan di bawah ini:
Nama Ketua Tim              : [Nama Lengkap Ketua Tim]
Nomor Induk Mahasiswa (NIM) : [NPM / NIM Mahasiswa]
Program Studi               : [Nama Program Studi]
Fakultas                    : [Nama Fakultas]
Perguruan Tinggi            : Universitas Lampung
Nama Dosen Pendamping       : [Nama Lengkap Dosen Pendamping beserta Gelar]
NIP / NIDN Dosen            : [NIP / NIDN]
Judul Proposal PKM          : [Tuliskan Judul Lengkap Proposal PKM Sesuai yang Didaftarkan]
Skema Bidang PKM            : [PKM-RE / PKM-RSH / PKM-K / PKM-PM / PKM-PI / PKM-KC / PKM-KI / PKM-VGK / PKM-GFT / PKM-AI]

Dengan ini menyatakan bahwa proposal PKM yang saya usulkan untuk tahun anggaran yang berjalan adalah:
1. Asli karya mahasiswa tim pengusul dan belum pernah dibiayai oleh lembaga atau sumber dana lain.
2. Penggunaan kecerdasan buatan / Artificial Intelligence (AI) mengikuti syarat dan ketentuan yang berlaku sesuai Panduan Penggunaan Generative AI (GenAI) Direktorat Belmawa Kemdiktisaintek.
3. Seluruh anggota tim berkomitmen untuk menjalankan kegiatan PKM secara bersungguh-sungguh dan bertanggung jawab hingga tuntas.

Bilamana di kemudian hari ditemukan ketidaksesuaian atau pemalsuan dengan pernyataan ini, maka saya bersedia dituntut dan diproses sesuai dengan ketentuan hukum yang berlaku serta mengembalikan seluruh dana bantuan yang telah diterima ke kas negara.

Demikian surat pernyataan ini dibuat dengan sesungguhnya dan dengan penuh kesadaran tanpa paksaan dari pihak manapun untuk dapat dipergunakan sebagaimana mestinya.


Bandar Lampung, [Tanggal, Bulan, Tahun]
Yang Menyatakan, Ketua Tim Pengusul


[ MATERAI Rp 10.000 ]
(Tanda tangan basah menimpa sebagian materai)


( [Nama Lengkap Ketua Tim Pengusul] )
NPM. [NPM / NIM]
`

const FORMAT_RAB_TEXT = `FORMAT RENCANA ANGGARAN BIAYA (RAB) PKM
SESUAI PEDOMAN RESMI SIMBELMAWA KEMDIKTISAINTEK

================================================================================
BAGIAN 1: REKAPITULASI RENCANA ANGGARAN BIAYA (DITEMPATKAN DI BAB 4 USULAN)
================================================================================

Tabel 4.1 Rekapitulasi Rencana Anggaran Biaya
+----+------------------------------------+--------------------------+-----------------------+
| No | Jenis Pengeluaran                   | Sumber Dana              | Besaran Dana (Rp)     |
+----+------------------------------------+--------------------------+-----------------------+
| 1  | Bahan habis pakai                  | Belmawa                  | Rp [Maks 60% Belmawa] |
|    | (ATK, reagen, material riset, dll) | Perguruan Tinggi (Unila) | Rp [...]              |
|    |                                    | Instansi Lain (jika ada) | Rp [...]              |
+----+------------------------------------+--------------------------+-----------------------+
| 2  | Sewa dan jasa                      | Belmawa                  | Rp [Maks 15% Belmawa] |
|    | (Sewa alat lab, uji sampel, cloud) | Perguruan Tinggi (Unila) | Rp [...]              |
|    |                                    | Instansi Lain (jika ada) | Rp [...]              |
+----+------------------------------------+--------------------------+-----------------------+
| 3  | Transportasi lokal                 | Belmawa                  | Rp [Maks 30% Belmawa] |
|    | (Transport sampling, survei mitra) | Perguruan Tinggi (Unila) | Rp [...]              |
|    |                                    | Instansi Lain (jika ada) | Rp [...]              |
+----+------------------------------------+--------------------------+-----------------------+
| 4  | Lain-lain                          | Belmawa                  | Rp [Maks 15% Belmawa] |
|    | (Komunikasi, publikasi, materai)   | Perguruan Tinggi (Unila) | Rp [...]              |
|    |                                    | Instansi Lain (jika ada) | Rp [...]              |
+----+------------------------------------+--------------------------+-----------------------+
| JUMLAH KESELURUHAN                      |                          | Rp [Rp 6 - 10 Juta]   |
+----+------------------------------------+--------------------------+-----------------------+

Rekapitulasi Sumber Pendanaan:
1. Kemdiktisaintek (Belmawa) : Rp [Rp 6.000.000 - Rp 10.000.000]
2. Perguruan Tinggi (Unila)   : Rp [...]
3. Instansi Lain (jika ada)   : Rp [...]
TOTAL AKUMULASI DANA          : Rp [...]


================================================================================
BAGIAN 2: JUSTIFIKASI ANGGARAN KEGIATAN (LAMPIRAN 2 PROPOSAL)
================================================================================

1. Jenis Pengeluaran: Bahan Habis Pakai (Maksimal 60%)
+----+---------------------+--------+--------+------------------+------------------+
| No | Komponen            | Volume | Satuan | Harga Satuan(Rp) | Total Biaya (Rp) |
+----+---------------------+--------+--------+------------------+------------------+
| 1  | [Nama Bahan/ATK]    | [...]  | [unit] | Rp [...]         | Rp [...]         |
| 2  | [Material Riset]    | [...]  | [unit] | Rp [...]         | Rp [...]         |
+----+---------------------+--------+--------+------------------+------------------+
| SUB TOTAL (1)                                                 | Rp [...]         |
+----+----------------------------------------------------------+------------------+

2. Jenis Pengeluaran: Sewa dan Jasa (Maksimal 15%)
+----+---------------------+--------+--------+------------------+------------------+
| No | Komponen            | Volume | Satuan | Harga Satuan(Rp) | Total Biaya (Rp) |
+----+---------------------+--------+--------+------------------+------------------+
| 1  | Sewa Alat Uji / Lab | [...]  | [jam]  | Rp [...]         | Rp [...]         |
| 2  | Jasa Fabrikasi PCB  | [...]  | [unit] | Rp [...]         | Rp [...]         |
+----+---------------------+--------+--------+------------------+------------------+
| SUB TOTAL (2)                                                 | Rp [...]         |
+----+----------------------------------------------------------+------------------+

3. Jenis Pengeluaran: Transportasi Lokal (Maksimal 30%)
+----+---------------------+--------+--------+------------------+------------------+
| No | Komponen            | Volume | Satuan | Harga Satuan(Rp) | Total Biaya (Rp) |
+----+---------------------+--------+--------+------------------+------------------+
| 1  | Transport Survei    | [...]  | [kali] | Rp [...]         | Rp [...]         |
+----+---------------------+--------+--------+------------------+------------------+
| SUB TOTAL (3)                                                 | Rp [...]         |
+----+----------------------------------------------------------+------------------+

4. Jenis Pengeluaran: Lain-lain (Maksimal 15%)
+----+---------------------+--------+--------+------------------+------------------+
| No | Komponen            | Volume | Satuan | Harga Satuan(Rp) | Total Biaya (Rp) |
+----+---------------------+--------+--------+------------------+------------------+
| 1  | Kuota Internet/Tim  | [...]  | [bln]  | Rp [Maks 100rb]  | Rp [...]         |
| 2  | Biaya Publikasi/Sem | [...]  | [keg]  | Rp [...]         | Rp [...]         |
| 3  | Bea Materai 10.000  | [...]  | [lbr]  | Rp 10.000        | Rp [...]         |
+----+---------------------+--------+--------+------------------+------------------+
| SUB TOTAL (4)                                                 | Rp [...]         |
+----+----------------------------------------------------------+------------------+
TOTAL ANGGARAN (1 + 2 + 3 + 4) = Rp [Rp 6.000.000 s.d. Rp 10.000.000]

POS ANGGARAN YANG DILARANG OLEH BELMAWA:
- Honorarium untuk tim pengusul, dosen pendamping, atau narasumber
- Biaya konsumsi rapat, makan siang, snack
- Sewa laptop, komputer, kamera, atau printer milik pribadi/kampus
- Pembelian flashdisk, harddisk eksternal, atau memori
- Pembelian alat/investasi bernilai permanen > Rp 1.000.000 per unit
- Kuota internet melebihi batas Rp 100.000/bulan per orang
`

const BIODATA_PENGUSUL_TEXT = `LAMPIRAN 1. FORMAT BIODATA KETUA, ANGGOTA, DAN DOSEN PENDAMPING
SESUAI PEDOMAN RESMI SIMBELMAWA KEMDIKTISAINTEK

A. Identitas Diri
1. Nama Lengkap             : [Nama Lengkap beserta Gelar bila Dosen]
2. Jenis Kelamin            : [Laki-laki / Perempuan]
3. Program Studi            : [Nama Program Studi]
4. NPM / NIM / NIDN         : [NPM untuk Mahasiswa / NIDN untuk Dosen]
5. Tempat dan Tanggal Lahir : [Tempat, Tgl-Bln-Tahun]
6. Alamat E-mail            : [Email Resmi / Email Mahasiswa]
7. Nomor Telepon / HP / WA  : [08xxxxxxxxxx]

B. Riwayat Pendidikan (Khusus Dosen / Mahasiswa)
- SD    : [Nama Sekolah, Tahun Lulus]
- SMP   : [Nama Sekolah, Tahun Lulus]
- SMA   : [Nama Sekolah, Tahun Lulus]
- S1/S2 : [Perguruan Tinggi, Jurusan, Tahun Lulus]

C. Rekam Jejak Prestasi / Pengalaman Kemahasiswaan (3 Tahun Terakhir)
1. [Prestasi / Kompetisi / Hibah yang Pernah Diikuti]
2. [Sertifikasi / Kepanitiaan Ilmiah]

Semua data yang saya isikan dan tercantum dalam biodata ini adalah benar dan dapat dipertanggungjawabkan secara hukum. Apabila di kemudian hari ternyata dijumpai ketidaksesuaian dengan kenyataan, saya sanggup menerima sanksi.

Bandar Lampung, [Tanggal, Bulan, Tahun]
Pengusul,

(Tanda Tangan Asli / Basah)

( [Nama Lengkap] )
NPM / NIDN. [...]
`

const SISTEMATIKA_USULAN_TEXT = `SISTEMATIKA PROPOSAL PROGRAM KREATIVITAS MAHASISWA (PKM)
SUMBER: PEDOMAN RESMI DIREKTORAT BELMAWA KEMDIKTISAINTEK

================================================================================
ATURAN FORMAT PENULISAN WAJIB (ANTI-GUGUR ADMINISTRASI):
================================================================================
1. Ukuran Kertas: A4 (80 gram), orientasi Portrait.
2. Batas Margin Halaman:
   - Margin Kiri   : 4 cm
   - Margin Atas   : 3 cm
   - Margin Kanan  : 3 cm
   - Margin Bawah  : 3 cm
3. Jenis dan Ukuran Huruf:
   - Font: Times New Roman, ukuran 12 pt.
   - Spasi: 1.15 spasi.
   - Perataan Teks: Rata Kiri-Kanan (Justified).
4. Penomoran Halaman:
   - Halaman Daftar Isi: Angka Romawi kecil (i, ii...) di pojok kanan bawah.
   - Halaman Inti (Bab 1 s.d. Daftar Pustaka): Angka Arab (1, 2, 3...) di pojok kanan atas.
5. Batas Halaman Inti:
   - MAKSIMAL 10 (SEPULUH) HALAMAN terhitung dari Bab 1 Pendahuluan s.d. Daftar Pustaka.
   - Halaman lampiran tidak dihitung dalam batas 10 halaman.
6. ATURAN SIMBELMAWA KRUSIAL:
   - Berkas PDF proposal diunggah TANPA SAMPUL / COVER.
   - Berkas PDF proposal diunggah TANPA LEMBAR PENGESAHAN.
   - Seluruh identitas pengusul, perguruan tinggi, dan lembar pengesahan dihasilkan secara digital oleh sistem SIMBELMAWA.

================================================================================
STRUKTUR BAB PROPOSAL (SKEMA PENDANAAN):
================================================================================
- DAFTAR ISI (i, ii)
- BAB 1. PENDAHULUAN
  * Latar belakang dan justifikasi ilmiah/praktis
  * Rumusan masalah dan urgensi gagasan
  * Tujuan khusus dan kebaruan penelitian/kegiatan
  * Luaran yang ditargetkan dan kontribusi nyata
- BAB 2. TINJAUAN PUSTAKA / GAMBARAN UMUM
  * PKM-RE/RSH : Tinjauan Pustaka & State of the Art
  * PKM-K      : Gambaran Umum Rencana Usaha, Analisis Pasar, Break Even Point (BEP)
  * PKM-PM/PI  : Gambaran Umum Masyarakat Sasaran / Profil Mitra Usaha
  * PKM-KC/KI  : Tinjauan Pustaka & Tahapan Konsep Desain Solusi
  * PKM-VGK    : Skenario Gagasan Futuristik dan Narasi Konstruktif
- BAB 3. METODE PELAKSANAAN / METODE RISET
  * Diagram alir tahapan kegiatan
  * Prosedur kerja, instrumen, dan teknik pengumpulan data
  * Analisis data dan indikator capaian terukur
- BAB 4. BIAYA DAN JADWAL KEGIATAN
  * Tabel 4.1 Rekapitulasi Rencana Anggaran Biaya (4 Komponen Belmawa)
  * Tabel 4.2 Bar-chart Jadwal Kegiatan (Durasi 3 s.d. 5 Bulan)
- DAFTAR PUSTAKA
  * Standar Harvard atau APA Style
  * Utamakan 80% rujukan artikel jurnal ilmiah 5-10 tahun terakhir
- LAMPIRAN-LAMPIRAN
  * Lampiran 1. Biodata Ketua, Anggota, dan Dosen Pendamping bertandatangan
  * Lampiran 2. Justifikasi Anggaran Kegiatan
  * Lampiran 3. Susunan Organisasi Tim Pengusul dan Pembagian Tugas
  * Lampiran 4. Surat Pernyataan Ketua Tim Pengusul (Bermeterai Rp 10.000)
  * Lampiran 5. Surat Pernyataan Kesediaan Kerjasama Mitra (khusus PKM-PM / PKM-PI)
  * Lampiran 6. Gambaran IPTEKS yang akan Diterapkan / Denah Detail Lokasi Mitra
`

const ARSIP_PROPOSAL_LOLOS = [
  {
    id: 'padivision',
    title: 'PadiVision: Deteksi Dini Penyakit Tanaman Padi Berbasis Computer Vision & IoT Edge',
    schema: 'PKM-KC',
    badge: 'Medali Perak PIMNAS',
    year: '2024',
    fakultas: 'FMIPA & FT Unila',
    teamLeader: 'Ahmad Faiz Al-Ghifari',
    supervisor: 'Dr. Ir. Gigih Forda Nama, S.T., M.T. (FT)',
    grant: 'Rp 9.850.000',
    fileUrl: '/docs/proposal-padivision-pkm-kc.pdf',
    description: 'Sistem edge computing pendeteksi hama blas dan hawar daun pada hamparan sawah Kabupaten Pringsewu dengan kamera bersensor multispektral.',
    glowColor: 'gold'
  },
  {
    id: 'nanomarine',
    title: 'NanoMarine: Sintesis Nanokomposit Kitosan-Grafena dari Limbah Kulit Udang Lampung',
    schema: 'PKM-RE',
    badge: 'Lolos Didanai Kemdiktisaintek',
    year: '2024',
    fakultas: 'FMIPA & FP Unila',
    teamLeader: 'Nabila Nurul Hidayah',
    supervisor: 'Prof. Dr. Rudy T. M. Situmeang (FMIPA)',
    grant: 'Rp 9.500.000',
    fileUrl: '/docs/proposal-nanomarine-pkm-re.pdf',
    description: 'Fabrikasi nanomaterial fotokatalis ramah lingkungan pemecah mikroplastik pesisir Teluk Lampung memanfaatkan limbah tambak udang lokal.',
    glowColor: 'blue'
  },
  {
    id: 'telangtea',
    title: 'TelangTea Herbal: Inovasi Minuman Fungsional Bunga Telang dengan Madu Hutan Way Kanan',
    schema: 'PKM-K',
    badge: 'Lolos Didanai & Inkubasi Bisnis',
    year: '2024',
    fakultas: 'FP & FEB Unila',
    teamLeader: 'Rizki Kurniawan',
    supervisor: 'Dr. Dyah Aring Hepiana, S.P., M.Si. (FP)',
    grant: 'Rp 8.200.000',
    fileUrl: '/docs/proposal-telangtea-pkm-k.pdf',
    description: 'Produk pangan fungsional kaya antioksidan antosianin siap konsumsi yang memberdayakan petani lebah lokal Way Kanan.',
    glowColor: 'green'
  },
  {
    id: 'finsmart',
    title: 'FinSmart Inklusi: Pemberdayaan Literasi Finansial Digital Nelayan Teluk Lampung',
    schema: 'PKM-PM',
    badge: 'Lolos Didanai Kemdiktisaintek',
    year: '2024',
    fakultas: 'FEB & FISIP Unila',
    teamLeader: 'Dinda Ayu Maharani',
    supervisor: 'Dr. Ernie Hendrawaty, S.E., M.Si. (FEB)',
    grant: 'Rp 8.750.000',
    fileUrl: '/docs/proposal-finsmart-pkm-pm.pdf',
    description: 'Program akselerasi inklusi pencatatan arus kas dan permodalan digital bagi 40 keluarga nelayan tradisional Pasaran Kota Bandar Lampung.',
    glowColor: 'purple'
  },
  {
    id: 'agrosense',
    title: 'AgroSense IoT: Smart Greenhouse Monitoring System Berbasis LoRaWAN Hortikultura',
    schema: 'PKM-KC',
    badge: 'Lolos Didanai Kemdiktisaintek',
    year: '2024',
    fakultas: 'FT & FP Unila',
    teamLeader: 'Fajar Eko Saputro',
    supervisor: 'Herry Wardiono, S.T., M.T. (FT)',
    grant: 'Rp 9.400.000',
    fileUrl: '/docs/proposal-agrosense-pkm-kc.pdf',
    description: 'Otomatisasi pengairan presisi dan mikroklimat rumah kaca tanaman cabai menggunakan transmisi radio jarak jauh hemat daya LoRa.',
    glowColor: 'orange'
  }
]

export function PedomanIndex() {
  const items = usePedoman()
  const [activeTab, setActiveTab] = useState('panduan')
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab])

  const copyToClipboard = (text, id, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setToastMessage(`✓ ${label} berhasil disalin ke clipboard!`)
      setTimeout(() => {
        setCopiedId(null)
        setToastMessage('')
      }, 2600)
    })
  }

  const filteredPanduan = items.filter((item) => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    return `${item.year} ${item.title} ${item.note || ''} ${item.source || ''} ${item.category || ''}`.toLowerCase().includes(q)
  })

  const years = [...new Set(filteredPanduan.map((item) => item.year))].sort((a, b) => b - a)

  const pedoman2026 = items.find((i) => i.year === 2026)
  const pedoman2025 = items.find((i) => i.year === 2025)
  const pedoman2024 = items.find((i) => i.year === 2024)

  return (
    <main>
      <Breadcrumb trail={[['Beranda', '#beranda'], ['Pedoman & Format Usulan']]} />
      <PageIntro
        eyebrow="PUSAT RUJUKAN RESMI BELMAWA KEMDIKTISAINTEK"
        title={<>Pedoman, Format Usulan &amp;<br /><em>Regulasi Anggaran PKM.</em></>}
        copy="Akses buku panduan resmi 10 skema PKM, aturan format penulisan anti-gugur administrasi, struktur RAB 4 komponen, template surat pernyataan bertanda tangan basah, dan arsip proposal lolos PIMNAS."
      />

      <div className="pedoman-container">
        {/* Navigation Tabs */}
        <div className="pedoman-nav-wrapper">
          <nav className="pedoman-nav-tabs" aria-label="Kategori Panduan & Format">
            <button
              className={`pedoman-tab-btn ${activeTab === 'panduan' ? 'active' : ''}`}
              onClick={() => setActiveTab('panduan')}
            >
              <BookOpen size={16} />
              <span>Buku Panduan Resmi</span>
            </button>
            <button
              className={`pedoman-tab-btn ${activeTab === 'sistematika' ? 'active' : ''}`}
              onClick={() => setActiveTab('sistematika')}
            >
              <FileText size={16} />
              <span>Format &amp; Sistematika Usulan</span>
            </button>
            <button
              className={`pedoman-tab-btn ${activeTab === 'rab' ? 'active' : ''}`}
              onClick={() => setActiveTab('rab')}
            >
              <DollarSign size={16} />
              <span>Format RAB 4 Komponen</span>
            </button>
            <button
              className={`pedoman-tab-btn ${activeTab === 'lampiran' ? 'active' : ''}`}
              onClick={() => setActiveTab('lampiran')}
            >
              <Paperclip size={16} />
              <span>Template Lampiran Baku</span>
            </button>
            <button
              className={`pedoman-tab-btn ${activeTab === 'arsip' ? 'active' : ''}`}
              onClick={() => setActiveTab('arsip')}
            >
              <Award size={16} />
              <span>Arsip Proposal Lolos PIMNAS</span>
            </button>
          </nav>
        </div>

        {/* ==============================================================
            TAB 1: BUKU PANDUAN RESMI SIMBELMAWA
            ============================================================== */}
        {activeTab === 'panduan' && (
          <section aria-label="Buku Panduan Resmi">
            {/* Glass Folders Quick Showcase */}
            <div className="doc-folder-showcase" style={{ marginBottom: '2.5rem' }}>
              <div className="doc-folder-intro">
                <p className="ref-eyebrow gold">MAP BERKAS RESMI</p>
                <h3>Folder Panduan &amp; Format Usulan</h3>
                <p>Sentuh atau arahkan kursor ke map folder interaktif untuk melihat berkas rujukan resmi dan contoh usulan.</p>
              </div>
              <div className="doc-folder-grid">
                <GlassFolder
                  label="Pedoman PKM 2026"
                  meta="Berkas Resmi Belmawa"
                  art="unila"
                  seed={3}
                  width={320}
                  appearDelay={0}
                  files={[
                    { name: "Pedoman Umum 2026", meta: "SIMBELMAWA Portal", art: "unila", href: pedoman2026?.fileUrl || 'https://simbelmawa.kemdiktisaintek.go.id/portal/unduh-panduan/' },
                    { name: "Format Usulan Proposal", meta: "Pedoman Format", art: "glacier", href: '/docs/panduan-format-sistematika-proposal-belmawa.txt' },
                    { name: "Format RAB 4 Komponen", meta: "Regulasi Anggaran", art: "aurora", href: '/docs/template-format-rab-4-komponen.txt' },
                  ]}
                />
                <GlassFolder
                  label="Pedoman PKM 2025"
                  meta="Rujukan Didanai"
                  art="glacier"
                  seed={7}
                  width={320}
                  appearDelay={120}
                  files={[
                    { name: "Pedoman PKM 2025", meta: "PDF · SIMBELMAWA", art: "glacier", href: pedoman2025?.fileUrl || 'https://simbelmawa.kemdiktisaintek.go.id/portal/unduh-panduan/' },
                    { name: "Surat Pernyataan Ketua", meta: "Format Bermeterai", art: "dusk", href: '/docs/template-surat-pernyataan-ketua-pkm.txt' },
                  ]}
                />
                <GlassFolder
                  label="Pedoman PKM 2024"
                  meta="Arsip Lengkap 10 Skema"
                  art="verdant"
                  seed={11}
                  width={320}
                  appearDelay={240}
                  files={[
                    { name: "Portal Panduan 2024", meta: "10 Skema Resmi", art: "verdant", href: pedoman2024?.fileUrl || 'https://simbelmawa.kemdiktisaintek.go.id/portal/panduan-pkm-2024/' },
                    { name: "Proposal Lolos PadiVision", meta: "Medali Perak PIMNAS", art: "ember", href: '/docs/proposal-padivision-pkm-kc.pdf' },
                  ]}
                />
              </div>
            </div>

            {/* Official Portal Notice */}
            <div className="pedoman-alert-banner info">
              <div className="pedoman-alert-icon">
                <Info size={22} />
              </div>
              <div className="pedoman-alert-content">
                <h4>Portal Resmi SIMBELMAWA Kemdiktisaintek</h4>
                <p>
                  Seluruh dokumen buku panduan umum dan teknis diterbitkan langsung oleh <strong>Direktorat Pembelajaran dan Kemahasiswaan (Belmawa)</strong> Kementerian Pendidikan Tinggi, Sains, dan Teknologi RI.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a
                    href="https://simbelmawa.kemdiktisaintek.go.id/portal/unduh-panduan/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pedoman-btn-action primary"
                  >
                    <span>Kunjungi Portal Unduh Panduan Kemdiktisaintek</span>
                    <ExternalLink size={14} />
                  </a>
                  <a
                    href="https://simbelmawa.kemdiktisaintek.go.id/portal/panduan-pkm-2024/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pedoman-btn-action secondary"
                  >
                    <span>Arsip Panduan 10 Skema (SIMBELMAWA)</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>

            {/* Filter Search */}
            <div className="filter-row" style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
              <label className="search-wrap">
                <Search size={16} aria-hidden="true" style={{ color: '#94a3b8' }} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari buku panduan skema… (contoh: PKM-KC, Riset, Kewirausahaan, Umum)"
                />
              </label>
              <span className="filter-count">{filteredPanduan.length} dokumen panduan</span>
            </div>

            {years.length === 0 && (
              <p className="empty-state">Tidak ada buku panduan yang cocok dengan kata pencarianmu.</p>
            )}

            {years.map((year) => (
              <section className="doc-year" key={year}>
                <div className="doc-year-heading">
                  <b>Tahun {year}</b>
                  <span>{filteredPanduan.filter((item) => item.year === year).length} Buku Pedoman Resmi</span>
                </div>
                <div className="pedoman-grid-3" style={{ marginTop: '0.85rem' }}>
                  {filteredPanduan
                    .filter((item) => item.year === year)
                    .map((item) => (
                      <GlowCard key={item.id} glowColor="blue" className="pedoman-card-base">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                            <span className="pedoman-badge-chip blue">{item.category || `Tahun ${item.year}`}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>RESMI</span>
                          </div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.35 }}>
                            {item.title}
                          </h3>
                          <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.55, margin: '0 0 1.25rem' }}>
                            {item.note || 'Pedoman resmi pengusulan Program Kreativitas Mahasiswa dari Direktorat Belmawa Kemdiktisaintek RI.'}
                          </p>
                        </div>
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SIMBELMAWA</span>
                          <a
                            href={item.fileUrl || 'https://simbelmawa.kemdiktisaintek.go.id/portal/unduh-panduan/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pedoman-btn-action primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                          >
                            <span>Unduh / Buka</span>
                            <ArrowRight size={13} />
                          </a>
                        </div>
                      </GlowCard>
                    ))}
                </div>
              </section>
            ))}
          </section>
        )}

        {/* ==============================================================
            TAB 2: FORMAT & SISTEMATIKA USULAN
            ============================================================== */}
        {activeTab === 'sistematika' && (
          <section aria-label="Format & Sistematika Usulan">
            {/* Anti Gugur Banner */}
            <div className="pedoman-alert-banner danger">
              <div className="pedoman-alert-icon">
                <AlertOctagon size={24} />
              </div>
              <div className="pedoman-alert-content">
                <h4>PERINGATAN KRUSIAL: Aturan Anti-Gugur Seleksi Administrasi Tahap 1</h4>
                <p>
                  Berdasarkan pedoman resmi Direktorat Belmawa Kemdiktisaintek, proposal yang diunggah ke laman SIMBELMAWA <strong>WAJIB TANPA COVER / SAMPUL</strong> dan <strong>WAJIB TANPA LEMBAR PENGESAHAN</strong>. Data perguruan tinggi, ketua, anggota, dan pengesahan pimpinan perguruan tinggi divalidasi dan disahkan secara digital langsung di sistem SIMBELMAWA. Menyertakan sampul atau lembar pengesahan berisiko didiskualifikasi langsung pada evaluasi tahap 1.
                </p>
                <div className="pedoman-checklist-row">
                  <span className="pedoman-checklist-badge">
                    <CheckCircle2 size={14} color="#dc2626" /> Tanpa Halaman Sampul (Cover)
                  </span>
                  <span className="pedoman-checklist-badge">
                    <CheckCircle2 size={14} color="#dc2626" /> Tanpa Lembar Pengesahan Manual
                  </span>
                  <span className="pedoman-checklist-badge">
                    <CheckCircle2 size={14} color="#dc2626" /> Maksimal 10 Halaman Inti (Bab 1 s.d. Daftar Pustaka)
                  </span>
                  <span className="pedoman-checklist-badge">
                    <CheckCircle2 size={14} color="#dc2626" /> Ukuran Kertas A4 &amp; Margin 4-3-3-3 cm
                  </span>
                </div>
              </div>
            </div>

            {/* Layout & Typography Spec Cards */}
            <div className="pedoman-grid-4" style={{ marginBottom: '2.5rem' }}>
              <GlowCard glowColor="blue" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip blue">Margin Halaman</div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>4 - 3 - 3 - 3 cm</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Kiri 4 cm, Atas 3 cm, Kanan 3 cm, Bawah 3 cm. Orientasi Portrait pada kertas A4 (80 gram).
                  </p>
                </div>
              </GlowCard>

              <GlowCard glowColor="emerald" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip emerald">Tipografi &amp; Paragraf</div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>TNR 12 pt · 1.15 Spasi</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Font Times New Roman 12 pt, spasi baris 1.15, perataan teks Rata Kanan-Kiri (Justified).
                  </p>
                </div>
              </GlowCard>

              <GlowCard glowColor="amber" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip amber">Penomoran Halaman</div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Dua Jenis Nomor</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Romawi kecil (i, ii) di <strong>kanan bawah</strong> untuk Daftar Isi. Angka Arab (1, 2) di <strong>kanan atas</strong> untuk Bab 1 s.d. Daftar Pustaka.
                  </p>
                </div>
              </GlowCard>

              <GlowCard glowColor="purple" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip purple">Batas Halaman</div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Maksimal 10 Halaman</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Isi utama (Bab 1 Pendahuluan s.d. Daftar Pustaka) maksimal 10 halaman. Lampiran tidak dihitung dalam 10 halaman.
                  </p>
                </div>
              </GlowCard>
            </div>

            {/* Systematic Chapters Breakdown */}
            <div className="pedoman-template-card">
              <div className="pedoman-template-header">
                <div className="pedoman-template-title">
                  <FileText size={20} color="#0071e3" />
                  <div>
                    <h3 style={{ margin: 0 }}>Struktur Sistematika Bab Proposal (Skema Pendanaan Belmawa)</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Berlaku untuk PKM-RE, PKM-RSH, PKM-K, PKM-PM, PKM-PI, PKM-KC, PKM-KI, PKM-VGK</p>
                  </div>
                </div>
                <div className="pedoman-actions-group">
                  <button
                    className="pedoman-btn-action primary"
                    onClick={() => copyToClipboard(SISTEMATIKA_USULAN_TEXT, 'sistematika', 'Sistematika Proposal')}
                  >
                    {copiedId === 'sistematika' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === 'sistematika' ? 'Tersalin!' : 'Salin Sistematika'}</span>
                  </button>
                  <a
                    href="/docs/panduan-format-sistematika-proposal-belmawa.txt"
                    download="panduan-format-sistematika-proposal-belmawa.txt"
                    className="pedoman-btn-action secondary"
                  >
                    <Download size={14} />
                    <span>Unduh Pedoman (.txt)</span>
                  </a>
                </div>
              </div>
              <pre className="pedoman-code-viewer">{SISTEMATIKA_USULAN_TEXT}</pre>
            </div>
          </section>
        )}

        {/* ==============================================================
            TAB 3: FORMAT RAB 4 KOMPONEN
            ============================================================== */}
        {activeTab === 'rab' && (
          <section aria-label="Format Rencana Anggaran Biaya">
            {/* Funding Ceiling Callout */}
            <div className="pedoman-alert-banner gold">
              <div className="pedoman-alert-icon">
                <DollarSign size={24} />
              </div>
              <div className="pedoman-alert-content">
                <h4>Ketentuan Besaran Pendanaan Resmi Kemdiktisaintek</h4>
                <p>
                  Besaran alokasi pendanaan per judul proposal yang disetujui Direktorat Belmawa untuk <strong>PKM Pendanaan (8 Bidang)</strong> adalah antara <strong>Rp 6.000.000,- sampai dengan Rp 10.000.000,-</strong>. Khusus untuk <strong>PKM Insentif (PKM-GFT dan PKM-AI)</strong>, diberikan insentif prestasi sebesar <strong>Rp 2.500.000,-</strong> per judul proposal yang lolos seleksi nasional.
                </p>
                <div className="pedoman-checklist-row">
                  <span className="pedoman-checklist-badge">
                    <CheckCircle2 size={14} color="#d97706" /> Plafon Belmawa: Rp 6.000.000 – Rp 10.000.000
                  </span>
                  <span className="pedoman-checklist-badge">
                    <CheckCircle2 size={14} color="#d97706" /> Insentif GFT &amp; AI: Rp 2.500.000
                  </span>
                  <span className="pedoman-checklist-badge">
                    <CheckCircle2 size={14} color="#d97706" /> 4 Komponen Belanja Wajib
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Komponen Grid Breakdown */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2rem 0 1rem' }}>
              Batasan Maksimal 4 Komponen Pengeluaran Belmawa
            </h3>
            <div className="pedoman-grid-4" style={{ marginBottom: '2.5rem' }}>
              <GlowCard glowColor="blue" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip blue">Komponen 1 · Maks 60%</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Bahan Habis Pakai</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    Pembelian ATK, bahan kimia/reagen lab, material riset prototipe, bibit, komponen elektronika/mekanik, media kultur, dan materi uji laboratorium.
                  </p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#0071e3' }}>
                  Maksimal 60% total dana
                </div>
              </GlowCard>

              <GlowCard glowColor="emerald" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip emerald">Komponen 2 · Maks 15%</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Sewa dan Jasa</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    Sewa peralatan laboratorium uji (misal SEM, GC-MS, spektrofotometri), jasa fabrikasi PCB/mekanik, hosting web riset, atau cloud computing sementara.
                  </p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                  Maksimal 15% total dana
                </div>
              </GlowCard>

              <GlowCard glowColor="amber" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip amber">Komponen 3 · Maks 30%</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Transportasi Lokal</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    Biaya transportasi untuk pengambilan sampel, survei lapangan, observasi mitra, atau belanja bahan di kawasan lokal (Lampung).
                  </p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#d97706' }}>
                  Maksimal 30% total dana
                </div>
              </GlowCard>

              <GlowCard glowColor="purple" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip purple">Komponen 4 · Maks 15%</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Lain-Lain</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    Komunikasi paket data (maksimal Rp 100.000/bln/orang), bea materai Rp 10.000, pendaftaran seminar ilmiah, dan publikasi jurnal.
                  </p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#9333ea' }}>
                  Maksimal 15% total dana
                </div>
              </GlowCard>
            </div>

            {/* Prohibited Expenses Warning Banner */}
            <div className="pedoman-alert-banner danger" style={{ marginBottom: '2.5rem' }}>
              <div className="pedoman-alert-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="pedoman-alert-content">
                <h4>POS ANGGARAN YANG DILARANG DIBIAYAI BELMAWA (DILARANG KERAS)</h4>
                <p>
                  Memasukkan pos pengeluaran terlarang di bawah ini akan menyebabkan pengurangan poin penilaian substansi anggaran atau penolakan proposal saat evaluasi:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>❌ Honorarium tim pengusul, dosen pendamping, atau narasumber</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>❌ Konsumsi rapat, snack, jamuan makan-minum</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>❌ Sewa komputer/laptop, printer, scanner, kamera milik sendiri/kampus</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>❌ Pembelian flashdisk, harddisk eksternal, atau kartu memori</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>❌ Pembelian alat/aset modal permanen bernilai &gt; Rp 1.000.000,- per unit</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>❌ Kuota internet/pulsa melebihi batas Rp 100.000,-/bulan per orang</div>
                </div>
              </div>
            </div>

            {/* Code Template Box */}
            <div className="pedoman-template-card">
              <div className="pedoman-template-header">
                <div className="pedoman-template-title">
                  <DollarSign size={20} color="#059669" />
                  <div>
                    <h3 style={{ margin: 0 }}>Template Tabel Rekapitulasi RAB (Bab 4) &amp; Justifikasi Anggaran (Lampiran 2)</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Format teks baku siap disalin ke Microsoft Word atau Google Docs proposalmu</p>
                  </div>
                </div>
                <div className="pedoman-actions-group">
                  <button
                    className="pedoman-btn-action primary"
                    onClick={() => copyToClipboard(FORMAT_RAB_TEXT, 'rab', 'Template RAB 4 Komponen')}
                  >
                    {copiedId === 'rab' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === 'rab' ? 'Tersalin!' : 'Salin Template RAB'}</span>
                  </button>
                  <a
                    href="/docs/template-format-rab-4-komponen.txt"
                    download="template-format-rab-4-komponen.txt"
                    className="pedoman-btn-action secondary"
                  >
                    <Download size={14} />
                    <span>Unduh File RAB (.txt)</span>
                  </a>
                </div>
              </div>
              <pre className="pedoman-code-viewer">{FORMAT_RAB_TEXT}</pre>
            </div>
          </section>
        )}

        {/* ==============================================================
            TAB 4: TEMPLATE LAMPIRAN RESMI
            ============================================================== */}
        {activeTab === 'lampiran' && (
          <section aria-label="Template Lampiran Resmi">
            {/* Lampiran 4: Surat Pernyataan Ketua */}
            <div className="pedoman-template-card">
              <div className="pedoman-template-header">
                <div className="pedoman-template-title">
                  <ShieldCheck size={22} color="#0071e3" />
                  <div>
                    <h3 style={{ margin: 0 }}>Lampiran 4. Surat Pernyataan Ketua Tim Pengusul (Bermeterai Rp 10.000)</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Dilengkapi klausul kepatuhan Generative AI Kemdiktisaintek, keaslian karya, dan tanda tangan basah menimpa meterai
                    </p>
                  </div>
                </div>
                <div className="pedoman-actions-group">
                  <button
                    className="pedoman-btn-action primary"
                    onClick={() => copyToClipboard(SURAT_PERNYATAAN_KETUA_TEXT, 'surat_ketua', 'Surat Pernyataan Ketua')}
                  >
                    {copiedId === 'surat_ketua' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === 'surat_ketua' ? 'Tersalin!' : 'Salin Format Surat'}</span>
                  </button>
                  <a
                    href="/docs/template-surat-pernyataan-ketua-pkm.txt"
                    download="template-surat-pernyataan-ketua-pkm.txt"
                    className="pedoman-btn-action secondary"
                  >
                    <Download size={14} />
                    <span>Unduh Berkas (.txt)</span>
                  </a>
                </div>
              </div>
              <pre className="pedoman-code-viewer">{SURAT_PERNYATAAN_KETUA_TEXT}</pre>
            </div>

            {/* Lampiran 1: Biodata Ketua, Anggota & Dosen */}
            <div className="pedoman-template-card">
              <div className="pedoman-template-header">
                <div className="pedoman-template-title">
                  <Paperclip size={20} color="#059669" />
                  <div>
                    <h3 style={{ margin: 0 }}>Lampiran 1. Format Biodata Ketua, Anggota, dan Dosen Pendamping</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Format baku identitas diri, riwayat pendidikan, rekam jejak riset/prestasi, serta klausul kebenaran data
                    </p>
                  </div>
                </div>
                <div className="pedoman-actions-group">
                  <button
                    className="pedoman-btn-action primary"
                    onClick={() => copyToClipboard(BIODATA_PENGUSUL_TEXT, 'biodata', 'Format Biodata Pengusul')}
                  >
                    {copiedId === 'biodata' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === 'biodata' ? 'Tersalin!' : 'Salin Biodata'}</span>
                  </button>
                  <a
                    href="/docs/template-biodata-pengusul-dosen.txt"
                    download="template-biodata-pengusul-dosen.txt"
                    className="pedoman-btn-action secondary"
                  >
                    <Download size={14} />
                    <span>Unduh Biodata (.txt)</span>
                  </a>
                </div>
              </div>
              <pre className="pedoman-code-viewer">{BIODATA_PENGUSUL_TEXT}</pre>
            </div>

            {/* Quick Summary of Lampiran 2, 3, 5, 6 */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2rem 0 1rem' }}>
              Daftar Lampiran Pendukung Lainnya
            </h3>
            <div className="pedoman-grid-3">
              <GlowCard glowColor="blue" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip blue">Lampiran 2</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Justifikasi Anggaran Belanja</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Uraian kuantitatif volume, satuan, harga satuan, dan subtotal per komponen (Bahan Habis Pakai, Sewa/Jasa, Transportasi Lokal, Lain-lain).
                  </p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    className="pedoman-btn-action secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setActiveTab('rab')}
                  >
                    <span>Lihat di Tab RAB &rarr;</span>
                  </button>
                </div>
              </GlowCard>

              <GlowCard glowColor="emerald" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip emerald">Lampiran 3</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Susunan Organisasi Tim &amp; Pembagian Tugas</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Tabel matriks 5 kolom: No, Nama Mahasiswa, Program Studi, Alokasi Waktu (jam/minggu), dan Uraian Kontribusi Tugas spesifik.
                  </p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <a
                    href="/docs/template-biodata-pengusul-dosen.txt"
                    download="template-biodata-pengusul-dosen.txt"
                    className="pedoman-btn-action secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={13} />
                    <span>Unduh Format (.txt)</span>
                  </a>
                </div>
              </GlowCard>

              <GlowCard glowColor="amber" className="pedoman-card-base">
                <div>
                  <div className="pedoman-badge-chip amber">Lampiran 5</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>Surat Pernyataan Kesediaan Mitra</h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Wajib untuk skema <strong>PKM-PM</strong> dan <strong>PKM-PI</strong>. Ditandatangani pimpinan kelompok mitra di atas meterai Rp 10.000.
                  </p>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <a
                    href="/docs/panduan-format-sistematika-proposal-belmawa.txt"
                    download="panduan-format-sistematika-proposal-belmawa.txt"
                    className="pedoman-btn-action secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={13} />
                    <span>Unduh Ketentuan Mitra</span>
                  </a>
                </div>
              </GlowCard>
            </div>
          </section>
        )}

        {/* ==============================================================
            TAB 5: ARSIP PROPOSAL LOLOS PIMNAS (PDF ASLI UNILA)
            ============================================================== */}
        {activeTab === 'arsip' && (
          <section aria-label="Arsip Proposal Lolos PIMNAS Unila">
            <div className="pedoman-alert-banner gold">
              <div className="pedoman-alert-icon">
                <Award size={24} />
              </div>
              <div className="pedoman-alert-content">
                <h4>Arsip Proposal Peraih Prestasi &amp; Lolos Pendanaan Nasional</h4>
                <p>
                  Pelajari langsung anatomi penulisan, diagram alir metodologi, perumusan anggaran biaya, dan justifikasi luaran dari proposal mahasiswa Universitas Lampung yang berhasil didanai dan meraih medali di ajang PIMNAS. Seluruh berkas PDF di bawah ini adalah dokumen utuh yang dapat langsung kamu buka dan unduh.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              {ARSIP_PROPOSAL_LOLOS.map((prop) => (
                <GlowCard key={prop.id} glowColor={prop.glowColor} className="pedoman-card-base" style={{ padding: '1.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="pedoman-badge-chip blue">{prop.schema}</span>
                      <span className="pedoman-badge-chip amber">{prop.badge}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Tahun {prop.year}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.3rem 0.75rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      Dana Didanai: {prop.grant}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.35 }}>
                    {prop.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
                    {prop.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', padding: '0.85rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Ketua Tim</span>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{prop.teamLeader}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Dosen Pendamping</span>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{prop.supervisor}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Kolaborasi Fakultas</span>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{prop.fakultas}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <a
                      href={prop.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pedoman-btn-action primary"
                    >
                      <ExternalLink size={14} />
                      <span>Buka &amp; Baca PDF Lengkap</span>
                    </a>
                    <a
                      href={prop.fileUrl}
                      download
                      className="pedoman-btn-action secondary"
                    >
                      <Download size={14} />
                      <span>Unduh Berkas</span>
                    </a>
                  </div>
                </GlowCard>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div className="pedoman-toast-notice">
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  )
}
export default PedomanIndex