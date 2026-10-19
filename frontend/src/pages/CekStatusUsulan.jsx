import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Users,
  Award,
  Layers,
  ExternalLink,
  Share2,
  HelpCircle,
  Check,
  ChevronRight,
  Filter,
  RotateCcw,
  Compass,
  ShieldCheck,
  Bookmark,
  Copy,
  Info
} from 'lucide-react'
import { authFetch, statusLabel, statusTone } from '../lib/studentApi'

const STEPS = [
  { key: 'draft', label: 'Draft Usulan', short: 'Draft', desc: 'Pengajuan & kelengkapan administrasi' },
  { key: 'dosen', label: 'Review Pembimbing', short: 'Dosen', desc: 'Validasi & asistensi dosen' },
  { key: 'internal', label: 'Review Internal', short: 'Internal', desc: 'Desk evaluation reviewer Unila' },
  { key: 'belmawa', label: 'Lolos Belmawa', short: 'Belmawa', desc: 'Pendanaan Ditjen Diktiristek' },
  { key: 'pimnas', label: 'PIMNAS', short: 'PIMNAS', desc: 'PKP2 & final PIMNAS nasional' },
]

const QUICK_SUGGESTIONS = [
  { label: 'Nadia (2117051001)', query: '2117051001' },
  { label: 'Semua Usulan (Feed)', query: 'all' },
  { label: 'PKM-KC', query: 'PKM-KC' },
  { label: 'PKM-RE', query: 'PKM-RE' },
  { label: 'PKM-RSH', query: 'PKM-RSH' },
  { label: 'Teknik Elektro', query: 'Teknik Elektro' },
]

function getStageProgress(item) {
  const stage = (item.stageName || '').toLowerCase()
  const status = (item.status || '').toLowerCase()

  if (stage.includes('pimnas') || status.includes('pimnas')) return 4
  if (item.isFunded || stage.includes('belmawa') || status === 'funded') return 3
  if (stage.includes('internal') || stage.includes('reviewer') || status === 'approved') return 2
  if (stage.includes('dosen') || stage.includes('bimbing') || status === 'under_review' || status === 'submitted') return 1
  return 0
}

function getSchemeClass(code) {
  const c = (code || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (c.includes('re')) return 'pkm-re'
  if (c.includes('rsh')) return 'pkm-rsh'
  if (c.includes('kc')) return 'pkm-kc'
  if (c.includes('ki')) return 'pkm-ki'
  if (c.includes('pm')) return 'pkm-pm'
  if (c.includes('pi')) return 'pkm-pi'
  if (c.includes('vgk')) return 'pkm-vgk'
  if (c.includes('gft')) return 'pkm-gft'
  if (c.includes('ai')) return 'pkm-ai'
  if (c.includes('k')) return 'pkm-k'
  return 'pkm-pi'
}

export function CekStatusUsulan({ user }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [state, setState] = useState({ loading: false, error: '', searched: false })
  const [filterType, setFilterType] = useState('all')
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0)
  const [copyToast, setCopyToast] = useState('')
  const [sampleFeed, setSampleFeed] = useState([])

  // Load initial public feed sample for pre-search discovery
  useEffect(() => {
    let alive = true
    authFetch('/proposals/track?q=all')
      .then(res => {
        if (alive && res?.data?.length) {
          setSampleFeed(res.data.slice(0, 3))
        }
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const executeSearch = async (keyword) => {
    const q = (keyword !== undefined ? keyword : query).trim()
    if (!q) {
      setState({ loading: false, error: 'Silakan masukkan NPM, Nama Mahasiswa, atau Judul Usulan.', searched: false })
      return
    }
    setState({ loading: true, error: '', searched: true })
    try {
      const result = await authFetch(`/proposals/track?q=${encodeURIComponent(q)}`)
      setResults(result?.data || [])
      setState({ loading: false, error: '', searched: true })
    } catch (err) {
      setResults([])
      setState({ loading: false, error: `Gagal memuat status usulan: ${err.message}`, searched: true })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    executeSearch()
  }

  const handleChipClick = (q) => {
    setQuery(q)
    executeSearch(q)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setState({ loading: false, error: '', searched: false })
    setFilterType('all')
  }

  const handleCopyLink = (item) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#cek-status`
    navigator.clipboard?.writeText(`${shareUrl} (NPM: ${item.studentNumber} - ${item.title})`)
    setCopyToast(`Tautan usulan "${item.title.slice(0, 28)}..." disalin!`)
    setTimeout(() => setCopyToast(''), 3000)
  }

  // Filtered results
  const filteredResults = useMemo(() => {
    if (filterType === 'funded') return results.filter(r => r.isFunded || r.status === 'funded')
    if (filterType === 'review') return results.filter(r => r.status === 'under_review' || r.status === 'submitted')
    if (filterType === 'draft') return results.filter(r => r.status === 'draft' || r.status === 'revision')
    return results
  }, [results, filterType])

  const counts = useMemo(() => {
    const funded = results.filter(r => r.isFunded || r.status === 'funded').length
    const review = results.filter(r => r.status === 'under_review' || r.status === 'submitted').length
    const draft = results.filter(r => r.status === 'draft' || r.status === 'revision').length
    return { all: results.length, funded, review, draft }
  }, [results])

  const quickChips = useMemo(() => {
    const list = []
    const npm = user?.studentNumber || user?.npm
    if (user?.name && npm) {
      const first = user.name.split(' ')[0]
      list.push({ label: `${first} (${npm}) - Akun Anda`, query: npm })
    } else if (user?.email === 'mahasiswa@pkm.unila.ac.id' || user?.username === 'mahasiswa') {
      list.push({ label: 'Nadia (2117051001)', query: '2117051001' })
    }
    list.push(
      { label: 'Semua Usulan (Feed)', query: 'all' },
      { label: 'PKM-KC', query: 'PKM-KC' },
      { label: 'PKM-RE', query: 'PKM-RE' },
      { label: 'PKM-RSH', query: 'PKM-RSH' },
      { label: 'Teknik Elektro', query: 'Teknik Elektro' },
    )
    return list
  }, [user])

  return (
    <div className="module-container" style={{ paddingTop: '1.5rem' }}>
      {/* Toast Notification */}
      {copyToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          border: '1px solid rgba(255,215,0,0.4)',
          animation: 'fadeIn 0.25s ease'
        }}>
          <Check size={18} color="#10b981" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* GRAND HERO SEARCH SECTION */}
      <section className="track-hero">
        <div className="track-hero-content">
          <div className="track-badge">
            <span className="track-badge-pulse" />
            <span>PELACAKAN STATUS USULAN REAL-TIME</span>
          </div>

          <h1 className="track-hero-title">
            Pantau Perjalanan Usulan PKM Unila <br />
            <span>Transparan & Akuntabel</span>
          </h1>

          <p className="track-hero-subtitle">
            Lacak progres proposal secara langsung mulai dari bimbingan dosen pendamping,
            penilaian reviewer internal universitas, rekomendasi SIMBelmawa, hingga lolos pendanaan dan melaju ke PIMNAS.
          </p>

          <form className="track-search-shell" onSubmit={handleSubmit}>
            <Search size={22} color="#ffd700" style={{ flexShrink: 0, marginLeft: '0.2rem' }} />
            <input
              type="text"
              className="track-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan NPM (contoh: 2117051001), Nama Pengusul, Judul, atau Skema..."
              aria-label="Kata kunci pencarian status usulan"
              style={{
                background: 'transparent',
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
                outline: 'none',
                color: '#ffffff',
                margin: 0,
              }}
            />
            {query && (
              <button
                type="button"
                className="track-search-clear"
                onClick={handleClear}
                title="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="track-search-btn"
              disabled={state.loading}
            >
              {state.loading ? (
                <>
                  <Clock size={18} className="animate-spin" />
                  <span>Menelusuri...</span>
                </>
              ) : (
                <>
                  <span>Lacak Status</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="track-chips-container">
            <span className="track-chips-label">Pencarian Cepat:</span>
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="track-chip"
                onClick={() => handleChipClick(chip.query)}
              >
                <Sparkles size={12} color="#ffd700" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ERROR MESSAGE IF ANY */}
      {state.error && (
        <div className="student-message-box" style={{
          borderLeftColor: '#ef4444',
          color: '#991b1b',
          background: '#fef2f2',
          padding: '1.25rem',
          borderRadius: '14px',
          marginBottom: '2rem'
        }}>
          {state.error}
        </div>
      )}

      {/* EMPTY RESULT MESSAGE */}
      {state.searched && !state.loading && !state.error && results.length === 0 && (
        <div className="student-empty" style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '20px',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          border: '1.5px solid #e2e8f0',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Search size={32} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Usulan Tidak Ditemukan
          </h3>
          <p style={{ color: '#64748b', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.55 }}>
            Tidak ada data yang cocok dengan kata kunci <strong>"{query}"</strong>.
            Pastikan NPM lengkap (10 digit), nama sesuai registrasi SSO Unila, atau coba telusuri berdasarkan skema (mis. <em>PKM-RE</em> atau <em>PKM-KC</em>).
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="track-action-btn gold"
              onClick={() => handleChipClick('all')}
            >
              <RotateCcw size={16} />
              <span>Lihat Semua Usulan Aktif</span>
            </button>
          </div>
        </div>
      )}

      {/* PRE-SEARCH STATE (Rich Discovery & Ecosystem Overview) */}
      {!state.searched && (
        <div>
          {/* Quick Stat Highlights */}
          <div className="track-stats-row">
            <div className="track-stat-card">
              <div className="track-stat-icon blue">
                <FileText size={24} />
              </div>
              <div>
                <div className="track-stat-val">426+</div>
                <div className="track-stat-lbl">Usulan Terdaftar (2025/2026)</div>
              </div>
            </div>

            <div className="track-stat-card">
              <div className="track-stat-icon emerald">
                <Award size={24} />
              </div>
              <div>
                <div className="track-stat-val">109</div>
                <div className="track-stat-lbl">Lolos Didanai Ditjen Belmawa</div>
              </div>
            </div>

            <div className="track-stat-card">
              <div className="track-stat-icon amber">
                <Layers size={24} />
              </div>
              <div>
                <div className="track-stat-val">10</div>
                <div className="track-stat-lbl">Skema PKM Aktif Tersedia</div>
              </div>
            </div>

            <div className="track-stat-card">
              <div className="track-stat-icon purple">
                <Users size={24} />
              </div>
              <div>
                <div className="track-stat-val">168+</div>
                <div className="track-stat-lbl">Dosen Pendamping Terverifikasi</div>
              </div>
            </div>
          </div>

          {/* 5-Tahapan Seleksi PKM Unila (Interactive Flow Card) */}
          <div className="track-roadmap-card">
            <div className="track-roadmap-head">
              <div>
                <div className="module-badge" style={{ marginBottom: '0.4rem' }}>ALUR SELEKSI & TAHAPAN</div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  5 Tahapan Perjalanan Proposal PKM Unila
                </h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                Standar Penilaian Belmawa Kemendikbudristek
              </span>
            </div>

            <div className="track-roadmap-grid">
              {STEPS.map((step, idx) => (
                <div
                  key={step.key}
                  className="track-roadmap-step"
                  style={{
                    cursor: 'pointer',
                    borderColor: activeRoadmapStep === idx ? '#ffd700' : undefined,
                    background: activeRoadmapStep === idx ? '#ffffff' : undefined,
                    boxShadow: activeRoadmapStep === idx ? '0 10px 25px -5px rgba(234, 179, 8, 0.2)' : undefined,
                  }}
                  onClick={() => setActiveRoadmapStep(idx)}
                >
                  <span className="track-roadmap-step-num">TAHAP 0{idx + 1}</span>
                  <div className="track-roadmap-step-title">{step.label}</div>
                  <div className="track-roadmap-step-desc">{step.desc}</div>
                </div>
              ))}
            </div>

            {/* Interactive Stage Detail Box */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem 1.5rem',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Info size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Fokus Tahap 0{activeRoadmapStep + 1}: {STEPS[activeRoadmapStep].label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {activeRoadmapStep === 0 && 'Pengusul membentuk tim lintas disiplin dan menyusun Bab 1-3 sesuai Pedoman PKM 2026.'}
                    {activeRoadmapStep === 1 && 'Dosen pendamping memberikan feedback metodologi, kelayakan anggaran, dan persetujuan bimbingan.'}
                    {activeRoadmapStep === 2 && 'Dua reviewer universitas melakukan blind review untuk menguji orisinalitas, keterbaruan, dan luaran.'}
                    {activeRoadmapStep === 3 && 'Proposal direkomendasikan dan disubmit ke SIMBelmawa Ditjen Diktiristek untuk penetapan pendanaan.'}
                    {activeRoadmapStep === 4 && 'Tim menjalankan pelaksanaan program, pengisian logbook rutin, monev internal (PKP2), dan tiket PIMNAS.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="track-action-btn gold"
                onClick={() => handleChipClick('all')}
              >
                <span>Lihat Usulan di Tahap Ini</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Preview Usulan Berjalan (Live Feed Sample) */}
          {sampleFeed.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <div className="module-badge" style={{ marginBottom: '0.35rem' }}>AKTIVITAS TERBARU</div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Usulan yang Sedang Dalam Pelacakan
                  </h3>
                </div>
                <button
                  type="button"
                  className="track-action-btn"
                  onClick={() => handleChipClick('all')}
                >
                  <Compass size={16} />
                  <span>Jelajahi Semua Usulan ({sampleFeed.length > 0 ? '426' : '0'})</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sampleFeed.map((item, idx) => (
                  <div
                    key={item.proposalId || idx}
                    className="track-proposal-card"
                    style={{ padding: '1.35rem 1.5rem', marginBottom: 0, cursor: 'pointer' }}
                    onClick={() => {
                      setQuery(item.studentNumber || item.title)
                      executeSearch(item.studentNumber || item.title)
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span className={`scheme-tag-pill ${getSchemeClass(item.schemeCode)}`}>
                          {item.schemeCode}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                          {item.schemeName}
                        </span>
                      </div>
                      <span className={`status-pill ${statusTone(item.status)}`}>
                        {item.isFunded ? 'Lolos Didanai' : statusLabel(item.status)}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f172a', margin: '0.6rem 0 0.4rem' }}>
                      {item.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#64748b' }}>
                      <span>Pengusul: <strong>{item.studentName}</strong> ({item.studentNumber})</span>
                      <span>•</span>
                      <span>{item.studyProgram || item.faculty}</span>
                      <span>•</span>
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>Klik untuk detail pelacakan &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ & Panduan Bantuan */}
          <div className="track-faq-grid">
            <div className="track-faq-card">
              <div className="track-faq-q">
                <HelpCircle size={20} color="#1d4ed8" />
                <span>Bagaimana cara melacak usulan tim saya?</span>
              </div>
              <div className="track-faq-a">
                Masukkan 10 digit NPM ketua tim atau nama lengkap pengusul pada kolom pencarian di atas.
                Sistem akan menampilkan riwayat verifikasi dosen, status reviewer internal, serta tahapan pendanaan.
              </div>
            </div>

            <div className="track-faq-card">
              <div className="track-faq-q">
                <ShieldCheck size={20} color="#059669" />
                <span>Kapan status usulan diperbarui?</span>
              </div>
              <div className="track-faq-a">
                Status diperbarui secara real-time setiap kali dosen pembimbing mengonfirmasi asistensi atau reviewer
                internal menyelesaikan form rubrik evaluasi pada portal PKM Center.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH RESULTS STATE */}
      {state.searched && results.length > 0 && (
        <div>
          {/* Results Action Bar & Filter Tabs */}
          <div className="track-results-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                  Ditemukan {filteredResults.length} Usulan
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '0.4rem' }}>
                  untuk kata kunci "{query}"
                </span>
              </div>
            </div>

            <div className="track-filters-wrap">
              <button
                type="button"
                className={`track-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Semua ({counts.all})
              </button>
              <button
                type="button"
                className={`track-filter-btn ${filterType === 'funded' ? 'active' : ''}`}
                onClick={() => setFilterType('funded')}
              >
                Lolos Didanai ({counts.funded})
              </button>
              <button
                type="button"
                className={`track-filter-btn ${filterType === 'review' ? 'active' : ''}`}
                onClick={() => setFilterType('review')}
              >
                Dalam Review ({counts.review})
              </button>
              <button
                type="button"
                className={`track-filter-btn ${filterType === 'draft' ? 'active' : ''}`}
                onClick={() => setFilterType('draft')}
              >
                Draft / Revisi ({counts.draft})
              </button>
              <button
                type="button"
                className="track-action-btn"
                style={{ padding: '0.45rem 0.85rem' }}
                onClick={handleClear}
                title="Reset pencarian"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredResults.map((item, idx) => {
              const activeIndex = getStageProgress(item)
              const schemeClass = getSchemeClass(item.schemeCode)
              const progressPercentage = Math.min(100, Math.max(0, (activeIndex / 4) * 100))

              return (
                <article key={item.proposalId || idx} className="track-proposal-card">
                  {/* Card Header */}
                  <div className="track-proposal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span className={`scheme-tag-pill ${schemeClass}`}>
                        {item.schemeCode}
                      </span>
                      <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                        {item.schemeName}
                      </span>
                      {item.periodYear && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#475569'
                        }}>
                          Tahun {item.periodYear}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.isFunded && (
                        <span className="status-pill completed" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                          <Sparkles size={13} color="#047857" />
                          <span>Didanai Belmawa</span>
                        </span>
                      )}
                      <span className={`status-pill ${statusTone(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="track-proposal-title">
                    {item.title}
                  </h3>

                  {/* Meta Chips */}
                  <div className="track-meta-chips">
                    <div className="track-meta-chip">
                      <Users size={14} color="#64748b" />
                      <span>Pengusul: <strong>{item.studentName}</strong> ({item.studentNumber})</span>
                    </div>
                    <div className="track-meta-chip">
                      <Compass size={14} color="#64748b" />
                      <span>{item.studyProgram || item.faculty}</span>
                    </div>
                    <div className="track-meta-chip">
                      <Bookmark size={14} color="#64748b" />
                      <span>Tim: <strong>{item.teamName || 'Tim PKM Unila'}</strong></span>
                    </div>
                    {item.stageName && (
                      <div className="track-meta-chip" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#92400e' }}>
                        <span>Tahap Aktif: {item.stageName}</span>
                      </div>
                    )}
                  </div>

                  {/* APPLE-STYLE CONNECTED TIMELINE PROGRESS STEPPER */}
                  <div className="track-stepper-wrap">
                    <div className="track-stepper-bar-bg" />
                    <div
                      className="track-stepper-bar-fill"
                      style={{ width: `${progressPercentage}%` }}
                    />
                    <div className="track-stepper-steps">
                      {STEPS.map((step, i) => {
                        const isCompleted = i < activeIndex
                        const isActive = i === activeIndex
                        const isUpcoming = i > activeIndex

                        return (
                          <div key={step.key} className="track-step-node">
                            <div className={`track-step-dot ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                              {isCompleted ? <Check size={18} strokeWidth={3} /> : i + 1}
                            </div>
                            <div className={`track-step-label ${isActive ? 'active' : ''}`}>
                              {step.short}
                            </div>
                            <div className={`track-step-status-tag ${isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'}`}>
                              {isCompleted ? 'Selesai' : isActive ? 'Sedang Berjalan' : 'Menunggu'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* SUPERVISOR & REVIEWER DECK */}
                  <div className="track-deck-grid">
                    <div className="track-deck-box">
                      <div className="track-deck-head">
                        <ShieldCheck size={15} color="#059669" />
                        <span>Dosen Pembimbing</span>
                      </div>
                      <div className="track-deck-content">
                        {item.supervisors?.length ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#ecfdf5',
                              color: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              DP
                            </div>
                            <span>{item.supervisors.join(', ')}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>
                            Belum ditetapkan oleh tim/jurusan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="track-deck-box">
                      <div className="track-deck-head">
                        <Users size={15} color="#1d4ed8" />
                        <span>Tim Reviewer Internal</span>
                      </div>
                      <div className="track-deck-content">
                        {item.reviewers?.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {item.reviewers.map((r, rIdx) => (
                              <div key={rIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{r.name}</span>
                                <span className={`status-pill ${statusTone(r.status)}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                                  {statusLabel(r.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>
                            Menunggu penugasan tim penilai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="track-card-actions">
                    <button
                      type="button"
                      className="track-action-btn"
                      onClick={() => handleCopyLink(item)}
                    >
                      <Copy size={15} />
                      <span>Salin Tautan Status</span>
                    </button>
                    {user?.role === 'mahasiswa' && (
                      <a
                        href="#logbook"
                        className="track-action-btn gold"
                        style={{ textDecoration: 'none' }}
                      >
                        <FileText size={15} />
                        <span>Buka Logbook Tim &rarr;</span>
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
