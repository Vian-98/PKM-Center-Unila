import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { Breadcrumb } from '../components/Breadcrumb'
import { usePedoman } from '../lib/content'

export function PedomanIndex() {
  const items = usePedoman()
  const [query, setQuery] = useState('')

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])

  const filtered = items.filter((item) => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    return `${item.year} ${item.title} ${item.note || ''} ${item.source || ''}`.toLowerCase().includes(q)
  })
  const years = [...new Set(filtered.map((item) => item.year))].sort((a, b) => b - a)

  return (
    <main>
      <Breadcrumb trail={[['Beranda', '#beranda'], ['Pedoman']]} />
      <PageIntro
        eyebrow="PEDOMAN PKM UNILA"
        title={<>Panduan untuk<br /><em>setiap langkah.</em></>}
        copy="Unduh pedoman resmi Program Kreativitas Mahasiswa setiap tahunnya, lengkap dengan versi dan sumber dokumen."
      />
      <section className="doc-index">
        <div className="filter-row">
          <label className="search-wrap">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pedoman… (judul, tahun, atau isi)" />
          </label>
          <span className="filter-count">{filtered.length} dokumen</span>
        </div>
        {years.length === 0 && <p className="empty-state">Tidak ada pedoman yang cocok dengan pencarianmu.</p>}
        {years.map((year) => (
          <section className="doc-year" key={year}>
            <div className="doc-year-heading"><b>{year}</b><span>{filtered.filter((item) => item.year === year).length} dokumen</span></div>
            {filtered.filter((item) => item.year === year).map((item) => (
              <article className="doc-card" key={item.id}>
                <div className="doc-badge">{item.year}</div>
                <div className="doc-copy">
                  <p className="card-meta">{item.source ? `${item.source} · pdf` : 'Dokumen resmi'}</p>
                  <h2>{item.title}</h2>
                  {item.note && <p>{item.note}</p>}
                </div>
                <a className="doc-download" href={item.fileUrl || '#'} target="_blank" rel="noopener noreferrer">
                  {item.fileUrl ? <>Buka & unduh <b>↓</b></> : <>Segera tersedia</>}
                </a>
              </article>
            ))}
          </section>
        ))}
      </section>
    </main>
  )
}