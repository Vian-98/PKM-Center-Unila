import { useEffect, useMemo, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { Breadcrumb } from '../components/Breadcrumb'
import { usePortfolio, schemeNames } from '../lib/content'

export function PortofolioIndex() {
  const items = usePortfolio()
  const [year, setYear] = useState('all')
  const [scheme, setScheme] = useState('all')
  const [open, setOpen] = useState(null)

  const years = useMemo(() => [...new Set(items.map((item) => item.year))].sort((a, b) => b - a), [items])
  const schemes = useMemo(() => [...new Set(items.map((item) => item.scheme).filter(Boolean))].sort(), [items])

  const filtered = items.filter((item) => (year === 'all' || item.year === year) && (scheme === 'all' || item.scheme === scheme))

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])

  return (
    <main>
      <Breadcrumb trail={[['Beranda', '#beranda'], ['Portofolio']]} />
      <PageIntro
        eyebrow="PORTOFOLIO & ARSIP"
        title={<>Proposal yang<br /><em>menembus seleksi.</em></>}
        copy="Arsip proposal PKM Universitas Lampung yang berhasil lolos pendanaan, tersaring per tahun pendanaan dan skema."
      />
      <section className="portfolio-index">
        <div className="filter-row portfolio-filters">
          <div className="filter-chips" role="group" aria-label="Filter tahun pendanaan">
            <button className={year === 'all' ? 'chip active' : 'chip'} onClick={() => setYear('all')}>Semua tahun</button>
            {years.map((y) => <button key={y} className={year === y ? 'chip active' : 'chip'} onClick={() => setYear(y)}>{y}</button>)}
          </div>
          <label className="filter-select">
            <span>Skema</span>
            <select value={scheme} onChange={(e) => setScheme(e.target.value)}>
              <option value="all">Semua skema</option>
              {schemes.map((s) => <option key={s} value={s}>{s} — {schemeNames[s] || s}</option>)}
            </select>
          </label>
        </div>

        {filtered.length === 0 && <p className="empty-state">Belum ada proposal pada filter ini.</p>}

        <div className="portfolio-list">
          {filtered.map((item) => (
            <article className={`portfolio-card ${item.scheme}`} key={item.id}>
              <div className="portfolio-head">
                <div>
                  <p className="card-meta">{item.year} · {item.scheme || 'PKM'} — {schemeNames[item.scheme] || 'Skema PKM'}</p>
                  <h2>{item.title}</h2>
                </div>
                <span className="portfolio-year">{item.year}</span>
              </div>
              <dl className="portfolio-meta">
                <div><dt>Tim</dt><dd>{item.team || '—'}</dd></div>
                <div><dt>Fakultas</dt><dd>{item.faculty || '—'}</dd></div>
                <div><dt>Prodi</dt><dd>{item.prodi || '—'}</dd></div>
              </dl>
              {item.description && (
                <div className="portfolio-detail">
                  <button type="button" className="detail-toggle" onClick={() => setOpen(open === item.id ? null : item.id)} aria-expanded={open === item.id}>
                    {open === item.id ? 'Sembunyikan ringkasan' : 'Lihat ringkasan'} <b>{open === item.id ? '−' : '+'}</b>
                  </button>
                  {open === item.id && <p className="portfolio-summary">{item.description}</p>}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}