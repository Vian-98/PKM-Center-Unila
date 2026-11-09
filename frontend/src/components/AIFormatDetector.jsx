import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Sparkles,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Printer,
  Upload,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Split,
  Eye,
  Copy,
} from 'lucide-react'
import {
  samplePujaPkmReReport,
  samplePadiVisionReport,
  sampleFinSmartReport,
  generateDynamicReportForFile,
} from '../lib/aiFormatCheckerData'

/**
 * AIFormatDetector Component
 * Mendeteksi kepatuhan format naskah proposal & laporan PKM berdasarkan pedoman Belmawa.
 * Menghasilkan Ringkasan Utama, Detail Kesalahan per Halaman, dan Saran Perbaikan Kebahasaan.
 */
export function AIFormatDetector({
  initialReport,
  assignment,
  onJumpToPage,
  onApplyToScoring,
  isSplitView = false,
  onToggleSplitView,
  showTopControls = true,
}) {
  // Pilih data awal: jika ada initialReport pakai itu, jika assignment RE pakai Puja, default ke Puja PKM-RE
  const [activeReport, setActiveReport] = useState(() => {
    if (initialReport) return initialReport
    if (assignment?.schemeCode === 'PKM-KC') return samplePadiVisionReport
    if (assignment?.schemeCode === 'PKM-PM') return sampleFinSmartReport
    return samplePujaPkmReReport
  })

  // State ekspansi akordeon: default semua expanded untuk keterbacaan penuh
  const [expandedSummary, setExpandedSummary] = useState({
    'sum-1': true,
    'sum-2': true,
    'sum-3': true,
  })

  const [expandedPages, setExpandedPages] = useState({
    'no-page': true,
    'page-7': true,
    'page-8': true,
    'page-9': true,
    'page-10': true,
    'page-11': true,
    'page-12': true,
    'page-13': true,
  })

  // State simulasi pemindaian AI
  const [isScanning, setIsScanning] = useState(false)
  const [scanStepIndex, setScanStepIndex] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [toastMessage, setToastMessage] = useState('')

  const fileInputRef = useRef(null)

  const scanSteps = [
    'Menghubungkan ke AI Gateway PKM-BELMAWA Rule Engine...',
    'Memvalidasi layout dokumen, ukuran kertas A4 & batas margin (4-3-3-3 cm)...',
    'Memeriksa konsistensi spasi paragraf (1,15) dan spasi caption tabel/gambar...',
    'Memeriksa kelengkapan Daftar Isi, Daftar Tabel, Gambar, dan Lampiran...',
    'Mendeteksi kata asing & istilah ilmiah yang belum dicetak miring...',
    'Menyusun rangkuman temuan dan rekomendasi kepatuhan format...',
  ]

  // Sinkronkan data bila penugasan atau dokumen yang dipilih berubah
  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport)
    } else if (assignment?.schemeCode === 'PKM-KC') {
      setActiveReport(samplePadiVisionReport)
    } else if (assignment?.schemeCode === 'PKM-PM') {
      setActiveReport(sampleFinSmartReport)
    } else {
      setActiveReport(samplePujaPkmReReport)
    }
  }, [assignment?.id, assignment?.schemeCode, initialReport])

  // Toggle Ringkasan Utama
  const toggleSummaryItem = (id) => {
    setExpandedSummary(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Toggle Page Group
  const togglePageGroup = (key) => {
    setExpandedPages(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Expand / Collapse Semua
  const handleToggleAll = (expand = true) => {
    const newSummary = {}
    activeReport.ringkasanUtama.forEach(s => { newSummary[s.id] = expand })
    setExpandedSummary(newSummary)

    const newPages = {}
    activeReport.detailKesalahan.forEach(p => { newPages[p.pageKey || p.pageLabel] = expand })
    setExpandedPages(newPages)
  }

  // Handle Pemicu Pindai Ulang
  const handleTriggerRescan = () => {
    setIsScanning(true)
    setScanStepIndex(0)
    setScanProgress(15)

    const interval = setInterval(() => {
      setScanStepIndex(prev => {
        const next = prev + 1
        setScanProgress(Math.min(95, (next + 1) * 16))
        if (next >= scanSteps.length) {
          clearInterval(interval)
          setTimeout(() => {
            setIsScanning(false)
            showToast('Audit format naskah berhasil diperbarui oleh AI.')
          }, 400)
          return prev
        }
        return next
      })
    }, 450)
  }

  // Handle Unggah Dokumen Bebas
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setScanStepIndex(0)
    setScanProgress(20)

    setTimeout(() => {
      const generated = generateDynamicReportForFile(file, assignment?.schemeCode || 'PKM-RE')
      setActiveReport(generated)
      setIsScanning(false)
      showToast(`Berkas "${file.name}" berhasil dianalisis oleh AI.`)
    }, 1400)
  }

  // Ganti Preset Dokumen
  const handleSelectPreset = (e) => {
    const val = e.target.value
    if (val === 'puja-re') {
      setActiveReport(samplePujaPkmReReport)
      showToast('Memuat hasil pengecekan Laporan Puja PKM-RE 2026.')
    } else if (val === 'padivision-kc') {
      setActiveReport(samplePadiVisionReport)
      showToast('Memuat hasil pengecekan Proposal PadiVision PKM-KC.')
    } else if (val === 'finsmart-pm') {
      setActiveReport(sampleFinSmartReport)
      showToast('Memuat hasil pengecekan Proposal FinSmart PKM-PM.')
    }
  }

  // Notifikasi Toast Ringan
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Salin seluruh ringkasan temuan ke clipboard (format teks/markdown)
  const handleCopySummary = async () => {
    const textLines = [
      `HASIL PENGECEKAN FORMAT AI - ${activeReport.documentName}`,
      `Skema: ${activeReport.schemeCode} · ${activeReport.documentType}`,
      `Status Kepatuhan: ${activeReport.statusLabel} (Skor: ${activeReport.complianceScore}/100)`,
      '',
      '=== RINGKASAN UTAMA ===',
      ...activeReport.ringkasanUtama.map((s, i) => `${i + 1}. ${s.title} (${s.detailCount} detail)`),
      '',
      '=== SARAN PERBAIKAN KEBAHASAAN ===',
      ...activeReport.saranPerbaikan.map(s => `- ${s}`),
    ].join('\n')

    try {
      await navigator.clipboard.writeText(textLines)
      showToast('Rangkuman temuan format berhasil disalin ke clipboard.')
    } catch {
      showToast('Gagal menyalin teks ke clipboard.')
    }
  }

  // Format Kata Asing dengan Tag Monospace Miring
  const renderFormattedSaran = (text) => {
    // Cari bagian di dalam tanda petik tunggal '...'
    const parts = text.split(/('[\w\s,.-]+')/g)
    return parts.map((part, idx) => {
      if (part.startsWith("'") && part.endsWith("'")) {
        const word = part.slice(1, -1)
        return (
          <span key={idx} className="ai-foreign-word" title="Istilah asing wajib ditulis miring (italic)">
            '{word}'
          </span>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  return (
    <div className="ai-format-report-root">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          background: '#0b2149',
          color: '#ffffff',
          padding: '0.65rem 1.15rem',
          borderRadius: '0.5rem',
          fontSize: '0.825rem',
          fontWeight: 700,
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <CheckCircle2 size={16} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Topbar untuk Reviewer Workspace */}
      {showTopControls && (
        <header className="ai-report-control-bar">
          <div className="ai-control-left">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0b2149', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={15} color="#0284c7" />
              <span>Modul AI Format Detector</span>
            </span>

            <select
              className="ai-select-doc-dropdown"
              value={
                activeReport.documentName.includes('Puja')
                  ? 'puja-re'
                  : activeReport.documentName.includes('PadiVision')
                  ? 'padivision-kc'
                  : activeReport.documentName.includes('FinSmart')
                  ? 'finsmart-pm'
                  : 'custom'
              }
              onChange={handleSelectPreset}
              title="Ganti Dokumen atau Kasus Uji"
            >
              <option value="puja-re">Laporan_Puja_Revisi_Final_PKM-RE_2026.docx</option>
              <option value="padivision-kc">Proposal_PadiVision_Final_PKM-KC_2026.pdf</option>
              <option value="finsmart-pm">Proposal_FinSmart_Pesisir_PKM-PM_2026.pdf</option>
            </select>

            <button
              type="button"
              className="ai-action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Unggah berkas Word (.docx) atau PDF mandiri untuk diaudit oleh AI"
            >
              <Upload size={14} />
              <span>Unggah Berkas Baru</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx,.doc,.pdf"
              style={{ display: 'none' }}
            />
          </div>

          <div className="ai-control-right">
            {onToggleSplitView && (
              <button
                type="button"
                className={`ai-action-btn ${isSplitView ? 'primary' : ''}`}
                onClick={onToggleSplitView}
                title="Buka tampilan berdampingan dengan Naskah PDF"
              >
                <Split size={14} />
                <span>{isSplitView ? 'Tampilan Penuh' : 'Berdampingan PDF'}</span>
              </button>
            )}

            <button
              type="button"
              className="ai-action-btn"
              onClick={handleTriggerRescan}
              disabled={isScanning}
              title="Jalankan ulang pemindaian AI terhadap naskah"
            >
              <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
              <span>{isScanning ? 'Memindai...' : 'Pindai Ulang AI'}</span>
            </button>

            {onApplyToScoring && (
              <button
                type="button"
                className="ai-action-btn scoring-btn"
                onClick={() => onApplyToScoring(activeReport)}
                title="Salin temuan format AI ini otomatis ke Form Penilaian & Kelemahan Proposal"
              >
                <CheckCircle2 size={14} />
                <span>Terapkan ke Form Scoring</span>
              </button>
            )}

            <button
              type="button"
              className="ai-action-btn"
              onClick={handleCopySummary}
              title="Salin seluruh ringkasan temuan format ke clipboard"
            >
              <Copy size={14} />
              <span className="hide-on-mobile">Salin Teks</span>
            </button>

            <button
              type="button"
              className="ai-action-btn"
              onClick={() => window.print()}
              title="Cetak atau simpan laporan hasil audit format ke PDF"
            >
              <Printer size={14} />
              <span className="hide-on-mobile">Cetak</span>
            </button>
          </div>
        </header>
      )}

      {/* Konten Laporan Hasil Pengecekan */}
      <main className="ai-format-report-container">
        {/* Header Dokumen yang Diaudit */}
        <div className="ai-report-header">
          <div className="ai-report-eyebrow">
            <span>H A S I L &nbsp; P E N G E C E K A N</span>
          </div>
          <h2 className="ai-report-title">
            {activeReport.documentName}
          </h2>
          <div className="ai-report-subtitle">
            <span>{activeReport.schemeCode} &middot; {activeReport.documentType}</span>
            <span>&bull;</span>
            <span>{activeReport.teamName || 'Tim PKM Unila'}</span>
            <span>&bull;</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>AI Audit Belmawa 2026</span>
          </div>
        </div>

        {/* Ringkasan Metrik / Status Kepatuhan */}
        <div className="ai-metrics-banner">
          <div className="ai-metric-item">
            <span className="ai-metric-label">Status Kepatuhan</span>
            <span className={`ai-metric-val ${activeReport.complianceScore < 80 ? 'score-warning' : 'score-good'}`}>
              {activeReport.statusLabel}
            </span>
          </div>

          <div className="ai-metric-item">
            <span className="ai-metric-label">Skor Format Belmawa</span>
            <span className="ai-metric-val">
              {activeReport.complianceScore} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span>
            </span>
          </div>

          <div className="ai-metric-item">
            <span className="ai-metric-label">Total Kesalahan Format</span>
            <span className="ai-metric-val score-warning">
              {activeReport.summaryStats?.totalErrors || 11} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Titik</span>
            </span>
          </div>

          <div className="ai-metric-item">
            <span className="ai-metric-label">Saran Kebahasaan</span>
            <span className="ai-metric-val" style={{ color: '#d97706' }}>
              {activeReport.saranPerbaikan?.length || 7} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Kata Asing</span>
            </span>
          </div>

          <div className="ai-metric-item" style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
            <span className="ai-metric-label">Kriteria Rubrik Terdampak</span>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0b2149' }}>
              Kriteria 1: Format & Administrasi
            </span>
            <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
              Saran potongan: -{activeReport.suggestedScoreDeduction || 15} poin
            </span>
          </div>
        </div>

        {/* 1. RINGKASAN UTAMA */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 className="ai-section-heading" style={{ margin: 0 }}>
              <Layers size={17} className="ai-section-heading-icon" />
              <span>RINGKASAN UTAMA</span>
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="ai-action-btn"
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                onClick={() => handleToggleAll(true)}
              >
                Buka Semua
              </button>
              <button
                type="button"
                className="ai-action-btn"
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                onClick={() => handleToggleAll(false)}
              >
                Tutup Semua
              </button>
            </div>
          </div>

          <div className="ai-summary-list">
            {activeReport.ringkasanUtama.map((sumItem, idx) => {
              const isExpanded = !!expandedSummary[sumItem.id]
              return (
                <div key={sumItem.id} className="ai-summary-card">
                  {/* Header Item Ringkasan Utama */}
                  <div
                    className="ai-summary-header"
                    onClick={() => toggleSummaryItem(sumItem.id)}
                  >
                    <div className="ai-summary-header-left">
                      <span style={{ color: '#0b2149', fontWeight: 800 }}>{idx + 1}.</span>
                      <span>{sumItem.title}</span>
                    </div>

                    <div className="ai-summary-header-right">
                      <span className="ai-badge-detail-count">
                        {sumItem.detailCount} detail
                      </span>
                      <div className={`ai-chevron-toggle ${isExpanded ? 'expanded' : ''}`}>
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Daftar Rincian Kesalahan di Bawahnya */}
                  {isExpanded && (
                    <div className="ai-summary-sublist">
                      {sumItem.items.map(subItem => (
                        <div key={subItem.id || subItem.text} className="ai-summary-subitem">
                          <div className="ai-subitem-left">
                            <XCircle className="ai-x-circle-icon" />
                            {subItem.page && (
                              <button
                                type="button"
                                className="ai-page-badge"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (subItem.pageNum && onJumpToPage) {
                                    onJumpToPage(subItem.pageNum)
                                  }
                                }}
                                title={subItem.pageNum ? `Lompat ke ${subItem.page} pada PDF` : ''}
                              >
                                {subItem.page}
                              </button>
                            )}
                            <div style={{ flex: 1 }}>
                              <span>{subItem.text}</span>
                            </div>
                          </div>

                          <div className="ai-subitem-right">
                            <span className={`ai-tag-pill ${subItem.tag === 'Format Penulisan' ? 'format-penulisan' : 'struktur-dokumen'}`}>
                              {subItem.tag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 2. DETAIL KESALAHAN */}
        <section>
          <h3 className="ai-section-heading">
            <FileText size={17} className="ai-section-heading-icon" />
            <span>DETAIL KESALAHAN</span>
          </h3>

          <div className="ai-detail-group-list">
            {activeReport.detailKesalahan.map((pageGroup) => {
              const groupKey = pageGroup.pageKey || pageGroup.pageLabel
              const isExpanded = expandedPages[groupKey] !== false
              return (
                <div key={groupKey} className="ai-page-group-card">
                  {/* Header Halaman */}
                  <div
                    className="ai-page-group-header"
                    onClick={() => togglePageGroup(groupKey)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span>{pageGroup.pageLabel}</span>
                      {pageGroup.pageNum && onJumpToPage && (
                        <button
                          type="button"
                          className="ai-page-badge"
                          style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onJumpToPage(pageGroup.pageNum)
                          }}
                          title={`Buka Halaman ${pageGroup.pageNum} di Penampil PDF`}
                        >
                          Lihat Hal. {pageGroup.pageNum} &rarr;
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="ai-badge-detail-count" style={{ color: '#475569', background: '#e2e8f0', borderColor: '#cbd5e1' }}>
                        {pageGroup.findingsCount} temuan
                      </span>
                      <div className={`ai-chevron-toggle ${isExpanded ? 'expanded' : ''}`}>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Temuan per Halaman */}
                  {isExpanded && (
                    <div className="ai-page-group-findings">
                      {pageGroup.findings.map(finding => (
                        <div key={finding.id || finding.text} className="ai-finding-row">
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flex: 1 }}>
                            <XCircle className="ai-x-circle-icon" />
                            <span>{finding.text}</span>
                          </div>

                          <div style={{ flexShrink: 0 }}>
                            <span className={`ai-tag-pill ${finding.tag === 'Format Penulisan' ? 'format-penulisan' : 'struktur-dokumen'}`}>
                              {finding.tag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 3. SARAN PERBAIKAN */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 className="ai-section-heading" style={{ margin: 0 }}>
              <AlertTriangle size={17} style={{ color: '#d97706' }} />
              <span>SARAN PERBAIKAN</span>
            </h3>

            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Deteksi Istilah Asing & Kerapihan Tipografi
            </span>
          </div>

          <div className="ai-saran-list">
            {activeReport.saranPerbaikan.map((saran, i) => (
              <div key={i} className="ai-saran-card">
                <AlertTriangle className="ai-saran-warn-icon" />
                <div style={{ flex: 1 }}>
                  {renderFormattedSaran(saran)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Banner Aksi Final Reviewer */}
        {onApplyToScoring && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#166534', fontSize: '0.95rem', fontWeight: 800 }}>
                Sinkronkan Rekomendasi Format AI ke Lembar Penilaian
              </h4>
              <p style={{ margin: 0, color: '#15803d', fontSize: '0.825rem', lineHeight: 1.5 }}>
                AI akan otomatis menyalin daftar kelemahan format di atas ke kolom catatan reviewer dan mengusulkan nilai format & administrasi.
              </p>
            </div>
            <button
              type="button"
              className="ai-action-btn scoring-btn"
              onClick={() => onApplyToScoring(activeReport)}
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.15rem' }}
            >
              <span>Salin Semua Temuan ke Form Scoring &rarr;</span>
            </button>
          </div>
        )}
      </main>

      {/* Modal Scanning AI saat proses berjalan */}
      {isScanning && (
        <div className="ai-scanning-overlay">
          <div className="ai-scanning-card">
            <div className="ai-scan-radar">
              <Sparkles size={32} />
            </div>

            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0b2149' }}>
              AI Document Format Audit
            </h3>

            <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
              Memeriksa kepatuhan naskah terhadap Pedoman Belmawa 2026...
            </p>

            <div className="ai-scan-progress-bar">
              <div
                className="ai-scan-progress-fill"
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            <div className="ai-scan-step-text">
              {scanSteps[scanStepIndex] || 'Memproses berkas...'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

