import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { Breadcrumb } from '../components/Breadcrumb'
import GlassFolder from '../components/GlassFolder'
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

  const pedoman2026 = items.find((i) => i.year === 2026)
  const pedoman2025 = items.find((i) => i.year === 2025)
  const pedoman2024 = items.find((i) => i.year === 2024)
  const pedoman2023 = items.find((i) => i.year === 2023)

  return (
    <main>
      <Breadcrumb trail={[['Beranda', '#beranda'], ['Pedoman']]} />
      <PageIntro
        eyebrow="PEDOMAN PKM UNILA"
        title={<>Panduan untuk<br /><em>setiap langkah.</em></>}
        copy="Unduh pedoman resmi Program Kreativitas Mahasiswa setiap tahunnya, lengkap dengan versi dan sumber dokumen."
      />

      {/* Interactive Glass Folder Showcase */}
      <section className="doc-folder-showcase" aria-label="Arsip Berkas Pedoman">
        <div className="doc-folder-intro">
          <p className="ref-eyebrow gold">MAP BERKAS RESMI</p>
          <h3>Buku Panduan & Format Usulan</h3>
          <p>Buka map kaca interaktif di bawah untuk melihat dokumen panduan, lampiran, dan format resmi.</p>
        </div>
        <div className="doc-folder-grid">
          <GlassFolder
            label="Pedoman PKM 2026"
            meta="3 berkas aktif"
            art="unila"
            seed={3}
            width={320}
            appearDelay={0}
            files={[
              { name: "Pedoman Umum 2026", meta: "PDF · SIMBELMAWA", art: "unila", href: pedoman2026?.fileUrl },
              { name: "Format Usulan Proposal", meta: "Template Dokumen", art: "glacier" },
              { name: "Rubrik Penilaian 2026", meta: "Kriteria Skor", art: "aurora" },
            ]}
          />
          <GlassFolder
            label="Pedoman PKM 2025"
            meta="2 berkas rujukan"
            art="glacier"
            seed={7}
            width={320}
            appearDelay={120}
            files={[
              { name: "Pedoman PKM 2025", meta: "PDF · SIMBELMAWA", art: "glacier", href: pedoman2025?.fileUrl },
              { name: "Juknis Monev 2025", meta: "Pedoman Kemajuan", art: "dusk" },
            ]}
          />
          <GlassFolder
            label="Arsip Panduan"
            meta="Koleksi Lampau"
            art="verdant"
            seed={11}
            width={320}
            action="none"
            labelPlacement="top-left"
            appearDelay={240}
            files={[
              { name: "Pedoman 2024", meta: "PDF · 12 Medali", art: "verdant", href: pedoman2024?.fileUrl },
              { name: "Pedoman 2023", meta: "PDF · Arsip", art: "ember", href: pedoman2023?.fileUrl },
            ]}
          />
        </div>
        <p className="doc-folder-hint">
          💡 <em>Arahkan kursor atau sentuh map folder untuk membuka dan melihat berkas di dalamnya.</em>
        </p>
      </section>

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