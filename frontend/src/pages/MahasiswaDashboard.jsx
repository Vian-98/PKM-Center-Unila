import { useState, useEffect } from 'react'
import {
  Layers, Users, GraduationCap, BookOpen, Bell, ArrowRight,
  CheckCircle2, Clock, Sparkles, FileText, ChevronRight,
  FileEdit, UserPlus, Plus
} from 'lucide-react'
import { loadStore, saveStore } from '../lib/dosenReviewerData'
import { GlowCard } from '../components/ui/spotlight-card'
import {
  authFetch, getNotifications, markNotificationsRead,
  statusLabel, statusTone, formatDateID, formatDateTimeID,
} from '../lib/studentApi'
import { getIncomingInvitationsForUser } from '../lib/teamInvitationData'

const EMPTY = {
  student: {}, team: null, proposal: null, supervisor: null, reviewers: [],
  stepper: [
    { key: 'draft', label: 'Draft Usulan', status: 'active' },
    { key: 'review_dosen', label: 'Review Dosen', status: 'pending' },
    { key: 'review_internal', label: 'Review Internal (Reviewer 1 & 2)', status: 'pending' },
    { key: 'lolos_belmawa', label: 'Lolos Belmawa', status: 'pending' },
    { key: 'pimnas', label: 'PIMNAS', status: 'pending' },
  ],
  stages: [], agenda: [], stats: { logbookCount: 0, feedbackCount: 0, teamMemberCount: 0, latestProgress: 0 },
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)

  const load = async () => {
    try {
      const res = await getNotifications()
      setItems(res?.data || [])
      setUnread(res?.unread || 0)
    } catch {
      /* notifikasi opsional; abaikan bila backend belum terjangkau */
    }
  }

  useEffect(() => { load() }, [])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      try {
        await markNotificationsRead()
        setUnread(0)
        setItems(prev => prev.map(n => ({ ...n, isRead: true })))
      } catch { /* ignore */ }
    }
  }

  return (
    <div className="student-bell-wrap">
      <button type="button" className="student-bell-btn" onClick={toggle} aria-label="Notifikasi" title="Notifikasi">
        <Bell size={18} />
        {unread > 0 && <span className="student-bell-count">{unread}</span>}
      </button>
      {open && (
        <div className="student-bell-panel" role="menu">
          <div className="student-bell-head">
            <strong>Notifikasi</strong>
            <button type="button" onClick={load}>Muat ulang</button>
          </div>
          <div className="student-bell-list">
            {items.length === 0 ? (
              <div className="student-bell-empty">Belum ada notifikasi.</div>
            ) : (
              items.map(n => (
                <div key={n.id} className={`student-bell-item ${n.isRead ? '' : 'unread'}`}>
                  <span className="student-bell-dot" />
                  <div>
                    <div className="student-bell-item-title">{n.title}</div>
                    {n.message && <div className="student-bell-item-msg">{n.message}</div>}
                    <div className="student-bell-item-time">{formatDateTimeID(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const getInitials = (name) => {
  if (!name) return 'M'
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export function MahasiswaDashboard({ user }) {
  const userKey = user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (user?.id || 'guest')
  const [activeTab, setActiveTab] = useState('ringkasan')
  const [data, setData] = useState(() => loadStore(`pkm_mhs_dashboard_${userKey}`, EMPTY))
  const [incomingInvites, setIncomingInvites] = useState(() => getIncomingInvitationsForUser(user))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setIncomingInvites(getIncomingInvitationsForUser(user))
  }, [userKey, user])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    let alive = true
    setData(loadStore(`pkm_mhs_dashboard_${userKey}`, EMPTY))
    setLoading(true)

    async function load() {
      try {
        const result = await authFetch('/student/dashboard')
        if (!alive) return
        if (result?.data) {
          const merged = { ...EMPTY, ...result.data, stats: { ...EMPTY.stats, ...(result.data.stats || {}) } }
          setData(merged)
          saveStore(`pkm_mhs_dashboard_${userKey}`, merged)
        }
        setError('')
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [userKey])

  const student = data.student && data.student.name ? data.student : (user ? {
    name: user.name,
    studentNumber: user.studentNumber || user.npm || '-',
    faculty: user.faculty || 'Universitas Lampung',
    studyProgram: user.studyProgram || user.department || 'S1'
  } : {})

  const localTeam = !data.team ? loadStore(`pkm_mhs_team_${userKey}`, null) : null
  const team = data.team || (localTeam ? {
    name: localTeam.name,
    members: (localTeam.members || []).map((m, idx) => ({
      studentId: `mem-${idx}`,
      name: m.name,
      studentNumber: m.npm,
      memberRole: m.role?.includes('Ketua') ? 'leader' : 'member'
    }))
  } : null)

  const proposal = data.proposal
  const supervisor = data.supervisor
  const stats = data.stats || {}
  const steps = data.stepper || EMPTY.stepper
  const agenda = data.agenda || []
  const stages = data.stages || []
  const doneCount = steps.filter(s => s.status === 'done').length
  const activeStepIdx = steps.findIndex(s => s.status === 'active')
  const currentIdx = activeStepIdx !== -1 ? activeStepIdx : (doneCount < steps.length ? doneCount : steps.length - 1)
  const currentStageName = activeStepIdx !== -1
    ? (steps[activeStepIdx]?.label || 'Draft Usulan')
    : (doneCount > 0 ? `${steps[doneCount - 1]?.label || 'Lolos Belmawa'} (Lolos)` : 'Draft Usulan')
  const progressPercent = steps.length > 0 ? Math.round(((doneCount + (activeStepIdx !== -1 ? 0.5 : 0)) / steps.length) * 100) : 20

  return (
    <div className="module-container">
      {/* Sleek, Modern Portal Header (Apple / Linear SaaS layout) */}
      <header className="student-portal-header">
        <div className="student-header-info">
          <div className="student-portal-badge">
            <span className="live-pulse-dot" />
            <span>PORTAL MAHASISWA • UNIVERSITAS LAMPUNG</span>
          </div>
          <h1 className="student-portal-title">Dashboard Usulan</h1>
          <p className="student-portal-subtitle">
            Pantau progres usulan proposal PKM, kelola logbook kegiatan riset, dan koordinasikan tim dalam satu sistem terpadu.
          </p>
        </div>

        <div className="student-portal-header-actions">
          <NotificationBell />
          <a className="btn-portal-create" href="#mahasiswa/ajukan-proposal">
            <Plus size={16} />
            <span>Ajukan Proposal Baru</span>
          </a>
        </div>
      </header>

      {/* Alert Banner Undangan Tim Masuk */}
      {incomingInvites.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1.5px solid #93c5fd',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 4px 14px rgba(0, 113, 227, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#0071e3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.98rem' }}>
                Undangan Bergabung ke Tim PKM Baru!
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.15rem' }}>
                Anda diundang oleh <strong>{incomingInvites[0]?.senderName}</strong> untuk bergabung ke dalam <strong>{incomingInvites[0]?.teamName}</strong>.
              </div>
            </div>
          </div>
          <a
            href="#mahasiswa/tim"
            className="btn-action primary"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem', gap: '0.4rem', textDecoration: 'none' }}
          >
            <span>Tinjau & Tanggapi di Manajemen Tim</span>
            <ArrowRight size={14} />
          </a>
        </div>
      )}

      {/* 4-Column Symmetrical Spotlight Stat Cards Grid (Light Frosted Glass) */}
      <div className="student-metric-grid">
        {/* Card 1: Tahap Usulan */}
        <GlowCard glowColor="blue" dark={false} className="student-metric-glow-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Tahap Usulan</span>
            <div className="metric-icon-badge blue">
              <Layers size={18} />
            </div>
          </div>
          <div className="metric-card-body">
            <div className="metric-card-val">
              Tahap {activeStepIdx !== -1 ? activeStepIdx + 1 : doneCount}
              <span className="metric-card-subval">/ {steps.length}</span>
            </div>
            <div className="metric-card-hint" title={currentStageName}>
              <span className="metric-status-dot blue" />
              <span className="truncate">{currentStageName}</span>
            </div>
          </div>
          <div className="metric-card-progress" title={`Progres Tahap ${progressPercent}%`}>
            <div
              className="metric-card-progress-bar blue"
              style={{ width: `${Math.max(15, progressPercent)}%` }}
            />
          </div>
        </GlowCard>

        {/* Card 2: Anggota Tim */}
        <GlowCard glowColor="green" dark={false} className="student-metric-glow-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Anggota Tim</span>
            <div className="metric-icon-badge green">
              <Users size={18} />
            </div>
          </div>
          <div className="metric-card-body">
            <div className="metric-card-val">
              {stats.teamMemberCount || 1}
              <span className="metric-card-subval">Mahasiswa</span>
            </div>
            <div className="metric-card-hint" title={team?.name || 'Tim PKM Unila'}>
              <span className="metric-status-dot green" />
              <span className="truncate">{team?.name || 'Tim PKM Unila'}</span>
            </div>
          </div>
          <a href="#mahasiswa/tim" className="metric-card-link">
            <span>Kelola Tim Usulan</span>
            <ArrowRight size={13} />
          </a>
        </GlowCard>

        {/* Card 3: Pembimbing */}
        <GlowCard glowColor="gold" dark={false} className="student-metric-glow-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Pembimbing</span>
            <div className="metric-icon-badge gold">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="metric-card-body">
            <div className="metric-card-val" title={supervisor?.name || 'Belum Ada'}>
              <span className="truncate" style={{ fontSize: '1.12rem' }}>
                {supervisor?.name || 'Belum Ada'}
              </span>
            </div>
            <div className="metric-card-hint" title={supervisor ? (supervisor.studyProgram || 'Disetujui Dosen') : 'Pilih pada usulan'}>
              <span className={`metric-status-dot ${supervisor ? 'gold' : 'blue'}`} />
              <span className="truncate">{supervisor ? (supervisor.studyProgram || 'Disetujui') : 'Pilih pada usulan'}</span>
            </div>
          </div>
          <a href="#mahasiswa/ajukan-proposal" className="metric-card-link">
            <span>{supervisor ? 'Detail Pembimbing' : 'Pilih Pembimbing'}</span>
            <ArrowRight size={13} />
          </a>
        </GlowCard>

        {/* Card 4: Logbook Digital */}
        <GlowCard glowColor="purple" dark={false} className="student-metric-glow-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Logbook Digital</span>
            <div className="metric-icon-badge purple">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="metric-card-body">
            <div className="metric-card-val">
              {stats.logbookCount || 0}
              <span className="metric-card-subval">Entri</span>
            </div>
            <div className="metric-card-hint">
              <span className="metric-status-dot purple" />
              <span className="truncate">{stats.feedbackCount ? `${stats.feedbackCount} Catatan Revisi` : 'Kemajuan Terverifikasi'}</span>
            </div>
          </div>
          <a href="#mahasiswa/logbook" className="metric-card-link">
            <span>Buka Catatan Logbook</span>
            <ArrowRight size={13} />
          </a>
        </GlowCard>
      </div>

      <nav className="modern-tabs" aria-label="Navigasi Portal Mahasiswa">
        <button className={`tab-btn ${activeTab === 'ringkasan' ? 'active' : ''}`} onClick={() => setActiveTab('ringkasan')}>
          <span>Ringkasan Usulan</span>
        </button>
        <button className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
          <span>Status &amp; Reviewer</span>
          <span className="tab-badge">{data.reviewers?.length || 0}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
          <span>Agenda &amp; Tenggat</span>
          <span className="tab-badge">{stages.length}</span>
        </button>
      </nav>

      {error && (
        <div className="student-message-box" style={{ borderLeftColor: '#f59e0b' }}>
          Menampilkan data tersimpan sementara (backend belum terjangkau). {error}
        </div>
      )}
      {loading && <p style={{ color: '#64748b', marginBottom: '1rem' }}>Memuat data portal mahasiswa...</p>}

      {activeTab === 'ringkasan' && (
        <section>
          {/* Alur 5 Tahap Usulan (Modern Connected Journey Stepper) */}
          <GlowCard glowColor="blue" dark={false} className="student-stepper-glow-card">
            <div className="stepper-card-header">
              <div>
                <h3 className="stepper-card-title">Alur 5 Tahap Usulan PKM</h3>
                <p className="stepper-card-subtitle">Pantau kemajuan usulan proposal tim mulai dari penyusunan draft hingga seleksi PIMNAS</p>
              </div>
              <span className="stepper-progress-pill">
                Tahap {activeStepIdx !== -1 ? `${activeStepIdx + 1} dari ${steps.length}` : `${doneCount} Selesai`}: <strong>{currentStageName}</strong>
              </span>
            </div>

            <div className="modern-stepper-track-wrap">
              <div className="modern-stepper-line-bg" />
              <div
                className="modern-stepper-line-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, (doneCount / Math.max(1, steps.length - 1)) * 100))}%`
                }}
              />
              <div className="modern-stepper-nodes">
                {steps.map((step, idx) => {
                  const isDone = step.status === 'done'
                  const isActive = step.status === 'active'
                  return (
                    <div key={step.key} className={`modern-step-node ${step.status}`}>
                      <div className="modern-step-circle">
                        {isDone ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : isActive ? (
                          <span className="modern-step-pulse" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div className="modern-step-info">
                        <span className="modern-step-num">Tahap {idx + 1}</span>
                        <div className="modern-step-title" title={step.label}>{step.label}</div>
                        <span className={`status-pill ${isDone ? 'completed' : isActive ? 'in_progress' : 'pending'}`}>
                          {isDone ? 'Selesai' : isActive ? 'Sedang Berjalan' : 'Menunggu'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </GlowCard>

          <div className="bento-dashboard-grid">
            {/* Hero Tile: Proposal Usulan */}
            <div>
              {proposal ? (
                <GlowCard glowColor="blue" dark={false} className="bento-hero-tile">
                  <div className="bento-hero-accent-strip" />
                  <div className="bento-hero-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="bento-scheme-pill">
                        <Sparkles size={13} />
                        {proposal.schemeCode || 'PKM'}
                      </span>
                      {proposal.isFunded && (
                        <span className="bento-funded-pill">
                          <CheckCircle2 size={13} />
                          Didanai Belmawa
                        </span>
                      )}
                      <span className="bento-id-badge">Usulan #{proposal.id || '1'}</span>
                    </div>
                    <span className={`status-pill ${statusTone(proposal.status)}`}>
                      {statusLabel(proposal.status)}
                    </span>
                  </div>

                  <h3 className="bento-hero-title">{proposal.title}</h3>

                  <div className="bento-meta-chips">
                    <div className="bento-meta-chip" title="Skema PKM">
                      <FileText size={14} color="#0071e3" />
                      <span>{proposal.schemeName || 'Program Kreativitas Mahasiswa'}</span>
                    </div>
                    <div className="bento-meta-chip" title="Tanggal Pengajuan">
                      <Clock size={14} color="#64748b" />
                      <span>Diajukan: {formatDateID(proposal.submittedAt || proposal.createdAt)}</span>
                    </div>
                    <div className="bento-meta-chip" title="Total Logbook">
                      <BookOpen size={14} color="#9333ea" />
                      <span>{proposal.logbookCount || 0} entri logbook</span>
                    </div>
                    {proposal.fieldOfStudy && (
                      <div className="bento-meta-chip" title="Bidang Ilmu">
                        <GraduationCap size={14} color="#d97706" />
                        <span>Bidang: {proposal.fieldOfStudy}</span>
                      </div>
                    )}
                  </div>

                  {proposal.abstract ? (
                    <div className="bento-abstract-card">
                      <div className="bento-abstract-label">
                        <FileText size={12} />
                        Ringkasan / Abstrak Usulan
                      </div>
                      <p className="bento-abstract-text">{proposal.abstract}</p>
                    </div>
                  ) : (
                    <div className="bento-abstract-card">
                      <p className="bento-abstract-text" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        Belum ada ringkasan abstrak. Lengkapi data usulan pada formulir.
                      </p>
                    </div>
                  )}

                  <div className="bento-hero-actions">
                    <a className="btn-action primary" href="#mahasiswa/ajukan-proposal">
                      <FileEdit size={15} />
                      <span>Edit / Lanjutkan Usulan</span>
                    </a>
                    <a className="btn-action secondary" href="#mahasiswa/logbook">
                      <BookOpen size={15} />
                      <span>Buka Logbook Digital</span>
                    </a>
                    <button
                      type="button"
                      className="bento-header-link"
                      onClick={() => setActiveTab('status')}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }}
                    >
                      <span>Lihat Status Penilai</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </GlowCard>
              ) : (
                <GlowCard glowColor="blue" dark={false} className="bento-hero-tile" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                  <div className="bento-hero-accent-strip" />
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', color: '#0071e3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <FileText size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                    Belum Ada Proposal Usulan
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                    Mulai susun usulan PKM pertama tim Anda melalui formulir bertahap 3-langkah yang mudah dan terpandu.
                  </p>
                  <a className="btn-action primary" href="#mahasiswa/ajukan-proposal">
                    <Plus size={16} />
                    <span>Ajukan Proposal Baru</span>
                  </a>
                </GlowCard>
              )}
            </div>

            {/* Satellite Bento Column */}
            <div className="student-stack">
              {/* Widget 1: Dosen Pembimbing */}
              <GlowCard glowColor="gold" dark={false} className="bento-widget-tile">
                <div className="bento-widget-head">
                  <div className="bento-widget-title-group">
                    <div className="bento-icon-badge amber">
                      <GraduationCap size={17} />
                    </div>
                    <h4 className="bento-widget-title">Dosen Pembimbing</h4>
                  </div>
                  {supervisor && (
                    <span className={`status-pill ${statusTone(supervisor.status || 'accepted')}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                      {statusLabel(supervisor.status || 'accepted')}
                    </span>
                  )}
                </div>

                {supervisor ? (
                  <div className="student-member-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div className="student-member-avatar" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                        {getInitials(supervisor.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="student-member-name" title={supervisor.name}>{supervisor.name}</div>
                        <div className="student-member-sub">
                          NIDN: {supervisor.lecturerNumber || '-'} • {supervisor.studyProgram || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bento-empty-box amber">
                    <div className="bento-empty-title">Belum Ada Pembimbing</div>
                    <div className="bento-empty-desc">
                      Pilih dosen pendamping untuk mengesahkan dan memvalidasi usulan PKM tim Anda.
                    </div>
                    <a className="bento-cta-btn" href="#mahasiswa/ajukan-proposal">
                      <Plus size={13} />
                      <span>Pilih Dosen Pembimbing</span>
                    </a>
                  </div>
                )}
              </GlowCard>

              {/* Widget 2: Anggota Tim */}
              <GlowCard glowColor="green" dark={false} className="bento-widget-tile">
                <div className="bento-widget-head">
                  <div className="bento-widget-title-group">
                    <div className="bento-icon-badge emerald">
                      <Users size={17} />
                    </div>
                    <div>
                      <h4 className="bento-widget-title">Anggota Tim</h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        {team?.name || 'Tim PKM'} ({team?.members?.length || 1} orang)
                      </span>
                    </div>
                  </div>
                  <a href="#mahasiswa/tim" className="bento-header-link" title="Kelola Anggota Tim">
                    <span>Kelola</span>
                    <ChevronRight size={13} />
                  </a>
                </div>

                {team?.members?.length ? (
                  <div className="student-stack" style={{ gap: '0.5rem' }}>
                    {team.members.map(m => (
                      <div key={m.studentId} className="student-member-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                          <div className="student-member-avatar">
                            {getInitials(m.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="student-member-name" title={m.name}>{m.name}</div>
                            <div className="student-member-sub">NPM: {m.studentNumber || '-'}</div>
                          </div>
                        </div>
                        <span className={`status-pill ${m.memberRole === 'leader' ? 'in_progress' : 'accepted'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', flexShrink: 0 }}>
                          {m.memberRole === 'leader' ? 'Ketua' : 'Anggota'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="student-member-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div className="student-member-avatar">
                        {getInitials(student.name || user?.name || 'Mahasiswa')}
                      </div>
                      <div>
                        <div className="student-member-name">{student.name || user?.name || 'Mahasiswa'}</div>
                        <div className="student-member-sub">NPM: {student.studentNumber || '-'}</div>
                      </div>
                    </div>
                    <span className="status-pill in_progress" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                      Ketua
                    </span>
                  </div>
                )}

                {(!team?.members || team.members.length < 3) && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '0.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Disarankan 3–5 anggota tim</span>
                    <a href="#mahasiswa/caritim" className="bento-header-link">
                      <UserPlus size={13} />
                      <span>Cari Rekan</span>
                    </a>
                  </div>
                )}
              </GlowCard>

              {/* Widget 3: Capaian & Logbook */}
              <GlowCard glowColor="purple" dark={false} className="bento-widget-tile">
                <div className="bento-widget-head">
                  <div className="bento-widget-title-group">
                    <div className="bento-icon-badge purple">
                      <BookOpen size={17} />
                    </div>
                    <div>
                      <h4 className="bento-widget-title">Capaian &amp; Logbook</h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Progres Pelaksanaan</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0071e3' }}>
                    {stats.latestProgress || 0}%
                  </span>
                </div>

                <div className="student-progress">
                  <div className="student-progress-track">
                    <div
                      className="student-progress-fill"
                      style={{ width: `${Math.min(100, Math.max(0, stats.latestProgress || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="bento-mini-stats">
                  <div className="bento-stat-pill">
                    <span className="bento-stat-pill-label">Total Entri</span>
                    <span className="bento-stat-pill-val">{stats.logbookCount || 0}</span>
                  </div>
                  <div className="bento-stat-pill">
                    <span className="bento-stat-pill-label">Catatan Revisi</span>
                    <span className="bento-stat-pill-val" style={{ color: stats.feedbackCount ? '#d97706' : '#059669' }}>
                      {stats.feedbackCount || 0}
                    </span>
                  </div>
                </div>

                <a className="btn-action secondary" href="#mahasiswa/logbook" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <Plus size={14} />
                  <span>Tambah Catatan Logbook</span>
                </a>
              </GlowCard>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'status' && (
        <section>
          {proposal ? (
            <article className="proposal-card-item">
              <div className="proposal-card-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span className="tag-scheme">{proposal.schemeCode}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{proposal.schemeName}</span>
                </div>
                <span className={`status-pill ${statusTone(proposal.status)}`}>{statusLabel(proposal.status)}</span>
              </div>
              <h4 className="proposal-card-title">{proposal.title}</h4>
              <div className="proposal-card-meta">
                <span>Tahap: {proposal.stageName || '-'}</span>
                <span>Diperbarui: {formatDateID(proposal.updatedAt)}</span>
              </div>

              <h5 className="student-panel-title" style={{ fontSize: '0.95rem' }}>Tim Penilai (Reviewer)</h5>
              {data.reviewers?.length ? (
                <div className="student-stack" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                  {data.reviewers.map((r, i) => (
                    <div key={i} className="student-member-row">
                      <span className="student-member-name">Reviewer {i + 1}: {r.name}</span>
                      <span className={`status-pill ${statusTone(r.status)}`}>{statusLabel(r.status)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="student-hint" style={{ marginBottom: '1rem' }}>Belum ada reviewer yang ditugaskan pada usulan ini.</p>
              )}

              {proposal.status === 'revision' && (
                <div className="student-message-box" style={{ borderLeftColor: '#f59e0b' }}>
                  Usulan Anda memerlukan revisi. Buka logbook atau pesan untuk melihat catatan lengkap dari pembimbing/reviewer.
                </div>
              )}
            </article>
          ) : (
            <div className="student-empty">
              <h4>Belum ada usulan</h4>
              <p>Status usulan akan muncul setelah Anda mengajukan proposal.</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'agenda' && (
        <section>
          <h3 className="student-section-title" style={{ marginTop: 0 }}>Tahapan &amp; Tenggat Periode</h3>
          {stages.length ? (
            <div className="guidance-grid">
              {stages.map(s => (
                <div key={s.id} className="guidance-card">
                  <div className="guidance-card-date">Tahap {s.stageOrder}</div>
                  <div className="guidance-card-agenda">{s.name}</div>
                  <div className="guidance-card-loc">{formatDateID(s.startDate)} — {formatDateID(s.endDate)}</div>
                  <span className={`status-pill ${s.status === 'active' ? 'in_progress' : s.status === 'completed' ? 'completed' : 'pending'}`}>
                    {s.status === 'active' ? 'Sedang Berjalan' : s.status === 'completed' ? 'Selesai' : 'Menunggu'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="student-empty">
              <h4>Belum ada tahapan</h4>
              <p>Tahapan periode PKM akan tampil setelah dipublikasikan admin.</p>
            </div>
          )}

          {agenda.length > 0 && (
            <>
              <h3 className="student-section-title">Tenggat Terdekat</h3>
              <div className="student-stack" style={{ gap: '0.6rem' }}>
                {agenda.map((a, i) => (
                  <div key={i} className="student-member-row">
                    <div>
                      <div className="student-member-name">{a.title}</div>
                      <div className="student-member-sub">Tenggat: {formatDateID(a.date)}</div>
                    </div>
                    <span className={`status-pill ${a.overdue ? 'rejected' : 'pending'}`}>{a.overdue ? 'Terlewat' : 'Menunggu'}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
