import { useState } from 'react'
import { authFetch, statusLabel, statusTone } from '../lib/studentApi'

const STEPS = ['Draft', 'Review Dosen', 'Review Internal', 'Lolos Belmawa', 'PIMNAS']

function stageIndex(stageName) {
  const name = (stageName || '').toLowerCase()
  if (name.includes('pimnas')) return 4
  if (name.includes('belmawa') || name.includes('didanai')) return 3
  if (name.includes('internal') || name.includes('reviewer')) return 2
  if (name.includes('dosen') || name.includes('bimbing')) return 1
  return 0
}

export function CekStatusUsulan() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [state, setState] = useState({ loading: false, error: '', searched: false })

  const search = async (event) => {
    event.preventDefault()
    const q = query.trim()
    if (!q) {
      setState({ loading: false, error: 'Masukkan NPM, email, atau nama terlebih dahulu.', searched: false })
      return
    }
    setState({ loading: true, error: '', searched: true })
    try {
      const result = await authFetch(`/proposals/track?q=${encodeURIComponent(q)}`)
      setResults(result?.data || [])
      setState({ loading: false, error: '', searched: true })
    } catch (err) {
      setResults([])
      setState({ loading: false, error: `Gagal menelusuri: ${err.message}`, searched: true })
    }
  }

  return (
    <div className="module-container">
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">PELACAKAN STATUS USULAN PUBLIK</div>
            <h1 className="module-title">Cek Status Usulan PKM</h1>
            <p className="module-subtitle">
              Masukkan NPM, email, atau nama pengusul untuk melihat tahapan dan status usulan proposal PKM secara transparan.
            </p>
          </div>
        </div>

        <form className="student-search" onSubmit={search}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Contoh: 2157051001 atau nama mahasiswa"
            aria-label="Kata kunci pencarian usulan"
          />
          <button type="submit" className="btn-action gold" disabled={state.loading} style={{ padding: '0.85rem 1.5rem' }}>
            {state.loading ? 'Menelusuri...' : 'Telusuri Usulan'}
          </button>
        </form>
      </section>

      {state.error && (
        <div className="student-message-box" style={{ borderLeftColor: '#ef4444', color: '#991b1b' }}>{state.error}</div>
      )}

      {state.searched && !state.loading && !state.error && results.length === 0 && (
        <div className="student-empty">
          <h4>Tidak ditemukan</h4>
          <p>Tidak ada usulan yang cocok dengan pencarian <strong>{query}</strong>.</p>
        </div>
      )}

      <div className="student-stack">
        {results.map((item, idx) => {
          const active = stageIndex(item.stageName)
          return (
            <article key={item.proposalId || idx} className="proposal-card-item">
              <div className="proposal-card-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span className="tag-scheme">{item.schemeCode}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{item.schemeName}</span>
                  {item.isFunded && <span className="status-pill completed">Didanai</span>}
                </div>
                <span className={`status-pill ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
              </div>

              <h4 className="proposal-card-title">{item.title}</h4>
              <div className="proposal-card-meta">
                <span>Pengusul: {item.studentName} ({item.studentNumber})</span>
                <span>{item.studyProgram || item.faculty}</span>
                <span>Tim: {item.teamName || '-'}</span>
                {item.periodYear && <span>Periode {item.periodYear}</span>}
                {item.stageName && <span>Tahap: {item.stageName}</span>}
              </div>

              <div className="student-result-steps">
                {STEPS.map((label, i) => (
                  <span key={label} className={`status-pill ${i < active ? 'completed' : i === active ? 'in_progress' : 'pending'}`}>
                    {i < active ? '\u2713 ' : `${i + 1}. `}{label}
                  </span>
                ))}
              </div>

              <div className="student-split" style={{ marginTop: '0.75rem', gap: '1rem' }}>
                <div>
                  <div className="student-step-eyebrow">Dosen Pembimbing</div>
                  <div className="student-member-name" style={{ marginTop: '0.2rem' }}>
                    {item.supervisors?.length ? item.supervisors.join(', ') : 'Belum ditetapkan'}
                  </div>
                </div>
                <div>
                  <div className="student-step-eyebrow">Tim Penilai</div>
                  <div className="student-member-name" style={{ marginTop: '0.2rem' }}>
                    {item.reviewers?.length
                      ? item.reviewers.map(r => `${r.name} (${statusLabel(r.status)})`).join(', ')
                      : 'Belum ada reviewer'}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
