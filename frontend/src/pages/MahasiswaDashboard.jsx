import { useState, useEffect } from 'react'
import { loadStore, saveStore } from '../lib/dosenReviewerData'
import {
  authFetch, getNotifications, markNotificationsRead,
  statusLabel, statusTone, formatDateID, formatDateTimeID,
} from '../lib/studentApi'

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
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
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

export function MahasiswaDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('ringkasan')
  const [data, setData] = useState(() => loadStore('pkm_mhs_dashboard', EMPTY))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const result = await authFetch('/student/dashboard')
        if (!alive) return
        if (result?.data) {
          const merged = { ...EMPTY, ...result.data, stats: { ...EMPTY.stats, ...(result.data.stats || {}) } }
          setData(merged)
          saveStore('pkm_mhs_dashboard', merged)
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
  }, [user])

  const student = data.student || {}
  const proposal = data.proposal
  const team = data.team
  const supervisor = data.supervisor
  const stats = data.stats || {}
  const steps = data.stepper || EMPTY.stepper
  const agenda = data.agenda || []
  const stages = data.stages || []
  const activeIndex = Math.max(0, steps.findIndex(s => s.status === 'active'))

  return (
    <div className="module-container">
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">PORTAL MAHASISWA — UNIVERSITAS LAMPUNG</div>
            <h1 className="module-title">Dashboard Mahasiswa</h1>
            <p className="module-subtitle">
              Pantau progres usulan proposal PKM, kelola logbook kegiatan, dan lengkapi berkas usulan dalam satu portal terpadu.
            </p>
          </div>
          <div className="student-header-meta">
            <span className="student-eyebrow">Pengusul Aktif</span>
            <span className="student-name">{student.name || user?.name || 'Mahasiswa'}</span>
            <span className="student-sub">
              NPM: {student.studentNumber || '-'} • {student.faculty || 'Universitas Lampung'}
            </span>
            <div className="student-header-actions">
              <NotificationBell />
              <a className="student-cta" href="#ajukan-proposal">Ajukan Proposal Baru &rarr;</a>
            </div>
          </div>
        </div>

        <div className="stat-cards-grid">
          <div className="stat-box">
            <div className="stat-box-label">Tahap Usulan Saat Ini</div>
            <div className="stat-box-value" style={{ color: '#fbbf24' }}>
              Tahap {activeIndex + 1} <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>/ {steps.length}</span>
            </div>
            <div className="stat-box-sub">{steps[activeIndex]?.label || 'Draft Usulan'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Anggota Tim</div>
            <div className="stat-box-value">{stats.teamMemberCount || 0} <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Orang</span></div>
            <div className="stat-box-sub">{team?.name || 'Belum ada tim'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Dosen Pembimbing</div>
            <div className="stat-box-value" style={{ fontSize: '1.05rem' }}>{supervisor?.name || 'Belum ditetapkan'}</div>
            <div className="stat-box-sub">{supervisor ? statusLabel(supervisor.status || 'accepted') : 'Ajukan bimbingan pada formulir usulan'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Catatan Logbook</div>
            <div className="stat-box-value">{stats.logbookCount || 0} <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Entri</span></div>
            <div className="stat-box-sub">{stats.feedbackCount ? `${stats.feedbackCount} catatan revisi` : 'Belum ada catatan revisi'}</div>
          </div>
        </div>
      </section>

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
          <h3 className="student-section-title">Progres 5 Tahap Usulan</h3>
          <div className="student-stepper">
            {steps.map((step, idx) => (
              <div key={step.key} className={`student-step ${step.status}`}>
                <div className="student-step-index">{step.status === 'done' ? '\u2713' : idx + 1}</div>
                <div className="student-step-body">
                  <div className="student-step-eyebrow">Tahap {idx + 1}</div>
                  <div className="student-step-label">{step.label}</div>
                  <div className="student-step-status">
                    {step.status === 'done' ? 'Selesai' : step.status === 'active' ? 'Sedang Berjalan' : 'Menunggu'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="student-split" style={{ marginTop: '1.5rem' }}>
            <div>
              <h3 className="student-panel-title">Proposal Usulan</h3>
              {proposal ? (
                <article className="proposal-card-item">
                  <div className="proposal-card-item-header">
                    <span className="tag-scheme">{proposal.schemeCode}</span>
                    <span className={`status-pill ${statusTone(proposal.status)}`}>{statusLabel(proposal.status)}</span>
                  </div>
                  <h4 className="proposal-card-title">{proposal.title}</h4>
                  <div className="proposal-card-meta">
                    <span>{proposal.schemeName}</span>
                    <span>Diajukan: {formatDateID(proposal.submittedAt || proposal.createdAt)}</span>
                    <span>{proposal.logbookCount || 0} entri logbook</span>
                    {proposal.fieldOfStudy && <span>Bidang: {proposal.fieldOfStudy}</span>}
                    {proposal.isFunded && <span style={{ color: '#059669', fontWeight: 700 }}>Didanai Belmawa</span>}
                  </div>
                  {proposal.abstract && (
                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>{proposal.abstract}</p>
                  )}
                  <div className="card-actions-row" style={{ marginTop: '1rem' }}>
                    <a className="btn-action primary" href="#ajukan-proposal">Edit / Lanjutkan Usulan</a>
                    <a className="btn-action secondary" href="#logbook">Buka Logbook</a>
                  </div>
                </article>
              ) : (
                <div className="student-empty">
                  <h4>Belum ada proposal</h4>
                  <p>Mulai susun usulan PKM pertama tim Anda melalui formulir multi-step.</p>
                  <a className="btn-action primary" href="#ajukan-proposal">Ajukan Proposal Baru</a>
                </div>
              )}
            </div>

            <div className="student-stack">
              <div className="student-panel">
                <h4 className="student-panel-title">Dosen Pembimbing</h4>
                {supervisor ? (
                  <>
                    <div className="student-member-name">{supervisor.name}</div>
                    <div className="student-member-sub" style={{ marginTop: '0.3rem' }}>
                      {supervisor.lecturerNumber || '-'} • {supervisor.studyProgram || '-'}
                    </div>
                    <span className={`status-pill ${statusTone(supervisor.status || 'accepted')}`} style={{ marginTop: '0.6rem' }}>
                      {statusLabel(supervisor.status || 'accepted')}
                    </span>
                  </>
                ) : (
                  <p className="student-hint">Belum ada dosen pembimbing. Pilih pada langkah 2 formulir usulan.</p>
                )}
              </div>

              <div className="student-panel">
                <h4 className="student-panel-title">Anggota Tim</h4>
                {team?.members?.length ? (
                  <div className="student-stack" style={{ gap: '0.5rem' }}>
                    {team.members.map(m => (
                      <div key={m.studentId} className="student-member-row">
                        <div>
                          <div className="student-member-name">{m.name}</div>
                          <div className="student-member-sub">{m.studentNumber || '-'}</div>
                        </div>
                        <span className={`status-pill ${m.memberRole === 'leader' ? 'accepted' : 'in_progress'}`}>
                          {m.memberRole === 'leader' ? 'Ketua' : 'Anggota'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="student-hint">Belum ada anggota tim terdaftar.</p>
                )}
              </div>

              <div className="student-panel">
                <h4 className="student-panel-title">Capaian Terakhir</h4>
                <div className="student-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155', fontWeight: 700 }}>
                    <span>Progres kegiatan</span>
                    <span>{stats.latestProgress || 0}%</span>
                  </div>
                  <div className="student-progress-track" style={{ marginTop: '0.4rem' }}>
                    <div className="student-progress-fill" style={{ width: `${Math.min(100, Math.max(0, stats.latestProgress || 0))}%` }} />
                  </div>
                </div>
                <a className="btn-action secondary" href="#logbook" style={{ marginTop: '0.9rem' }}>Tambah Catatan Logbook</a>
              </div>
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
