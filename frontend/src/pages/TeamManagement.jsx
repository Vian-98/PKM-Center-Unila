import { useState, useEffect } from 'react'
import {
  Users, UserPlus, Shield, CheckCircle2, Clock, ArrowRight, UserCheck,
  Check, X, Briefcase, Plus, AlertCircle, Sparkles, Send, Trash2
} from 'lucide-react'
import { loadStore, saveStore } from '../lib/dosenReviewerData'
import {
  getIncomingRequests, saveIncomingRequests,
  getVacancies, saveVacancies
} from '../lib/matchmakingData'
import { authFetch, getTeamInvitations, respondTeamInvitation } from '../lib/studentApi'
import { getIncomingInvitationsForUser, updateLocalInvitationStatus } from '../lib/teamInvitationData'

function getDefaultTeam(u) {
  const isNadia = u?.email === 'mahasiswa@pkm.unila.ac.id' || u?.username === 'mahasiswa'
  if (isNadia) {
    return {
      id: 'team-my',
      name: 'Tim PKM Unggulan Unila',
      leader: 'Nadia Putri Maharani',
      leaderEmail: 'mahasiswa@pkm.unila.ac.id',
      scheme: 'PKM-KC',
      members: [
        { name: 'Nadia Putri Maharani', role: 'Ketua Pengusul', prodi: 'S1 Teknik Elektro', npm: '2117051001' },
        { name: 'Rian Saputra', role: 'Anggota 1', prodi: 'S1 Kimia FMIPA', npm: '2117021045' },
        { name: 'Fajar Nugroho', role: 'Anggota 2', prodi: 'S1 Proteksi Tanaman FP', npm: '2114011022' },
      ],
      invitations: [
        { id: 'inv-1', name: 'Dewi Sartika', faculty: 'Fakultas Ekonomi & Bisnis', role: 'Analisis Finansial & Bisnis', status: 'Menunggu Konfirmasi', date: '14 Okt 2026' }
      ]
    }
  }

  const uKey = u?.email ? u.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (u?.id || 'guest')
  const name = u?.name || 'Mahasiswa'
  const npm = u?.studentNumber || u?.npm || '-'
  const prodi = u?.studyProgram || u?.department || u?.faculty || 'Universitas Lampung'

  return {
    id: `team-${uKey}`,
    name: `Tim PKM ${name}`,
    leader: name,
    leaderEmail: u?.email || '',
    scheme: 'PKM-KC',
    members: [
      { name, role: 'Ketua Pengusul', prodi, npm }
    ],
    invitations: []
  }
}

export function TeamManagement({ user }) {
  const userKey = user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (user?.id || 'guest')
  const isNadia = user?.email === 'mahasiswa@pkm.unila.ac.id' || user?.username === 'mahasiswa'

  const [team, setTeam] = useState(() => loadStore(`pkm_mhs_team_${userKey}`, getDefaultTeam(user)))
  const [allRequests, setAllRequests] = useState(getIncomingRequests)
  const [allVacancies, setAllVacancies] = useState(getVacancies)
  const [incomingInvites, setIncomingInvites] = useState(() => getIncomingInvitationsForUser(user))
  const [showVacancyModal, setShowVacancyModal] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  // Form Buat Lowongan Baru
  const [newVac, setNewVac] = useState({
    roleName: '',
    targetFaculty: 'Fakultas Teknik',
    targetMajor: '',
    skills: '',
    description: '',
    slots: 1
  })

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // Sinkronisasi ketika user login berganti
  useEffect(() => {
    const currentTeam = loadStore(`pkm_mhs_team_${userKey}`, getDefaultTeam(user))
    setTeam(currentTeam)
    setAllRequests(getIncomingRequests())
    setAllVacancies(getVacancies())
    setIncomingInvites(getIncomingInvitationsForUser(user))

    // Sinkronkan data undangan tim dari backend & global storage
    let alive = true
    getTeamInvitations()
      .then(res => {
        if (!alive || !res?.data) return
        const apiIncoming = res.data.incoming || []
        const localIncoming = getIncomingInvitationsForUser(user)
        const map = new Map()
        localIncoming.forEach(i => map.set(i.id, i))
        apiIncoming.forEach(i => {
          map.set(i.id, {
            id: i.id,
            teamId: i.teamId,
            teamName: i.teamName,
            scheme: i.scheme || 'PKM-KC',
            senderName: i.senderName,
            senderFaculty: i.senderFaculty,
            senderProdi: i.senderProdi,
            roleOffered: i.roleOffered || 'Calon Anggota Multidisiplin',
            message: i.message,
            status: i.status,
            createdAt: i.createdAt
          })
        })
        const activePending = Array.from(map.values()).filter(i => i.status === 'pending')
        setIncomingInvites(activePending)
      })
      .catch(() => {
        if (alive) {
          setIncomingInvites(getIncomingInvitationsForUser(user))
        }
      })

    // Sinkronkan data anggota tim resmi dari backend jika ada
    authFetch('/student/dashboard')
      .then(res => {
        if (!alive || !res?.data?.team) return
        const backendTeam = res.data.team
        const backendMembers = (backendTeam.members || []).map(m => ({
          name: m.name,
          role: m.memberRole === 'leader' ? 'Ketua Pengusul' : 'Anggota Tim',
          prodi: m.studyProgram || m.faculty || 'Universitas Lampung',
          npm: m.studentNumber || '-'
        }))
        if (backendMembers.length > 0) {
          setTeam(prev => {
            const updated = {
              ...prev,
              name: backendTeam.name || prev.name,
              members: backendMembers
            }
            saveStore(`pkm_mhs_team_${userKey}`, updated)
            return updated
          })
        }
      })
      .catch(() => {})
    return () => { alive = false }
  }, [userKey])

  useEffect(() => {
    saveStore(`pkm_mhs_team_${userKey}`, team)
  }, [team, userKey])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  // Filter Permintaan Masuk: Hanya permintaan yang ditujukan ke tim pemilik akun ini
  const incomingRequests = allRequests.filter(r => {
    if (isNadia) {
      return (
        r.teamId === 'team-my' ||
        r.teamId === 'team-agro' ||
        r.targetLeaderEmail === 'mahasiswa@pkm.unila.ac.id' ||
        (team.name && r.teamName === team.name)
      )
    }
    return (
      (user?.email && r.targetLeaderEmail === user.email) ||
      (team.id && r.teamId === team.id) ||
      (team.name && r.teamName === team.name) ||
      (r.targetLeaderName && user?.name && r.targetLeaderName.toLowerCase() === user.name.toLowerCase())
    )
  })

  // Filter Lowongan: Hanya lowongan yang dipasang oleh tim pemilik akun ini
  const myVacancies = allVacancies.filter(v => {
    if (isNadia) {
      return (
        v.teamId === 'team-my' ||
        v.teamId === 'team-agro' ||
        v.leaderEmail === 'mahasiswa@pkm.unila.ac.id' ||
        v.leaderName === 'Nadia Putri Maharani'
      )
    }
    return (
      (user?.email && v.leaderEmail === user.email) ||
      (team.id && v.teamId === team.id) ||
      (team.name && v.teamName === team.name) ||
      (v.leaderName && user?.name && v.leaderName.toLowerCase() === user.name.toLowerCase())
    )
  })

  // Aksi Ketua: Terima Calon Anggota (Request dari Mahasiswa)
  const handleAcceptRequest = (req) => {
    if (team.members.length >= 5) {
      setAlertMsg('Batas maksimum kuota tim PKM adalah 5 orang sesuai pedoman Belmawa.')
      setTimeout(() => setAlertMsg(''), 5000)
      return
    }

    const updatedMembers = [
      ...team.members,
      {
        name: req.studentName.replace(' (Anda)', ''),
        role: `Anggota ${team.members.length}`,
        prodi: `${req.prodi} ${req.faculty}`,
        npm: req.npm
      }
    ]

    setTeam(prev => ({
      ...prev,
      members: updatedMembers
    }))

    // Perbarui status request menjadi accepted di global storage
    const updatedRequests = allRequests.map(r =>
      r.id === req.id ? { ...r, status: 'accepted' } : r
    )
    setAllRequests(updatedRequests)
    saveIncomingRequests(updatedRequests)

    setAlertMsg(`Selamat! ${req.studentName} resmi diterima bergabung ke dalam tim!`)
    setTimeout(() => setAlertMsg(''), 5000)
  }

  // Aksi Mahasiswa: Terima Undangan Bergabung dari Tim Lain
  const handleAcceptInvite = async (inv) => {
    try {
      await respondTeamInvitation(inv.id, 'accept')
    } catch (err) {
      console.warn('respondTeamInvitation API fallback to local sync:', err.message)
    }

    updateLocalInvitationStatus(inv.id, 'accepted', user)

    // Perbarui profil tim mahasiswa penerima agar langsung menjadi anggota aktif tim tersebut
    const joinedTeam = {
      id: inv.teamId,
      name: inv.teamName,
      leader: inv.senderName,
      scheme: inv.scheme || 'PKM-KC',
      members: [
        {
          name: inv.senderName,
          role: 'Ketua Pengusul',
          prodi: inv.senderProdi || inv.senderFaculty || 'FMIPA',
          npm: '-'
        },
        {
          name: user?.name || 'Mahasiswa',
          role: 'Anggota Tim (Multidisiplin)',
          prodi: user?.studyProgram || user?.department || user?.faculty || 'Universitas Lampung',
          npm: user?.studentNumber || user?.npm || '-'
        }
      ],
      invitations: []
    }
    setTeam(joinedTeam)
    saveStore(`pkm_mhs_team_${userKey}`, joinedTeam)

    setIncomingInvites(prev => prev.filter(i => i.id !== inv.id))
    setAlertMsg(`Selamat! Anda telah resmi bergabung ke dalam ${inv.teamName}!`)
    setTimeout(() => setAlertMsg(''), 6000)
  }

  // Aksi Mahasiswa: Tolak Undangan Bergabung dari Tim Lain
  const handleRejectInvite = async (inv) => {
    try {
      await respondTeamInvitation(inv.id, 'reject')
    } catch (err) {
      console.warn('respondTeamInvitation API fallback to local sync:', err.message)
    }

    updateLocalInvitationStatus(inv.id, 'rejected', user)
    setIncomingInvites(prev => prev.filter(i => i.id !== inv.id))
    setAlertMsg(`Undangan bergabung ke ${inv.teamName} telah ditolak.`)
    setTimeout(() => setAlertMsg(''), 4500)
  }

  // Aksi Ketua: Buat Lowongan Rekrutmen Baru
  const handleCreateVacancy = (e) => {
    e.preventDefault()
    if (!newVac.roleName.trim() || !newVac.description.trim()) {
      setAlertMsg('Mohon lengkapi judul posisi dan deskripsi peran yang dibutuhkan.')
      setTimeout(() => setAlertMsg(''), 4000)
      return
    }

    const createdVac = {
      id: `vac-${Date.now()}`,
      teamId: team.id || `team-${userKey}`,
      teamName: team.name,
      leaderName: team.leader || user?.name || 'Mahasiswa',
      leaderEmail: user?.email || '',
      scheme: team.scheme || 'PKM-KC',
      title: `${team.name} — Rekrutmen Terbuka`,
      targetFaculty: newVac.targetFaculty,
      targetMajor: newVac.targetMajor || 'Semua Program Studi Terkait',
      roleName: newVac.roleName,
      skills: newVac.skills ? newVac.skills.split(',').map(s => s.trim()).filter(Boolean) : ['Kolaborasi', 'Disiplin'],
      slots: Number(newVac.slots) || 1,
      description: newVac.description
    }

    const updated = [createdVac, ...allVacancies]
    setAllVacancies(updated)
    saveVacancies(updated)
    setShowVacancyModal(false)
    setNewVac({
      roleName: '',
      targetFaculty: 'Fakultas Teknik',
      targetMajor: '',
      skills: '',
      description: '',
      slots: 1
    })

    setAlertMsg('Lowongan rekrutmen tim berhasil dipublikasikan ke halaman Cari Tim!')
    setTimeout(() => setAlertMsg(''), 5000)
  }

  // Hapus Lowongan Tim Sendiri
  const handleDeleteVacancy = (vacId) => {
    const updated = allVacancies.filter(v => v.id !== vacId)
    setAllVacancies(updated)
    saveVacancies(updated)
    setAlertMsg('Lowongan berhasil ditutup.')
    setTimeout(() => setAlertMsg(''), 4000)
  }

  const pendingRequests = incomingRequests.filter(r => r.status === 'pending')

  return (
    <div className="module-container">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <section className="module-header" style={{ marginBottom: '1.75rem' }}>
        <div className="module-header-top">
          <div>
            <div className="module-badge">KOLABORASI DUA ARAH TIM PKM</div>
            <h1 className="module-title">Manajemen Tim & Rekrutmen</h1>
            <p className="module-subtitle">
              Kelola anggota aktif, tinjau permintaan bergabung mahasiswa (Request), kirim undangan (Invite), dan publikasikan lowongan.
            </p>
          </div>
          <div className="student-header-meta">
            <span className="student-eyebrow">Status Kuota Tim</span>
            <span className="student-name">{team.name}</span>
            <span className="student-sub">
              <strong>{team.members.length} / 5</strong> Anggota (Maks. 5 Mahasiswa)
            </span>
          </div>
        </div>
      </section>

      {/* Alert Notification Banner */}
      {alertMsg && (
        <div className="student-message-box" style={{ borderLeftColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', background: '#ecfdf5', color: '#065f46' }}>
          <CheckCircle2 size={18} />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Grid of Polymorphic Glass Cards */}
      {/* ========================================================
          CARD UTAMA: UNDANGAN BERGABUNG MASUK DARI TIM LAIN
          ======================================================== */}
      {incomingInvites.length > 0 && (
        <section
          className="student-panel"
          style={{
            marginBottom: '1.75rem',
            borderLeft: '4px solid #0071e3',
            background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(255, 255, 255, 0.98) 100%)',
            border: '1.5px solid #bfdbfe',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 8px 24px rgba(0, 113, 227, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="caritim-hub-icon blue" style={{ width: 42, height: 42, borderRadius: '12px' }}>
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="student-panel-title" style={{ margin: 0, color: '#1e3a8a', fontSize: '1.1rem' }}>
                  Undangan Bergabung ke Tim Masuk
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Ketua tim PKM lain mengundang Anda untuk bergabung ke dalam usulan tim mereka
                </span>
              </div>
            </div>
            <span
              className="bento-scheme-pill"
              style={{
                background: '#dbeafe',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px'
              }}
            >
              {incomingInvites.length} Undangan Menunggu Konfirmasi
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {incomingInvites.map(inv => (
              <div
                key={inv.id}
                style={{
                  padding: '1.25rem',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #bfdbfe',
                  boxShadow: '0 4px 16px rgba(0, 113, 227, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.02rem' }}>
                      {inv.teamName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Ketua Pengusul: <strong style={{ color: '#0f172a' }}>{inv.senderName}</strong> {inv.senderFaculty ? `(${inv.senderFaculty})` : ''}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      background: '#fef3c7',
                      color: '#b45309',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Clock size={11} />
                    Menunggu Konfirmasi
                  </span>
                </div>

                <div
                  style={{
                    background: '#eff6ff',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #dbeafe',
                    fontSize: '0.8rem',
                    color: '#1e40af'
                  }}
                >
                  Peran Ditawarkan: <strong>{inv.roleOffered || 'Calon Anggota Multidisiplin'}</strong>
                </div>

                {inv.message && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.45, fontStyle: 'italic' }}>
                    "{inv.message}"
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-action primary"
                    onClick={() => handleAcceptInvite(inv)}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      background: '#059669',
                      borderColor: '#059669',
                      color: '#ffffff'
                    }}
                  >
                    <Check size={15} style={{ marginRight: '0.4rem' }} />
                    <span>Terima Undangan</span>
                  </button>
                  <button
                    type="button"
                    className="btn-action secondary"
                    onClick={() => handleRejectInvite(inv)}
                    style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', color: '#dc2626' }}
                  >
                    <X size={15} style={{ marginRight: '0.3rem' }} />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grid of Polymorphic Glass Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* ========================================================
            CARD 1: ANGGOTA TIM AKTIF
            ======================================================== */}
        <section className="student-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="caritim-hub-icon blue" style={{ width: 36, height: 36 }}>
                <Users size={18} />
              </div>
              <div>
                <h3 className="student-panel-title" style={{ margin: 0 }}>Anggota Tim Aktif</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Komposisi lintas fakultas/prodi</span>
              </div>
            </div>
            <span className="bento-funded-pill" style={{ fontSize: '0.75rem' }}>
              {team.members.length} / 5 Anggota
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {team.members.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1rem',
                  background: 'rgba(248, 250, 252, 0.75)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    className={`caritim-avatar ${m.role.includes('Ketua') ? 'gold' : ''}`}
                    style={{ width: 40, height: 40, fontSize: '0.88rem' }}
                  >
                    {getInitials(m.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {m.prodi ? `${m.prodi}${m.npm ? ` • ${m.npm}` : ''}` : (m.npm ? `NPM: ${m.npm}` : 'Universitas Lampung')}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    background: m.role.includes('Ketua') ? '#fef3c7' : '#eff6ff',
                    color: m.role.includes('Ketua') ? '#b45309' : '#0071e3',
                    border: m.role.includes('Ketua') ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(0, 113, 227, 0.2)'
                  }}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <a
              href="#caritim"
              className="btn-action secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
            >
              <UserPlus size={15} style={{ marginRight: '0.4rem' }} />
              <span>Cari Calon Rekan</span>
            </a>
            <button
              type="button"
              className="btn-action primary"
              onClick={() => setShowVacancyModal(!showVacancyModal)}
              style={{ padding: '0.75rem 1rem', gap: '0.35rem' }}
            >
              <Plus size={15} />
              <span>Buka Lowongan</span>
            </button>
          </div>
        </section>

        {/* ========================================================
            CARD 2: PERMINTAAN GABUNG MASUK (INCOMING REQUESTS)
            ======================================================== */}
        <section className="student-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="caritim-hub-icon gold" style={{ width: 36, height: 36 }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="student-panel-title" style={{ margin: 0 }}>Permintaan Bergabung</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Mahasiswa melamar masuk tim (Arah 2)</span>
              </div>
            </div>
            <span
              className="bento-scheme-pill"
              style={{
                fontSize: '0.75rem',
                background: pendingRequests.length > 0 ? '#fef3c7' : '#f1f5f9',
                color: pendingRequests.length > 0 ? '#b45309' : '#64748b'
              }}
            >
              {pendingRequests.length} Menunggu Persetujuan
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="student-empty" style={{ padding: '2rem 1rem' }}>
              <h4>Belum ada permintaan masuk</h4>
              <p>Mahasiswa yang mengajukan diri ke tim Anda akan muncul di sini untuk ditinjau.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '1rem',
                    background: req.status === 'accepted' ? '#f0fdf4' : req.status === 'rejected' ? '#fef2f2' : 'rgba(248, 250, 252, 0.75)',
                    border: `1px solid ${req.status === 'accepted' ? '#bbf7d0' : req.status === 'rejected' ? '#fecaca' : 'rgba(226, 232, 240, 0.8)'}`,
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>{req.studentName}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {req.prodi} • {req.faculty} (NPM: {req.npm})
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: req.status === 'accepted' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: req.status === 'accepted' ? '#15803d' : req.status === 'rejected' ? '#b91c1c' : '#b45309',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {req.status === 'accepted' ? <Check size={11} /> : req.status === 'rejected' ? <X size={11} /> : <Clock size={11} />}
                      {req.status === 'accepted' ? 'Diterima' : req.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#1e40af', background: '#eff6ff', padding: '0.35rem 0.65rem', borderRadius: '8px', fontWeight: 600 }}>
                    Melamar Posisi: <strong>{req.appliedRole}</strong>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.45, fontStyle: 'italic' }}>
                    "{req.message}"
                  </p>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    {req.skills?.map(s => (
                      <span key={s} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                        #{s}
                      </span>
                    ))}
                  </div>

                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '0.5px solid #e2e8f0', paddingTop: '0.65rem' }}>
                      <button
                        type="button"
                        className="btn-action primary"
                        onClick={() => handleAcceptRequest(req)}
                        style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.78rem', background: '#059669', gap: '0.35rem' }}
                      >
                        <Check size={13} />
                        <span>Terima ke Tim</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action secondary"
                        onClick={() => handleRejectRequest(req.id, req.studentName)}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#ef4444', gap: '0.35rem' }}
                      >
                        <X size={13} />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ========================================================
          FORM POPUP/COLLAPSIBLE: BUAT LOWONGAN REKRUTMEN BARU
          ======================================================== */}
      {showVacancyModal && (
        <section className="student-panel" style={{ marginTop: '1.75rem', border: '1.5px solid #0071e3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} color="#0071e3" />
              <h3 className="student-panel-title" style={{ margin: 0 }}>Pasang Lowongan Rekrutmen Tim Baru</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowVacancyModal(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateVacancy} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="student-field" style={{ margin: 0 }}>
              <label className="student-label">Peran / Posisi yang Dicari</label>
              <input
                className="student-input"
                type="text"
                placeholder="misal: Ahli Desain Casing Alat / Estimator Biaya"
                value={newVac.roleName}
                onChange={e => setNewVac({ ...newVac, roleName: e.target.value })}
                required
              />
            </div>

            <div className="student-field" style={{ margin: 0 }}>
              <label className="student-label">Target Fakultas</label>
              <select
                className="student-input"
                value={newVac.targetFaculty}
                onChange={e => setNewVac({ ...newVac, targetFaculty: e.target.value })}
              >
                <option value="Fakultas Teknik">Fakultas Teknik</option>
                <option value="FMIPA">FMIPA</option>
                <option value="FKIP">FKIP</option>
                <option value="Fakultas Pertanian">Fakultas Pertanian</option>
                <option value="FEB">FEB</option>
                <option value="Fakultas Hukum">Fakultas Hukum</option>
              </select>
            </div>

            <div className="student-field" style={{ margin: 0 }}>
              <label className="student-label">Target Program Studi</label>
              <input
                className="student-input"
                type="text"
                placeholder="misal: Teknik Sipil / Kimia / S1 Manajemen"
                value={newVac.targetMajor}
                onChange={e => setNewVac({ ...newVac, targetMajor: e.target.value })}
              />
            </div>

            <div className="student-field" style={{ margin: 0 }}>
              <label className="student-label">Keahlian yang Dibutuhkan (Pisahkan koma)</label>
              <input
                className="student-input"
                type="text"
                placeholder="misal: AutoCAD, SAP2000, Analisis Tanah"
                value={newVac.skills}
                onChange={e => setNewVac({ ...newVac, skills: e.target.value })}
              />
            </div>

            <div className="student-field" style={{ gridColumn: '1 / -1', margin: 0 }}>
              <label className="student-label">Uraian Tugas & Kontribusi yang Diharapkan</label>
              <textarea
                className="student-textarea"
                rows={3}
                placeholder="Jelaskan kebutuhan peran ini dalam menyelesaikan proposal PKM..."
                value={newVac.description}
                onChange={e => setNewVac({ ...newVac, description: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-action secondary"
                onClick={() => setShowVacancyModal(false)}
              >
                Batal
              </button>
              <button type="submit" className="btn-action primary">
                <Send size={14} style={{ marginRight: '0.35rem' }} />
                <span>Publikasikan Lowongan ke Cari Tim</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ========================================================
          SECTION 3: UNDANGAN REKRUTMEN KELUAR (OUTGOING INVITES)
          ======================================================== */}
      <section className="student-panel" style={{ marginTop: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="caritim-hub-icon blue" style={{ width: 36, height: 36 }}>
              <Send size={18} />
            </div>
            <div>
              <h3 className="student-panel-title" style={{ margin: 0 }}>Undangan Keluar ke Mahasiswa</h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Undangan resmi yang dikirimkan oleh tim Anda (Arah 1: Invite)</span>
            </div>
          </div>
          <span className="bento-scheme-pill" style={{ fontSize: '0.75rem' }}>
            {team.invitations.length} Undangan Dikirim
          </span>
        </div>

        {team.invitations.length === 0 ? (
          <div className="student-empty" style={{ padding: '1.5rem 1rem' }}>
            <h4>Belum ada undangan terkirim</h4>
            <p>Jelajahi tab "Mahasiswa Mencari Tim" pada menu Cari Tim untuk mengirimkan undangan langsung.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {team.invitations.map((inv) => (
              <div
                key={inv.id}
                style={{
                  padding: '1rem',
                  background: 'rgba(248, 250, 252, 0.75)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{inv.name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{inv.faculty}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      background: '#fef3c7',
                      color: '#b45309',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Clock size={11} />
                    {inv.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Peran ditawarkan: <strong style={{ color: '#0f172a' }}>{inv.role}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================
          SECTION 4: LOWONGAN REKRUTMEN AKTIF TIM ANDA
          ======================================================== */}
      <section className="student-panel" style={{ marginTop: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="caritim-hub-icon gold" style={{ width: 36, height: 36 }}>
              <Briefcase size={18} />
            </div>
            <div>
              <h3 className="student-panel-title" style={{ margin: 0 }}>Lowongan Terbuka Tim Anda</h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Lowongan tim Anda yang sedang tayang di modul Cari Tim</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-action primary"
            onClick={() => setShowVacancyModal(!showVacancyModal)}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <Plus size={14} />
            <span>Tambah Posisi</span>
          </button>
        </div>

        {myVacancies.length === 0 ? (
          <div className="student-empty" style={{ padding: '1.5rem 1rem' }}>
            <h4>Belum ada lowongan dibuka</h4>
            <p>Tim Anda belum mempublikasikan lowongan posisi anggota. Klik tombol "Buka Lowongan" jika tim Anda memerlukan rekan multidisiplin baru.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
            {myVacancies.map((vac) => (
              <div
                key={vac.id}
                style={{
                  padding: '1rem',
                  background: 'rgba(248, 250, 252, 0.75)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>{vac.roleName}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Target: {vac.targetFaculty} • {vac.targetMajor}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteVacancy(vac.id)}
                    title="Tutup & Hapus Lowongan Ini"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '0.2rem'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>
                  {vac.description}
                </p>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  {vac.skills?.map(s => (
                    <span key={s} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                      #{s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
