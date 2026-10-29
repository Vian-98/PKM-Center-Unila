import { useState, useMemo, useEffect } from 'react'
import {
  Users, UserPlus, Shield, CheckCircle2, Clock, ArrowRight, UserCheck,
  Check, X, Briefcase, Plus, AlertCircle, Sparkles, Send, Trash2,
  GraduationCap, Search, MessageSquare
} from 'lucide-react'
import { loadStore, saveStore, initialSupervisorRequests } from '../lib/dosenReviewerData'
import {
  getIncomingRequests, saveIncomingRequests,
  getVacancies, saveVacancies,
  getMySentRequests, saveMySentRequests
} from '../lib/matchmakingData'
import { authFetch, getTeamInvitations, sendTeamInvitation, respondTeamInvitation } from '../lib/studentApi'
import { recordNewInvitation, getIncomingInvitationsForUser, updateLocalInvitationStatus } from '../lib/teamInvitationData'

// Direktori Dosen Pembimbing Resmi yang memiliki akun terdaftar dan aktif di sistem PKM Center
const DOSEN_LIST = [
  {
    id: 'user-dosen-budi',
    name: 'Dr. Budi Santoso, S.T., M.T.',
    email: 'dosen@pkm.unila.ac.id',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Elektro',
    nidn: '0015048201',
    nip: '198204152008121002',
    bidang: ['Edge AI', 'Internet of Things', 'Sistem Tertanam'],
    badge: 'Akun Aktif • Pembimbing PIMNAS',
    quota: '4/10 Bimbingan',
    bio: 'Fokus riset otomasi cerdas, instrumentasi industri, dan komputasi edge untuk pertanian dan kebencanaan.',
  },
  {
    id: 'user-dosen-sri',
    name: 'Dr. Ir. Sri Mulyani, M.T.',
    email: 'dosen.reviewer@pkm.unila.ac.id',
    faculty: 'Fakultas Pertanian',
    prodi: 'Teknologi Hasil Pertanian',
    nidn: '0020087501',
    nip: '197508202001122001',
    bidang: ['Teknologi Pangan', 'Hilirisasi Hasil Pertanian', 'Bioteknologi Pascapanen'],
    badge: 'Akun Aktif • Dosen & Reviewer PKM',
    quota: '3/10 Bimbingan',
    bio: 'Fasilitasi hilirisasi produk pertanian, formulasi kemasan ramah lingkungan, dan pendampingan UMKM olahan pangan lokal Lampung.',
  },
]

// Direktori awal Rekan Mahasiswa Terdaftar di Sistem
const DB_REGISTERED_STUDENTS = [
  {
    id: 'mhs-1',
    name: 'Favian Rifqi Pratama',
    email: 'mhs1@pkm.unila.ac.id',
    faculty: 'FMIPA',
    prodi: 'Ilmu Komputer',
    npm: '2217051001',
    bio: 'Fokus riset Computer Vision, deep learning, dan full-stack app. Siap jadi lead programmer.',
    skema: 'PKM-KC',
    target: 'Fakultas Teknik / FP',
    skills: ['Python', 'TensorFlow', 'React / Vite', 'Computer Vision']
  },
  {
    id: 'mhs-2',
    name: 'Ahmad Fauzi',
    email: 'mhs2@pkm.unila.ac.id',
    faculty: 'Fakultas Teknik',
    prodi: 'Teknik Mesin',
    npm: '2215061002',
    bio: 'Spesialis perancangan mekanik, CAD/SolidWorks, 3D printing, dan aktuator robotik.',
    skema: 'PKM-KC',
    target: 'FMIPA / FEB',
    skills: ['CAD SolidWorks', '3D Printing', 'Mekanika Fluida', 'Arduino']
  },
  {
    id: 'mhs-3',
    name: 'Siti Nurhaliza',
    email: 'mhs3@pkm.unila.ac.id',
    faculty: 'Fakultas Pertanian',
    prodi: 'Agribisnis',
    npm: '2114131003',
    bio: 'Berpengalaman dalam riset kelayakan usaha tani, BMC, dan kemitraan UMKM binaan di Pesawaran.',
    skema: 'PKM-K',
    target: 'Fakultas Teknik / FEB',
    skills: ['Analisis Kelayakan Usaha', 'Supply Chain Agribisnis', 'Pemberdayaan Petani', 'Pitching Bisnis']
  },
  {
    id: 'mhs-4',
    name: 'Dewi Sartika',
    email: 'dewi.sartika@student.unila.ac.id',
    faculty: 'FEB',
    prodi: 'Akuntansi & Keuangan',
    npm: '2111031024',
    bio: 'Menyusun RAB realistis, analisis cashflow, BEP, dan kepatuhan perpajakan PKM Kewirausahaan.',
    skema: 'PKM-K',
    target: 'Semua Fakultas',
    skills: ['Rencana Anggaran Biaya (RAB)', 'Laporan Keuangan', 'Cost-Benefit Analysis', 'Excel Pro']
  },
  {
    id: 'mhs-5',
    name: 'Bima Satria',
    email: 'bima.satria@student.unila.ac.id',
    faculty: 'Fakultas Pertanian',
    prodi: 'Agronomi & Hortikultura',
    npm: '2114021008',
    bio: 'Riset uji efikasi pupuk organik cair, kultur jaringan pisang mas, dan metodologi lapangan.',
    skema: 'PKM-RE',
    target: 'FMIPA Kimia / Biologi',
    skills: ['Uji Lapangan', 'Statistika Rancangan Percobaan', 'Kultur Jaringan', 'Fisiologi Tanaman']
  },
  {
    id: 'mhs-6',
    name: 'Rian Saputra',
    email: 'rian.saputra@student.unila.ac.id',
    faculty: 'FMIPA',
    prodi: 'Kimia Terapan',
    npm: '2117021045',
    bio: 'Penelitian bio-briket, pirolisis biomassa limbah kopi, dan pengujian FTIR / kalorimeter bom.',
    skema: 'PKM-RE',
    target: 'Fakultas Teknik',
    skills: ['Spektroskopi FTIR', 'Karakterisasi Bahan', 'Kimia Organik', 'Bio-Briket']
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
  'Fakultas Kedokteran',
  'FISIP',
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
  if (fac.includes('teknik')) return 'FMIPA / FEB / Pertanian'
  if (fac.includes('mipa')) return 'Fakultas Teknik / Kedokteran'
  if (fac.includes('pertanian')) return 'Fakultas Teknik / FEB'
  if (fac.includes('feb')) return 'Fakultas Teknik / FMIPA'
  return 'Semua Fakultas Terkait'
}

function getDefaultTeam(u) {
  const isNadia = u?.email === 'mahasiswa@pkm.unila.ac.id' || u?.username === 'mahasiswa'
  if (isNadia) {
    return {
      id: 'team-my',
      name: 'Tim PKM Unggulan Unila',
      leader: 'Nadia Putri Maharani',
      leaderEmail: 'mahasiswa@pkm.unila.ac.id',
      scheme: 'PKM-KC',
      dosenPembimbing: {
        id: 'user-dosen-budi',
        name: 'Dr. Budi Santoso, S.T., M.T.',
        email: 'dosen@pkm.unila.ac.id',
        prodi: 'Teknik Elektro FT',
        status: 'Disetujui'
      },
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
    dosenPembimbing: null,
    members: [
      { name, role: 'Ketua Pengusul', prodi, npm }
    ],
    invitations: []
  }
}

export function TeamManagement({ user, initialTab = 'tim' }) {
  const userKey = user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (user?.id || 'guest')
  const isNadia = user?.email === 'mahasiswa@pkm.unila.ac.id' || user?.username === 'mahasiswa'

  // Tab aktif: 'tim' | 'dosen' | 'mahasiswa' | 'lowongan'
  const [activeTab, setActiveTab] = useState(initialTab || 'tim')

  // Sinkronisasi tab saat initialTab berubah dari navigasi luar
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // State Manajemen Tim
  const [team, setTeam] = useState(() => loadStore(`pkm_mhs_team_${userKey}`, getDefaultTeam(user)))
  const [allRequests, setAllRequests] = useState(getIncomingRequests)
  const [allVacancies, setAllVacancies] = useState(getVacancies)
  const [incomingInvites, setIncomingInvites] = useState(() => getIncomingInvitationsForUser(user))
  const [showVacancyModal, setShowVacancyModal] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  // State Pencarian Dosen & Mahasiswa
  const [searchQuery, setSearchQuery] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('Semua Fakultas')
  const [invited, setInvited] = useState({})
  const [mahasiswaList, setMahasiswaList] = useState(DB_REGISTERED_STUDENTS)
  const [sentRequests, setSentRequests] = useState(() => getMySentRequests(userKey))

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
  }, [activeTab])

  // Sinkronisasi data mahasiswa live dari backend jika tersedia
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

  // Sinkronisasi ketika user login berganti
  useEffect(() => {
    const currentTeam = loadStore(`pkm_mhs_team_${userKey}`, getDefaultTeam(user))
    setTeam(currentTeam)
    setAllRequests(getIncomingRequests())
    setAllVacancies(getVacancies())
    setIncomingInvites(getIncomingInvitationsForUser(user))
    setSentRequests(getMySentRequests(userKey))

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

  // Permintaan masuk ke tim user
  const incomingRequests = allRequests.filter(
    r => r.teamId === (team.id || `team-${userKey}`)
  )

  // Lowongan yang dipasang oleh tim user sendiri
  const myVacancies = allVacancies.filter(
    v => v.teamId === (team.id || `team-${userKey}`)
  )

  // Aksi Terima Permintaan Bergabung Mahasiswa Masuk
  const handleAcceptRequest = (req) => {
    if (team.members.length >= 5) {
      setAlertMsg('Batas maksimal anggota tim (5 orang) telah tercapai sesuai pedoman Belmawa.')
      setTimeout(() => setAlertMsg(''), 4500)
      return
    }

    const newMember = {
      name: req.studentName,
      role: req.appliedRole || 'Anggota Tim',
      prodi: `${req.prodi} (${req.faculty})`,
      npm: req.npm || '-'
    }

    const updatedTeam = {
      ...team,
      members: [...team.members, newMember]
    }
    setTeam(updatedTeam)
    saveStore(`pkm_mhs_team_${userKey}`, updatedTeam)

    const updatedRequests = allRequests.map(r =>
      r.id === req.id ? { ...r, status: 'accepted' } : r
    )
    setAllRequests(updatedRequests)
    saveIncomingRequests(updatedRequests)

    setAlertMsg(`Selamat! ${req.studentName} berhasil diterima sebagai anggota baru tim Anda!`)
    setTimeout(() => setAlertMsg(''), 5000)
  }

  // Aksi Tolak Permintaan Bergabung
  const handleRejectRequest = (reqId, studentName) => {
    const updated = allRequests.map(r =>
      r.id === reqId ? { ...r, status: 'rejected' } : r
    )
    setAllRequests(updated)
    saveIncomingRequests(updated)

    setAlertMsg(`Permintaan bergabung dari ${studentName} telah ditolak.`)
    setTimeout(() => setAlertMsg(''), 4000)
  }

  // Aksi Mahasiswa: Terima Undangan Masuk dari Tim Lain
  const handleAcceptInvite = async (inv) => {
    try {
      await respondTeamInvitation(inv.id, 'accept')
    } catch (err) {
      console.warn('respondTeamInvitation API fallback to local sync:', err.message)
    }

    updateLocalInvitationStatus(inv.id, 'accepted', user)

    const joinedTeam = {
      id: inv.teamId || `team-joined-${Date.now()}`,
      name: inv.teamName,
      leader: inv.senderName,
      leaderEmail: inv.senderEmail || '',
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

  // Aksi: Mengundang Mahasiswa atau Dosen dari Direktori
  const handleInviteFromDirectory = async (id, name, type, studentObj = null) => {
    setInvited(prev => ({ ...prev, [id]: true }))

    if (type.includes('Mahasiswa') || type.includes('Anggota')) {
      const existingInv = team.invitations || []
      const roleOffered = 'Calon Anggota Multidisiplin'
      const newInvId = `inv-${Date.now()}`

      const newInv = {
        id: newInvId,
        name: name,
        faculty: studentObj?.faculty || 'Universitas Lampung',
        role: roleOffered,
        status: 'Menunggu Konfirmasi',
        date: 'Hari ini'
      }

      const updatedTeam = {
        ...team,
        invitations: [newInv, ...existingInv]
      }
      setTeam(updatedTeam)
      saveStore(`pkm_mhs_team_${userKey}`, updatedTeam)

      const globalInv = {
        id: newInvId,
        teamId: team.id || `team-${userKey}`,
        teamName: team.name || `Tim PKM ${user?.name || 'Mahasiswa'}`,
        scheme: team.scheme || 'PKM-KC',
        senderId: user?.id || userKey,
        senderName: user?.name || 'Mahasiswa',
        senderEmail: user?.email || '',
        senderFaculty: user?.faculty || 'Fakultas Teknik',
        senderProdi: user?.studyProgram || user?.department || 'Teknik Elektro',
        recipientId: studentObj?.id || id,
        recipientName: studentObj?.name || name,
        recipientEmail: studentObj?.email || '',
        recipientNpm: studentObj?.npm || '',
        recipientFaculty: studentObj?.faculty || 'Universitas Lampung',
        recipientProdi: studentObj?.prodi || '',
        roleOffered: roleOffered,
        message: `Halo ${studentObj?.name || name}, kami mengundang Anda untuk bergabung ke dalam ${team.name} sebagai ${roleOffered}.`,
        status: 'pending',
        date: 'Hari ini',
        createdAt: new Date().toISOString()
      }
      recordNewInvitation(globalInv)

      try {
        await sendTeamInvitation({
          recipientId: studentObj?.id || id,
          recipientEmail: studentObj?.email || '',
          recipientNpm: studentObj?.npm || '',
          roleOffered: roleOffered,
          message: globalInv.message
        })
      } catch (err) {
        console.warn('sendTeamInvitation API fallback to local sync:', err.message)
      }
    }

    if (type.includes('Dosen') || type.includes('Pembimbing')) {
      const currentDosenReqs = loadStore('pkm_dosen_requests', initialSupervisorRequests)
      const newDosenReq = {
        id: `req-${Date.now()}`,
        proposalId: 'prop-custom',
        proposalTitle: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung Berbasis Edge AI',
        schemeCode: 'PKM-KC',
        teamName: isNadia ? 'AgroSense Unila' : team.name,
        studentName: user?.name || 'Nadia Putri Maharani',
        studentNumber: user?.studentNumber || user?.npm || '2117051001',
        studentFaculty: user?.faculty || 'Fakultas Teknik',
        studentProdi: user?.studyProgram || user?.department || 'Teknik Elektro',
        requestMessage: `Selamat siang Bapak/Ibu ${name}, kami dari tim ${team.name} mengajukan permohonan kesediaan Bapak/Ibu menjadi dosen pembimbing PKM kami. Kami sangat berharap arahan dan bimbingan Bapak/Ibu.`,
        status: 'pending',
        responseMessage: '',
        respondedAt: null,
        createdAt: new Date().toISOString(),
      }
      saveStore('pkm_dosen_requests', [newDosenReq, ...currentDosenReqs])
    }

    setAlertMsg(`Undangan resmi berhasil dikirimkan kepada ${name} (${type})!`)
    setTimeout(() => setAlertMsg(''), 4500)
  }

  // Aksi Mahasiswa: Melamar / Mengajukan Bergabung ke Lowongan Tim Lain
  const handleApplyToVacancy = (vacId, teamName, roleName, vacObj = {}) => {
    const updated = { ...sentRequests, [vacId]: true }
    setSentRequests(updated)
    saveMySentRequests(updated, userKey)

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

    setAlertMsg('Lowongan rekrutmen tim berhasil dipublikasikan!')
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

  // Filtering Dosen
  const filteredDosen = useMemo(() => {
    return DOSEN_LIST.filter(d => {
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.prodi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bidang.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchFaculty =
        facultyFilter === 'Semua Fakultas' || d.faculty === facultyFilter
      return matchSearch && matchFaculty
    })
  }, [searchQuery, facultyFilter])

  // Filtering Mahasiswa
  const filteredMahasiswa = useMemo(() => {
    return mahasiswaList.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.prodi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.bio.toLowerCase().includes(searchQuery.toLowerCase())
      const matchFaculty =
        facultyFilter === 'Semua Fakultas' || m.faculty === facultyFilter
      return matchSearch && matchFaculty
    })
  }, [mahasiswaList, searchQuery, facultyFilter])

  // Filtering Lowongan
  const filteredVacancies = useMemo(() => {
    return allVacancies.filter(v => {
      const matchSearch =
        v.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.targetFaculty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchFaculty =
        facultyFilter === 'Semua Fakultas' || v.targetFaculty === facultyFilter
      return matchSearch && matchFaculty
    })
  }, [allVacancies, searchQuery, facultyFilter])

  const pendingRequests = incomingRequests.filter(r => r.status === 'pending')

  return (
    <div className="module-container">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <section className="module-header" style={{ marginBottom: '1.5rem' }}>
        <div className="module-header-top">
          <div>
            <div className="module-badge">PORTAL TIM &amp; MATCHMAKING PKM</div>
            <h1 className="module-title">Manajemen &amp; Cari Tim PKM</h1>
            <p className="module-subtitle">
              Satu ruang terpadu untuk mengelola susunan tim aktif, memenuhi syarat Belmawa, mencari rekan mahasiswa multidisiplin, dan menghubungi dosen pembimbing resmi.
            </p>
          </div>
          <div className="student-header-meta">
            <span className="student-eyebrow">Status Tim Anda</span>
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

      {/* ========================================================
          NAVIGASI TAB UTAMA (UNIFIED TAB NAVIGATION)
          ======================================================== */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'tim' ? 'active' : ''}`}
          onClick={() => setActiveTab('tim')}
        >
          <Users size={16} />
          <span>Tim Saya (Manajemen)</span>
          <span className="tab-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            {team.members.length}/5
          </span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'dosen' ? 'active' : ''}`}
          onClick={() => setActiveTab('dosen')}
        >
          <GraduationCap size={16} />
          <span>Cari Dosen Pembimbing</span>
          <span className="tab-badge">{filteredDosen.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'mahasiswa' ? 'active' : ''}`}
          onClick={() => setActiveTab('mahasiswa')}
        >
          <UserPlus size={16} />
          <span>Cari Rekan Mahasiswa</span>
          <span className="tab-badge">{filteredMahasiswa.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'lowongan' ? 'active' : ''}`}
          onClick={() => setActiveTab('lowongan')}
        >
          <Briefcase size={16} />
          <span>Bursa Lowongan Rekrutmen</span>
          <span className="tab-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
            {filteredVacancies.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          KONTEN TAB 1: TIM SAYA (MANAJEMEN FORMASI TIM)
          ======================================================== */}
      {activeTab === 'tim' && (
        <>
          {/* Card: Undangan Bergabung Masuk dari Tim Lain (jika ada) */}
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

                    <div style={{ fontSize: '0.82rem', color: '#1e40af', background: '#eff6ff', padding: '0.45rem 0.75rem', borderRadius: '10px', fontWeight: 600 }}>
                      Peran yang Ditawarkan: <strong>{inv.roleOffered}</strong> • Skema: <strong>{inv.scheme}</strong>
                    </div>

                    {inv.message && (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, fontStyle: 'italic', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '10px', borderLeft: '3px solid #cbd5e1' }}>
                        "{inv.message}"
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn-action primary"
                        onClick={() => handleAcceptInvite(inv)}
                        style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.84rem', background: '#059669', gap: '0.4rem', justifyContent: 'center' }}
                      >
                        <Check size={15} />
                        <span>Terima &amp; Bergabung</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action secondary"
                        onClick={() => handleRejectInvite(inv)}
                        style={{ padding: '0.6rem 1rem', fontSize: '0.84rem', color: '#ef4444', gap: '0.4rem', justifyContent: 'center' }}
                      >
                        <X size={15} />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Card: Status Kelayakan Tim (Validasi Pedoman Belmawa) */}
          <section className="student-panel" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Shield size={20} color="#0071e3" />
                <h3 className="student-panel-title" style={{ margin: 0 }}>
                  Kelayakan Syarat Pedoman Belmawa 2026
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Skema: <strong>{team.scheme}</strong>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '12px', background: team.members.length >= 3 && team.members.length <= 5 ? '#f0fdf4' : '#fffbeb', border: `1px solid ${team.members.length >= 3 && team.members.length <= 5 ? '#bbf7d0' : '#fef08a'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: team.members.length >= 3 && team.members.length <= 5 ? '#15803d' : '#a16207' }}>
                  {team.members.length >= 3 && team.members.length <= 5 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>Jumlah Anggota ({team.members.length}/5)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {team.members.length >= 3 && team.members.length <= 5 ? 'Memenuhi syarat kuota tim (3–5 mahasiswa).' : 'Belum memenuhi. Tambahkan anggota agar genap minimal 3 orang.'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#15803d' }}>
                  <CheckCircle2 size={16} />
                  <span>Komposisi Multidisiplin</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Terbuka untuk kolaborasi lintas program studi dan angkatan aktif Unila.
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '12px', background: team.dosenPembimbing ? '#f0fdf4' : '#eff6ff', border: `1px solid ${team.dosenPembimbing ? '#bbf7d0' : '#bfdbfe'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: team.dosenPembimbing ? '#15803d' : '#1d4ed8' }}>
                  {team.dosenPembimbing ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  <span>Dosen Pembimbing</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {team.dosenPembimbing ? `${team.dosenPembimbing.name} (${team.dosenPembimbing.status})` : 'Belum ada. Cari dan undang dosen pembimbing terdaftar.'}
                </div>
              </div>
            </div>
          </section>

          {/* Grid 2 Kolom: Anggota Tim Aktif & Permintaan Masuk / Undangan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
            {/* Kolom 1: Susunan Anggota Tim */}
            <section className="student-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="caritim-hub-icon blue" style={{ width: 36, height: 36 }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="student-panel-title" style={{ margin: 0 }}>Anggota Tim Aktif</h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Formasi sah tercatat di sistem</span>
                  </div>
                </div>
                <span className="bento-scheme-pill">
                  {team.members.length} / 5 Anggota
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {team.members.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      background: m.role.includes('Ketua') ? 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)' : 'rgba(248, 250, 252, 0.75)',
                      border: `1px solid ${m.role.includes('Ketua') ? '#fef08a' : 'rgba(226, 232, 240, 0.8)'}`
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

              {/* Shortcut Aksi Cepat */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-action secondary"
                  onClick={() => setActiveTab('mahasiswa')}
                  style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                >
                  <UserPlus size={15} style={{ marginRight: '0.4rem' }} />
                  <span>Cari Rekan Mahasiswa</span>
                </button>
                <button
                  type="button"
                  className="btn-action secondary"
                  onClick={() => setActiveTab('dosen')}
                  style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                >
                  <GraduationCap size={15} style={{ marginRight: '0.4rem' }} />
                  <span>Cari Dosen</span>
                </button>
                <button
                  type="button"
                  className="btn-action primary"
                  onClick={() => setShowVacancyModal(!showVacancyModal)}
                  style={{ padding: '0.75rem 1rem', gap: '0.35rem' }}
                >
                  <Plus size={15} />
                  <span>Lowongan</span>
                </button>
              </div>
            </section>

            {/* Kolom 2: Permintaan Bergabung Masuk & Undangan Keluar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <section className="student-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="caritim-hub-icon gold" style={{ width: 36, height: 36 }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="student-panel-title" style={{ margin: 0 }}>Permintaan Masuk</h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Mahasiswa melamar masuk tim Anda</span>
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

              {/* Undangan Keluar (Pending Invitations) */}
              <section className="student-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="caritim-hub-icon green" style={{ width: 36, height: 36 }}>
                      <Send size={18} />
                    </div>
                    <div>
                      <h3 className="student-panel-title" style={{ margin: 0 }}>Undangan Keluar</h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Undangan yang Anda kirimkan ke calon anggota</span>
                    </div>
                  </div>
                  <span className="bento-scheme-pill">
                    {team.invitations?.length || 0} Terkirim
                  </span>
                </div>

                {!team.invitations || team.invitations.length === 0 ? (
                  <div className="student-empty" style={{ padding: '1.5rem 1rem' }}>
                    <h4>Belum ada undangan terkirim</h4>
                    <p>Buka tab "Cari Rekan Mahasiswa" di atas untuk mencari dan mengundang anggota baru.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {team.invitations.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'rgba(248, 250, 252, 0.75)',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          borderRadius: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>{inv.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{inv.faculty} • {inv.role}</div>
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
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          KONTEN TAB 2: CARI DOSEN PEMBIMBING
          ======================================================== */}
      {activeTab === 'dosen' && (
        <section className="student-panel" style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="student-panel-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Direktori Dosen Pembimbing Terverifikasi
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Pilih dosen pembimbing yang memiliki akun aktif di PKM Center Unila sesuai bidang fokus usulan Anda.
              </p>
            </div>
            <span className="bento-scheme-pill" style={{ background: '#ecfdf5', color: '#065f46' }}>
              {filteredDosen.length} Dosen Terdaftar Aktif
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="caritim-filter-row">
            <div className="caritim-search-bar" style={{ flex: '1 1 280px', maxWidth: '420px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="search"
                className="caritim-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama dosen, keahlian riset, atau prodi..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}
                  title="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="caritim-faculty-pills">
              {FACULTIES.slice(0, 5).map(fac => (
                <button
                  key={fac}
                  type="button"
                  className={`caritim-fac-btn ${facultyFilter === fac ? 'active' : ''}`}
                  onClick={() => setFacultyFilter(fac)}
                >
                  {fac}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Dosen */}
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
                    onClick={() => handleInviteFromDirectory(d.id, d.name, 'Dosen Pembimbing')}
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
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('pkm_target_chat_contact', d.email || d.id)
                      window.location.hash = '#mahasiswa/pesan'
                    }}
                    className="btn-action secondary"
                    title={`Kirim pesan langsung ke ${d.name}`}
                    style={{ padding: '0.65rem 0.85rem', cursor: 'pointer' }}
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          KONTEN TAB 3: CARI REKAN MAHASISWA
          ======================================================== */}
      {activeTab === 'mahasiswa' && (
        <section className="student-panel" style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="student-panel-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Direktori Mahasiswa Siap Kolaborasi
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Temukan rekan mahasiswa dari berbagai fakultas untuk melengkapi kompetensi teknis, analisis bisnis, maupun riset laboratorium tim Anda.
              </p>
            </div>
            <span className="bento-scheme-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              {filteredMahasiswa.length} Mahasiswa Terdaftar
            </span>
          </div>

          {/* Search & Faculty Filters */}
          <div className="caritim-filter-row">
            <div className="caritim-search-bar" style={{ flex: '1 1 280px', maxWidth: '420px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="search"
                className="caritim-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama mahasiswa, minat keahlian, atau prodi..."
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}
                  title="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="caritim-faculty-pills">
              {FACULTIES.slice(0, 6).map(fac => (
                <button
                  key={fac}
                  type="button"
                  className={`caritim-fac-btn ${facultyFilter === fac ? 'active' : ''}`}
                  onClick={() => setFacultyFilter(fac)}
                >
                  {fac}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Mahasiswa */}
          <div className="caritim-directory-grid">
            {filteredMahasiswa.map(m => (
              <article key={m.id} className="caritim-card">
                <div>
                  <div className="caritim-card-head">
                    <div className="caritim-avatar blue">
                      {getInitials(m.name)}
                    </div>
                    <div className="caritim-card-meta">
                      <h3 className="caritim-card-name" title={m.name}>{m.name}</h3>
                      <div className="caritim-card-faculty">
                        <Users size={14} />
                        <span>{m.faculty} • {m.prodi}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <span className="bento-scheme-pill">
                      Minat: {m.skema}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      NPM: {m.npm}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: '0 0 0.75rem' }}>
                    {m.bio}
                  </p>

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
                    onClick={() => handleInviteFromDirectory(m.id, m.name, 'Mahasiswa Anggota', m)}
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
                  <button
                    type="button"
                    onClick={() => {
                      // Email dipetakan ke UUID akun oleh halaman Pesan
                      localStorage.setItem('pkm_target_chat_contact', m.email || m.id)
                      window.location.hash = '#mahasiswa/pesan'
                    }}
                    className="btn-action secondary"
                    title={`Kirim pesan langsung ke ${m.name}`}
                    style={{ padding: '0.65rem 0.85rem', cursor: 'pointer' }}
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          KONTEN TAB 4: BURSA LOWONGAN REKRUTMEN
          ======================================================== */}
      {activeTab === 'lowongan' && (
        <section className="student-panel" style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="student-panel-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Bursa Lowongan Rekrutmen Tim PKM
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Bergabunglah dengan tim yang sedang membutuhkan kompetensi spesifik Anda, atau publikasikan lowongan untuk tim Anda.
              </p>
            </div>
            <button
              type="button"
              className="btn-action primary"
              onClick={() => setShowVacancyModal(!showVacancyModal)}
              style={{ gap: '0.4rem' }}
            >
              <Plus size={15} />
              <span>Buka Lowongan Baru</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="caritim-search-bar" style={{ marginBottom: '1.25rem', maxWidth: '440px' }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="search"
              className="caritim-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari posisi lowongan, nama tim, atau kompetensi yang dicari..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Grid Lowongan */}
          <div className="caritim-directory-grid">
            {filteredVacancies.map(vac => (
              <article key={vac.id} className="caritim-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span className="bento-scheme-pill">{vac.scheme}</span>
                      <h3 className="caritim-card-name" style={{ marginTop: '0.35rem' }}>{vac.roleName}</h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Tim: <strong style={{ color: '#0f172a' }}>{vac.teamName}</strong>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
                      {vac.slots} Slot
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: '0.65rem 0' }}>
                    {vac.description}
                  </p>

                  <div style={{ fontSize: '0.76rem', color: '#0071e3', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Target: {vac.targetFaculty} • {vac.targetMajor}
                  </div>

                  <div className="caritim-card-tags">
                    {vac.skills.map(s => (
                      <span key={s} className="caritim-tag-pill">#{s}</span>
                    ))}
                  </div>
                </div>

                <div className="caritim-card-actions" style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    className={`btn-action ${sentRequests[vac.id] ? 'secondary' : 'primary'}`}
                    disabled={sentRequests[vac.id]}
                    onClick={() => handleApplyToVacancy(vac.id, vac.teamName, vac.roleName, vac)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {sentRequests[vac.id] ? (
                      <>
                        <Check size={14} />
                        <span>Lamaran Terkirim</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Ajukan Diri Bergabung</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          MODAL: BUAT LOWONGAN REKRUTMEN BARU
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
                <option value="FEB">Fakultas Ekonomi &amp; Bisnis</option>
                <option value="Fakultas Hukum">Fakultas Hukum</option>
                <option value="Fakultas Kedokteran">Fakultas Kedokteran</option>
                <option value="FISIP">FISIP</option>
              </select>
            </div>

            <div className="student-field" style={{ margin: 0 }}>
              <label className="student-label">Target Jurusan / Prodi Spesifik</label>
              <input
                className="student-input"
                type="text"
                placeholder="misal: Teknik Elektro / Ilmu Komputer / Agribisnis"
                value={newVac.targetMajor}
                onChange={e => setNewVac({ ...newVac, targetMajor: e.target.value })}
              />
            </div>

            <div className="student-field" style={{ margin: 0 }}>
              <label className="student-label">Keahlian Kunci (pisahkan koma)</label>
              <input
                className="student-input"
                type="text"
                placeholder="misal: IoT, 3D CAD, Python, Rencana Anggaran"
                value={newVac.skills}
                onChange={e => setNewVac({ ...newVac, skills: e.target.value })}
              />
            </div>

            <div className="student-field" style={{ gridColumn: '1 / -1', margin: 0 }}>
              <label className="student-label">Deskripsi Pekerjaan &amp; Tanggung Jawab Anggota</label>
              <textarea
                className="student-input"
                style={{ minHeight: '85px', resize: 'vertical' }}
                placeholder="Jelaskan peran yang akan dijalankan anggota dalam penyusunan proposal PKM tim Anda..."
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
              <button
                type="submit"
                className="btn-action primary"
              >
                Publikasikan Lowongan Sekarang
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
