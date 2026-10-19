import { useState, useMemo, useEffect } from 'react'
import {
  GraduationCap, Users, Sparkles, Search, ArrowRight,
  Check, Send, BookOpen, MessageSquare, CheckCircle2, UserPlus, Briefcase
} from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import { getVacancies, getMySentRequests, saveMySentRequests } from '../lib/matchmakingData'
import { loadStore, saveStore } from '../lib/dosenReviewerData'

const DOSEN_LIST = [
  {
    id: 'dos-1',
    name: 'Dr. Budi Dosen, S.T., M.T.',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Elektro',
    nidn: '0015048201',
    bidang: ['Edge AI', 'Internet of Things', 'Sistem Tertanam'],
    badge: 'Pembimbing PIMNAS 2024',
    quota: '4/10 Bimbingan',
    bio: 'Fokus riset otomasi cerdas, instrumentasi industri, dan komputasi edge untuk pertanian dan kebencanaan.',
  },
  {
    id: 'dos-2',
    name: 'Darmansyah, S.T., M.T., Ph.D.',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Informatika',
    nidn: '0028097903',
    bidang: ['Computer Vision', 'Deep Learning', 'Smart Farming'],
    badge: 'Medali Emas PIMNAS',
    quota: '5/10 Bimbingan',
    bio: 'Pengembangan visi komputer, klasifikasi citra satelit, dan deteksi dini penyakit tanaman pangan.',
  },
  {
    id: 'dos-3',
    name: 'Dr. Sumargono, M.Pd.',
    faculty: 'FKIP',
    prodi: 'Pendidikan Sejarah',
    nidn: '0012066802',
    bidang: ['Pendidikan Sejarah', 'Etnopedagogi', 'Media Digital'],
    badge: 'Reviewer PKM Nasional',
    quota: '3/10 Bimbingan',
    bio: 'Riset kearifan lokal Lampung, revitalisasi tradisi tutur, dan integrasi media digital dalam pembelajaran.',
  },
  {
    id: 'dos-4',
    name: 'Yusuf Perdana, S.Pd., M.Pd.',
    faculty: 'FKIP',
    prodi: 'Teknologi Pendidikan',
    nidn: '0003019001',
    bidang: ['Pembelajaran Interaktif', 'Gamifikasi Edukasi', 'Inovasi Modul'],
    badge: 'Fasilitator PKM Unila',
    quota: '2/10 Bimbingan',
    bio: 'Eksplorasi media interaktif, desain pengalaman belajar, dan pemberdayaan komunitas belajar siswa.',
  },
  {
    id: 'dos-5',
    name: 'Dr. rer. nat. Akmal Junaidi, S.Si., M.Sc.',
    faculty: 'FMIPA',
    prodi: 'Ilmu Komputer',
    nidn: '0019077405',
    bidang: ['Data Science', 'Natural Language Processing', 'Bioinformatika'],
    badge: 'Reviewer Internal Unila',
    quota: '4/10 Bimbingan',
    bio: 'Penerapan penambangan data genomik, pemodelan statistik bahasa daerah, dan komputasi sains.',
  },
  {
    id: 'dos-6',
    name: 'Dr. Eng. Ir. Helmy Fitriawan, S.T., M.Sc.',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Elektro',
    nidn: '0010087502',
    bidang: ['Wireless Sensor Network', 'Telekomunikasi', 'Radar Mikro'],
    badge: 'Koordinator Riset Terapan',
    quota: '3/10 Bimbingan',
    bio: 'Riset jaringan nirkabel hemat daya, deteksi propagasi sinyal maritim, dan telemetri jarak jauh.',
  },
]

function getSkillsForStudent(studyProgram = '', faculty = '') {
  const sp = (studyProgram || '').toLowerCase()
  const fac = (faculty || '').toLowerCase()
  if (sp.includes('komputer') || sp.includes('informatika')) {
    return ['Kecerdasan Buatan', 'Computer Vision', 'Fullstack Web', 'Internet of Things']
  }
  if (sp.includes('elektro')) {
    return ['Smart IoT', 'Edge AI', 'Otomasi Hardware', 'C++ / MicroPython']
  }
  if (sp.includes('agribisnis') || fac.includes('pertanian')) {
    return ['Rantai Pasok Agribisnis', 'Analisis Usaha Tani', 'Pemberdayaan Petani', 'Hilirisasi Pangan']
  }
  if (sp.includes('manajemen') || sp.includes('bisnis') || fac.includes('feb')) {
    return ['Business Model Canvas', 'Analisis Finansial', 'Digital Marketing', 'Validasi Pasar']
  }
  if (sp.includes('komunikasi') || fac.includes('fisip')) {
    return ['Komunikasi Publik', 'Kampanye Kreatif', 'Content Creation', 'Hubungan Masyarakat']
  }
  if (sp.includes('dokter') || fac.includes('kedokteran')) {
    return ['Riset Biomedis', 'Kesehatan Tropis', 'Edukasi Preventif', 'Metodologi Medis']
  }
  if (sp.includes('kimia') || sp.includes('fisika') || sp.includes('biologi')) {
    return ['Kimia Analitik', 'Bio-Briket', 'Spektroskopi', 'Karakterisasi Bahan']
  }
  if (fac.includes('hukum')) {
    return ['Analisis Regulasi', 'Hukum Lingkungan', 'Policy Brief', 'Sosiologi Hukum']
  }
  return ['PKM Teamwork', 'Riset Ilmiah', 'Kolaborasi Multidisiplin']
}

function getSkemaForStudent(faculty = '') {
  const fac = (faculty || '').toLowerCase()
  if (fac.includes('teknik') || fac.includes('mipa')) return 'PKM-KC'
  if (fac.includes('pertanian') || fac.includes('feb')) return 'PKM-K'
  if (fac.includes('fisip') || fac.includes('hukum') || fac.includes('fkip')) return 'PKM-PM'
  if (fac.includes('kedokteran')) return 'PKM-RE'
  return 'PKM-KC'
}

function getTargetForStudent(faculty = '') {
  const fac = (faculty || '').toLowerCase()
  if (fac.includes('teknik')) return 'Mencari Rekan: FMIPA & Fakultas Pertanian'
  if (fac.includes('mipa')) return 'Mencari Rekan: Fakultas Teknik & FEB'
  if (fac.includes('pertanian')) return 'Mencari Rekan: Fakultas Teknik & FEB'
  if (fac.includes('feb')) return 'Mencari Rekan: Fakultas Teknik & FMIPA'
  if (fac.includes('fisip')) return 'Mencari Rekan: FEB & Pertanian'
  if (fac.includes('kedokteran')) return 'Mencari Rekan: FMIPA & Teknik'
  return 'Mencari rekan lintas program studi / fakultas'
}

// Data mahasiswa terverifikasi yang terdaftar di database PostgreSQL (users & student_profiles)
const DB_REGISTERED_STUDENTS = [
  {
    id: '01037e8c-7e95-4e2e-b1e9-b0713f933f5f',
    name: 'Favian Pratama (Mahasiswa 1)',
    email: 'mhs1@pkm.unila.ac.id',
    faculty: 'FMIPA',
    prodi: 'S1 Ilmu Komputer',
    npm: '2217051001',
    skills: ['Kecerdasan Buatan', 'Computer Vision', 'Python & PyTorch', 'Fullstack Web'],
    skema: 'PKM-KC',
    target: 'Mencari Rekan: Fakultas Teknik (Hardware IoT) & FEB',
    bio: 'Fokus riset PKM-KC & Kecerdasan Buatan untuk deteksi dini dan otomasi sistem cerdas.'
  },
  {
    id: 'a7c1364a-df35-4020-9dcb-f69820af20c8',
    name: 'Ahmad Fauzi (Mahasiswa 2)',
    email: 'mhs2@pkm.unila.ac.id',
    faculty: 'Fakultas Teknik',
    prodi: 'S1 Teknik Informatika',
    npm: '2215061002',
    skills: ['Rekayasa Perangkat Lunak', 'Mobile Flutter', 'Cloud API', 'Embedded IoT'],
    skema: 'PKM-PI',
    target: 'Mencari Rekan: FMIPA & Pertanian',
    bio: 'Fokus riset PKM-PI & Rekayasa Perangkat Lunak untuk digitalisasi proses UMKM dan pertanian.'
  },
  {
    id: '727081be-9b82-4773-8110-18ce3ae5f460',
    name: 'Siti Nurhaliza (Mahasiswa 3)',
    email: 'mhs3@pkm.unila.ac.id',
    faculty: 'Fakultas Pertanian',
    prodi: 'S1 Agribisnis',
    npm: '2114131003',
    skills: ['Rantai Pasok Agribisnis', 'Analisis Kelayakan Usaha', 'Pemasaran Produk', 'Sosial Ekonomi'],
    skema: 'PKM-K',
    target: 'Mencari Rekan: Fakultas Teknik & FEB',
    bio: 'Fokus riset PKM-K & Hilirisasi Produk Komoditas pertanian lokal bernilai ekonomi tinggi.'
  },
  {
    id: 'b89bff11-c9f8-4df4-8279-1347ecdd3ae2',
    name: 'Nadia Mahasiswa',
    email: 'mahasiswa@pkm.unila.ac.id',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Elektro',
    npm: '2117051001',
    skills: ['Smart IoT', 'Edge AI', 'Otomasi Hardware', 'C++ / MicroPython'],
    skema: 'PKM-KC',
    target: 'Mencari Rekan: FMIPA & Fakultas Pertanian',
    bio: 'Mahasiswa aktif Teknik Elektro Universitas Lampung dengan fokus riset otomasi sensor pertanian.'
  },
  {
    id: '57e6e844-4a90-4c97-a3ac-2c5807472ddb',
    name: 'Rizky Ramadhan',
    email: 'rizky.ramadhan@student.unila.ac.id',
    faculty: 'FEB',
    prodi: 'S1 Manajemen Bisnis',
    npm: '2211011045',
    skills: ['Business Model Canvas', 'Analisis Finansial', 'Digital Marketing', 'Validasi Pasar'],
    skema: 'PKM-K',
    target: 'Mencari Rekan: FMIPA & Fakultas Teknik',
    bio: 'Peminat PKM-K dan Analisis Pasar untuk produk-produk inovatif berbasis teknologi.'
  },
  {
    id: 'aacae1ea-de05-446f-b1f5-53c47f1e355d',
    name: 'Bima Sakti',
    email: 'bima.sakti@student.unila.ac.id',
    faculty: 'FISIP',
    prodi: 'S1 Ilmu Komunikasi',
    npm: '2216031022',
    skills: ['Komunikasi Publik', 'Kampanye Kreatif', 'Content Creation', 'Hubungan Masyarakat'],
    skema: 'PKM-PM',
    target: 'Mencari Rekan: FEB & Pertanian',
    bio: 'Fokus pada komunikasi publik dan kampanye kreatif untuk pemberdayaan komunitas desa.'
  },
  {
    id: 'e5b72ce8-a668-441c-a333-d522adfcb00d',
    name: 'Aulia Rahma Putri',
    email: 'aulia.rahma@student.unila.ac.id',
    faculty: 'Fakultas Kedokteran',
    prodi: 'S1 Pendidikan Dokter',
    npm: '2318011008',
    skills: ['Riset Biomedis', 'Kesehatan Tropis', 'Edukasi Preventif', 'Metodologi Medis'],
    skema: 'PKM-RE',
    target: 'Mencari Rekan: FMIPA (Kimia/Biologi) & Teknik',
    bio: 'Fokus riset biomedis dan penanganan masalah kesehatan tropis pada masyarakat pesisir.'
  }
]

const FACULTIES = [
  'Semua Fakultas',
  'Fakultas Teknik',
  'FMIPA',
  'FKIP',
  'Fakultas Pertanian',
  'FEB',
  'Fakultas Hukum',
  'Fakultas Kedokteran',
  'FISIP',
]

export function CariTim({ user }) {
  const userKey = user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (user?.id || 'guest')
  const isNadia = user?.email === 'mahasiswa@pkm.unila.ac.id' || user?.username === 'mahasiswa'

  const [tab, setTab] = useState('dosen')
  const [search, setSearch] = useState('')
  const [faculty, setFaculty] = useState('Semua Fakultas')
  const [invited, setInvited] = useState({})
  const [vacancies] = useState(getVacancies)
  const [sentRequests, setSentRequests] = useState(() => getMySentRequests(userKey))
  const [mahasiswaList, setMahasiswaList] = useState(DB_REGISTERED_STUDENTS)
  const [alertMsg, setAlertMsg] = useState('')

  // Muat data mahasiswa terdaftar secara live dari backend database
  useEffect(() => {
    let alive = true
    fetch('/api/students')
      .then(res => res.json())
      .then(result => {
        if (!alive || !result?.data?.length) return
        const mapped = result.data.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          faculty: s.faculty || 'Universitas Lampung',
          prodi: s.studyProgram || s.department || 'Universitas Lampung',
          npm: s.npm || '-',
          bio: s.bio || `Mahasiswa aktif ${s.studyProgram || s.faculty} Universitas Lampung. Terbuka berkolaborasi dalam tim PKM.`,
          skema: getSkemaForStudent(s.faculty),
          target: getTargetForStudent(s.faculty),
          skills: getSkillsForStudent(s.studyProgram || s.department, s.faculty)
        }))
        setMahasiswaList(mapped)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    setSentRequests(getMySentRequests(userKey))
  }, [userKey])

  const handleInvite = (id, name, type) => {
    setInvited(prev => ({ ...prev, [id]: true }))
    // Sinkronisasi undangan mahasiswa ke pkm_mhs_team_${userKey} di localStorage
    if (type.includes('Mahasiswa') || type.includes('Anggota')) {
      const defaultTeam = isNadia ? {
        name: 'Tim PKM Unggulan Unila',
        members: [
          { name: 'Nadia Putri Maharani', role: 'Ketua Pengusul', prodi: 'S1 Teknik Elektro', npm: '2117051001' }
        ],
        invitations: []
      } : {
        name: `Tim PKM ${user?.name || 'Mahasiswa'}`,
        members: [
          { name: user?.name || 'Mahasiswa', role: 'Ketua Pengusul', prodi: user?.studyProgram || user?.department || 'Universitas Lampung', npm: user?.studentNumber || user?.npm || '-' }
        ],
        invitations: []
      }

      const currentTeam = loadStore(`pkm_mhs_team_${userKey}`, defaultTeam)
      const existingInv = currentTeam.invitations || []
      const newInv = {
        id: `inv-${Date.now()}`,
        name: name,
        faculty: 'Universitas Lampung',
        role: 'Calon Anggota Multidisiplin',
        status: 'Menunggu Konfirmasi',
        date: 'Hari ini'
      }
      saveStore(`pkm_mhs_team_${userKey}`, {
        ...currentTeam,
        invitations: [newInv, ...existingInv]
      })
    }
    setAlertMsg(`Undangan resmi berhasil dikirimkan kepada ${name} (${type})!`)
    setTimeout(() => setAlertMsg(''), 4500)
  }

  const handleRequestJoin = (vacId, teamName, roleName, vacObj = {}) => {
    const updated = { ...sentRequests, [vacId]: true }
    setSentRequests(updated)
    saveMySentRequests(updated, userKey)

    // Simpan request ke antrean pkm_mhs_incoming_requests
    const currentIncoming = loadStore('pkm_mhs_incoming_requests', [])
    const applicantName = user?.name ? `${user.name} (Anda)` : 'Mahasiswa (Anda)'
    const applicantNpm = user?.studentNumber || user?.npm || '-'
    const applicantFaculty = user?.faculty || 'Universitas Lampung'
    const applicantProdi = user?.studyProgram || user?.department || 'S1'

    const newReq = {
      id: `req-${Date.now()}`,
      teamId: vacId,
      teamName: teamName,
      targetLeaderEmail: vacObj?.leaderEmail || '',
      targetLeaderName: vacObj?.leaderName || '',
      applicantEmail: user?.email || '',
      studentName: applicantName,
      npm: applicantNpm,
      faculty: applicantFaculty,
      prodi: applicantProdi,
      skills: ['PKM Teamwork', 'Riset', 'Kolaborasi'],
      appliedRole: roleName,
      message: `Saya tertarik berkontribusi pada usulan ${teamName} sebagai ${roleName}.`,
      status: 'pending',
      createdAt: 'Baru saja'
    }
    saveStore('pkm_mhs_incoming_requests', [newReq, ...currentIncoming])

    setAlertMsg(`Permintaan bergabung ke tim "${teamName}" untuk posisi "${roleName}" berhasil diajukan! Ketua tim akan meninjau usulanmu.`)
    setTimeout(() => setAlertMsg(''), 5500)
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  // Filter Dosen
  const filteredDosen = useMemo(() => {
    return DOSEN_LIST.filter(d => {
      const matchFac = faculty === 'Semua Fakultas' || d.faculty === faculty
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        d.name.toLowerCase().includes(q) ||
        d.faculty.toLowerCase().includes(q) ||
        d.prodi.toLowerCase().includes(q) ||
        d.bidang.some(b => b.toLowerCase().includes(q))
      return matchFac && matchSearch
    })
  }, [faculty, search])

  // Filter Mahasiswa (Hanya Mahasiswa Terdaftar di Database)
  const filteredMahasiswa = useMemo(() => {
    return mahasiswaList.filter(m => {
      // Sembunyikan mahasiswa yang sedang login agar tidak mengundang diri sendiri
      if (user) {
        const myNpm = user.studentNumber || user.npm
        if (m.id === user.id) return false
        if (myNpm && m.npm === myNpm) return false
        if (user.email && m.email === user.email) return false
      }

      const matchFac = faculty === 'Semua Fakultas' || m.faculty === faculty
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.faculty.toLowerCase().includes(q) ||
        m.prodi.toLowerCase().includes(q) ||
        (m.npm && m.npm.toLowerCase().includes(q)) ||
        m.skills.some(s => s.toLowerCase().includes(q)) ||
        m.skema.toLowerCase().includes(q)
      return matchFac && matchSearch
    })
  }, [mahasiswaList, faculty, search, user])

  // Filter Lowongan Tim
  const filteredVacancies = useMemo(() => {
    return vacancies.filter(v => {
      const matchFac = faculty === 'Semua Fakultas' || v.targetFaculty === faculty
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        v.teamName.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q) ||
        v.targetFaculty.toLowerCase().includes(q) ||
        v.targetMajor.toLowerCase().includes(q) ||
        v.roleName.toLowerCase().includes(q) ||
        v.skills.some(s => s.toLowerCase().includes(q)) ||
        v.scheme.toLowerCase().includes(q)
      return matchFac && matchSearch
    })
  }, [vacancies, faculty, search])

  return (
    <div className="caritim-container">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <section className="module-header" style={{ marginBottom: '1.75rem' }}>
        <div className="module-header-top">
          <div>
            <div className="module-badge">MATCHMAKING DUA ARAH PKM</div>
            <h1 className="module-title">Cari Tim & Pembimbing</h1>
            <p className="module-subtitle">
              Sistem pencocokan interdisipliner: Tim dapat mengundang anggota (Invite) dan mahasiswa dapat melamar ke tim yang membuka lowongan (Request).
            </p>
          </div>
        </div>
      </section>

      {/* Notification Banner */}
      {alertMsg && (
        <div className="student-message-box" style={{ borderLeftColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', background: '#ecfdf5', color: '#065f46' }}>
          <CheckCircle2 size={18} />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* ========================================================
          DIRECTORY EXPLORER CONTROLS
          ======================================================== */}
      <div className="caritim-controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Segmented Tabs (3 Modes) */}
          <nav className="modern-tabs" style={{ margin: 0 }}>
            <button
              className={`tab-btn ${tab === 'dosen' ? 'active' : ''}`}
              onClick={() => setTab('dosen')}
            >
              <GraduationCap size={16} />
              <span>Direktori Dosen Pembimbing</span>
              <span className="tab-badge">{filteredDosen.length}</span>
            </button>
            <button
              className={`tab-btn ${tab === 'mahasiswa' ? 'active' : ''}`}
              onClick={() => setTab('mahasiswa')}
            >
              <Users size={16} />
              <span>Mahasiswa Mencari Tim</span>
              <span className="tab-badge">{filteredMahasiswa.length}</span>
            </button>
            <button
              className={`tab-btn ${tab === 'lowongan' ? 'active' : ''}`}
              onClick={() => setTab('lowongan')}
            >
              <Briefcase size={16} />
              <span>Tim Buka Rekrutmen</span>
              <span className="tab-badge" style={{ background: '#fef3c7', color: '#b45309' }}>{filteredVacancies.length}</span>
            </button>
          </nav>

          {/* Quick Info */}
          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            Menampilkan {tab === 'dosen' ? filteredDosen.length : tab === 'mahasiswa' ? filteredMahasiswa.length : filteredVacancies.length} entri aktif
          </span>
        </div>

        {/* Search Bar */}
        <div className="caritim-search-bar">
          <Search size={18} color="#94a3b8" />
          <input
            type="search"
            className="caritim-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === 'dosen'
                ? 'Cari nama dosen, prodi, atau bidang riset (misal: AI, IoT, Sejarah)...'
                : tab === 'mahasiswa'
                  ? 'Cari nama mahasiswa, keahlian, atau skema usulan (misal: Bio-Briket, Robotik)...'
                  : 'Cari lowongan tim, jurusan yang dicari, atau judul usulan (misal: Teknik Sipil, FEB, PKM-KC)...'
            }
          />
        </div>

        {/* Faculty Filter Pills */}
        <div className="caritim-faculty-pills">
          {FACULTIES.map(fac => (
            <button
              key={fac}
              type="button"
              className={`caritim-faculty-btn ${faculty === fac ? 'active' : ''}`}
              onClick={() => setFaculty(fac)}
            >
              {fac}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          DIRECTORY CARDS GRID
          ======================================================== */}
      {tab === 'dosen' && (
        <div className="caritim-directory-grid">
          {filteredDosen.map(d => (
            <article key={d.id} className="caritim-card">
              <div>
                <div className="caritim-card-head">
                  <div className="caritim-avatar gold">
                    {getInitials(d.name)}
                  </div>
                  <div className="caritim-card-meta">
                    <h3 className="caritim-card-name" title={d.name}>{d.name}</h3>
                    <div className="caritim-card-faculty">
                      <GraduationCap size={14} />
                      <span>{d.faculty} • {d.prodi}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <span className="bento-funded-pill" style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                    {d.badge}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    NIDN: {d.nidn}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: '0 0 0.75rem' }}>
                  {d.bio}
                </p>

                <div className="caritim-card-tags">
                  {d.bidang.map(b => (
                    <span key={b} className="caritim-tag-pill">#{b}</span>
                  ))}
                </div>
              </div>

              <div className="caritim-card-actions">
                <button
                  type="button"
                  className={`btn-action ${invited[d.id] ? 'success' : 'primary'}`}
                  onClick={() => handleInvite(d.id, d.name, 'Dosen Pembimbing')}
                  style={{ flex: 1 }}
                >
                  {invited[d.id] ? (
                    <>
                      <Check size={14} />
                      <span>Undangan Terkirim</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap size={14} />
                      <span>Undang Pembimbing</span>
                    </>
                  )}
                </button>
                <a
                  href="#pesan"
                  className="btn-action secondary"
                  title="Kirim pesan langsung"
                  style={{ padding: '0.65rem 0.85rem' }}
                >
                  <MessageSquare size={14} />
                </a>
              </div>
            </article>
          ))}
          {filteredDosen.length === 0 && (
            <div className="student-empty" style={{ gridColumn: '1 / -1' }}>
              <h4>Tidak ada dosen ditemukan</h4>
              <p>Coba gunakan kata kunci pencarian lain atau pilih filter "Semua Fakultas".</p>
            </div>
          )}
        </div>
      )}

      {tab === 'mahasiswa' && (
        <div className="caritim-directory-grid">
          {filteredMahasiswa.map(m => (
            <article key={m.id} className="caritim-card">
              <div>
                <div className="caritim-card-head">
                  <div className="caritim-avatar">
                    {getInitials(m.name)}
                  </div>
                  <div className="caritim-card-meta">
                    <h3 className="caritim-card-name" title={m.name}>{m.name}</h3>
                    <div className="caritim-card-faculty" style={{ color: '#059669' }}>
                      <BookOpen size={14} />
                      <span>{m.faculty} • {m.prodi}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <span className="bento-scheme-pill" style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                    Minat: {m.skema}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    NPM: {m.npm}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: '0 0 0.5rem' }}>
                  {m.bio}
                </p>

                <div style={{ background: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '0.5px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  <strong>Kebutuhan Tim:</strong> {m.target}
                </div>

                <div className="caritim-card-tags">
                  {m.skills.map(s => (
                    <span key={s} className="caritim-tag-pill">#{s}</span>
                  ))}
                </div>
              </div>

              <div className="caritim-card-actions">
                <button
                  type="button"
                  className={`btn-action ${invited[m.id] ? 'success' : 'primary'}`}
                  onClick={() => handleInvite(m.id, m.name, 'Anggota Tim')}
                  style={{ flex: 1 }}
                >
                  {invited[m.id] ? (
                    <>
                      <Check size={14} />
                      <span>Undangan Terkirim</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Undang ke Tim</span>
                    </>
                  )}
                </button>
                <a
                  href="#pesan"
                  className="btn-action secondary"
                  title="Kirim pesan langsung"
                  style={{ padding: '0.65rem 0.85rem' }}
                >
                  <MessageSquare size={14} />
                </a>
              </div>
            </article>
          ))}
          {filteredMahasiswa.length === 0 && (
            <div className="student-empty" style={{ gridColumn: '1 / -1' }}>
              <h4>Tidak ada mahasiswa ditemukan</h4>
              <p>Coba gunakan kata kunci pencarian lain atau pilih filter "Semua Fakultas".</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: TIM MEMBUKA REKRUTMEN (LOWONGAN TIM PKM)
          ======================================================== */}
      {tab === 'lowongan' && (
        <div className="caritim-directory-grid">
          {filteredVacancies.map(vac => (
            <article key={vac.id} className="caritim-card">
              <div>
                <div className="caritim-card-head">
                  <div className="caritim-avatar" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
                    {getInitials(vac.teamName)}
                  </div>
                  <div className="caritim-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <h3 className="caritim-card-name" style={{ margin: 0 }}>{vac.teamName}</h3>
                      <span className="bento-scheme-pill" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                        {vac.scheme}
                      </span>
                    </div>
                    <div className="caritim-card-faculty" style={{ color: '#0071e3', marginTop: '0.2rem' }}>
                      <Users size={13} />
                      <span>Ketua: {vac.leaderName}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(239, 246, 255, 0.75)', border: '1px solid rgba(191, 219, 254, 0.8)', padding: '0.65rem 0.85rem', borderRadius: '12px', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e40af', letterSpacing: '0.04em' }}>
                    POSISI DIBUTUHKAN:
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                    {vac.roleName}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                    Kriteria: {vac.targetFaculty} ({vac.targetMajor})
                  </div>
                </div>

                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Judul Usulan:</div>
                  <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.45 }}>
                    {vac.title}
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: '0 0 0.75rem' }}>
                  {vac.description}
                </p>

                <div className="caritim-card-tags">
                  {vac.skills.map(s => (
                    <span key={s} className="caritim-tag-pill">#{s}</span>
                  ))}
                </div>
              </div>

              <div className="caritim-card-actions" style={{ borderTop: '0.5px solid #e2e8f0', paddingTop: '0.85rem', marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                    {vac.slots} Slot Terbuka
                  </span>

                  <button
                    type="button"
                    className={`btn-action ${sentRequests[vac.id] ? 'success' : 'primary'}`}
                    disabled={sentRequests[vac.id]}
                    onClick={() => handleRequestJoin(vac.id, vac.teamName, vac.roleName, vac)}
                    style={{ flex: 1, padding: '0.6rem 0.9rem' }}
                  >
                    {sentRequests[vac.id] ? (
                      <>
                        <Check size={14} />
                        <span>Request Terkirim</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Request Gabung</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
          {filteredVacancies.length === 0 && (
            <div className="student-empty" style={{ gridColumn: '1 / -1' }}>
              <h4>Tidak ada lowongan tim ditemukan</h4>
              <p>Coba gunakan kata kunci pencarian lain atau pilih filter "Semua Fakultas".</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

