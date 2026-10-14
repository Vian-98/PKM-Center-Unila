import { useState, useMemo } from 'react'
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

const MAHASISWA_LIST = [
  {
    id: 'mhs-1',
    name: 'Nadia Putri Maharani',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Elektro',
    npm: '2117051001',
    skills: ['Smart IoT', 'Edge AI', 'Otomasi Hardware', 'C++ / MicroPython'],
    skema: 'PKM-KC',
    target: 'Mencari 2 Rekan: FMIPA (Kimia) & FP (Agronomi)',
    bio: 'Mengembangkan prototype detektor kualitas tanah nirkabel. Butuh rekan untuk formulasi nutrisi dan validasi agronomis.',
  },
  {
    id: 'mhs-2',
    name: 'Rian Saputra',
    faculty: 'FMIPA',
    prodi: 'Kimia',
    npm: '2117021045',
    skills: ['Bio-Briket', 'Energi Terbarukan', 'Karakterisasi Bahan', 'Spektroskopi'],
    skema: 'PKM-RE',
    target: 'Mencari 2 Rekan: Teknik Mesin & Desain Produk',
    bio: 'Riset sintesis karbon aktif dan briket dari limbah biomassa kulit kopi robusta Lampung Barat.',
  },
  {
    id: 'mhs-3',
    name: 'Fajar Nugroho',
    faculty: 'Fakultas Pertanian',
    prodi: 'Proteksi Tanaman',
    npm: '2114011032',
    skills: ['SIG & Pemetaan', 'Hama Hayati', 'Drone Mapping', 'Kultur Jaringan'],
    skema: 'PKM-VGK',
    target: 'Mencari 1 Rekan: Teknik Informatika (GIS)',
    bio: 'Pemetaan spasial sebaran penyakit busuk buah kakao berbasis citra multispektral UAV di Pesawaran.',
  },
  {
    id: 'mhs-4',
    name: 'Aisyah Zahra',
    faculty: 'FEB',
    prodi: 'Manajemen Bisnis',
    npm: '2211011088',
    skills: ['Business Model Canvas', 'Finansial Proyeksi', 'Pemasaran Digital', 'Branding'],
    skema: 'PKM-K',
    target: 'Mencari 2 Rekan: Teknologi Hasil Pertanian & DKV',
    bio: 'Inisiasi produk olahan herbal fungsional bunga telang Lampung bernilai ekonomi tinggi bagi UMKM wanita.',
  },
  {
    id: 'mhs-5',
    name: 'Dimas Pratama',
    faculty: 'Fakultas Hukum',
    prodi: 'Ilmu Hukum',
    npm: '2112011014',
    skills: ['Analisis Regulasi', 'Hukum Lingkungan', 'Policy Brief', 'Sosiologi Hukum'],
    skema: 'PKM-RSH',
    target: 'Mencari 2 Rekan: FISIP & Ekonomi Pembangunan',
    bio: 'Kajian yuridis efektivitas regulasi perlindungan wilayah pesisir Teluk Lampung dari abrasi dan pencemaran.',
  },
]

const FACULTIES = [
  'Semua Fakultas',
  'Fakultas Teknik',
  'FMIPA',
  'FKIP',
  'Fakultas Pertanian',
  'FEB',
  'Fakultas Hukum',
]

export function CariTim() {
  const [tab, setTab] = useState('dosen')
  const [search, setSearch] = useState('')
  const [faculty, setFaculty] = useState('Semua Fakultas')
  const [invited, setInvited] = useState({})
  const [vacancies] = useState(getVacancies)
  const [sentRequests, setSentRequests] = useState(getMySentRequests)
  const [alertMsg, setAlertMsg] = useState('')

  const handleInvite = (id, name, type) => {
    setInvited(prev => ({ ...prev, [id]: true }))
    // Sinkronisasi undangan mahasiswa ke pkm_mhs_team di localStorage
    if (type.includes('Mahasiswa') || type.includes('Anggota')) {
      const currentTeam = loadStore('pkm_mhs_team', { name: 'Tim PKM Unggulan Unila', members: [], invitations: [] })
      const existingInv = currentTeam.invitations || []
      const newInv = {
        id: `inv-${Date.now()}`,
        name: name,
        faculty: 'Universitas Lampung',
        role: 'Calon Anggota Multidisiplin',
        status: 'Menunggu Konfirmasi',
        date: 'Hari ini'
      }
      saveStore('pkm_mhs_team', {
        ...currentTeam,
        invitations: [newInv, ...existingInv]
      })
    }
    setAlertMsg(`Undangan resmi berhasil dikirimkan kepada ${name} (${type})!`)
    setTimeout(() => setAlertMsg(''), 4500)
  }

  const handleRequestJoin = (vacId, teamName, roleName) => {
    const updated = { ...sentRequests, [vacId]: true }
    setSentRequests(updated)
    saveMySentRequests(updated)

    // Simpan request ke antrean pkm_mhs_incoming_requests
    const currentIncoming = loadStore('pkm_mhs_incoming_requests', [])
    const newReq = {
      id: `req-${Date.now()}`,
      teamId: vacId,
      studentName: 'Nadia Putri Maharani (Anda)',
      npm: '2117051001',
      faculty: 'Fakultas Teknik',
      prodi: 'S1 Teknik Elektro',
      skills: ['IoT & Edge AI', 'MicroPython', 'Otomasi'],
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

  // Filter Mahasiswa
  const filteredMahasiswa = useMemo(() => {
    return MAHASISWA_LIST.filter(m => {
      const matchFac = faculty === 'Semua Fakultas' || m.faculty === faculty
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.faculty.toLowerCase().includes(q) ||
        m.prodi.toLowerCase().includes(q) ||
        m.skills.some(s => s.toLowerCase().includes(q)) ||
        m.skema.toLowerCase().includes(q)
      return matchFac && matchSearch
    })
  }, [faculty, search])

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
                    onClick={() => handleRequestJoin(vac.id, vac.teamName, vac.roleName)}
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

