import { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../lib/content'
import {
  loadStore,
  saveStore,
  initialReviewerOverview,
  initialReviewAssignments,
  defaultReviewCriteria,
  proposalDocumentDetails,
  initialPdfAnnotations,
} from '../lib/dosenReviewerData'
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Download,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react'

export function ReviewerDashboard({ user, onSwitchRole }) {
  // Pemeriksaan hak akses: hanya akun berstatus reviewer atau admin yang dapat mengakses
  if (user && user.role !== 'reviewer' && user.role !== 'admin') {
    const hasReviewerRole = user.roles?.includes('reviewer')
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
            background: hasReviewerRole ? '#f5f3ff' : '#fef2f2',
            color: hasReviewerRole ? '#7c3aed' : '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '1.25rem'
          }}>
            ⚖️
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
            {hasReviewerRole ? 'Peran Reviewer Belum Aktif' : 'Akses Dibatasi: Peran Reviewer Diperlukan'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '540px', marginInline: 'auto' }}>
            Anda saat ini teridentifikasi sebagai <strong>{user.name}</strong> dengan peran aktif <strong>{user.role === 'dosen' ? 'Dosen Pembimbing' : user.role}</strong>.
            Tidak semua dosen bertindak sebagai reviewer PKM. Halaman ini hanya untuk penilai proposal yang memiliki penugasan resmi.
          </p>

          {hasReviewerRole ? (
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <p style={{ color: '#6d28d9', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.85rem' }}>
                Akun Anda memiliki SK/Penugasan sebagai Reviewer PKM. Beralih peran sekarang untuk mengakses antrean dan lembar penilaian proposal.
              </p>
              <button
                type="button"
                className="btn-masuk"
                onClick={() => onSwitchRole ? onSwitchRole('reviewer') : (window.location.hash = '#reviewer')}
                style={{ background: 'linear-gradient(135deg, #6d28d9, #4c1d95)', margin: '0 auto', display: 'inline-flex' }}
              >
                Beralih ke Peran Reviewer Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#dosen" className="btn-masuk" style={{ textDecoration: 'none' }}>
                Kembali ke Dashboard Dosen
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

  // Persistent State agar tidak statis
  const [overview, setOverview] = useState(() => loadStore('pkm_reviewer_overview', initialReviewerOverview))
  const [assignments, setAssignments] = useState(() => loadStore('pkm_reviewer_assignments', initialReviewAssignments))
  const [annotations, setAnnotations] = useState(() => loadStore('pkm_pdf_annotations', initialPdfAnnotations))
  
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')

  // State Pratinjau Naskah Dokumen Proposal & Anotasi Langsung (Dedicated Workspace)
  const [docModal, setDocModal] = useState({
    isOpen: false,
    assignment: null,
    details: null,
    viewMode: 'pdf', // 'pdf' | 'summary'
    activeTab: 'abstrak', // 'abstrak' | 'bab1' | 'bab2' | 'bab3' | 'bab4' | 'lampiran'
    activePage: 1,
    newCommentText: '',
    newCommentCategory: 'critical', // 'critical' | 'suggestion' | 'positive'
    newCommentPage: 1,
    filterCategory: 'all', // 'all' | 'critical' | 'suggestion' | 'positive'
    showComments: true, // Toggle panel samping catatan (collapse untuk tampilan PDF 100% penuh)
  })

  // State Penilaian / Scoring Modal
  const [scoringModal, setScoringModal] = useState({
    isOpen: false,
    assignment: null,
    criteria: defaultReviewCriteria,
    scores: {}, // { criterionId: { score: number, comment: string } }
    strengths: '',
    weaknesses: '',
    comments: '',
    recommendation: 'funded', // 'funded' | 'revision' | 'rejected' | 'accepted'
    reviewStatus: 'draft',
  })

  // Buka Naskah Proposal ke Dedicated Full-Screen Workspace
  const openReviewWorkspace = useCallback((item) => {
    const details = proposalDocumentDetails[item.id] || {
      title: item.proposalTitle,
      scheme: item.schemeCode,
      team: item.teamName,
      leader: item.leaderName,
      faculty: item.faculty,
      version: 'Naskah_Proposal_v1.0.pdf',
      fileSize: '4.8 MB',
      pdfUrl: item.documentUrl || '/docs/proposal-padivision-pkm-kc.pdf',
      fileName: 'proposal-pkm.pdf',
      submittedDate: '10 Oktober 2026',
      abstract: item.abstract,
      chapters: {
        bab1: 'Latar belakang riset, rumusan masalah, dan urgensi solusi inovatif untuk tantangan daerah.',
        bab2: 'Tinjauan pustaka dan perbandingan teknologi pendukung sesuai standar PKM.',
        bab3: 'Tahapan riset, instrumen uji, dan indikator keberhasilan luaran terukur.',
        bab4: 'RAB biaya langsung dan jadwal waktu pelaksanaan kegiatan selama 4 bulan.',
        lampiran: 'Surat pernyataan orisinalitas, biodata anggota tim, dan dokumen kemitraan mitra.',
      },
    }
    setDocModal({
      isOpen: true,
      assignment: item,
      details: {
        ...details,
        pdfUrl: details.pdfUrl || item.documentUrl || '/docs/proposal-padivision-pkm-kc.pdf',
      },
      viewMode: 'pdf',
      activeTab: 'abstrak',
      activePage: 1,
      newCommentPage: 1,
      newCommentText: '',
      newCommentCategory: 'critical',
      filterCategory: 'all',
      showComments: true,
    })
    if (!window.location.hash.includes(`/review/${item.id}`)) {
      window.location.hash = `#reviewer/review/${item.id}`
    }
  }, [])

  // Tutup Workspace dan Kembali ke Antrean
  const closeReviewWorkspace = useCallback(() => {
    setDocModal(prev => ({ ...prev, isOpen: false }))
    if (window.location.hash.includes('/review/')) {
      window.location.hash = '#reviewer'
    }
  }, [])

  // Sinkronisasi navigasi hash: tombol browser Back / Forward & deep link
  useEffect(() => {
    const handleHashSync = () => {
      const h = window.location.hash || ''
      if (h.startsWith('#reviewer/review/')) {
        const id = h.replace('#reviewer/review/', '').trim()
        if (id && (!docModal.isOpen || docModal.assignment?.id !== id)) {
          const item = assignments.find(a => a.id === id)
          if (item) {
            openReviewWorkspace(item)
          }
        }
      } else if (h === '#reviewer' && docModal.isOpen) {
        setDocModal(prev => ({ ...prev, isOpen: false }))
      }
    }
    handleHashSync()
    window.addEventListener('hashchange', handleHashSync)
    return () => window.removeEventListener('hashchange', handleHashSync)
  }, [assignments, docModal.isOpen, docModal.assignment?.id, openReviewWorkspace])

  // Dukungan tombol keyboard Escape untuk menutup modal / workspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (scoringModal.isOpen) {
          setScoringModal(prev => ({ ...prev, isOpen: false }))
        } else if (docModal.isOpen) {
          closeReviewWorkspace()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [docModal.isOpen, scoringModal.isOpen, closeReviewWorkspace])

  const token = localStorage.getItem('pkm_token')

  // Sinkronisasi otomatis ke LocalStorage
  useEffect(() => { saveStore('pkm_reviewer_overview', overview) }, [overview])
  useEffect(() => { saveStore('pkm_reviewer_assignments', assignments) }, [assignments])
  useEffect(() => { saveStore('pkm_pdf_annotations', annotations) }, [annotations])

  // Fetch dari API jika terhubung ke backend
  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    fetch(`${api}/reviewer/overview`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(res => { if (res?.data) setOverview(res.data) })
      .catch(() => {})

    fetch(`${api}/reviewer/assignments`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(res => { if (res?.data?.length) setAssignments(res.data) })
      .catch(() => {})
  }, [token])

  // Hitung Total Skor Terbobot secara realtime
  const liveTotalScore = useMemo(() => {
    if (!scoringModal.isOpen) return 0
    let total = 0
    scoringModal.criteria.forEach(c => {
      const s = scoringModal.scores[c.id]?.score || 0
      total += s * (c.weight || 0.2)
    })
    return parseFloat(total.toFixed(2))
  }, [scoringModal.scores, scoringModal.criteria, scoringModal.isOpen])

  // Buka Form Scoring untuk Penugasan tertentu (memulihkan nilai tersimpan jika ada)
  const openScoringForm = (assignment) => {
    const initialScores = {}
    defaultReviewCriteria.forEach(c => {
      const savedScore = assignment.savedScores?.[c.id]
      initialScores[c.id] = {
        score: savedScore?.score ?? (assignment.totalScore ? Math.round(assignment.totalScore) : 80),
        comment: savedScore?.comment ?? '',
      }
    })

    setScoringModal({
      isOpen: true,
      assignment,
      criteria: defaultReviewCriteria,
      scores: initialScores,
      strengths: assignment.strengths || (assignment.status === 'completed' ? 'Gagasan sangat solutif dan metode uji lapangan sangat jelas.' : ''),
      weaknesses: assignment.weaknesses || (assignment.status === 'completed' ? 'Rincian luaran paten sederhana perlu diperkuat.' : ''),
      comments: assignment.comments || (assignment.status === 'completed' ? 'Sangat direkomendasikan untuk didanai Belmawa.' : ''),
      recommendation: assignment.recommendation || 'funded',
      reviewStatus: assignment.reviewStatus || 'draft',
    })
  }

  // Handle Ubah Skor Kriteria
  const handleScoreChange = (criterionId, val) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0))
    setScoringModal(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criterionId]: {
          ...prev.scores[criterionId],
          score: num,
        },
      },
    }))
  }

  // Handle Ubah Komentar Kriteria
  const handleCommentChange = (criterionId, text) => {
    setScoringModal(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criterionId]: {
          ...prev.scores[criterionId],
          comment: text,
        },
      },
    }))
  }

  // Simpan Draf atau Finalisasi
  const handleSaveReview = async (isFinal = false) => {
    const { assignment, scores, strengths, weaknesses, comments, recommendation } = scoringModal
    if (!assignment) return

    const payload = {
      scores: Object.entries(scores).map(([cid, data]) => ({
        criterionId: parseInt(cid),
        score: data.score,
        comment: data.comment,
      })),
      totalScore: liveTotalScore,
      strengths,
      weaknesses,
      comments,
      recommendation,
    }

    if (token) {
      try {
        const endpoint = isFinal
          ? `${api}/reviewer/assignments/${assignment.id}/submit`
          : `${api}/reviewer/assignments/${assignment.id}/save`
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.warn('Backend offline, menyimpan ke state lokal.', err)
      }
    }

    // Update state lokal & localStorage
    setAssignments(prev =>
      prev.map(a =>
        a.id === assignment.id
          ? {
              ...a,
              totalScore: liveTotalScore,
              recommendation,
              strengths,
              weaknesses,
              comments,
              savedScores: scores,
              reviewStatus: isFinal ? 'finalized' : 'draft',
              status: isFinal ? 'completed' : 'in_progress',
            }
          : a
      )
    )

    if (isFinal && assignment.status !== 'completed') {
      setOverview(prev => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
        completedCount: prev.completedCount + 1,
      }))
      alert('Penilaian dan keputusan rekomendasi berhasil difinalisasi.')
    } else {
      alert('Draf penilaian berhasil disimpan.')
    }

    setScoringModal(prev => ({ ...prev, isOpen: false }))
  }

  // Lompat ke Halaman tertentu pada Dokumen PDF
  const handleJumpToPage = (pageNum) => {
    setDocModal(prev => ({
      ...prev,
      activePage: pageNum,
      newCommentPage: pageNum,
    }))
  }

  // Tambah Catatan / Komentar Baru Langsung pada PDF
  const handleAddAnnotation = (e) => {
    e.preventDefault()
    if (!docModal.newCommentText.trim() || !docModal.assignment) return

    const propId = docModal.assignment.id
    const pageNum = parseInt(docModal.newCommentPage) || 1

    const categoryLabels = {
      critical: 'Perbaikan Wajib',
      suggestion: 'Saran Masukan',
      positive: 'Poin Positif',
    }

    const sectionLabels = {
      1: 'Halaman 1: Cover & Judul',
      2: 'Halaman 2: Lembar Pengesahan',
      3: 'Halaman 3: Ringkasan & Abstrak',
      4: 'Halaman 4: Bab 1 Pendahuluan',
      5: 'Halaman 5: Bab 2 & 3 Metodologi',
      6: 'Halaman 6: Bab 4 RAB & Jadwal',
    }

    const newAnn = {
      id: `ann-${Date.now()}`,
      proposalId: propId,
      page: pageNum,
      section: sectionLabels[pageNum] || `Halaman ${pageNum}`,
      author: user?.name || 'Dr. Hendri Reviewer',
      category: docModal.newCommentCategory,
      categoryLabel: categoryLabels[docModal.newCommentCategory] || 'Catatan',
      text: docModal.newCommentText.trim(),
      createdAt: new Date().toISOString(),
    }

    setAnnotations(prev => ({
      ...prev,
      [propId]: [newAnn, ...(prev[propId] || [])],
    }))

    setDocModal(prev => ({
      ...prev,
      newCommentText: '',
    }))
  }

  // Hapus Catatan dari Dokumen PDF
  const handleDeleteAnnotation = (annId) => {
    if (!docModal.assignment) return
    const propId = docModal.assignment.id
    setAnnotations(prev => ({
      ...prev,
      [propId]: (prev[propId] || []).filter(a => a.id !== annId),
    }))
  }

  // Sinkronkan Seluruh Catatan / Anotasi PDF ke Form Scoring
  const handleSyncAnnotationsToScoring = () => {
    if (!docModal.assignment) return
    const propId = docModal.assignment.id
    const currentList = annotations[propId] || []

    const criticals = currentList.filter(a => a.category === 'critical').map(a => `[Hal. ${a.page}] ${a.text}`)
    const suggestions = currentList.filter(a => a.category === 'suggestion').map(a => `[Hal. ${a.page}] ${a.text}`)
    const positives = currentList.filter(a => a.category === 'positive').map(a => `[Hal. ${a.page}] ${a.text}`)

    const targetAssignment = docModal.assignment

    // Buka scoring form dengan pre-fill catatan dari anotasi PDF
    const initialScores = {}
    defaultReviewCriteria.forEach(c => {
      const savedScore = targetAssignment.savedScores?.[c.id]
      initialScores[c.id] = {
        score: savedScore?.score ?? (targetAssignment.totalScore ? Math.round(targetAssignment.totalScore) : 80),
        comment: savedScore?.comment ?? '',
      }
    })

    setScoringModal({
      isOpen: true,
      assignment: targetAssignment,
      criteria: defaultReviewCriteria,
      scores: initialScores,
      strengths: positives.length > 0 ? positives.join('\n') : (targetAssignment.strengths || ''),
      weaknesses: criticals.length > 0 ? criticals.join('\n') : (targetAssignment.weaknesses || ''),
      comments: suggestions.length > 0 ? suggestions.join('\n') : (targetAssignment.comments || ''),
      recommendation: targetAssignment.recommendation || 'funded',
      reviewStatus: targetAssignment.reviewStatus || 'draft',
    })
  }

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchFilter = activeFilter === 'pending'
        ? (a.status === 'assigned' || a.status === 'in_progress')
        : activeFilter === 'completed'
        ? (a.status === 'completed')
        : true

      const matchSearch = searchQuery === '' ? true : (
        a.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.schemeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.faculty.toLowerCase().includes(searchQuery.toLowerCase())
      )

      return matchFilter && matchSearch
    })
  }, [assignments, activeFilter, searchQuery])

  return (
    <div className="module-container">
      {/* Header Dashboard Reviewer */}
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">MODUL REVIEWER PROPOSAL - UNIVERSITAS LAMPUNG</div>
            <h1 className="module-title">Dashboard Penilaian Reviewer</h1>
            <p className="module-subtitle">
              Antrean evaluasi proposal pasca batas waktu pengusulan (deadline). Lakukan scoring naskah berdasarkan rubrik standar Belmawa dan tetapkan rekomendasi kelayakan pendanaan.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Reviewer Bertugas:</span>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff' }}>
              {user?.name || 'Dr. Hendri Reviewer, M.Kom.'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
              Klaster Penilai PKM Unila - SIMBELMAWA
            </div>
            <a
              href="#dosen"
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
              title="Beralih ke Dashboard Dosen Pembimbing"
            >
              <span>Buka Dashboard Dosen &rarr;</span>
            </a>
          </div>
        </div>

        {/* Ringkasan Statistik Antrean */}
        <div className="stat-cards-grid">
          <div className="stat-box">
            <div className="stat-box-label">Total Antrean Penugasan</div>
            <div className="stat-box-value">
              {overview.totalAssignments} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Proposal</span>
            </div>
            <div className="stat-box-sub">Ditugaskan oleh Admin PKM Center</div>
          </div>

          <div className="stat-box">
            <div className="stat-box-label">Belum Dinilai (Pending)</div>
            <div className="stat-box-value" style={{ color: overview.pendingCount > 0 ? '#fbbf24' : '#ffffff' }}>
              {overview.pendingCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Naskah</span>
            </div>
            <div className="stat-box-sub">
              {overview.pendingCount > 0 ? 'Segera dinilai sebelum batas akhir' : 'Tidak ada tunggakan'}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-box-label">Sedang Dalam Proses (Draft)</div>
            <div className="stat-box-value" style={{ color: '#60a5fa' }}>
              {overview.inProgressCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Draf</span>
            </div>
            <div className="stat-box-sub">Tersimpan sementara di sistem</div>
          </div>

          <div className="stat-box">
            <div className="stat-box-label">Telah Difinalisasi</div>
            <div className="stat-box-value" style={{ color: '#34d399' }}>
              {overview.completedCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Selesai</span>
            </div>
            <div className="stat-box-sub">Keputusan rekomendasi terkirim</div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar Antrean */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="modern-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Semua Antrean ({assignments.length})
          </button>
          <button
            className={`tab-btn ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            Perlu Dinilai ({assignments.filter(a => a.status !== 'completed').length})
          </button>
          <button
            className={`tab-btn ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            Sudah Selesai ({assignments.filter(a => a.status === 'completed').length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari proposal, ketua, skema, fakultas..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ minWidth: '260px', padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.9rem' }}
        />
      </div>

      {/* Daftar Antrean Penilaian */}
      <section>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filteredAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b' }}>Tidak ada antrean penilaian yang sesuai dengan kriteria pencarian.</p>
            </div>
          ) : (
            filteredAssignments.map(item => (
              <article key={item.id} className="proposal-card-item">
                <div className="proposal-card-item-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="tag-scheme">{item.schemeCode}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                      Tim: <strong>{item.teamName}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.totalScore !== null && (
                      <span style={{ background: '#0b2149', color: '#fbbf24', padding: '0.2rem 0.65rem', borderRadius: '0.35rem', fontWeight: 800, fontSize: '0.85rem' }}>
                        Skor: {item.totalScore}
                      </span>
                    )}
                    <span className={`status-pill ${item.status}`}>
                      {item.status === 'completed' ? 'Selesai Dinilai' : item.status === 'in_progress' ? 'Draf Tersimpan' : 'Belum Dinilai'}
                    </span>
                  </div>
                </div>

                <h3
                  className="proposal-card-title"
                  onClick={() => openReviewWorkspace(item)}
                  style={{ cursor: 'pointer' }}
                  title="Klik untuk membuka naskah proposal pada dedicated review workspace"
                >
                  {item.proposalTitle}
                </h3>

                <div className="proposal-card-meta">
                  <span>Ketua Pengusul: <strong>{item.leaderName}</strong></span>
                  <span>Fakultas: {item.faculty}</span>
                  <span>Batas Waktu Review: <strong>{item.reviewDeadline || '18 Oktober 2026'}</strong></span>
                  {item.recommendation && (
                    <span>
                      Rekomendasi: <strong style={{ textTransform: 'capitalize', color: item.recommendation === 'funded' ? '#059669' : item.recommendation === 'rejected' ? '#dc2626' : '#d97706' }}>{item.recommendation}</strong>
                    </span>
                  )}
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  <strong>Ringkasan Abstrak:</strong> {item.abstract}
                </div>

                <div className="card-actions-row">
                  <button
                    className="btn-action secondary"
                    onClick={() => openReviewWorkspace(item)}
                  >
                    Buka Naskah Proposal (PDF)
                  </button>
                  <button
                    className={`btn-action ${item.status === 'completed' ? 'secondary' : 'primary'}`}
                    onClick={() => openScoringForm(item)}
                  >
                    {item.status === 'completed' ? 'Lihat & Edit Penilaian' : 'Isi Form Scoring & Keputusan'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* MODAL FORM SCORING & RUBRIK PENILAIAN */}
      {scoringModal.isOpen && (
        <div className="modal-overlay" onClick={() => setScoringModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog modal-dialog-large" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div>
                <span className="tag-scheme" style={{ marginBottom: '0.25rem' }}>
                  {scoringModal.assignment?.schemeCode}
                </span>
                <h3 style={{ marginTop: '0.25rem' }}>
                  Form Penilaian & Rekomendasi Proposal
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setScoringModal(prev => ({ ...prev, isOpen: false }))}>x</button>
            </div>

            <div className="modal-dialog-body">
              {/* Header Info Proposal */}
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', borderLeft: '4px solid #0b2149' }}>
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', color: '#0b2149' }}>
                  {scoringModal.assignment?.proposalTitle}
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Ketua: <strong>{scoringModal.assignment?.leaderName}</strong> - Fakultas: {scoringModal.assignment?.faculty} - Tim: {scoringModal.assignment?.teamName}
                </div>
              </div>

              {/* Total Skor Live Banner */}
              <div className="total-score-badge">
                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cbd5e1' }}>
                    Kalkulasi Skor Terbobot Otomatis (Live Weighted Score)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Skor maksimal kelayakan: 100.00 - Ambang batas lolos Belmawa: &ge; 80.00
                  </div>
                </div>
                <div className="total-score-badge-val">
                  {liveTotalScore} <span style={{ fontSize: '1rem', color: '#ffffff' }}>/ 100</span>
                </div>
              </div>

              {/* Tabel Rubrik Kriteria */}
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                1. Rubrik Penilaian Kriteria Standar PKM
              </h4>
              <div className="scoring-table-wrap">
                <table className="scoring-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Kriteria Penilaian</th>
                      <th style={{ width: '12%', textAlign: 'center' }}>Bobot</th>
                      <th style={{ width: '22%', textAlign: 'center' }}>Skor (0-100)</th>
                      <th style={{ width: '26%' }}>Catatan Evaluator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoringModal.criteria.map(c => {
                      const currentScore = scoringModal.scores[c.id]?.score ?? 80
                      const currentComment = scoringModal.scores[c.id]?.comment ?? ''
                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="criterion-title">{c.name}</div>
                            <div className="criterion-desc">{c.description}</div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#1d4ed8' }}>
                            {Math.round((c.weight || 0.2) * 100)}%
                          </td>
                          <td>
                            <div className="score-input-wrap" style={{ flexDirection: 'column', alignItems: 'center' }}>
                              <input
                                type="number"
                                className="score-num-input"
                                min="0"
                                max="100"
                                value={currentScore}
                                onChange={e => handleScoreChange(c.id, e.target.value)}
                              />
                              <input
                                type="range"
                                min="0"
                                max="100"
                                style={{ width: '100%', marginTop: '0.4rem', cursor: 'pointer' }}
                                value={currentScore}
                                onChange={e => handleScoreChange(c.id, e.target.value)}
                              />
                            </div>
                          </td>
                          <td>
                            <textarea
                              style={{ width: '100%', minHeight: '60px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.8rem' }}
                              placeholder="Catatan kriteria..."
                              value={currentComment}
                              onChange={e => handleCommentChange(c.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Form Evaluasi Kualitatif */}
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
                2. Evaluasi Kualitatif Naskah
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#059669', marginBottom: '0.35rem' }}>
                    Kekuatan Proposal (Strengths):
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '85px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                    placeholder="Poin keunggulan gagasan, novelty, dan kelayakan teknis..."
                    value={scoringModal.strengths}
                    onChange={e => setScoringModal(prev => ({ ...prev, strengths: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#b91c1c', marginBottom: '0.35rem' }}>
                    Kelemahan Proposal (Weaknesses):
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '85px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                    placeholder="Aspek metodologi yang kurang rinci atau risiko pelaksanaan..."
                    value={scoringModal.weaknesses}
                    onChange={e => setScoringModal(prev => ({ ...prev, weaknesses: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                  Saran / Catatan Perbaikan Komprehensif:
                </label>
                <textarea
                  style={{ width: '100%', minHeight: '75px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}
                  placeholder="Instruksi revisi yang wajib dipenuhi tim sebelum pengiriman nasional..."
                  value={scoringModal.comments}
                  onChange={e => setScoringModal(prev => ({ ...prev, comments: e.target.value }))}
                />
              </div>

              {/* 3. Keputusan Lolos & Rekomendasi (Bebas Emoji) */}
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                3. Keputusan Rekomendasi Lolos Pendanaan
              </h4>
              <div className="recommendation-grid">
                <div
                  className={`recommendation-option funded ${scoringModal.recommendation === 'funded' ? 'selected' : ''}`}
                  onClick={() => setScoringModal(prev => ({ ...prev, recommendation: 'funded' }))}
                >
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>Lolos Didanai</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Direkomendasikan didanai Belmawa</div>
                </div>

                <div
                  className={`recommendation-option revision ${scoringModal.recommendation === 'revision' ? 'selected' : ''}`}
                  onClick={() => setScoringModal(prev => ({ ...prev, recommendation: 'revision' }))}
                >
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#b45309' }}>Perlu Revisi</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Wajib memperbaiki naskah</div>
                </div>

                <div
                  className={`recommendation-option accepted ${scoringModal.recommendation === 'accepted' ? 'selected' : ''}`}
                  onClick={() => setScoringModal(prev => ({ ...prev, recommendation: 'accepted' }))}
                >
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e40af' }}>Diterima (Tahap 2)</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Lolos seleksi internal kampus</div>
                </div>

                <div
                  className={`recommendation-option rejected ${scoringModal.recommendation === 'rejected' ? 'selected' : ''}`}
                  onClick={() => setScoringModal(prev => ({ ...prev, recommendation: 'rejected' }))}
                >
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#991b1b' }}>Ditolak</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Tidak memenuhi ambang batas</div>
                </div>
              </div>
            </div>

            <div className="modal-dialog-footer">
              <button
                type="button"
                className="btn-action secondary"
                onClick={() => setScoringModal(prev => ({ ...prev, isOpen: false }))}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn-action secondary"
                onClick={() => handleSaveReview(false)}
              >
                Simpan Draf Nilai
              </button>
              <button
                type="button"
                className="btn-action success"
                onClick={() => handleSaveReview(true)}
              >
                Finalisasi & Kirim Keputusan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED FULL-SCREEN REVIEW WORKSPACE (Pengganti Popup Modal Sempit) */}
      {docModal.isOpen && (
        <div className="reviewer-workspace-overlay">
          {/* HEADER / TOOLBAR ATAS WORKSPACE */}
          <header className="rev-workspace-topbar">
            {/* Bagian Kiri: Tombol Back & Identitas Naskah */}
            <div className="rev-topbar-left">
              <button
                type="button"
                className="rev-topbar-back-btn"
                onClick={closeReviewWorkspace}
                title="Kembali ke Daftar Antrean Reviewer (Tekan Esc)"
              >
                <ArrowLeft size={17} />
                <span>Kembali ke Antrean</span>
              </button>

              <div className="rev-topbar-divider" />

              <div className="rev-topbar-meta">
                <div className="rev-topbar-meta-title-row">
                  <span className="rev-scheme-tag">
                    {docModal.details?.scheme || docModal.assignment?.schemeCode}
                  </span>
                  <h3 className="rev-topbar-title" title={docModal.details?.title}>
                    {docModal.details?.title}
                  </h3>
                </div>
                <div className="rev-topbar-submeta">
                  Ketua: <strong>{docModal.details?.leader}</strong> &bull; {docModal.details?.faculty} &bull; Tim <strong>{docModal.details?.team}</strong> &bull; Berkas: {docModal.details?.fileName || 'proposal-pkm.pdf'} ({docModal.details?.fileSize || 'Standar Belmawa'})
                </div>
              </div>
            </div>

            {/* Bagian Kanan: Mode Switch, Tools & CTA Penilaian */}
            <div className="rev-topbar-right">
              {/* Tab Mode */}
              <div className="rev-topbar-pill-group">
                <button
                  type="button"
                  className={`rev-pill-btn ${docModal.viewMode === 'pdf' ? 'active' : ''}`}
                  onClick={() => setDocModal(prev => ({ ...prev, viewMode: 'pdf' }))}
                  title="Tampilan Viewer Dokumen PDF Resmi"
                >
                  <FileText size={15} />
                  <span>Naskah PDF</span>
                </button>
                <button
                  type="button"
                  className={`rev-pill-btn ${docModal.viewMode === 'summary' ? 'active' : ''}`}
                  onClick={() => setDocModal(prev => ({ ...prev, viewMode: 'summary' }))}
                  title="Lihat Intisari Bab Proposal"
                >
                  <BookOpen size={15} />
                  <span>Ringkasan Bab</span>
                </button>
              </div>

              {/* Unduh & Tab Baru */}
              <a
                href={docModal.details?.pdfUrl || '/docs/proposal-padivision-pkm-kc.pdf'}
                download={docModal.details?.fileName || 'naskah-proposal.pdf'}
                className="rev-topbar-action-link"
                title="Unduh Berkas PDF Proposal Lengkap"
              >
                <Download size={15} />
                <span className="hide-on-mobile">Unduh PDF</span>
              </a>

              <a
                href={docModal.details?.pdfUrl || '/docs/proposal-padivision-pkm-kc.pdf'}
                target="_blank"
                rel="noopener noreferrer"
                className="rev-topbar-action-link"
                title="Buka Dokumen di Tab Browser Terpisah"
              >
                <ExternalLink size={15} />
                <span className="hide-on-mobile">Tab Baru</span>
              </a>

              {/* Tombol Toggle Panel Catatan */}
              {docModal.viewMode === 'pdf' && (() => {
                const currentPropId = docModal.assignment?.id || ''
                const propAnns = annotations[currentPropId] || []
                return (
                  <button
                    type="button"
                    className={`rev-topbar-toggle-btn ${docModal.showComments ? 'active' : ''}`}
                    onClick={() => setDocModal(prev => ({ ...prev, showComments: !prev.showComments }))}
                    title={docModal.showComments ? 'Sembunyikan Panel Catatan (Fokus PDF Layar Penuh)' : 'Buka Panel Catatan & Komentar'}
                  >
                    <MessageSquare size={15} />
                    <span>Catatan ({propAnns.length})</span>
                    {docModal.showComments ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                  </button>
                )
              })()}

              {/* CTA Form Penilaian Langsung */}
              <button
                type="button"
                className="rev-topbar-score-cta"
                onClick={() => openScoringForm(docModal.assignment)}
                title="Buka Form Rubrik Penilaian & Skor Proposal"
              >
                <Sparkles size={15} />
                <span>
                  {docModal.assignment?.status === 'completed'
                    ? `Skor: ${docModal.assignment.totalScore || 88}`
                    : 'Form Penilaian'}
                </span>
              </button>
            </div>
          </header>

          {/* AREA UTAMA WORKSPACE */}
          <main className="rev-workspace-body">
            {docModal.viewMode === 'pdf' ? (
              (() => {
                const currentPropId = docModal.assignment?.id || ''
                const propAnnotations = annotations[currentPropId] || []
                const filteredAnns = propAnnotations.filter(a => {
                  if (docModal.filterCategory === 'all') return true
                  return a.category === docModal.filterCategory
                })

                const pageShortcuts = [
                  { num: 1, label: 'Hal 1: Cover' },
                  { num: 2, label: 'Hal 2: Pengesahan' },
                  { num: 3, label: 'Hal 3: Abstrak' },
                  { num: 4, label: 'Hal 4: Bab 1' },
                  { num: 5, label: 'Hal 5: Bab 2 & 3' },
                  { num: 6, label: 'Hal 6: Bab 4 RAB' },
                ]

                return (
                  <>
                    {/* PANEL KIRI: PENAMPIL DOKUMEN PDF (Dapat Meluas 100% Layar) */}
                    <div className="rev-pdf-view-pane">
                      {/* Bar Pintasan Bab Belmawa */}
                      <div className="rev-pdf-toolbar">
                        <div className="rev-toolbar-shortcuts">
                          <span className="rev-toolbar-label">Lompat Bab Belmawa:</span>
                          {pageShortcuts.map(p => (
                            <button
                              key={p.num}
                              type="button"
                              className={`rev-page-shortcut-btn ${docModal.activePage === p.num ? 'active' : ''}`}
                              onClick={() => handleJumpToPage(p.num)}
                              title={`Lompat ke ${p.label} pada naskah PDF`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        <div className="rev-toolbar-hint">
                          <span>Fokus: <strong>Halaman {docModal.activePage}</strong></span>
                          <span>&bull;</span>
                          <button
                            type="button"
                            className="rev-page-shortcut-btn"
                            style={{ background: '#0284c7', color: '#ffffff', borderColor: '#0284c7' }}
                            onClick={() => {
                              setDocModal(prev => ({
                                ...prev,
                                showComments: true,
                                newCommentPage: prev.activePage,
                              }))
                            }}
                          >
                            + Beri Catatan di Halaman {docModal.activePage}
                          </button>
                        </div>
                      </div>

                      {/* Frame Penampil PDF (Tinggi Penuh Tanpa Terpotong) */}
                      <div className="rev-iframe-wrapper">
                        <iframe
                          key={`${docModal.details?.pdfUrl}-p${docModal.activePage}`}
                          src={`${docModal.details?.pdfUrl || '/docs/proposal-padivision-pkm-kc.pdf'}#page=${docModal.activePage}&toolbar=1&navpanes=0`}
                          title={`Pratinjau PDF - ${docModal.details?.title}`}
                        />
                      </div>
                    </div>

                    {/* PANEL KANAN: DRAWER CATATAN & ANOTASI (DAPAT DI-COLLAPSE) */}
                    {docModal.showComments && (
                      <aside className="rev-comments-drawer">
                        {/* Header Drawer */}
                        <div className="rev-drawer-header">
                          <div className="rev-drawer-title-wrap">
                            <h4 className="rev-drawer-title">Catatan Naskah</h4>
                            <span className="rev-count-badge">
                              {propAnnotations.length} Catatan
                            </span>
                          </div>
                          <button
                            type="button"
                            className="rev-drawer-close-btn"
                            onClick={() => setDocModal(prev => ({ ...prev, showComments: false }))}
                            title="Sembunyikan Panel Catatan (Fokus PDF Layar Penuh)"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Filter Kategori */}
                        <div className="rev-drawer-filters">
                          {[
                            ['all', 'Semua'],
                            ['critical', 'Wajib'],
                            ['suggestion', 'Saran'],
                            ['positive', 'Positif'],
                          ].map(([catKey, catLabel]) => (
                            <button
                              key={catKey}
                              type="button"
                              className={`rev-drawer-filter-btn ${docModal.filterCategory === catKey ? 'active' : ''}`}
                              onClick={() => setDocModal(prev => ({ ...prev, filterCategory: catKey }))}
                            >
                              {catLabel}
                            </button>
                          ))}
                        </div>

                        {/* Formulir Tambah Catatan Cepat */}
                        <form onSubmit={handleAddAnnotation} className="rev-drawer-form">
                          <div className="rev-form-row">
                            <div>
                              <label className="rev-form-label">Target Halaman:</label>
                              <select
                                className="rev-form-select"
                                value={docModal.newCommentPage}
                                onChange={e => {
                                  const p = parseInt(e.target.value) || 1
                                  handleJumpToPage(p)
                                }}
                              >
                                <option value="1">Hal 1 (Cover & Judul)</option>
                                <option value="2">Hal 2 (Pengesahan)</option>
                                <option value="3">Hal 3 (Abstrak)</option>
                                <option value="4">Hal 4 (Bab 1 Pendahuluan)</option>
                                <option value="5">Hal 5 (Bab 2-3 Metode)</option>
                                <option value="6">Hal 6 (Bab 4 RAB)</option>
                              </select>
                            </div>

                            <div>
                              <label className="rev-form-label">Tipe Masukan:</label>
                              <select
                                className="rev-form-select"
                                value={docModal.newCommentCategory}
                                onChange={e => setDocModal(prev => ({ ...prev, newCommentCategory: e.target.value }))}
                              >
                                <option value="critical">Perbaikan Wajib</option>
                                <option value="suggestion">Saran Masukan</option>
                                <option value="positive">Poin Positif</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <textarea
                              className="rev-form-textarea"
                              rows={2}
                              placeholder={`Tuliskan catatan evaluasi untuk Hal. ${docModal.newCommentPage}...`}
                              value={docModal.newCommentText}
                              onChange={e => setDocModal(prev => ({ ...prev, newCommentText: e.target.value }))}
                              required
                            />
                          </div>

                          <button type="submit" className="rev-form-submit-btn">
                            + Kirim Catatan ke Hal. {docModal.newCommentPage}
                          </button>
                        </form>

                        {/* Daftar Kartu Catatan */}
                        <div className="rev-drawer-list">
                          {filteredAnns.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                              Belum ada catatan pada kategori ini.<br />Tuliskan evaluasi pertama Anda pada form di atas.
                            </div>
                          ) : (
                            filteredAnns.map(ann => (
                              <div key={ann.id} className={`rev-comment-card ${ann.category}`}>
                                <div className="rev-comment-top">
                                  <div className="rev-comment-left-meta">
                                    <button
                                      type="button"
                                      className="rev-page-jump-chip"
                                      onClick={() => handleJumpToPage(ann.page)}
                                      title={`Lompat ke Hal. ${ann.page} pada PDF`}
                                    >
                                      Hal. {ann.page} &rarr;
                                    </button>
                                    <span className={`rev-category-chip ${ann.category}`}>
                                      {ann.categoryLabel}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className="rev-comment-delete-btn"
                                    onClick={() => handleDeleteAnnotation(ann.id)}
                                    title="Hapus catatan ini"
                                  >
                                    &times;
                                  </button>
                                </div>

                                <p className="rev-comment-text">{ann.text}</p>

                                <div className="rev-comment-footer">
                                  <span>{ann.author}</span>
                                  <span>
                                    {new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(ann.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer Aksi Drawer */}
                        <div className="rev-drawer-footer">
                          <button
                            type="button"
                            className="btn-action secondary"
                            onClick={handleSyncAnnotationsToScoring}
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}
                            title="Salin semua catatan ini otomatis ke Form Scoring & Rekomendasi"
                          >
                            Salin Catatan ke Form Scoring &rarr;
                          </button>
                        </div>
                      </aside>
                    )}
                  </>
                )
              })()
            ) : (
              /* VIEW MODE: RINGKASAN & INTISARI BAB */
              <div className="rev-summary-view">
                <aside className="rev-summary-sidebar">
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem 0.5rem' }}>
                    Daftar Bab Naskah
                  </span>
                  {[
                    ['abstrak', 'Ringkasan & Abstrak'],
                    ['bab1', 'Bab 1 Pendahuluan'],
                    ['bab2', 'Bab 2 Tinjauan Pustaka'],
                    ['bab3', 'Bab 3 Metodologi'],
                    ['bab4', 'Bab 4 RAB & Jadwal'],
                    ['lampiran', 'Lampiran Berkas'],
                  ].map(([tabKey, tabLabel]) => (
                    <button
                      key={tabKey}
                      type="button"
                      className={`rev-summary-tab-btn ${docModal.activeTab === tabKey ? 'active' : ''}`}
                      onClick={() => setDocModal(prev => ({ ...prev, activeTab: tabKey }))}
                    >
                      <FileText size={15} />
                      <span>{tabLabel}</span>
                    </button>
                  ))}

                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      type="button"
                      className="btn-action secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
                      onClick={() => setDocModal(prev => ({ ...prev, viewMode: 'pdf' }))}
                    >
                      &larr; Beralih ke Naskah PDF
                    </button>
                  </div>
                </aside>

                <div className="rev-summary-content">
                  <div className="rev-summary-card">
                    {docModal.activeTab === 'abstrak' && (
                      <div>
                        <span className="rev-scheme-tag" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                          Intisari Eksekutif
                        </span>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>
                          Abstrak Proposal PKM
                        </h4>
                        <div style={{ background: 'rgba(2, 132, 199, 0.1)', borderLeft: '4px solid #0284c7', padding: '1.25rem', borderRadius: '0.5rem', lineHeight: 1.7, fontStyle: 'italic', color: '#e0f2fe', fontSize: '0.95rem' }}>
                          "{docModal.details?.abstract}"
                        </div>
                      </div>
                    )}

                    {docModal.activeTab === 'bab1' && (
                      <div>
                        <span className="rev-scheme-tag" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                          Bab 1
                        </span>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>
                          Pendahuluan & Urgensi Masalah
                        </h4>
                        <p style={{ lineHeight: 1.8, fontSize: '0.95rem', color: '#cbd5e1' }}>
                          {docModal.details?.chapters?.bab1}
                        </p>
                      </div>
                    )}

                    {docModal.activeTab === 'bab2' && (
                      <div>
                        <span className="rev-scheme-tag" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                          Bab 2
                        </span>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>
                          Tinjauan Pustaka & Kebaruan Ide
                        </h4>
                        <p style={{ lineHeight: 1.8, fontSize: '0.95rem', color: '#cbd5e1' }}>
                          {docModal.details?.chapters?.bab2}
                        </p>
                      </div>
                    )}

                    {docModal.activeTab === 'bab3' && (
                      <div>
                        <span className="rev-scheme-tag" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                          Bab 3
                        </span>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>
                          Tahapan Riset & Metode Pelaksanaan
                        </h4>
                        <p style={{ lineHeight: 1.8, fontSize: '0.95rem', color: '#cbd5e1' }}>
                          {docModal.details?.chapters?.bab3}
                        </p>
                      </div>
                    )}

                    {docModal.activeTab === 'bab4' && (
                      <div>
                        <span className="rev-scheme-tag" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                          Bab 4
                        </span>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>
                          Rencana Anggaran Biaya (RAB) & Jadwal Kegiatan
                        </h4>
                        <p style={{ lineHeight: 1.8, fontSize: '0.95rem', color: '#cbd5e1' }}>
                          {docModal.details?.chapters?.bab4}
                        </p>
                      </div>
                    )}

                    {docModal.activeTab === 'lampiran' && (
                      <div>
                        <span className="rev-scheme-tag" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                          Lampiran
                        </span>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>
                          Kelengkapan Dokumen & Surat Pernyataan
                        </h4>
                        <p style={{ lineHeight: 1.8, fontSize: '0.95rem', color: '#cbd5e1' }}>
                          {docModal.details?.chapters?.lampiran}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
