// Persistent LocalStorage helper agar data tidak statis dan tersimpan secara dinamis
export function loadStore(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      let parsed = JSON.parse(saved)
      if (key === 'pkm_master_direct_messages' && Array.isArray(parsed)) {
        // Hapus semua riwayat pesan legacy/seeding
        parsed = parsed.filter(m => m && !m.id?.startsWith('msg-fb-') && !m.id?.startsWith('msg-ss-') && !m.id?.startsWith('msg-ab-') && !m.id?.startsWith('msg-rb-') && !m.id?.startsWith('msg-na-') && !m.id?.startsWith('msg-fn-') && !m.id?.startsWith('msg-sf-') && !m.id?.startsWith('msg-br-') && !m.id?.startsWith('msg-bh-') && !m.id?.startsWith('msg-nh-') && !m.id?.startsWith('msg-adm-'))
        localStorage.setItem(key, JSON.stringify(parsed))
      }
      return parsed
    }
  } catch (err) {
    console.warn(`Gagal memuat ${key} dari localStorage:`, err)
  }
  return fallback
}

export function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`Gagal menyimpan ${key} ke localStorage:`, err)
  }
}

// Data awal Dosen Pembimbing (bebas emoji)
export const initialDosenOverview = {
  lecturerNumber: '198204152008121002',
  faculty: 'Fakultas Teknik',
  department: 'Teknik Elektro',
  studyProgram: 'Teknik Elektro',
  academicPosition: 'Lektor Kepala',
  supervisionCapacity: 10,
  activeSupervisedCount: 4,
  remainingCapacity: 6,
  pendingRequestsCount: 2,
  upcomingSessionsCount: 2,
}

export const initialSupervisorRequests = [
  {
    id: 'req-01',
    proposalId: 'prop-01',
    proposalTitle: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung Berbasis Edge AI',
    schemeCode: 'PKM-KC',
    teamName: 'AgroSense Unila',
    studentName: 'Nadia Putri Maharani',
    studentNumber: '2117051001',
    studentFaculty: 'Fakultas Teknik',
    studentProdi: 'Teknik Elektro',
    requestMessage: 'Selamat siang Bapak Dr. Budi, mohon kesediaan Bapak menjadi dosen pembimbing tim kami pada skema PKM-KC. Kami mengembangkan sensor IoT tanah dan inferensi edge AI pada perkebunan lada di Tanggamus. Kami sangat berharap arahan Bapak.',
    status: 'pending',
    responseMessage: '',
    respondedAt: null,
    createdAt: '2026-10-10T09:30:00Z',
  },
  {
    id: 'req-02',
    proposalId: 'prop-02',
    proposalTitle: 'Bio-Briket dari Limbah Kulit Kopi Robusta sebagai Alternatif Energi Terbarukan Ramah Lingkungan',
    schemeCode: 'PKM-RE',
    teamName: 'BioEnergi Lampung',
    studentName: 'Rian Saputra',
    studentNumber: '2117021045',
    studentFaculty: 'FMIPA',
    studentProdi: 'Kimia',
    requestMessage: 'Yth. Bapak Dr. Budi, tim kami bermaksud mengajukan permohonan bimbingan untuk pengujian nilai kalor dan emisi bio-briket limbah kopi. Mohon kesediaan dan bimbingan Bapak.',
    status: 'pending',
    responseMessage: '',
    respondedAt: null,
    createdAt: '2026-10-11T14:15:00Z',
  },
  {
    id: 'req-03',
    proposalId: 'prop-03',
    proposalTitle: 'Aplikasi SIG Pemetaan Sebaran Hama Ulat Daun Kakao Berbasis Android',
    schemeCode: 'PKM-PI',
    teamName: 'AgriMap Geo',
    studentName: 'Fajar Nugroho',
    studentNumber: '2017051012',
    studentFaculty: 'Fakultas Pertanian',
    studentProdi: 'Proteksi Tanaman',
    requestMessage: 'Assalamu’alaikum Bapak, izin mengajukan bimbingan PKM Penerapan Iptek bersama kelompok tani mitra di Pesawaran.',
    status: 'accepted',
    responseMessage: 'Diterima. Segera jadwalkan konsultasi awal via sistem untuk mematangkan MoU dengan mitra tani.',
    respondedAt: '2026-10-08T11:00:00Z',
    createdAt: '2026-10-07T08:00:00Z',
  },
]

export const initialSupervisedProposals = [
  {
    id: 'prop-03',
    title: 'Aplikasi SIG Pemetaan Sebaran Hama Ulat Daun Kakao Berbasis Android',
    abstract: 'Solusi digital berbasis Sistem Informasi Geografis (SIG) untuk mendeteksi dan memetakan serangan hama pada kebun kakao secara spasial, membantu petani menentukan zona penanganan presisi.',
    status: 'submitted',
    schemeCode: 'PKM-PI',
    schemeName: 'PKM Penerapan Iptek',
    teamName: 'AgriMap Geo',
    leaderName: 'Fajar Nugroho',
    leaderFaculty: 'Fakultas Pertanian',
    isFunded: false,
    submittedAt: '2026-10-09T16:00:00Z',
    createdAt: '2026-09-20T10:00:00Z',
    logbookCount: 4,
  },
  {
    id: 'prop-04',
    title: 'Robot Pembersih Sampah Saluran Irigasi Berbasis Kendali Nirkabel LoRa',
    abstract: 'Rancang bangun wahana robot apung pembersih limbah plastik saluran irigasi sawah di Lampung Tengah dengan transmisi kendali jarak jauh frekuensi LoRa hemat daya.',
    status: 'under_review',
    schemeCode: 'PKM-KC',
    schemeName: 'PKM Karsa Cipta',
    teamName: 'RoboClean Hydro',
    leaderName: 'Ahmad Zaki',
    leaderFaculty: 'Fakultas Teknik',
    isFunded: false,
    submittedAt: '2026-10-05T13:40:00Z',
    createdAt: '2026-09-15T08:00:00Z',
    logbookCount: 6,
  },
  {
    id: 'prop-05',
    title: 'Pemberdayaan UMKM Kripik Pisang Lampung Melalui Digital Packaging & Storytelling Brand',
    abstract: 'Pengabdian masyarakat untuk modernisasi kemasan biodegradable dan kurasi narasi kultural UMKM kripik pisang di sentra Gang PU Bandar Lampung.',
    status: 'funded',
    schemeCode: 'PKM-PM',
    schemeName: 'PKM Pengabdian Masyarakat',
    teamName: 'BananaPreneur',
    leaderName: 'Siti Rahmawati',
    leaderFaculty: 'FEB',
    isFunded: true,
    submittedAt: '2026-09-28T10:00:00Z',
    createdAt: '2026-09-01T10:00:00Z',
    logbookCount: 9,
  },
]

export const initialGuidanceSessions = [
  {
    id: 'gs-01',
    proposalId: 'prop-03',
    proposalTitle: 'Aplikasi SIG Pemetaan Sebaran Hama Ulat Daun Kakao Berbasis Android',
    schemeCode: 'PKM-PI',
    teamName: 'AgriMap Geo',
    scheduledAt: '2026-10-15T10:00',
    location: 'Ruang Dosen Jurusan TE, Gedung H Lt. 2',
    meetingUrl: 'https://meet.google.com/pkm-unila-bimbingan1',
    status: 'scheduled',
    agenda: 'Validasi form survei kebutuhan mitra dan pengujian prototipe wireframe SIG mobile',
    meetingNotes: '',
  },
  {
    id: 'gs-02',
    proposalId: 'prop-04',
    proposalTitle: 'Robot Pembersih Sampah Saluran Irigasi Berbasis Kendali Nirkabel LoRa',
    schemeCode: 'PKM-KC',
    teamName: 'RoboClean Hydro',
    scheduledAt: '2026-10-18T14:00',
    location: 'Lab Robotika & Mekatronika Unila',
    meetingUrl: 'https://meet.google.com/pkm-unila-bimbingan2',
    status: 'scheduled',
    agenda: 'Uji daya angkut payload konveyor sampah dan stabilitas lambung kapal di air mengalir',
    meetingNotes: '',
  },
  {
    id: 'gs-03',
    proposalId: 'prop-05',
    proposalTitle: 'Pemberdayaan UMKM Kripik Pisang Lampung Melalui Digital Packaging & Storytelling Brand',
    schemeCode: 'PKM-PM',
    teamName: 'BananaPreneur',
    scheduledAt: '2026-10-06T09:00',
    location: 'Gedung Rektorat Lt. 3 / Daring',
    meetingUrl: 'https://zoom.us/j/9871234567',
    status: 'completed',
    agenda: 'Evaluasi draf laporan kemajuan dan bukti transfer legalitas P-IRT mitra',
    meetingNotes: 'Revisi label komposisi gizi disetujui. Tim lanjut ke pencetakan kemasan ramah lingkungan 500 pcs.',
  },
]

// Data awal Reviewer (bebas emoji)
export const initialReviewerOverview = {
  totalAssignments: 5,
  pendingCount: 2,
  inProgressCount: 1,
  completedCount: 2,
}

export const initialReviewAssignments = [
  {
    id: 'rev-01',
    proposalId: 'prop-101',
    proposalTitle: 'Deteksi Otomatis Penyakit Blas Padi Menggunakan Citra Drone & Mobile YOLOv8',
    schemeCode: 'PKM-KC',
    schemeName: 'PKM Karsa Cipta',
    teamName: 'PadiVision',
    leaderName: 'Bima Satria',
    faculty: 'Fakultas Pertanian',
    status: 'assigned', // assigned | in_progress | completed
    reviewDeadline: '2026-10-18',
    assignedAt: '2026-10-08T08:00:00Z',
    totalScore: null,
    recommendation: null,
    reviewStatus: 'draft',
    abstract: 'Proposal ini mengusulkan integrasi kamera multispektral drone hemat biaya dan model deteksi objek YOLOv8 pada smartphone petani untuk memetakan gejala awal penyakit blas pada hamparan sawah Kabupaten Pringsewu secara real-time.',
    documentUrl: '/docs/proposal-padivision-pkm-kc.pdf',
    versionNumber: 1,
    strengths: '',
    weaknesses: '',
    comments: '',
  },
  {
    id: 'rev-02',
    proposalId: 'prop-102',
    proposalTitle: 'Sintesis Nanokomposit Kitosan-Pektin Kulit Kakao sebagai Pengawet Alami Ikan Teri Nasi',
    schemeCode: 'PKM-RE',
    schemeName: 'PKM Riset Eksakta',
    teamName: 'NanoMarine',
    leaderName: 'Clara Anindya',
    faculty: 'FMIPA',
    status: 'in_progress',
    reviewDeadline: '2026-10-17',
    assignedAt: '2026-10-07T10:00:00Z',
    totalScore: 78.5,
    recommendation: 'revision',
    reviewStatus: 'draft',
    abstract: 'Pemanfaatan polimer alami dari limbah hasil olahan coklat Lampung sebagai pelapis edible film ramah lingkungan guna memperpanjang umur simpan hasil tangkapan nelayan pesisir Teluk Lampung tanpa formalin.',
    documentUrl: '/docs/proposal-nanomarine-pkm-re.pdf',
    versionNumber: 2,
    strengths: 'Kajian ekstraksi pektin limbah kakao sangat terperinci dan didukung pengujian FTIR.',
    weaknesses: 'Uji organoleptik pada variasi suhu tropis belum dicantumkan secara kuantitatif.',
    comments: 'Perbaiki metodologi pengujian organoleptik dan lengkapi surat izin pemanfaatan limbah pabrik.',
  },
  {
    id: 'rev-03',
    proposalId: 'prop-103',
    proposalTitle: 'Model Edukasi Finansial Berkelanjutan untuk Ibu Rumah Tangga Pesisir Berbasis Gamifikasi Tabungan Emas',
    schemeCode: 'PKM-PM',
    schemeName: 'PKM Pengabdian Masyarakat',
    teamName: 'FinSmart Pesisir',
    leaderName: 'Deni Kurniawan',
    faculty: 'FEB',
    status: 'completed',
    reviewDeadline: '2026-10-12',
    assignedAt: '2026-10-02T09:00:00Z',
    totalScore: 92.0,
    recommendation: 'funded',
    reviewStatus: 'finalized',
    abstract: 'Program pelatihan inklusi keuangan dengan media board game edukatif dan aplikasi pencatat kas harian untuk keluarga nelayan di Kalianda Lampung Selatan.',
    documentUrl: '/docs/proposal-finsmart-pkm-pm.pdf',
    versionNumber: 1,
    strengths: 'Dukungan kelompok nelayan mitra sangat konkret dengan komitmen partisipasi aktif 35 ibu nelayan.',
    weaknesses: 'Rincian anggaran untuk modul papan permainan perlu distandardisasi.',
    comments: 'Sangat layak didanai dan memiliki potensi replikasi tinggi di kawasan pesisir nusantara.',
  },
  {
    id: 'rev-04',
    proposalId: 'prop-104',
    proposalTitle: 'Produksi Teh Celup Daun Kelor & Bunga Telang Kaya Antioksidan Beraroma Melati',
    schemeCode: 'PKM-K',
    schemeName: 'PKM Kewirausahaan',
    teamName: 'TelangTea Botanica',
    leaderName: 'Eka Lestari',
    faculty: 'Fakultas Pertanian',
    status: 'completed',
    reviewDeadline: '2026-10-10',
    assignedAt: '2026-10-01T11:00:00Z',
    totalScore: 68.0,
    recommendation: 'rejected',
    reviewStatus: 'finalized',
    abstract: 'Pengembangan produk minuman herbal fungsional dengan inovasi celup piramida ramah lingkungan.',
    documentUrl: '/docs/proposal-telangtea-pkm-k.pdf',
    versionNumber: 1,
    strengths: 'Produk memiliki daya tarik visual yang baik dengan kemasan modern.',
    weaknesses: 'Nilai kebaruan rendah karena produk sejenis sudah banyak di pasaran dan analisis BEP belum akurat.',
    comments: 'Belum memenuhi kriteria kebaruan dan differensiasi pasar untuk level kompetisi nasional.',
  },
]

export const defaultReviewCriteria = [
  { id: 1, name: 'Format & Kelengkapan Administrasi', description: 'Kesesuaian dengan pedoman umum PKM, tata tulis, kelengkapan surat pernyataan & biodata.', maxScore: 100, weight: 0.15 },
  { id: 2, name: 'Gagasan, Kreativitas & Kebaruan (Novelty)', description: 'Ketajaman masalah, orisinalitas ide, daya cipta, serta kebaruan luaran yang ditawarkan.', maxScore: 100, weight: 0.25 },
  { id: 3, name: 'Ketepatan Metodologi & Pelaksanaan', description: 'Kejelasan alur kerja, metode ilmiah/rekayasa, instrumen uji, dan manajemen risiko.', maxScore: 100, weight: 0.30 },
  { id: 4, name: 'Potensi Dampak, Luaran & Kemanfaatan', description: 'Kemanfaatan nyata bagi masyarakat/industri, paten/publikasi ilmiah, serta keberlanjutan produk.', maxScore: 100, weight: 0.20 },
  { id: 5, name: 'Kewajaran Anggaran (RAB) & Jadwal Kegiatan', description: 'Rincian anggaran realistis sesuai standar biaya masukan dan jadwal kegiatan yang terstruktur.', maxScore: 100, weight: 0.10 },
]

// ==========================================================
// DIREKTORI PENGGUNA RESMI SISTEM PKM (Real Multi-User Directory)
// Menjamin setiap akun terhubung ke pihak yang sesuai konteksnya
// ==========================================================
export const SYSTEM_USERS = {
  'user-dosen-budi': {
    id: 'user-dosen-budi',
    name: 'Dr. Budi Santoso, S.T., M.T.',
    email: 'dosen@pkm.unila.ac.id',
    role: 'dosen',
    roleLabel: 'Dosen Pembimbing (Teknik Elektro & IoT)',
    faculty: 'Fakultas Teknik',
    dept: 'Teknik Elektro',
    avatar: 'BS',
    status: 'Aktif Bimbingan',
  },
  'user-dosen-sri': {
    id: 'user-dosen-sri',
    name: 'Dr. Ir. Sri Mulyani, M.T.',
    email: 'dosen.reviewer@pkm.unila.ac.id',
    role: 'dosen',
    roleLabel: 'Dosen Pembimbing (Pertanian & Pangan)',
    faculty: 'Fakultas Pertanian',
    dept: 'Teknologi Hasil Pertanian',
    avatar: 'SM',
    status: 'Aktif Bimbingan & Review',
  },
  'user-rev-hendri': {
    id: 'user-rev-hendri',
    name: 'Dr. Hendri Reviewer, M.Kom.',
    email: 'reviewer@pkm.unila.ac.id',
    role: 'reviewer',
    roleLabel: 'Reviewer Internal PKM Unila',
    faculty: 'FMIPA',
    dept: 'Ilmu Komputer',
    avatar: 'HR',
    status: 'Reviewer Aktif',
  },
  'user-mhs-nadia': {
    id: 'user-mhs-nadia',
    name: 'Nadia Putri Maharani',
    email: 'mahasiswa@pkm.unila.ac.id',
    role: 'mahasiswa',
    roleLabel: 'Mahasiswa (Ketua Tim AgroSense — PKM-KC)',
    faculty: 'Fakultas Pertanian',
    dept: 'Agroteknologi',
    avatar: 'NP',
    status: 'Pengusul Proposal',
  },
  'user-mhs-favian': {
    id: 'user-mhs-favian',
    name: 'Favian Rifqi Pratama',
    email: 'mhs1@pkm.unila.ac.id',
    role: 'mahasiswa',
    roleLabel: 'Mahasiswa (Ketua Tim VisionAI — PKM-KC)',
    faculty: 'FMIPA',
    dept: 'Ilmu Komputer',
    avatar: 'FP',
    status: 'Pengusul Proposal',
  },
  'user-mhs-ahmad': {
    id: 'user-mhs-ahmad',
    name: 'Ahmad Fauzi',
    email: 'mhs2@pkm.unila.ac.id',
    role: 'mahasiswa',
    roleLabel: 'Mahasiswa (Ketua Tim SmartTrash — PKM-PI)',
    faculty: 'Fakultas Teknik',
    dept: 'Teknik Mesin & Otomasi',
    avatar: 'AF',
    status: 'Pengusul Proposal',
  },
  'user-mhs-siti': {
    id: 'user-mhs-siti',
    name: 'Siti Nurhaliza',
    email: 'mhs3@pkm.unila.ac.id',
    role: 'mahasiswa',
    roleLabel: 'Mahasiswa (Ketua Tim AgriPreneur — PKM-K)',
    faculty: 'Fakultas Pertanian',
    dept: 'Agribisnis',
    avatar: 'SN',
    status: 'Pengusul Proposal',
  },
  'user-mhs-bima': {
    id: 'user-mhs-bima',
    name: 'Bima Satria',
    email: 'bima.satria@student.unila.ac.id',
    role: 'mahasiswa',
    roleLabel: 'Mahasiswa (Ketua Tim PadiVision — PKM-KC)',
    faculty: 'Fakultas Pertanian',
    dept: 'Ilmu Tanah & IoT',
    avatar: 'BS',
    status: 'Pengusul Proposal',
  },
  'user-mhs-rian': {
    id: 'user-mhs-rian',
    name: 'Rian Saputra',
    email: 'rian.saputra@student.unila.ac.id',
    role: 'mahasiswa',
    roleLabel: 'Mahasiswa (Ketua Tim BioEnergi — PKM-RE)',
    faculty: 'FMIPA',
    dept: 'Kimia Terapan',
    avatar: 'RS',
    status: 'Pengusul Proposal',
  },
  'user-admin': {
    id: 'user-admin',
    name: 'Tim Pengelola PKM Center Unila',
    email: 'admin@pkm.unila.ac.id',
    role: 'admin',
    roleLabel: 'Admin Kampus (Helpdesk PKM)',
    faculty: 'LPPM Unila',
    dept: 'Pusat Kreativitas Mahasiswa',
    avatar: 'TP',
    status: 'Administrator',
  },
}

// Fungsi resolusi ID Kanonikal Pengguna yang Login
export function resolveCurrentUserId(user) {
  if (!user) return null
  const email = (user.email || '').toLowerCase().trim()
  const name = (user.name || user.nama || '').toLowerCase().trim()
  const role = (user.role || '').toLowerCase().trim()

  if (email.includes('dosen.reviewer') || name.includes('sri')) return 'user-dosen-sri'
  if (role === 'reviewer' || email.includes('reviewer') || name.includes('hendri') || email.startsWith('rev')) return 'user-rev-hendri'
  if (email.includes('mhs1') || email.includes('favian') || name.includes('favian') || email === '2217051001') return 'user-mhs-favian'
  if (email.includes('mhs2') || email.includes('ahmad') || name.includes('ahmad') || email === '2215061002') return 'user-mhs-ahmad'
  if (email.includes('mhs3') || email.includes('siti') || name.includes('siti') || email === '2114131003') return 'user-mhs-siti'
  if (email.includes('bima') || name.includes('bima')) return 'user-mhs-bima'
  if (email.includes('rian') || name.includes('rian')) return 'user-mhs-rian'
  if (email.includes('nadia') || email === '2117051001' || (role === 'mahasiswa' && (email.includes('mahasiswa') || !email.includes('@')))) return 'user-mhs-nadia'
  if (role === 'admin' || email.includes('admin')) return 'user-admin'
  if (role === 'dosen' || email.includes('dosen') || name.includes('budi') || /^19\d{8,}/.test(email)) return 'user-dosen-budi'
  return user.id || `user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`
}

// Menentukan Daftar Kontak Relevan Berdasarkan Siapa yang Login
export function getContactsForUser(currentUserId, userRole) {
  if (!currentUserId) return []

  const allUsers = Object.values(SYSTEM_USERS)
  const isMahasiswa = userRole === 'mahasiswa' || currentUserId.startsWith('user-mhs')
  const isDosen = userRole === 'dosen' || currentUserId.startsWith('user-dosen')

  const dosenList = allUsers.filter(u => u.role === 'dosen' && u.id !== currentUserId)
  const mhsList = allUsers.filter(u => u.role === 'mahasiswa' && u.id !== currentUserId)
  const otherList = allUsers.filter(u => (u.role === 'reviewer' || u.role === 'admin') && u.id !== currentUserId)

  if (isMahasiswa) {
    // Untuk Mahasiswa: Munculkan Dosen Pembimbing teratas (chat dosen), lalu Rekan Mahasiswa (chat mahasiswa), lalu Reviewer/Admin
    return [...dosenList, ...mhsList, ...otherList]
  }

  if (isDosen) {
    // Untuk Dosen: Munculkan Mahasiswa Bimbingan/Pengusul teratas (chat mahasiswa), lalu Rekan Dosen/Reviewer, lalu Admin
    return [...mhsList, ...dosenList, ...otherList]
  }

  return allUsers.filter(u => u.id !== currentUserId)
}

// Master Percakapan Bersama (Real Inter-Account Communication Database)
// Telah dikosongkan agar riwayat chat bersih di semua akun
export const initialMasterMessages = []

// Kompatibilitas mundur
export const initialConversations = []

export const initialChatThreads = {}

export const initialProposalFeedback = []

// Data awal Logbook Proposal Mahasiswa untuk Dosen Pembimbing (bebas emoji)
export const initialProposalLogbooks = {
  'prop-03': [
    {
      id: 'log-301',
      week: 'Pekan 1',
      date: '2026-09-25',
      activity: 'Survei lokasi kebun kakao kelompok tani Mekar Jaya Pesawaran dan wawancara kebutuhan petani.',
      progressPct: 25,
      attachmentName: 'Dokumentasi_Survei_Mitra.pdf',
      dosenComment: 'Data kebutuhan petani sudah konkret. Lanjutkan ke standardisasi format formulir geolokasi.',
      dosenStatus: 'valid',
      reviewedAt: '2026-09-27T10:00:00Z',
    },
    {
      id: 'log-302',
      week: 'Pekan 2',
      date: '2026-10-02',
      activity: 'Pengambilan sampel koordinat GPS pohon kakao terinfeksi dan perancangan skema database spasial PostGIS.',
      progressPct: 50,
      attachmentName: 'Skema_Database_Spasial.pdf',
      dosenComment: 'Struktur relasi tabel sudah bagus. Pastikan optimasi query spasial untuk performa mobile.',
      dosenStatus: 'valid',
      reviewedAt: '2026-10-04T14:30:00Z',
    },
    {
      id: 'log-303',
      week: 'Pekan 3',
      date: '2026-10-08',
      activity: 'Pembuatan wireframe antarmuka aplikasi Android dan integrasi peta interaktif Leaflet Mobile.',
      progressPct: 75,
      attachmentName: 'Wireframe_UI_Aplikasi.pdf',
      dosenComment: 'Perhatikan kontras warna pada peta agar mudah dilihat petani di bawah terik matahari perkebunan.',
      dosenStatus: 'valid',
      reviewedAt: '2026-10-09T09:15:00Z',
    },
    {
      id: 'log-304',
      week: 'Pekan 4',
      date: '2026-10-12',
      activity: 'Pengujian fitur offline-first untuk perekaman titik koordinat dan penyimpanan lokal SQLite sebelum sinkronisasi.',
      progressPct: 90,
      attachmentName: 'Hasil_Uji_Offline_Sync.pdf',
      dosenComment: '',
      dosenStatus: 'pending',
      reviewedAt: null,
    },
  ],
  'prop-04': [
    {
      id: 'log-401',
      week: 'Pekan 1',
      date: '2026-09-20',
      activity: 'Analisis debit air dan volume sampah plastik di saluran irigasi primer Metro Lampung.',
      progressPct: 20,
      attachmentName: 'Data_Karakteristik_Saluran.pdf',
      dosenComment: 'Pastikan berat jenis pelampung robot diperhitungkan terhadap arus debit maksimal saat hujan deras.',
      dosenStatus: 'valid',
      reviewedAt: '2026-09-22T11:00:00Z',
    },
    {
      id: 'log-402',
      week: 'Pekan 2',
      date: '2026-09-28',
      activity: 'Perancangan rangka katamaran berbahan PVC ringan dan mekanisme konveyor jaring sampah.',
      progressPct: 45,
      attachmentName: 'Desain_CAD_Katamaran.pdf',
      dosenComment: 'Bagus, lanjutkan fabrikasi rangka prototipe awal.',
      dosenStatus: 'valid',
      reviewedAt: '2026-09-30T16:00:00Z',
    },
    {
      id: 'log-403',
      week: 'Pekan 3',
      date: '2026-10-05',
      activity: 'Pemasangan modul transceiver LoRa SX1278 frekuensi 915 MHz dan uji jangkauan kendali nirkabel 500 meter.',
      progressPct: 70,
      attachmentName: 'Laporan_Uji_LoRa_RF.pdf',
      dosenComment: 'Hasil RSSI memuaskan pada jarak 500m di area terbuka saluran irigasi.',
      dosenStatus: 'valid',
      reviewedAt: '2026-10-07T13:20:00Z',
    },
    {
      id: 'log-404',
      week: 'Pekan 4',
      date: '2026-10-11',
      activity: 'Uji daya angkut payload konveyor sampah di kolam laboratorium mekatronika dengan beban 2.5 kg.',
      progressPct: 85,
      attachmentName: 'Dokumentasi_Uji_Daya_Angkut.pdf',
      dosenComment: '',
      dosenStatus: 'pending',
      reviewedAt: null,
    },
  ],
  'prop-05': [
    {
      id: 'log-501',
      week: 'Pekan 1',
      date: '2026-09-10',
      activity: 'Kunjungan observasi sentra UMKM kripik pisang Gang PU Bandar Lampung dan perumusan masalah kemasan konvensional.',
      progressPct: 30,
      attachmentName: 'Dokumentasi_Kunjungan_UMKM.pdf',
      dosenComment: 'Fokuskan pada kelayakan material kemasan biodegradable yang tahan minyak dan higienis.',
      dosenStatus: 'valid',
      reviewedAt: '2026-09-12T15:00:00Z',
    },
    {
      id: 'log-502',
      week: 'Pekan 2',
      date: '2026-09-22',
      activity: 'Perancangan 3 varian desain visual kemasan standing pouch dengan ornamen tapis khas Lampung.',
      progressPct: 65,
      attachmentName: 'Katalog_Desain_Kemasan_Tapis.pdf',
      dosenComment: 'Pilihan motif tapis sangat estetik. Pastikan pencantuman nomor izin edar dan barcode jelas.',
      dosenStatus: 'valid',
      reviewedAt: '2026-09-24T10:45:00Z',
    },
    {
      id: 'log-503',
      week: 'Pekan 3',
      date: '2026-10-04',
      activity: 'Pencetakan sampel kemasan ramah lingkungan 100 pcs dan pengujian ketahanan simpan renyah kripik 14 hari.',
      progressPct: 95,
      attachmentName: 'Hasil_Uji_Renyah_Kemasan.pdf',
      dosenComment: 'Kualitas kerenyahan terjaga baik. Tim siap melangkah ke tahap sosialisasi menyeluruh.',
      dosenStatus: 'valid',
      reviewedAt: '2026-10-06T09:30:00Z',
    },
  ],
}

// Data rincian dokumen proposal & berkas PDF resmi untuk reviewer dan dosen (bebas emoji)
export const proposalDocumentDetails = {
  'rev-01': {
    title: 'Deteksi Otomatis Penyakit Blas Padi Menggunakan Citra Drone & Mobile YOLOv8',
    scheme: 'PKM-KC (Karsa Cipta)',
    team: 'PadiVision',
    leader: 'Bima Satria',
    faculty: 'Fakultas Pertanian',
    version: 'Naskah_Final_v1.2.pdf',
    fileSize: '4.8 MB',
    pdfUrl: '/docs/proposal-padivision-pkm-kc.pdf',
    fileName: 'proposal-padivision-pkm-kc.pdf',
    submittedDate: '08 Oktober 2026',
    abstract: 'Pengembangan teknologi tepat guna berbasis visi komputer untuk mendeteksi sebaran jamur Pyricularia oryzae penyebab blas padi pada lahan persawahan di Pringsewu. Menggunakan drone berkamera multispektral dan model inferensi ringan YOLOv8.',
    chapters: {
      bab1: 'Penyakit blas padi menurunkan produktivitas gabah hingga 35-50% di sentra beras Lampung. Deteksi dini secara manual memerlukan waktu dan tenaga ahli yang terbatas, sehingga diperlukan sistem deteksi otomatis berbasis citra drone dan mobile app.',
      bab2: 'Tinjauan literatur mencakup arsitektur YOLOv8n, perbandingan ekstraksi fitur penyakit daun padi, integrasi GPS geotagging, dan regulasi penggunaan frekuensi drone sipil di Indonesia.',
      bab3: 'Metode riset: (1) Pengambilan dataset citra sawah 2.000 foto; (2) Data augmentation & labeling via Roboflow; (3) Training model YOLOv8 dengan target mAP > 85%; (4) Konversi format ONNX / TFLite ke aplikasi Flutter Android.',
      bab4: 'Total anggaran belanja sebesar Rp 8.750.000 dengan komponen utama: sewa sensor drone, bahan bakar uji terbang, server GPU cloud Google Colab Pro, dan pengujian lapangan selama 4 bulan.',
      lampiran: 'Surat pernyataan ketua bermaterai Rp 10.000, biodata ketua dan 3 anggota, biodata dosen pembimbing, surat kesediaan kemitraan dinas pertanian setempat.'
    }
  },
  'rev-02': {
    title: 'Sintesis Nanokomposit Kitosan-Pektin Kulit Kakao sebagai Pengawet Alami Ikan Teri Nasi',
    scheme: 'PKM-RE (Riset Eksakta)',
    team: 'NanoMarine',
    leader: 'Clara Anindya',
    faculty: 'FMIPA',
    version: 'Naskah_Revisi_v2.0.pdf',
    fileSize: '3.2 MB',
    pdfUrl: '/docs/proposal-nanomarine-pkm-re.pdf',
    fileName: 'proposal-nanomarine-pkm-re.pdf',
    submittedDate: '07 Oktober 2026',
    abstract: 'Pemanfaatan polimer alami dari limbah hasil olahan coklat Lampung sebagai pelapis edible film ramah lingkungan guna memperpanjang umur simpan hasil tangkapan nelayan pesisir Teluk Lampung tanpa formalin.',
    chapters: {
      bab1: 'Tingkat kebusukan pasca panen ikan teri nasi mencapai 20% karena minimnya rantai pendingin nelayan tradisional. Diperlukan bahan pengawet edible film antimikroba non-kimia.',
      bab2: 'Ekstraksi pektin dari limbah kakao dan kitosan dari cangkang udang menghasilkan polimer biokompatibel dengan gugus fungsional aktif penghambat bakteri pembusuk.',
      bab3: 'Metodologi: Ekstraksi kimia pektin limbah kakao, sintesis nanokomposit, uji karakterisasi FTIR dan SEM, serta pengujian angka lempeng total (ALT) bakteri teri.',
      bab4: 'RAB: Rp 9.400.000 untuk reagen laboratorium kimia murni, uji SEM di lab terpadu Unila, dan pembelian bahan baku dari sentra kakao Pesawaran.',
      lampiran: 'Kelengkapan administrasi 100% lengkap sesuai buku panduan Belmawa 2025.'
    }
  },
  'rev-03': {
    title: 'Model Edukasi Finansial Berkelanjutan untuk Ibu Rumah Tangga Pesisir Berbasis Gamifikasi Tabungan Emas',
    scheme: 'PKM-PM (Pengabdian Masyarakat)',
    team: 'FinSmart Pesisir',
    leader: 'Deni Kurniawan',
    faculty: 'FEB',
    version: 'Naskah_Pengabdian_v1.0.pdf',
    fileSize: '2.9 MB',
    pdfUrl: '/docs/proposal-finsmart-pkm-pm.pdf',
    fileName: 'proposal-finsmart-pkm-pm.pdf',
    submittedDate: '02 Oktober 2026',
    abstract: 'Program pelatihan inklusi keuangan dengan media board game edukatif dan aplikasi pencatat kas harian untuk keluarga nelayan di Kalianda Lampung Selatan.',
    chapters: {
      bab1: 'Fluktuasi pendapatan nelayan musiman menyebabkan kerentanan finansial keluarga pesisir. Ibu rumah tangga memerlukan literasi tabungan terencana yang mudah dipahami.',
      bab2: 'Teori gamifikasi keuangan micro-saving dan kebiasaan menabung emas sebagai lindung nilai inflasi di kalangan masyarakat maritim.',
      bab3: 'Pelaksanaan: Focus Group Discussion, simulasi papan permainan finansial 4 putaran modul, pendampingan pembukaan tabungan emas digital, dan monitoring mingguan.',
      bab4: 'RAB: Rp 7.800.000 untuk cetak papan permainan modular, modul saku literasi, dan konsumsi pelatihan 35 peserta mitra.',
      lampiran: 'Surat kesediaan kerja sama Kepala Desa Pesisir Kalianda dan Ketua PKK Desa.'
    }
  },
  'rev-04': {
    title: 'Produksi Teh Celup Daun Kelor & Bunga Telang Kaya Antioksidan Beraroma Melati',
    scheme: 'PKM-K (Kewirausahaan)',
    team: 'TelangTea Botanica',
    leader: 'Eka Lestari',
    faculty: 'Fakultas Pertanian',
    version: 'Naskah_Kewirausahaan_v1.0.pdf',
    fileSize: '3.5 MB',
    pdfUrl: '/docs/proposal-telangtea-pkm-k.pdf',
    fileName: 'proposal-telangtea-pkm-k.pdf',
    submittedDate: '01 Oktober 2026',
    abstract: 'Pengembangan produk minuman herbal fungsional dengan inovasi celup piramida ramah lingkungan.',
    chapters: {
      bab1: 'Tren gaya hidup sehat meningkatkan permintaan minuman fungsional kaya flavonoid dan antioksidan di kalangan generasi muda.',
      bab2: 'Sinergi ekstrak Moringa oleifera dan Clitoria ternatea memberikan khasiat anti-inflamasi dan warna biru alami yang memikat.',
      bab3: 'Proses pengeringan dehidrator suhu rendah, peracikan rasio rasa melati, packaging kantong celup biodegradable, dan strategi pemasaran online via TikTok Shop.',
      bab4: 'RAB: Rp 6.900.000 untuk mesin sealer piramida kantong teh, bahan baku daun kelor dan bunga telang organik, serta uji nutrisi proksimat.',
      lampiran: 'Analisis kelayakan usaha, perhitungan BEP, dan proyeksi arus kas 1 tahun.'
    }
  },
  'prop-01': {
    title: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung Berbasis Edge AI',
    scheme: 'PKM-KC (Karsa Cipta)',
    team: 'AgroSense Unila',
    leader: 'Nadia Putri Maharani',
    faculty: 'Fakultas Teknik',
    version: 'Naskah_Proposal_AgroSense_v1.0.pdf',
    fileSize: '5.1 MB',
    pdfUrl: '/docs/proposal-agrosense-pkm-kc.pdf',
    fileName: 'proposal-agrosense-pkm-kc.pdf',
    submittedDate: '10 Oktober 2026',
    abstract: 'Pengembangan sensor IoT tanah dan inferensi edge AI pada perkebunan lada di Tanggamus.',
    chapters: {
      bab1: 'Latar belakang kendala pengairan perkebunan lada Lampung.',
      bab2: 'Tinjauan literatur sensor soil moisture FDR dan mikrokontroler hemat daya ESP32.',
      bab3: 'Perakitan node sensor, pengujian laboratorium, dan instalasi lapangan.',
      bab4: 'RAB Rp 8.950.000 dan jadwal riset 4 bulan.',
      lampiran: 'Kelengkapan administrasi dan surat pernyataan ketua.'
    }
  }
}

// Data Anotasi & Komentar Langsung pada Berkas PDF Proposal (bebas emoji)
export const initialPdfAnnotations = {
  'rev-01': [
    {
      id: 'ann-101',
      proposalId: 'rev-01',
      page: 1,
      section: 'Halaman 1: Cover & Judul',
      author: 'Dr. Hendri Reviewer',
      category: 'positive',
      categoryLabel: 'Poin Positif',
      text: 'Judul sudah sangat spesifik dan mencerminkan bidang PKM-KC (kombinasi drone multispektral dan YOLOv8).',
      createdAt: '2026-10-10T10:15:00Z',
    },
    {
      id: 'ann-102',
      proposalId: 'rev-01',
      page: 2,
      section: 'Halaman 2: Lembar Pengesahan',
      author: 'Dr. Hendri Reviewer',
      category: 'suggestion',
      categoryLabel: 'Saran Masukan',
      text: 'Pastikan format gelar akademik pembimbing dan Dekan sudah persis sesuai SK rektorat.',
      createdAt: '2026-10-10T10:22:00Z',
    },
    {
      id: 'ann-103',
      proposalId: 'rev-01',
      page: 4,
      section: 'Halaman 4: Bab 1 Pendahuluan',
      author: 'Dr. Hendri Reviewer',
      category: 'critical',
      categoryLabel: 'Perbaikan Wajib',
      text: 'Latar belakang perlu dilengkapi data luas lahan sawah terdampak penyakit blas di Pringsewu minimal 2 tahun terakhir.',
      createdAt: '2026-10-10T10:35:00Z',
    },
    {
      id: 'ann-104',
      proposalId: 'rev-01',
      page: 5,
      section: 'Halaman 5: Bab 3 Metodologi',
      author: 'Dr. Hendri Reviewer',
      category: 'suggestion',
      categoryLabel: 'Saran Masukan',
      text: 'Diagram alir tahapan augmentasi citra dan transfer learning perlu ditambahkan resolusi minimum kamera drone.',
      createdAt: '2026-10-10T10:48:00Z',
    },
    {
      id: 'ann-105',
      proposalId: 'rev-01',
      page: 6,
      section: 'Halaman 6: Bab 4 RAB & Jadwal',
      author: 'Dr. Hendri Reviewer',
      category: 'critical',
      categoryLabel: 'Perbaikan Wajib',
      text: 'Biaya sewa server cloud GPU (Rp 2.100.000) harus disertai justifikasi durasi pelatihan model per epoch.',
      createdAt: '2026-10-10T11:05:00Z',
    },
  ],
  'rev-02': [
    {
      id: 'ann-201',
      proposalId: 'rev-02',
      page: 1,
      section: 'Halaman 1: Cover & Judul',
      author: 'Dr. Hendri Reviewer',
      category: 'positive',
      categoryLabel: 'Poin Positif',
      text: 'Ide pemanfaatan limbah kakao dan cangkang udang memiliki nilai ekonomi sirkular maritim yang sangat baik.',
      createdAt: '2026-10-09T09:20:00Z',
    },
    {
      id: 'ann-202',
      proposalId: 'rev-02',
      page: 4,
      section: 'Halaman 4: Bab 3 Metodologi',
      author: 'Dr. Hendri Reviewer',
      category: 'critical',
      categoryLabel: 'Perbaikan Wajib',
      text: 'Uji organoleptik dan uji pembusukan ikan teri belum mencantumkan variasi suhu penyimpanan tropis.',
      createdAt: '2026-10-09T09:40:00Z',
    },
  ],
  'rev-03': [
    {
      id: 'ann-301',
      proposalId: 'rev-03',
      page: 4,
      section: 'Halaman 4: Bab 3 Metode Pengabdian',
      author: 'Dr. Hendri Reviewer',
      category: 'positive',
      categoryLabel: 'Poin Positif',
      text: 'Pendekatan gamifikasi board game sangat tepat sasaran untuk literasi ibu rumah tangga nelayan.',
      createdAt: '2026-10-05T14:10:00Z',
    },
  ],
  'rev-04': [
    {
      id: 'ann-401',
      proposalId: 'rev-04',
      page: 4,
      section: 'Halaman 4: Bab 2 Peluang Usaha',
      author: 'Dr. Hendri Reviewer',
      category: 'critical',
      categoryLabel: 'Perbaikan Wajib',
      text: 'Analisis diferensiasi terhadap produk teh kelor yang sudah eksis di minimarket belum dijelaskan secara mendalam.',
      createdAt: '2026-10-04T16:30:00Z',
    },
  ],
}

