import { useState, useEffect, useMemo } from 'react'
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

export function ReviewerDashboard({ user }) {
  // Persistent State agar tidak statis
  const [overview, setOverview] = useState(() => loadStore('pkm_reviewer_overview', initialReviewerOverview))
  const [assignments, setAssignments] = useState(() => loadStore('pkm_reviewer_assignments', initialReviewAssignments))
  const [annotations, setAnnotations] = useState(() => loadStore('pkm_pdf_annotations', initialPdfAnnotations))
  
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')

  // State Pratinjau Naskah Dokumen Proposal & Anotasi Langsung
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
    setDocModal(prev => ({ ...prev, isOpen: false }))

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

                <h3 className="proposal-card-title">{item.proposalTitle}</h3>

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
                    onClick={() => {
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
                      })
                    }}
                  >
                    Buka Dokumen PDF Proposal
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

      {/* MODAL PRATINJAU NASKAH PROPOSAL RESMI (PDF VIEWER) */}
      {docModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDocModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog modal-dialog-pdf" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div>
                <span className="tag-scheme" style={{ marginBottom: '0.25rem' }}>
                  {docModal.details?.scheme}
                </span>
                <h3 style={{ marginTop: '0.25rem' }}>
                  Pratinjau Dokumen Naskah Proposal PKM (PDF)
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDocModal(prev => ({ ...prev, isOpen: false }))} title="Tutup">
                x
              </button>
            </div>

            <div className="modal-dialog-body">
              {/* Header Info & Toolbar Berkas Dokumen */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '0.65rem', marginBottom: '1rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #0b2149', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ minWidth: '240px', flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.35rem 0', color: '#0b2149', fontSize: '1.05rem', lineHeight: 1.35 }}>
                    {docModal.details?.title}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '0.35rem' }}>
                    <span>Ketua: <strong>{docModal.details?.leader}</strong></span>
                    <span>Fakultas: <strong>{docModal.details?.faculty}</strong></span>
                    <span>Tim: <strong>{docModal.details?.team}</strong></span>
                    <span>Berkas: <strong>{docModal.details?.fileName || docModal.details?.version}</strong> ({docModal.details?.fileSize || 'Standar Belmawa'})</span>
                    <span>Diserahkan: <strong>{docModal.details?.submittedDate}</strong></span>
                  </div>
                </div>

                {/* Toolbar Tombol Aksi Dokumen */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <a
                    href={docModal.details?.pdfUrl || '/docs/proposal-padivision-pkm-kc.pdf'}
                    download={docModal.details?.fileName || 'naskah-proposal-pkm.pdf'}
                    className="btn-action secondary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
                    title="Unduh berkas PDF lengkap ke perangkat"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Unduh PDF</span>
                  </a>

                  <a
                    href={docModal.details?.pdfUrl || '/docs/proposal-padivision-pkm-kc.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action secondary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
                    title="Buka dokumen di tab browser terpisah"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    <span>Buka Tab Baru</span>
                  </a>
                </div>
              </div>

              {/* Mode Tampilan Tab */}
              <div className="modern-tabs" style={{ marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className={`tab-btn ${docModal.viewMode === 'pdf' ? 'active' : ''}`}
                  onClick={() => setDocModal(prev => ({ ...prev, viewMode: 'pdf' }))}
                  style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
                >
                  Dokumen Proposal PDF (Viewer Resmi)
                </button>
                <button
                  type="button"
                  className={`tab-btn ${docModal.viewMode === 'summary' ? 'active' : ''}`}
                  onClick={() => setDocModal(prev => ({ ...prev, viewMode: 'summary' }))}
                  style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
                >
                  Ringkasan & Intisari Bab Naskah
                </button>
              </div>

              {/* KONTEN UTAMA: WORKSPACE DOKUMEN PDF & ANOTASI LANGSUNG */}
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
                    <div className="pdf-workspace-grid">
                      {/* SISI KIRI: PENAMPIL DOKUMEN PDF DENGAN NAVIGASI CEPAT */}
                      <div className="pdf-viewer-pane">
                        {/* Bar Pintasan Halaman PDF */}
                        <div className="pdf-page-jumper-bar">
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginRight: '0.25rem' }}>
                            Pindah Halaman:
                          </span>
                          {pageShortcuts.map(p => (
                            <button
                              key={p.num}
                              type="button"
                              className={`pdf-page-btn ${docModal.activePage === p.num ? 'active' : ''}`}
                              onClick={() => handleJumpToPage(p.num)}
                              title={`Lompat ke ${p.label} pada PDF`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Frame Viewer Dokumen PDF */}
                        <div className="pdf-iframe-wrap">
                          <iframe
                            key={`${docModal.details?.pdfUrl}-p${docModal.activePage}`}
                            src={`${docModal.details?.pdfUrl || '/docs/proposal-padivision-pkm-kc.pdf'}#page=${docModal.activePage}&toolbar=1&navpanes=0`}
                            title={`Pratinjau PDF - ${docModal.details?.title}`}
                          />
                        </div>

                        {/* Status Navigasi & Info Berkas */}
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span>Fokus Halaman Aktif: <strong>Halaman {docModal.activePage}</strong> &bull; Standar Belmawa 2026</span>
                          <button
                            type="button"
                            className="btn-action secondary"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => setDocModal(prev => ({ ...prev, newCommentPage: prev.activePage }))}
                          >
                            + Beri Catatan di Halaman {docModal.activePage}
                          </button>
                        </div>
                      </div>

                      {/* SISI KANAN: PANEL ANOTASI & KOMENTAR LANGSUNG */}
                      <div className="pdf-comments-pane">
                        {/* Header Panel Komentar */}
                        <div className="pdf-comments-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0b2149' }}>
                              Catatan & Komentar Naskah
                            </span>
                            <span className="tag-scheme" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#dbeafe', color: '#1d4ed8' }}>
                              {propAnnotations.length} Catatan
                            </span>
                          </div>

                          {/* Filter Kategori Catatan */}
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            {[
                              ['all', 'Semua'],
                              ['critical', 'Wajib'],
                              ['suggestion', 'Saran'],
                              ['positive', 'Positif'],
                            ].map(([catKey, catLabel]) => (
                              <button
                                key={catKey}
                                type="button"
                                style={{
                                  border: '1px solid #cbd5e1',
                                  background: docModal.filterCategory === catKey ? '#0b2149' : '#ffffff',
                                  color: docModal.filterCategory === catKey ? '#ffffff' : '#475569',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: '0.3rem',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setDocModal(prev => ({ ...prev, filterCategory: catKey }))}
                              >
                                {catLabel}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Formulir Tambah Komentar Langsung */}
                        <form onSubmit={handleAddAnnotation} className="pdf-comments-form">
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                                Target Halaman / Bab:
                              </label>
                              <select
                                value={docModal.newCommentPage}
                                onChange={e => {
                                  const p = parseInt(e.target.value) || 1
                                  handleJumpToPage(p)
                                }}
                                style={{ width: '100%', padding: '0.35rem 0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.78rem', background: '#ffffff', color: '#0f172a' }}
                              >
                                <option value="1">Halaman 1 (Cover & Judul)</option>
                                <option value="2">Halaman 2 (Lembar Pengesahan)</option>
                                <option value="3">Halaman 3 (Ringkasan / Abstrak)</option>
                                <option value="4">Halaman 4 (Bab 1 Pendahuluan)</option>
                                <option value="5">Halaman 5 (Bab 2 & 3 Metodologi)</option>
                                <option value="6">Halaman 6 (Bab 4 RAB & Jadwal)</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                                Tipe Masukan:
                              </label>
                              <select
                                value={docModal.newCommentCategory}
                                onChange={e => setDocModal(prev => ({ ...prev, newCommentCategory: e.target.value }))}
                                style={{ width: '100%', padding: '0.35rem 0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.78rem', background: '#ffffff', color: '#0f172a' }}
                              >
                                <option value="critical">Perbaikan Wajib</option>
                                <option value="suggestion">Saran Masukan</option>
                                <option value="positive">Poin Positif</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ marginBottom: '0.5rem' }}>
                            <textarea
                              rows={2}
                              placeholder={`Tuliskan catatan revisi langsung untuk Halaman ${docModal.newCommentPage}...`}
                              value={docModal.newCommentText}
                              onChange={e => setDocModal(prev => ({ ...prev, newCommentText: e.target.value }))}
                              style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.35rem', fontSize: '0.8rem', resize: 'vertical', boxSizing: 'border-box' }}
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="btn-action primary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          >
                            + Kirim Catatan ke Halaman {docModal.newCommentPage}
                          </button>
                        </form>

                        {/* Daftar Kartu Komentar yang Sudah Ada */}
                        <div className="pdf-comments-list">
                          {filteredAnns.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                              Belum ada catatan pada kategori ini.<br />Tuliskan catatan evaluasi pertama di formulir atas.
                            </div>
                          ) : (
                            filteredAnns.map(ann => (
                              <div key={ann.id} className={`pdf-comment-card ${ann.category}`}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="pdf-comment-page-badge"
                                    onClick={() => handleJumpToPage(ann.page)}
                                    title={`Klik untuk lompat ke Halaman ${ann.page} pada PDF`}
                                  >
                                    Hal. {ann.page} &rarr;
                                  </button>
                                  <span className={`pdf-comment-category-pill ${ann.category}`}>
                                    {ann.categoryLabel}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                    {ann.section}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAnnotation(ann.id)}
                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
                                    title="Hapus catatan ini"
                                  >
                                    &times;
                                  </button>
                                </div>

                                <p style={{ margin: '0.45rem 0', fontSize: '0.825rem', lineHeight: 1.45, color: '#1e293b' }}>
                                  {ann.text}
                                </p>

                                <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                                  <span>{ann.author}</span>
                                  <span>{new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(ann.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer Aksi Sidebar Komentar */}
                        <div className="pdf-comments-footer-bar">
                          <button
                            type="button"
                            className="btn-action secondary"
                            onClick={handleSyncAnnotationsToScoring}
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem' }}
                            title="Salin semua catatan ini otomatis ke Form Scoring & Rekomendasi"
                          >
                            Salin Semua Catatan ke Form Scoring &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div>
                  {/* Sub-Navigasi Bab Naskah jika mode ringkasan dipilih */}
                  <div className="modern-tabs" style={{ marginBottom: '0.75rem' }}>
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
                        className={`tab-btn ${docModal.activeTab === tabKey ? 'active' : ''}`}
                        onClick={() => setDocModal(prev => ({ ...prev, activeTab: tabKey }))}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      >
                        {tabLabel}
                      </button>
                    ))}
                  </div>

                  {/* Konten Bab yang Dipilih */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.65rem', padding: '1.25rem', minHeight: '200px', lineHeight: 1.6, color: '#1e293b', fontSize: '0.9rem' }}>
                    {docModal.activeTab === 'abstrak' && (
                      <div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#0b2149', fontSize: '0.95rem', fontWeight: 800 }}>Abstrak Eksekutif Proposal:</h5>
                        <p style={{ margin: 0, fontStyle: 'italic', color: '#334155' }}>"{docModal.details?.abstract}"</p>
                      </div>
                    )}
                    {docModal.activeTab === 'bab1' && (
                      <div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#0b2149', fontSize: '0.95rem', fontWeight: 800 }}>Bab 1. Pendahuluan & Latar Belakang:</h5>
                        <p style={{ margin: 0 }}>{docModal.details?.chapters?.bab1}</p>
                      </div>
                    )}
                    {docModal.activeTab === 'bab2' && (
                      <div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#0b2149', fontSize: '0.95rem', fontWeight: 800 }}>Bab 2. Tinjauan Pustaka & Kebaruan Ide:</h5>
                        <p style={{ margin: 0 }}>{docModal.details?.chapters?.bab2}</p>
                      </div>
                    )}
                    {docModal.activeTab === 'bab3' && (
                      <div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#0b2149', fontSize: '0.95rem', fontWeight: 800 }}>Bab 3. Tahap Pelaksanaan & Metode Ilmiah:</h5>
                        <p style={{ margin: 0 }}>{docModal.details?.chapters?.bab3}</p>
                      </div>
                    )}
                    {docModal.activeTab === 'bab4' && (
                      <div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#0b2149', fontSize: '0.95rem', fontWeight: 800 }}>Bab 4. Rencana Anggaran Biaya (RAB) & Jadwal:</h5>
                        <p style={{ margin: 0 }}>{docModal.details?.chapters?.bab4}</p>
                      </div>
                    )}
                    {docModal.activeTab === 'lampiran' && (
                      <div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#0b2149', fontSize: '0.95rem', fontWeight: 800 }}>Kelengkapan Berkas & Surat Pernyataan:</h5>
                        <p style={{ margin: 0 }}>{docModal.details?.chapters?.lampiran}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-dialog-footer">
              <button
                type="button"
                className="btn-action secondary"
                onClick={() => setDocModal(prev => ({ ...prev, isOpen: false }))}
              >
                Tutup Pratinjau
              </button>
              <button
                type="button"
                className="btn-action primary"
                onClick={handleSyncAnnotationsToScoring}
              >
                Sinkronkan Catatan & Lanjut ke Form Scoring &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
