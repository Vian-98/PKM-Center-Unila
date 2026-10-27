import { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/content'
import { getAuthToken } from '../lib/authSession'
import {
  loadStore,
  saveStore,
  initialDosenOverview,
  initialSupervisorRequests,
  initialSupervisedProposals,
  initialGuidanceSessions,
  initialProposalLogbooks,
} from '../lib/dosenReviewerData'

export function DosenDashboard({ user, onSwitchRole }) {
  // Pemeriksaan hak akses: hanya akun berstatus dosen atau admin yang dapat mengakses
  if (user && user.role !== 'dosen' && user.role !== 'admin') {
    const hasDosenRole = user.roles?.includes('dosen')
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: hasDosenRole ? '#eff6ff' : '#fef2f2',
            color: hasDosenRole ? '#2563eb' : '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '1.25rem'
          }}>
            🎓
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
            {hasDosenRole ? 'Peran Dosen Belum Aktif' : 'Akses Dibatasi: Peran Dosen Pembimbing Diperlukan'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '540px', marginInline: 'auto' }}>
            Anda saat ini teridentifikasi sebagai <strong>{user.name}</strong> dengan peran aktif <strong>{user.role === 'reviewer' ? 'Reviewer' : user.role}</strong>.
            Halaman ini khusus untuk Dosen Pembimbing PKM dalam memantau dan membimbing mahasiswa.
          </p>

          {hasDosenRole ? (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <p style={{ color: '#1e40af', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.85rem' }}>
                Akun Anda memiliki hak akses Dosen Pembimbing. Beralih peran sekarang untuk mengelola bimbingan mahasiswa.
              </p>
              <button
                type="button"
                className="btn-masuk"
                onClick={() => onSwitchRole ? onSwitchRole('dosen') : (window.location.hash = '#dosen')}
                style={{ margin: '0 auto', display: 'inline-flex' }}
              >
                Beralih ke Peran Dosen Pembimbing
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#reviewer" className="btn-masuk" style={{ textDecoration: 'none' }}>
                Ke Antrean Reviewer
              </a>
              <a href="#beranda" className="btn-masuk" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', textDecoration: 'none' }}>
                Ke Portal Beranda
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState('requests') // 'requests' | 'proposals' | 'guidance'
  
  // Persistent State agar tidak statis dan tidak hilang saat refresh
  const [overview, setOverview] = useState(() => loadStore('pkm_dosen_overview', initialDosenOverview))
  const [requests, setRequests] = useState(() => loadStore('pkm_dosen_requests', initialSupervisorRequests))
  const [proposals, setProposals] = useState(() => loadStore('pkm_dosen_proposals', initialSupervisedProposals))
  const [guidanceSessions, setGuidanceSessions] = useState(() => loadStore('pkm_dosen_guidance', initialGuidanceSessions))
  const [logbooks, setLogbooks] = useState(() => loadStore('pkm_dosen_logbooks', initialProposalLogbooks))

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [requestFilter, setRequestFilter] = useState('all') // 'all' | 'pending' | 'accepted' | 'rejected'
  const [guidanceStatusFilter, setGuidanceStatusFilter] = useState('all')

  // Modal State untuk ACC / Reject
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    request: null,
    action: 'accepted', // 'accepted' | 'rejected'
    message: '',
  })

  // Modal State untuk Tambah Jadwal Bimbingan
  const [newSessionModal, setNewSessionModal] = useState({
    isOpen: false,
    proposalId: '',
    scheduledAt: '',
    mode: 'offline', // 'offline' | 'online'
    location: 'Ruang Dosen Jurusan TE, Gedung H Lt. 2',
    meetingUrl: 'https://meet.google.com/pkm-unila-bimbingan',
    agenda: '',
  })

  // Modal State untuk Selesaikan Bimbingan & Catatan (Meeting Notes)
  const [notesModal, setNotesModal] = useState({
    isOpen: false,
    session: null,
    meetingNotes: '',
    status: 'completed',
  })

  // Modal State untuk Logbook & Validasi Kemajuan Riset
  const [logbookModal, setLogbookModal] = useState({
    isOpen: false,
    proposal: null,
    editingLogId: null,
    commentText: '',
    statusVal: 'valid',
    isAdding: false,
    newEntry: {
      week: 'Pekan 5',
      activity: '',
      progressPct: 100,
      attachmentName: 'Dokumentasi_Riset_Pekan5.pdf',
    },
  })

  const token = getAuthToken()

  // Sinkronisasi otomatis ke LocalStorage setiap ada perubahan state
  useEffect(() => { saveStore('pkm_dosen_overview', overview) }, [overview])
  useEffect(() => { saveStore('pkm_dosen_requests', requests) }, [requests])
  useEffect(() => { saveStore('pkm_dosen_proposals', proposals) }, [proposals])
  useEffect(() => { saveStore('pkm_dosen_guidance', guidanceSessions) }, [guidanceSessions])
  useEffect(() => { saveStore('pkm_dosen_logbooks', logbooks) }, [logbooks])

  // Fetch dari API jika terhubung ke backend
  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    fetch(`${api}/dosen/overview`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(res => { if (res?.data) setOverview(res.data) })
      .catch(() => {})

    fetch(`${api}/dosen/requests`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(res => { if (res?.data?.length) setRequests(res.data) })
      .catch(() => {})

    fetch(`${api}/dosen/proposals`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(res => { if (res?.data?.length) setProposals(res.data) })
      .catch(() => {})

    fetch(`${api}/dosen/guidance`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(res => { if (res?.data?.length) setGuidanceSessions(res.data) })
      .catch(() => {})
  }, [token])

  // Handle ACC / Reject Submission
  const handleConfirmResponse = async () => {
    const { request, action, message } = responseModal
    if (!request) return

    // Coba kirim ke backend jika token tersedia
    if (token) {
      try {
        await fetch(`${api}/dosen/requests/${request.id}/respond`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, message }),
        })
      } catch (err) {
        console.warn('Backend offline, memperbarui state lokal.', err)
      }
    }

    // Update state permintaan
    setRequests(prev =>
      prev.map(r =>
        r.id === request.id
          ? {
              ...r,
              status: action,
              responseMessage: message,
              respondedAt: new Date().toISOString(),
            }
          : r
      )
    )

    if (action === 'accepted') {
      // Tambahkan ke proposal bimbingan aktif jika belum ada
      setProposals(prev => {
        const alreadyExists = prev.some(p => p.id === request.proposalId || p.title === request.proposalTitle)
        if (alreadyExists) return prev
        return [
          {
            id: request.proposalId || `prop-${Date.now()}`,
            title: request.proposalTitle,
            abstract: 'Proposal baru diterima sebagai tim bimbingan aktif.',
            status: 'submitted',
            schemeCode: request.schemeCode,
            schemeName: request.schemeCode,
            teamName: request.teamName,
            leaderName: request.studentName,
            leaderFaculty: request.studentFaculty,
            isFunded: false,
            submittedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            logbookCount: 0,
          },
          ...prev,
        ]
      })

      // Perbarui ringkasan kuota secara dinamis
      setOverview(prev => ({
        ...prev,
        activeSupervisedCount: prev.activeSupervisedCount + 1,
        remainingCapacity: Math.max(0, prev.remainingCapacity - 1),
        pendingRequestsCount: Math.max(0, prev.pendingRequestsCount - 1),
      }))
    } else {
      setOverview(prev => ({
        ...prev,
        pendingRequestsCount: Math.max(0, prev.pendingRequestsCount - 1),
      }))
    }

    setResponseModal({ isOpen: false, request: null, action: 'accepted', message: '' })
  }

  // Handle Tambah Jadwal Bimbingan Baru
  const handleCreateSession = async (e) => {
    e.preventDefault()
    const { proposalId, scheduledAt, mode, location, meetingUrl, agenda } = newSessionModal
    if (!proposalId || !scheduledAt || !agenda) {
      alert('Harap pilih proposal, waktu, dan agenda pertemuan.')
      return
    }

    const selectedProp = proposals.find(p => p.id === proposalId)
    const newSession = {
      id: `gs-${Date.now()}`,
      proposalId,
      proposalTitle: selectedProp ? selectedProp.title : 'Proposal Bimbingan',
      schemeCode: selectedProp ? selectedProp.schemeCode : 'PKM',
      teamName: selectedProp ? selectedProp.teamName : 'Tim Pengusul',
      scheduledAt,
      location: mode === 'offline' ? location : '',
      meetingUrl: mode === 'online' ? meetingUrl : '',
      status: 'scheduled',
      agenda,
      meetingNotes: '',
    }

    if (token) {
      try {
        await fetch(`${api}/dosen/guidance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            proposalId,
            scheduledAt,
            location: mode === 'offline' ? location : '',
            meetingUrl: mode === 'online' ? meetingUrl : '',
            agenda,
          }),
        })
      } catch (err) {
        console.warn('Backend offline, menyimpan lokal.', err)
      }
    }

    setGuidanceSessions(prev => [newSession, ...prev])
    setOverview(prev => ({ ...prev, upcomingSessionsCount: prev.upcomingSessionsCount + 1 }))
    setNewSessionModal({
      isOpen: false,
      proposalId: '',
      scheduledAt: '',
      mode: 'offline',
      location: 'Ruang Dosen Jurusan TE, Gedung H Lt. 2',
      meetingUrl: 'https://meet.google.com/pkm-unila-bimbingan',
      agenda: '',
    })
  }

  // Handle Simpan Catatan Pertemuan (Meeting Notes)
  const handleSaveNotes = async () => {
    const { session, meetingNotes, status } = notesModal
    if (!session) return

    if (token) {
      try {
        await fetch(`${api}/dosen/guidance/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ meetingNotes, status }),
        })
      } catch (err) {
        console.warn('Backend offline, memperbarui lokal.', err)
      }
    }

    setGuidanceSessions(prev =>
      prev.map(s =>
        s.id === session.id
          ? { ...s, meetingNotes, status }
          : s
      )
    )

    if (status === 'completed' && session.status !== 'completed') {
      setOverview(prev => ({ ...prev, upcomingSessionsCount: Math.max(0, prev.upcomingSessionsCount - 1) }))
    }

    setNotesModal({ isOpen: false, session: null, meetingNotes: '', status: 'completed' })
  }

  // Handle Hapus Sesi Bimbingan
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Hapus jadwal sesi bimbingan ini?')) return
    if (token) {
      try {
        await fetch(`${api}/dosen/guidance/${sessionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.warn('Backend offline, menghapus lokal.', err)
      }
    }
    setGuidanceSessions(prev => prev.filter(s => s.id !== sessionId))
    setOverview(prev => ({ ...prev, upcomingSessionsCount: Math.max(0, prev.upcomingSessionsCount - 1) }))
  }

  // Handle Buka & Kelola Logbook Proposal
  const handleOpenLogbook = (prop) => {
    const currentList = logbooks[prop.id] || []
    setLogbookModal({
      isOpen: true,
      proposal: prop,
      editingLogId: null,
      commentText: '',
      statusVal: 'valid',
      isAdding: false,
      newEntry: {
        week: `Pekan ${currentList.length + 1}`,
        activity: '',
        progressPct: 100,
        attachmentName: 'Dokumentasi_Kemajuan.pdf',
      },
    })
  }

  // Handle Validasi Logbook oleh Dosen
  const handleSaveLogbookValidation = (logId) => {
    const { proposal, commentText, statusVal } = logbookModal
    if (!proposal) return

    setLogbooks(prev => ({
      ...prev,
      [proposal.id]: (prev[proposal.id] || []).map(entry =>
        entry.id === logId
          ? {
              ...entry,
              dosenComment: commentText,
              dosenStatus: statusVal,
              reviewedAt: new Date().toISOString(),
            }
          : entry
      ),
    }))

    setLogbookModal(prev => ({
      ...prev,
      editingLogId: null,
      commentText: '',
      statusVal: 'valid',
    }))
  }

  // Handle Tambah Catatan Monitoring Logbook Baru
  const handleAddNewLogbook = (e) => {
    e.preventDefault()
    const { proposal, newEntry } = logbookModal
    if (!proposal || !newEntry.activity.trim()) return

    const currentList = logbooks[proposal.id] || []
    const created = {
      id: `log-${Date.now()}`,
      week: newEntry.week || `Pekan ${currentList.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      activity: newEntry.activity.trim(),
      progressPct: parseInt(newEntry.progressPct) || 100,
      attachmentName: newEntry.attachmentName.trim() || 'Dokumentasi_Riset.pdf',
      dosenComment: 'Disetujui dan divalidasi oleh dosen pembimbing.',
      dosenStatus: 'valid',
      reviewedAt: new Date().toISOString(),
    }

    setLogbooks(prev => ({
      ...prev,
      [proposal.id]: [...(prev[proposal.id] || []), created],
    }))

    // Perbarui counter logbook di proposal
    setProposals(prev =>
      prev.map(p =>
        p.id === proposal.id ? { ...p, logbookCount: (p.logbookCount || 0) + 1 } : p
      )
    )

    setLogbookModal(prev => ({
      ...prev,
      isAdding: false,
      newEntry: {
        week: `Pekan ${currentList.length + 2}`,
        activity: '',
        progressPct: 100,
        attachmentName: 'Dokumentasi_Riset.pdf',
      },
    }))
  }

  // Data terfilter secara dinamis
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchFilter = requestFilter === 'all' ? true : r.status === requestFilter
      const matchQuery = searchQuery === '' ? true : (
        r.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.teamName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchFilter && matchQuery
    })
  }, [requests, requestFilter, searchQuery])

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      if (!searchQuery) return true
      return (
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.teamName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [proposals, searchQuery])

  const filteredGuidance = useMemo(() => {
    return guidanceSessions.filter(g => {
      const matchStatus = guidanceStatusFilter === 'all' ? true : g.status === guidanceStatusFilter
      const matchQuery = searchQuery === '' ? true : (
        g.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.agenda.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchStatus && matchQuery
    })
  }, [guidanceSessions, guidanceStatusFilter, searchQuery])

  const capacityPct = Math.min(100, Math.round((overview.activeSupervisedCount / (overview.supervisionCapacity || 10)) * 100))

  return (
    <div className="module-container">
      {/* Header Dashboard Dosen */}
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">MODUL DOSEN PEMBIMBING - UNIVERSITAS LAMPUNG</div>
            <h1 className="module-title">Dashboard Dosen Pembimbing</h1>
            <p className="module-subtitle">
              Kelola persetujuan bimbingan proposal PKM, pantau kemajuan riset tim mahasiswa, dan atur slot sesi konsultasi secara terstruktur.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Dosen Pembimbing Aktif:</span>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff' }}>
              {user?.name || 'Dr. Budi Dosen, S.T., M.T.'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
              NIP: {overview.lecturerNumber} - {overview.faculty}
            </div>
            <a
              href="#reviewer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.45rem',
                padding: '0.35rem 0.75rem',
                background: '#1e3a8a',
                color: '#ffffff',
                border: '1px solid #60a5fa',
                borderRadius: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              title="Beralih ke Dashboard Reviewer Proposal"
            >
              <span>Buka Dashboard Reviewer &rarr;</span>
            </a>
          </div>
        </div>

        {/* Ringkasan Kuota Bimbingan & Kapasitas */}
        <div className="stat-cards-grid">
          <div className="stat-box">
            <div className="stat-box-label">Alokasi Kuota Bimbingan</div>
            <div className="stat-box-value">
              {overview.activeSupervisedCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {overview.supervisionCapacity} Tim</span>
            </div>
            <div className="capacity-bar-wrap">
              <div className="capacity-bar-fill" style={{ width: `${capacityPct}%` }} />
            </div>
            <div className="stat-box-sub">
              Sisa kuota: <strong>{overview.remainingCapacity} tim</strong>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-box-label">Permintaan Masuk (Pending)</div>
            <div className="stat-box-value" style={{ color: overview.pendingRequestsCount > 0 ? '#fbbf24' : '#ffffff' }}>
              {overview.pendingRequestsCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Pengajuan</span>
            </div>
            <div className="stat-box-sub">
              {overview.pendingRequestsCount > 0 ? 'Memerlukan tanggapan dosen' : 'Semua telah direspon'}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-box-label">Jadwal Sesi Mendatang</div>
            <div className="stat-box-value" style={{ color: '#60a5fa' }}>
              {overview.upcomingSessionsCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Sesi</span>
            </div>
            <div className="stat-box-sub">Konsultasi tatap muka dan daring</div>
          </div>

          <div className="stat-box">
            <div className="stat-box-label">Status Pendanaan Belmawa</div>
            <div className="stat-box-value" style={{ color: '#34d399' }}>
              {proposals.filter(p => p.isFunded).length} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Lolos Didanai</span>
            </div>
            <div className="stat-box-sub">Dari total {proposals.length} proposal dibimbing</div>
          </div>
        </div>
      </section>

      {/* Modern Tabs Nav */}
      <nav className="modern-tabs" aria-label="Navigasi Dosen">
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => { setActiveTab('requests'); setSearchQuery('') }}
        >
          <span>Permintaan Bimbingan Masuk</span>
          <span className="tab-badge">{requests.filter(r => r.status === 'pending').length} Baru</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => { setActiveTab('proposals'); setSearchQuery('') }}
        >
          <span>Usulan Dibimbing & Logbook</span>
          <span className="tab-badge">{proposals.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'guidance' ? 'active' : ''}`}
          onClick={() => { setActiveTab('guidance'); setSearchQuery('') }}
        >
          <span>Kelola Slot & Jadwal Bimbingan</span>
          <span className="tab-badge">{guidanceSessions.length}</span>
        </button>
      </nav>

      {/* Search & Filter Toolbar Dinamis */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Cari berdasarkan judul, nama mahasiswa, tim, atau agenda..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '240px', padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.9rem' }}
        />
        {activeTab === 'requests' && (
          <select
            value={requestFilter}
            onChange={e => setRequestFilter(e.target.value)}
            style={{ padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.9rem', background: '#fff' }}
          >
            <option value="all">Semua Status Permintaan</option>
            <option value="pending">Menunggu Respon (Pending)</option>
            <option value="accepted">Disetujui (ACC)</option>
            <option value="rejected">Ditolak</option>
          </select>
        )}
        {activeTab === 'guidance' && (
          <select
            value={guidanceStatusFilter}
            onChange={e => setGuidanceStatusFilter(e.target.value)}
            style={{ padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.9rem', background: '#fff' }}
          >
            <option value="all">Semua Status Sesi</option>
            <option value="scheduled">Terjadwal</option>
            <option value="completed">Selesai / Terlaksana</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        )}
        {activeTab === 'guidance' && (
          <button
            className="btn-action primary"
            onClick={() => setNewSessionModal(prev => ({ ...prev, isOpen: true, proposalId: proposals[0]?.id || '' }))}
          >
            Tambah Jadwal Bimbingan
          </button>
        )}
      </div>

      {/* TAB 1: PERMINTAAN BIMBINGAN (ACC / REJECT) */}
      {activeTab === 'requests' && (
        <section>
          {filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b' }}>Tidak ada data permintaan bimbingan yang sesuai pencarian.</p>
            </div>
          ) : (
            filteredRequests.map(req => (
              <article key={req.id} className="proposal-card-item">
                <div className="proposal-card-item-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="tag-scheme">{req.schemeCode}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                      Tim: <strong>{req.teamName}</strong>
                    </span>
                  </div>
                  <span className={`status-pill ${req.status}`}>
                    {req.status === 'pending' ? 'Menunggu Respon' : req.status === 'accepted' ? 'Disetujui (ACC)' : 'Ditolak'}
                  </span>
                </div>

                <h3 className="proposal-card-title">{req.proposalTitle}</h3>

                <div className="proposal-card-meta">
                  <span>Ketua: <strong>{req.studentName}</strong> ({req.studentNumber})</span>
                  <span>{req.studentFaculty} - {req.studentProdi}</span>
                  <span>Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="student-message-box">
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e40af', marginBottom: '0.25rem' }}>
                    Pesan Permohonan Mahasiswa:
                  </div>
                  "{req.requestMessage}"
                </div>

                {req.responseMessage && (
                  <div style={{ background: req.status === 'accepted' ? '#f0fdf4' : '#fef2f2', borderLeft: `3px solid ${req.status === 'accepted' ? '#10b981' : '#ef4444'}`, padding: '0.75rem 1rem', borderRadius: '0.35rem', fontSize: '0.875rem', marginBottom: '1rem', color: '#1f2937' }}>
                    <strong>Tanggapan Dosen:</strong> "{req.responseMessage}"
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Ditanggapi pada: {new Date(req.respondedAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                )}

                {req.status === 'pending' && (
                  <div className="card-actions-row">
                    <button
                      className="btn-action danger"
                      onClick={() => setResponseModal({ isOpen: true, request: req, action: 'rejected', message: '' })}
                    >
                      Tolak Permintaan
                    </button>
                    <button
                      className="btn-action success"
                      onClick={() => setResponseModal({ isOpen: true, request: req, action: 'accepted', message: 'Diterima. Silakan jadwalkan konsultasi awal via sistem untuk mematangkan proposal.' })}
                    >
                      Terima Bimbingan (ACC)
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      )}

      {/* TAB 2: PROPOSAL DIBIMBING & LOGBOOK */}
      {activeTab === 'proposals' && (
        <section>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {filteredProposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b' }}>Tidak ada proposal yang sesuai kata kunci.</p>
              </div>
            ) : (
              filteredProposals.map(prop => (
                <article key={prop.id} className="proposal-card-item">
                  <div className="proposal-card-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="tag-scheme">{prop.schemeCode}</span>
                      <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                        Tim: {prop.teamName}
                      </span>
                    </div>
                    <span className={`status-pill ${prop.status}`}>
                      {prop.status === 'funded' ? 'Lolos Didanai' : prop.status === 'under_review' ? 'Sedang Direview' : 'Terkirim'}
                    </span>
                  </div>

                  <h3 className="proposal-card-title">{prop.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, margin: '0.25rem 0 0.85rem 0' }}>
                    {prop.abstract}
                  </p>

                  <div className="proposal-card-meta">
                    <span>Ketua Tim: <strong>{prop.leaderName}</strong></span>
                    <span>Fakultas: {prop.leaderFaculty}</span>
                    <span>Catatan Logbook: <strong>{prop.logbookCount} Catatan Terisi</strong></span>
                  </div>

                  <div className="card-actions-row">
                    <a
                      href={prop.schemeCode === 'PKM-KC' ? '/docs/proposal-padivision-pkm-kc.pdf' : prop.schemeCode === 'PKM-RE' ? '/docs/proposal-nanomarine-pkm-re.pdf' : prop.schemeCode === 'PKM-PM' ? '/docs/proposal-finsmart-pkm-pm.pdf' : '/docs/proposal-telangtea-pkm-k.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action secondary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Buka dokumen proposal lengkap dalam format PDF"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>Lihat Dokumen PDF</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        let targetId = 'user-mhs-nadia'
                        const leader = (prop.leaderName || '').toLowerCase()
                        if (leader.includes('fajar') || leader.includes('bima')) targetId = 'user-mhs-bima'
                        else if (leader.includes('rian')) targetId = 'user-mhs-rian'
                        else if (leader.includes('ahmad') || leader.includes('zaki')) targetId = 'user-mhs-ahmad'
                        else if (leader.includes('siti')) targetId = 'user-mhs-siti'
                        else if (leader.includes('favian')) targetId = 'user-mhs-favian'
                        localStorage.setItem('pkm_target_chat_contact', targetId)
                        window.location.hash = '#dosen/pesan'
                      }}
                      className="btn-action secondary"
                      style={{ cursor: 'pointer' }}
                    >
                      Chat Tim Mahasiswa
                    </button>
                    <button
                      className="btn-action primary"
                      onClick={() => handleOpenLogbook(prop)}
                    >
                      Buka Logbook Riset ({prop.logbookCount || (logbooks[prop.id]?.length || 0)} Catatan)
                    </button>
                    <button
                      className="btn-action gold"
                      onClick={() => {
                        setNewSessionModal(prev => ({
                          ...prev,
                          isOpen: true,
                          proposalId: prop.id,
                          agenda: `Konsultasi revisi proposal ${prop.schemeCode} - ${prop.title.slice(0, 30)}...`,
                        }))
                        setActiveTab('guidance')
                      }}
                    >
                      Atur Slot Pertemuan
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {/* TAB 3: KELOLA SLOT & JADWAL BIMBINGAN */}
      {activeTab === 'guidance' && (
        <section>
          {filteredGuidance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b' }}>Belum ada jadwal bimbingan yang terdaftar.</p>
            </div>
          ) : (
            <div className="guidance-grid">
              {filteredGuidance.map(session => (
                <div key={session.id} className="guidance-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div className="guidance-card-date">
                        {new Date(session.scheduledAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(session.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                      <span className={`status-pill ${session.status}`}>
                        {session.status === 'scheduled' ? 'Terjadwal' : session.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 700, marginBottom: '0.25rem' }}>
                      [{session.schemeCode}] {session.teamName}
                    </div>

                    <div className="guidance-card-agenda">
                      Agenda: {session.agenda}
                    </div>

                    <div className="guidance-card-loc">
                      {session.meetingUrl ? (
                        <a href={session.meetingUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                          Buka Tautan Google Meet / Rapat Daring
                        </a>
                      ) : (
                        <span>Lokasi: {session.location || 'Ruang Dosen'}</span>
                      )}
                    </div>

                    {session.meetingNotes && (
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#334155', borderLeft: '3px solid #10b981', marginBottom: '1rem' }}>
                        <strong>Notula Pertemuan:</strong>
                        <p style={{ margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>{session.meetingNotes}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="btn-action secondary"
                      style={{ flex: 1, padding: '0.45rem' }}
                      onClick={() => setNotesModal({ isOpen: true, session, meetingNotes: session.meetingNotes || '', status: session.status })}
                    >
                      Catat Notula / Status
                    </button>
                    <button
                      className="btn-action danger"
                      style={{ padding: '0.45rem 0.75rem' }}
                      onClick={() => handleDeleteSession(session.id)}
                      title="Hapus Sesi"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MODAL RESPON ACC / REJECT */}
      {responseModal.isOpen && (
        <div className="modal-overlay" onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>
                {responseModal.action === 'accepted' ? 'Konfirmasi Persetujuan Bimbingan (ACC)' : 'Konfirmasi Penolakan Permintaan'}
              </h3>
              <button className="modal-close-btn" onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}>x</button>
            </div>
            <div className="modal-dialog-body">
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem' }}>
                Proposal: <strong>{responseModal.request?.proposalTitle}</strong>
                <br />
                Pengusul: {responseModal.request?.studentName} ({responseModal.request?.teamName})
              </p>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                Pesan Tanggapan Dosen (akan diterima tim mahasiswa):
              </label>
              <textarea
                style={{ width: '100%', minHeight: '110px', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                placeholder="Tuliskan catatan, alasan penerimaan/penolakan, atau arahan awal bimbingan..."
                value={responseModal.message}
                onChange={e => setResponseModal(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="modal-dialog-footer">
              <button className="btn-action secondary" onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}>
                Batal
              </button>
              <button
                className={`btn-action ${responseModal.action === 'accepted' ? 'success' : 'danger'}`}
                onClick={handleConfirmResponse}
              >
                {responseModal.action === 'accepted' ? 'Setujui Bimbingan (ACC)' : 'Tolak Permintaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SLOT JADWAL BIMBINGAN */}
      {newSessionModal.isOpen && (
        <div className="modal-overlay" onClick={() => setNewSessionModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateSession}>
              <div className="modal-dialog-header">
                <h3>Buat Slot & Jadwal Bimbingan Baru</h3>
                <button type="button" className="modal-close-btn" onClick={() => setNewSessionModal(prev => ({ ...prev, isOpen: false }))}>x</button>
              </div>
              <div className="modal-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Pilih Proposal / Tim Bimbingan:
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                    value={newSessionModal.proposalId}
                    onChange={e => setNewSessionModal(prev => ({ ...prev, proposalId: e.target.value }))}
                    required
                  >
                    <option value="">-- Pilih Proposal Tim --</option>
                    {proposals.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.schemeCode}] {p.title} (Tim: {p.teamName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Waktu Pertemuan:
                  </label>
                  <input
                    type="datetime-local"
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                    value={newSessionModal.scheduledAt}
                    onChange={e => setNewSessionModal(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Metode Konsultasi:
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="mode"
                        checked={newSessionModal.mode === 'offline'}
                        onChange={() => setNewSessionModal(prev => ({ ...prev, mode: 'offline' }))}
                      />
                      Luring (Tatap Muka di Kampus)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="mode"
                        checked={newSessionModal.mode === 'online'}
                        onChange={() => setNewSessionModal(prev => ({ ...prev, mode: 'online' }))}
                      />
                      Daring (Google Meet / Zoom)
                    </label>
                  </div>
                </div>

                {newSessionModal.mode === 'offline' ? (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      Lokasi Tatap Muka:
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                      value={newSessionModal.location}
                      onChange={e => setNewSessionModal(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Contoh: Ruang Dosen Jurusan TE Gedung H Lt. 2"
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      Tautan Rapat Daring (URL):
                    </label>
                    <input
                      type="url"
                      style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                      value={newSessionModal.meetingUrl}
                      onChange={e => setNewSessionModal(prev => ({ ...prev, meetingUrl: e.target.value }))}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Agenda Bimbingan:
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '80px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                    value={newSessionModal.agenda}
                    onChange={e => setNewSessionModal(prev => ({ ...prev, agenda: e.target.value }))}
                    placeholder="Contoh: Pembahasan perbaikan Bab 3 metode riset dan anggaran biaya"
                    required
                  />
                </div>
              </div>
              <div className="modal-dialog-footer">
                <button type="button" className="btn-action secondary" onClick={() => setNewSessionModal(prev => ({ ...prev, isOpen: false }))}>
                  Batal
                </button>
                <button type="submit" className="btn-action primary">
                  Simpan Jadwal Bimbingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOTULA & STATUS PERTEMUAN */}
      {notesModal.isOpen && (
        <div className="modal-overlay" onClick={() => setNotesModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>Catat Hasil Pertemuan & Status Bimbingan</h3>
              <button className="modal-close-btn" onClick={() => setNotesModal(prev => ({ ...prev, isOpen: false }))}>x</button>
            </div>
            <div className="modal-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Status Pertemuan:
                </label>
                <select
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                  value={notesModal.status}
                  onChange={e => setNotesModal(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="scheduled">Terjadwal</option>
                  <option value="completed">Terlaksana / Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Catatan / Notula Hasil Konsultasi:
                </label>
                <textarea
                  style={{ width: '100%', minHeight: '120px', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                  placeholder="Tuliskan poin evaluasi dan arahan revisi untuk tim mahasiswa..."
                  value={notesModal.meetingNotes}
                  onChange={e => setNotesModal(prev => ({ ...prev, meetingNotes: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button className="btn-action secondary" onClick={() => setNotesModal(prev => ({ ...prev, isOpen: false }))}>
                Batal
              </button>
              <button className="btn-action success" onClick={handleSaveNotes}>
                Simpan Notula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGBOOK & VALIDASI KEMAJUAN RISET */}
      {logbookModal.isOpen && (
        <div className="modal-overlay" onClick={() => setLogbookModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog modal-dialog-large" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div>
                <span className="tag-scheme" style={{ marginBottom: '0.25rem' }}>
                  {logbookModal.proposal?.schemeCode}
                </span>
                <h3 style={{ marginTop: '0.25rem' }}>
                  Logbook & Kronologi Kemajuan Riset Tim Mahasiswa
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setLogbookModal(prev => ({ ...prev, isOpen: false }))}>x</button>
            </div>

            <div className="modal-dialog-body">
              {/* Info Proposal */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.65rem', marginBottom: '1.25rem', borderLeft: '4px solid #0b2149' }}>
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#0b2149', fontSize: '1rem' }}>
                  {logbookModal.proposal?.title}
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Ketua: <strong>{logbookModal.proposal?.leaderName}</strong> &bull; Tim: <strong>{logbookModal.proposal?.teamName}</strong> &bull; Fakultas: {logbookModal.proposal?.leaderFaculty}
                </div>
              </div>

              {/* Action Bar Atas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Daftar Catatan Kegiatan ({logbooks[logbookModal.proposal?.id]?.length || 0} Pekan):
                </div>
                <button
                  type="button"
                  className="btn-action primary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setLogbookModal(prev => ({ ...prev, isAdding: !prev.isAdding }))}
                >
                  {logbookModal.isAdding ? 'Tutup Formulir Baru' : '+ Catat Kegiatan Monitoring Baru'}
                </button>
              </div>

              {/* Form Tambah Logbook Baru */}
              {logbookModal.isAdding && (
                <form onSubmit={handleAddNewLogbook} style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.65rem', marginBottom: '1.25rem', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#0f172a' }}>Form Tambah Catatan Monitoring Kemajuan</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.2rem' }}>Pekan Kegiatan:</label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.85rem' }}
                        value={logbookModal.newEntry.week}
                        onChange={e => setLogbookModal(prev => ({ ...prev, newEntry: { ...prev.newEntry, week: e.target.value } }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.2rem' }}>Persentase Capaian (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.85rem' }}
                        value={logbookModal.newEntry.progressPct}
                        onChange={e => setLogbookModal(prev => ({ ...prev, newEntry: { ...prev.newEntry, progressPct: e.target.value } }))}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.2rem' }}>Deskripsi Kegiatan & Capaian Riset:</label>
                    <textarea
                      style={{ width: '100%', minHeight: '65px', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.85rem' }}
                      placeholder="Uraikan progres pekerjaan riset, pengujian, atau koordinasi mitra..."
                      value={logbookModal.newEntry.activity}
                      onChange={e => setLogbookModal(prev => ({ ...prev, newEntry: { ...prev.newEntry, activity: e.target.value } }))}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.2rem' }}>Nama Berkas Lampiran / Dokumentasi:</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.85rem' }}
                      value={logbookModal.newEntry.attachmentName}
                      onChange={e => setLogbookModal(prev => ({ ...prev, newEntry: { ...prev.newEntry, attachmentName: e.target.value } }))}
                      placeholder="Contoh: Hasil_Uji_Prototipe_Pekan5.pdf"
                    />
                  </div>
                  <button type="submit" className="btn-action success" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                    Simpan Catatan ke Logbook
                  </button>
                </form>
              )}

              {/* Daftar Item Logbook */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(logbooks[logbookModal.proposal?.id] || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '0.5rem', color: '#64748b' }}>
                    Belum ada riwayat catatan logbook untuk proposal ini.
                  </div>
                ) : (
                  (logbooks[logbookModal.proposal?.id] || []).map(entry => {
                    const isEditing = logbookModal.editingLogId === entry.id
                    return (
                      <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '1rem', background: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: '#0b2149', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                              {entry.week}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Tanggal: {entry.date}
                            </span>
                          </div>
                          <span className={`status-pill ${entry.dosenStatus === 'valid' ? 'accepted' : entry.dosenStatus === 'needs_revision' ? 'rejected' : 'pending'}`}>
                            {entry.dosenStatus === 'valid' ? 'Valid (ACC Pembimbing)' : entry.dosenStatus === 'needs_revision' ? 'Perlu Perbaikan' : 'Menunggu Validasi'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: '#334155', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                          {entry.activity}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Capaian Riset:</span>
                          <div style={{ flex: 1, maxWidth: '200px', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${entry.progressPct}%`, height: '100%', background: '#2563eb' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>{entry.progressPct}%</span>
                        </div>

                        {entry.attachmentName && (
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Lampiran Berkas:</span>
                            <a
                              href="/docs/proposal-padivision-pkm-kc.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontWeight: 600, color: '#1d4ed8', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Buka lampiran laporan berkas PDF"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                              <span>{entry.attachmentName}</span>
                            </a>
                          </div>
                        )}

                        {/* Kotak Komentar Pembimbing */}
                        <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '0.45rem', borderLeft: '3px solid #3b82f6', marginTop: '0.5rem' }}>
                          {isEditing ? (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                Catatan & Arahan Pembimbing:
                              </label>
                              <textarea
                                style={{ width: '100%', minHeight: '60px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}
                                value={logbookModal.commentText}
                                onChange={e => setLogbookModal(prev => ({ ...prev, commentText: e.target.value }))}
                                placeholder="Tuliskan arahan validasi kemajuan riset..."
                              />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <select
                                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem' }}
                                  value={logbookModal.statusVal}
                                  onChange={e => setLogbookModal(prev => ({ ...prev, statusVal: e.target.value }))}
                                >
                                  <option value="valid">Valid (ACC Pembimbing)</option>
                                  <option value="needs_revision">Perlu Perbaikan</option>
                                  <option value="pending">Menunggu Validasi</option>
                                </select>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    className="btn-action secondary"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => setLogbookModal(prev => ({ ...prev, editingLogId: null }))}
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-action success"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => handleSaveLogbookValidation(entry.id)}
                                  >
                                    Simpan Validasi
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.825rem', color: '#1e293b' }}>
                                <strong>Validasi Pembimbing:</strong> {entry.dosenComment || 'Belum ada catatan pembimbing.'}
                              </div>
                              <button
                                type="button"
                                className="btn-action secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                onClick={() => setLogbookModal(prev => ({
                                  ...prev,
                                  editingLogId: entry.id,
                                  commentText: entry.dosenComment || '',
                                  statusVal: entry.dosenStatus || 'valid',
                                }))}
                              >
                                {entry.dosenComment ? 'Ubah Catatan' : 'Beri Validasi'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="modal-dialog-footer">
              <button
                type="button"
                className="btn-action secondary"
                onClick={() => setLogbookModal(prev => ({ ...prev, isOpen: false }))}
              >
                Tutup Logbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
