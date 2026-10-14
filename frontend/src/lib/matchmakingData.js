import { loadStore, saveStore } from './dosenReviewerData'

export const DEFAULT_VACANCIES = [
  {
    id: 'vac-1',
    teamId: 'team-agro',
    teamName: 'AgroSense Unila',
    leaderName: 'Nadia Putri Maharani',
    scheme: 'PKM-KC',
    title: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Berbasis Edge AI',
    targetFaculty: 'Fakultas Pertanian',
    targetMajor: 'Proteksi Tanaman / Agroteknologi',
    roleName: 'Ahli Karakteristik Tanah & Nutrisi Lada',
    skills: ['Analisis Tanah', 'Nutrisi Lada', 'Validasi Agronomis', 'Uji Lapangan'],
    slots: 1,
    description: 'Mencari rekan dari Fakultas Pertanian untuk merumuskan parameter kelembaban tanah dan dosis pupuk tanaman lada pada sistem otomasi terpadu.'
  },
  {
    id: 'vac-2',
    teamId: 'team-bio',
    teamName: 'BioEnergi Lampung',
    leaderName: 'Rian Saputra',
    scheme: 'PKM-RE',
    title: 'Bio-Briket dari Limbah Kulit Kopi Robusta sebagai Alternatif Energi Terbarukan',
    targetFaculty: 'Fakultas Teknik',
    targetMajor: 'Teknik Sipil / Teknik Mesin',
    roleName: 'Desain Cetakan Hidrolik & Uji Tekan',
    skills: ['AutoCAD / SolidWorks', 'Mekanika Bahan', 'Uji Kuat Tekan', 'Kalorimetri'],
    slots: 1,
    description: 'Membutuhkan mahasiswa Teknik untuk merancang prototype mesin pres hidrolik briket biomassa dan uji ketahanan tekan mekanis bahan.'
  },
  {
    id: 'vac-3',
    teamId: 'team-tapis',
    teamName: 'Tapis Edu-Tech',
    leaderName: 'Fajar Nugroho',
    scheme: 'PKM-PM',
    title: 'Pemberdayaan Pengrajin Tapis Kuno Melalui Platform Digital Interaktif Berbasis AI',
    targetFaculty: 'FEB',
    targetMajor: 'S1 Manajemen / Bisnis Digital',
    roleName: 'Rantai Pasok & Analisis Valuasi Usaha',
    skills: ['Business Model Canvas', 'Digital Marketing', 'Laporan Keuangan', 'Branding'],
    slots: 2,
    description: 'Memerlukan rekan dari FEB untuk merancang strategi komersialisasi produk kerajinan kain Tapis dan pelatihan pembukuan bagi kelompok mitra.'
  },
  {
    id: 'vac-4',
    teamId: 'team-eco',
    teamName: 'EcoFilter Zeolit',
    leaderName: 'Dewi Sartika',
    scheme: 'PKM-PI',
    title: 'Sistem Filtrasi Limbah Cair Pabrik Tahu Menggunakan Membran Zeolit Alam',
    targetFaculty: 'FMIPA',
    targetMajor: 'S1 Kimia',
    roleName: 'Uji Kualitas Air & Analisis COD/BOD',
    skills: ['Spektrofotometri', 'Uji COD/BOD', 'Kimia Analitik', 'Baku Mutu Air'],
    slots: 1,
    description: 'Memerlukan rekan mahasiswa FMIPA Kimia untuk pengukuran baku mutu air limbah sebelum dan sesudah filtrasi zeolit di pabrik mitra.'
  }
]

export const DEFAULT_INCOMING_REQUESTS = [
  {
    id: 'req-01',
    teamId: 'team-my',
    studentName: 'Dewi Sartika',
    npm: '2111011034',
    faculty: 'FEB',
    prodi: 'S1 Manajemen',
    skills: ['Analisis Finansial', 'Business Plan', 'Riset Pasar'],
    appliedRole: 'Analisis Kelayakan Finansial & Bisnis',
    message: 'Saya sangat tertarik berkontribusi pada usulan IoT Smart Agriculture ini untuk menyusun analisis kelayakan ekonomi, efisiensi biaya mitra petani lada, dan proyeksi ROI alat.',
    status: 'pending',
    createdAt: '14 Okt 2026'
  },
  {
    id: 'req-02',
    teamId: 'team-my',
    studentName: 'Bagas Wicaksono',
    npm: '2115011018',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Sipil',
    skills: ['Desain Struktur Casing', 'AutoCAD', 'Material Outdoor Tahan Cuaca'],
    appliedRole: 'Perancang Enclosure Proteksi Sensor',
    message: 'Saya mahasiswa Teknik Sipil dengan fokus perancangan struktur luar ruang. Saya ingin mengajukan diri merancang housing enclosure box sensor tanah yang tahan korosi dan cuaca ekstrem.',
    status: 'pending',
    createdAt: '14 Okt 2026'
  }
]

export function getVacancies() {
  return loadStore('pkm_mhs_vacancies', DEFAULT_VACANCIES)
}

export function saveVacancies(data) {
  saveStore('pkm_mhs_vacancies', data)
}

export function getIncomingRequests() {
  return loadStore('pkm_mhs_incoming_requests', DEFAULT_INCOMING_REQUESTS)
}

export function saveIncomingRequests(data) {
  saveStore('pkm_mhs_incoming_requests', data)
}

export function getMySentRequests() {
  return loadStore('pkm_mhs_my_sent_requests', {})
}

export function saveMySentRequests(data) {
  saveStore('pkm_mhs_my_sent_requests', data)
}
