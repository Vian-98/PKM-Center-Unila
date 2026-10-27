import React, { useState } from 'react'
import {
  Printer,
  Download,
  Edit3,
  Eye,
  X,
  Check,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  School
} from 'lucide-react'

// Fungsi pembuat dokumen cetak HTML untuk Save as PDF Landscape
export function printCanvasToPdf(canvasData) {
  const printWindow = window.open('', '_blank', 'width=1150,height=800')
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk mengunduh / mencetak PDF.')
    return
  }

  const membersHtml = (canvasData.members || [])
    .filter(Boolean)
    .map(m => `<div><span class="check-mark">&#10003;</span> ${escapeHtml(m)}</div>`)
    .join('')

  const renderPoints = (points) => {
    if (!points || !points.length) return '<div class="empty-hint">- Belum ada poin -</div>'
    return points
      .filter(Boolean)
      .map(p => `<div class="canvas-item"><span class="check-mark">&#10003;</span> <span>${escapeHtml(p)}</span></div>`)
      .join('')
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>PKM Strategy Canvas - ${escapeHtml(canvasData.title || 'Proposal PKM')}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 6mm 8mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .psc-wrapper {
      position: relative;
      width: 100%;
      max-width: 275mm;
      margin: 0 auto;
    }
    /* Header */
    .psc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3.5mm;
      position: relative;
    }
    .psc-logo-brand {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .psc-grid-icon {
      width: 32px;
      height: 32px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: 2.5px;
      padding: 2px;
      background: transparent;
    }
    .psc-grid-cell {
      background: #0284c7;
      border-radius: 1.5px;
    }
    .psc-logo-text {
      line-height: 1.1;
    }
    .psc-logo-text strong {
      font-size: 15pt;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: -0.5px;
      display: block;
    }
    .psc-logo-text span {
      font-size: 6pt;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: block;
    }
    .psc-title-group {
      text-align: center;
      flex: 1;
      margin-right: 50px;
    }
    .psc-main-title {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .psc-sub-title {
      font-size: 8.5pt;
      font-style: italic;
      color: #334155;
      margin-top: 1px;
    }
    /* Meta Table */
    .psc-meta-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #1e293b;
      font-size: 7.8pt;
      margin-bottom: 0;
    }
    .psc-meta-table td {
      border: 1px solid #1e293b;
      padding: 4px 6px;
      vertical-align: top;
    }
    .psc-meta-col-left {
      width: 48%;
    }
    .psc-meta-col-right {
      width: 52%;
    }
    .meta-row {
      display: flex;
      margin-bottom: 2px;
    }
    .meta-label {
      width: 90px;
      font-weight: 700;
      color: #0f172a;
      flex-shrink: 0;
    }
    .meta-colon {
      width: 10px;
      flex-shrink: 0;
    }
    .meta-value {
      flex: 1;
    }
    .check-mark {
      font-weight: 900;
      color: #0284c7;
      margin-right: 3px;
    }
    /* Main 8-Box Canvas Grid */
    .psc-canvas-container {
      position: relative;
      width: 100%;
    }
    .psc-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 280px;
      height: 280px;
      opacity: 0.055;
      pointer-events: none;
      z-index: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: 16px;
      padding: 16px;
    }
    .psc-watermark-cell {
      background: #0284c7;
      border-radius: 8px;
    }
    .psc-grid-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #1e293b;
      position: relative;
      z-index: 1;
      table-layout: fixed;
    }
    .psc-grid-table th {
      border: 1px solid #1e293b;
      padding: 3px 5px;
      font-size: 8pt;
      font-weight: 800;
      text-align: center;
      background: #f8fafc;
      color: #0f172a;
    }
    .psc-grid-table td {
      border: 1px solid #1e293b;
      padding: 5px 6px;
      vertical-align: top;
      height: 60mm;
      font-size: 7.2pt;
      line-height: 1.25;
      width: 25%;
      background: rgba(255, 255, 255, 0.94);
    }
    .canvas-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 4px;
      text-align: justify;
    }
    .canvas-item span {
      flex: 1;
    }
    .empty-hint {
      color: #94a3b8;
      font-style: italic;
    }
    .print-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 3mm;
      font-size: 6.5pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="psc-wrapper">
    <!-- Header -->
    <div class="psc-header">
      <div class="psc-logo-brand">
        <div class="psc-grid-icon">
          <div class="psc-grid-cell"></div><div class="psc-grid-cell"></div><div class="psc-grid-cell"></div>
          <div class="psc-grid-cell"></div><div class="psc-grid-cell"></div><div class="psc-grid-cell"></div>
          <div class="psc-grid-cell"></div><div class="psc-grid-cell"></div><div class="psc-grid-cell"></div>
        </div>
        <div class="psc-logo-text">
          <strong>PSC</strong>
          <span>PKM STRATEGY CANVAS</span>
        </div>
      </div>
      <div class="psc-title-group">
        <h1 class="psc-main-title">PKM STRATEGY CANVAS (PSC)</h1>
        <p class="psc-sub-title">Framework untuk menyusun ide PKM hingga siap lolos PIMNAS</p>
      </div>
    </div>

    <!-- Meta Information Table -->
    <table class="psc-meta-table">
      <tr>
        <td class="psc-meta-col-left">
          <div class="meta-row">
            <span class="meta-label">Nama Ketua</span>
            <span class="meta-colon">:</span>
            <span class="meta-value"><strong>${escapeHtml(canvasData.leader || '-')}</strong></span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Nama Anggota</span>
            <span class="meta-colon">:</span>
            <span class="meta-value">${membersHtml || '<em>- Belum ditentukan -</em>'}</span>
          </div>
        </td>
        <td class="psc-meta-col-right">
          <div class="meta-row">
            <span class="meta-label">Perguruan Tinggi</span>
            <span class="meta-colon">:</span>
            <span class="meta-value">${escapeHtml(canvasData.university || 'Universitas Lampung')}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Judul ${escapeHtml(canvasData.scheme ? canvasData.scheme.toUpperCase() : 'PKM')}</span>
            <span class="meta-colon">:</span>
            <span class="meta-value" style="font-style: italic; font-weight: 600;">
              ${escapeHtml(canvasData.title || 'Inovasi Belum Berjudul')}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- 8-Box Canvas Grid Table -->
    <div class="psc-canvas-container">
      <div class="psc-watermark">
        <div class="psc-watermark-cell"></div><div class="psc-watermark-cell"></div><div class="psc-watermark-cell"></div>
        <div class="psc-watermark-cell"></div><div class="psc-watermark-cell"></div><div class="psc-watermark-cell"></div>
        <div class="psc-watermark-cell"></div><div class="psc-watermark-cell"></div><div class="psc-watermark-cell"></div>
      </div>

      <table class="psc-grid-table">
        <!-- Row 1: Masalah, Tujuan, Gagasan, Metode -->
        <thead>
          <tr>
            <th>Masalah <em>(Problem)</em></th>
            <th>Tujuan <em>(Purpose)</em></th>
            <th>Gagasan <em>(Idea)</em></th>
            <th>Metode <em>(Method)</em></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${renderPoints(canvasData.problem)}</td>
            <td>${renderPoints(canvasData.purpose)}</td>
            <td>${renderPoints(canvasData.idea)}</td>
            <td>${renderPoints(canvasData.method)}</td>
          </tr>
        </tbody>

        <!-- Row 2: Keunikan, Kegiatan Utama, Kebaharuan, Luaran -->
        <thead>
          <tr>
            <th>Keunikan <em>(Unique Value)</em></th>
            <th>Kegiatan Utama <em>(Key Activities)</em></th>
            <th>Kebaharuan <em>(Novelty)</em></th>
            <th>Luaran <em>(Output)</em></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${renderPoints(canvasData.uniqueValue)}</td>
            <td>${renderPoints(canvasData.keyActivities)}</td>
            <td>${renderPoints(canvasData.novelty)}</td>
            <td>${renderPoints(canvasData.output)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="print-footer">
      <span>PKM Center Universitas Lampung • Dihasilkan otomatis melalui asisten AI PKMATE</span>
      <span>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>
  </div>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 400)
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function PKMStrategyCanvasModal({
  isOpen,
  onClose,
  canvasData,
  onUpdateCanvas,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(canvasData)

  // Sinkronisasi otomatis saat data canvas baru diterima dari AI
  React.useEffect(() => {
    if (canvasData) {
      setFormData(canvasData)
    }
  }, [canvasData])

  if (!isOpen) return null

  const handleSaveForm = (e) => {
    e.preventDefault()
    if (onUpdateCanvas) onUpdateCanvas(formData)
    setIsEditing(false)
  }

  const handleArrayChange = (field, index, value) => {
    const nextArr = [...(formData[field] || [])]
    nextArr[index] = value
    setFormData({ ...formData, [field]: nextArr })
  }

  const handleAddArrayItem = (field) => {
    const nextArr = [...(formData[field] || []), '']
    setFormData({ ...formData, [field]: nextArr })
  }

  const handleRemoveArrayItem = (field, index) => {
    const nextArr = (formData[field] || []).filter((_, i) => i !== index)
    setFormData({ ...formData, [field]: nextArr })
  }

  const handleMemberChange = (index, value) => {
    const next = [...(formData.members || [])]
    next[index] = value
    setFormData({ ...formData, members: next })
  }

  const handleAddMember = () => {
    setFormData({ ...formData, members: [...(formData.members || []), ''] })
  }

  const handleRemoveMember = (index) => {
    setFormData({ ...formData, members: (formData.members || []).filter((_, i) => i !== index) })
  }

  const sections = [
    { key: 'problem', label: 'Masalah (Problem)' },
    { key: 'purpose', label: 'Tujuan (Purpose)' },
    { key: 'idea', label: 'Gagasan (Idea)' },
    { key: 'method', label: 'Metode (Method)' },
    { key: 'uniqueValue', label: 'Keunikan (Unique Value)' },
    { key: 'keyActivities', label: 'Kegiatan Utama (Key Activities)' },
    { key: 'novelty', label: 'Kebaharuan (Novelty)' },
    { key: 'output', label: 'Luaran (Output)' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                PKM Strategy Canvas (PSC)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>
                Framework 8 Pilar Perancangan Proposal Lolos PIMNAS
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: isEditing ? '#eff6ff' : '#ffffff',
                color: isEditing ? '#1d4ed8' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
              <span>{isEditing ? 'Pratinjau Visual' : 'Sunting / Edit Konten'}</span>
            </button>

            <button
              type="button"
              onClick={() => printCanvasToPdf(formData)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.45rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={15} />
              <span>Unduh / Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {isEditing ? (
            /* Mode Formulir Edit */
            <form onSubmit={handleSaveForm}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Judul Usulan PKM:
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Smart System Drone Detector..."
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Skema PKM:
                  </label>
                  <select
                    value={formData.scheme || 'PKM-VGK'}
                    onChange={(e) => setFormData({ ...formData, scheme: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  >
                    <option value="PKM-RE">PKM-RE (Riset Eksakta)</option>
                    <option value="PKM-RSH">PKM-RSH (Riset Sosial Humaniora)</option>
                    <option value="PKM-K">PKM-K (Kewirausahaan)</option>
                    <option value="PKM-PM">PKM-PM (Pengabdian Masyarakat)</option>
                    <option value="PKM-PI">PKM-PI (Penerapan Iptek)</option>
                    <option value="PKM-KC">PKM-KC (Karsa Cipta)</option>
                    <option value="PKM-KI">PKM-KI (Karya Inovatif)</option>
                    <option value="PKM-VGK">PKM-VGK (Video Gagasan Konstruktif)</option>
                    <option value="PKM-GFT">PKM-GFT (Gagasan Futuristik Tertulis)</option>
                    <option value="PKM-AI">PKM-AI (Artikel Ilmiah)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Perguruan Tinggi:
                  </label>
                  <input
                    type="text"
                    value={formData.university || ''}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    placeholder="Universitas Lampung"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Nama Ketua Tim:
                  </label>
                  <input
                    type="text"
                    value={formData.leader || ''}
                    onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                    placeholder="Nama Lengkap Ketua"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      Anggota Tim (Maks 4 Orang):
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      style={{ fontSize: '0.7rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + Tambah Anggota
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {(formData.members || []).map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={m}
                          onChange={(e) => handleMemberChange(idx, e.target.value)}
                          placeholder={`Anggota ${idx + 1}`}
                          style={{ flex: 1, padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 8 Blok Grid Input */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {sections.map(({ key, label }) => (
                  <div
                    key={key}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{label}</strong>
                      <button
                        type="button"
                        onClick={() => handleAddArrayItem(key)}
                        style={{ fontSize: '0.7rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >
                        + Poin
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {(formData[key] || []).map((point, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                          <textarea
                            rows={2}
                            value={point}
                            onChange={(e) => handleArrayChange(key, idx, e.target.value)}
                            placeholder={`Poin ${idx + 1}...`}
                            style={{
                              flex: 1,
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.78rem',
                              resize: 'vertical'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayItem(key, idx)}
                            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.4rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      {(!formData[key] || formData[key].length === 0) && (
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', margin: '0.3rem 0' }}>
                          Klik '+ Poin' untuk menambahkan butir analisis.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          ) : (
            /* Mode Pratinjau Visual (Mirip 100% dengan Hasil Cetak) */
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #0f172a',
                padding: '1.25rem 1.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                position: 'relative'
              }}
            >
              {/* Header Visual */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  borderBottom: '2px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '2.5px',
                      padding: '2px'
                    }}
                  >
                    {[...Array(9)].map((_, i) => (
                      <div key={i} style={{ background: '#0284c7', borderRadius: '1.5px' }} />
                    ))}
                  </div>
                  <div style={{ lineHeight: 1.1 }}>
                    <strong style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0369a1', letterSpacing: '-0.5px', display: 'block' }}>
                      PSC
                    </strong>
                    <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block' }}>
                      PKM STRATEGY CANVAS
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', flex: 1, marginRight: '50px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>
                    PKM STRATEGY CANVAS (PSC)
                  </h2>
                  <p style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#334155', margin: '2px 0 0 0' }}>
                    Framework untuk menyusun ide PKM hingga siap lolos PIMNAS
                  </p>
                </div>
              </div>

              {/* Tabel Identitas Tim */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #1e293b',
                  fontSize: '0.78rem',
                  marginBottom: '0'
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '48%', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', marginBottom: '3px' }}>
                        <span style={{ width: 95, fontWeight: 700, color: '#0f172a' }}>Nama Ketua</span>
                        <span style={{ width: 12 }}>:</span>
                        <strong style={{ flex: 1 }}>{formData.leader || '-'}</strong>
                      </div>
                      <div style={{ display: 'flex' }}>
                        <span style={{ width: 95, fontWeight: 700, color: '#0f172a' }}>Nama Anggota</span>
                        <span style={{ width: 12 }}>:</span>
                        <div style={{ flex: 1 }}>
                          {(formData.members || []).map((m, i) => (
                            <div key={i}>
                              <span style={{ color: '#0284c7', fontWeight: 900, marginRight: '4px' }}>&#10003;</span>
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '52%', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', marginBottom: '3px' }}>
                        <span style={{ width: 110, fontWeight: 700, color: '#0f172a' }}>Perguruan Tinggi</span>
                        <span style={{ width: 12 }}>:</span>
                        <span style={{ flex: 1 }}>{formData.university || 'Universitas Lampung'}</span>
                      </div>
                      <div style={{ display: 'flex' }}>
                        <span style={{ width: 110, fontWeight: 700, color: '#0f172a' }}>
                          Judul {formData.scheme ? formData.scheme.toUpperCase() : 'PKM'}
                        </span>
                        <span style={{ width: 12 }}>:</span>
                        <span style={{ flex: 1, fontStyle: 'italic', fontWeight: 600 }}>
                          {formData.title || 'Inovasi Belum Berjudul'}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Grid 8-Pilar Canvas */}
              <div style={{ position: 'relative', width: '100%' }}>
                {/* Watermark Tengah */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 220,
                    height: 220,
                    opacity: 0.05,
                    pointerEvents: 'none',
                    zIndex: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                  }}
                >
                  {[...Array(9)].map((_, i) => (
                    <div key={i} style={{ background: '#0284c7', borderRadius: '6px' }} />
                  ))}
                </div>

                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #1e293b',
                    position: 'relative',
                    zIndex: 1,
                    tableLayout: 'fixed'
                  }}
                >
                  {/* Row 1 */}
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Masalah <em>(Problem)</em>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Tujuan <em>(Purpose)</em>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Gagasan <em>(Idea)</em>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Metode <em>(Method)</em>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[formData.problem, formData.purpose, formData.idea, formData.method].map((list, idx) => (
                        <td
                          key={idx}
                          style={{
                            border: '1px solid #1e293b',
                            padding: '6px',
                            verticalAlign: 'top',
                            fontSize: '0.74rem',
                            lineHeight: 1.3,
                            background: 'rgba(255, 255, 255, 0.95)',
                            minHeight: '140px'
                          }}
                        >
                          {(list || []).map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <span style={{ color: '#0284c7', fontWeight: 900, marginRight: '4px', flexShrink: 0 }}>&#10003;</span>
                              <span style={{ flex: 1, textAlign: 'justify' }}>{item}</span>
                            </div>
                          ))}
                        </td>
                      ))}
                    </tr>
                  </tbody>

                  {/* Row 2 */}
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Keunikan <em>(Unique Value)</em>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Kegiatan Utama <em>(Key Activities)</em>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Kebaharuan <em>(Novelty)</em>
                      </th>
                      <th style={{ border: '1px solid #1e293b', padding: '5px', fontSize: '0.8rem', background: '#f8fafc', width: '25%' }}>
                        Luaran <em>(Output)</em>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[formData.uniqueValue, formData.keyActivities, formData.novelty, formData.output].map((list, idx) => (
                        <td
                          key={idx}
                          style={{
                            border: '1px solid #1e293b',
                            padding: '6px',
                            verticalAlign: 'top',
                            fontSize: '0.74rem',
                            lineHeight: 1.3,
                            background: 'rgba(255, 255, 255, 0.95)',
                            minHeight: '140px'
                          }}
                        >
                          {(list || []).map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <span style={{ color: '#0284c7', fontWeight: 900, marginRight: '4px', flexShrink: 0 }}>&#10003;</span>
                              <span style={{ flex: 1, textAlign: 'justify' }}>{item}</span>
                            </div>
                          ))}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.7rem', color: '#64748b' }}>
                <span>PKM Center Universitas Lampung • Asisten AI PKMATE</span>
                <span>Standar Template PKM Strategy Canvas (PSC)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
