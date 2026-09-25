import { useEffect, useState } from 'react'
import { GlowCard } from '../components/GlowCard'
import { PageIntro } from '../components/PageIntro'
import { useContent, fallbackNews, formatDate, splitBody, hideBrokenImage } from '../lib/content'

const PER_PAGE = 3

function NewsVisual({ item }) {
  const image = item.thumbnailUrl || item.mediaUrl
  return (
    <div className={`news-visual ${image ? 'has-image' : ''} ${item.color}`}>
      {image && <img src={image} alt="" aria-hidden="true" onError={hideBrokenImage} />}
      <span>{item.category}</span>
      <b>↗</b>
    </div>
  )
}

export function NewsIndex() {
  const [page, setPage] = useState(1)
  const items = useContent('news', fallbackNews)
  const total = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const shown = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const current = Math.min(page, total)

  useEffect(() => {
    if (current !== page) setPage(current)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page, current])

  return (
    <main>
      <PageIntro
        eyebrow="KABAR DARI PKM CENTER"
        title={<>Cerita yang terus<br /><em>bertumbuh.</em></>}
        copy="Pengumuman, kegiatan, dan catatan perjalanan karya mahasiswa PKM Unila."
      />
      <section className="news-grid">
        {shown.map((item) => (
          <GlowCard glowColor={item.color} className="news-glow" key={item.id}>
            <a className={`news-card ${item.color}`} href={`#berita/${item.id}`}>
              <NewsVisual item={item} />
              <p className="card-meta">{formatDate(item)} · {item.category}</p>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <span className="read-more">Baca selengkapnya →</span>
            </a>
          </GlowCard>
        ))}
      </section>
      <nav className="pagination" aria-label="Pagination berita">
        {Array.from({ length: total }, (_, i) => i + 1).map((number) => (
          <button key={number} className={number === current ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>
        ))}
      </nav>
    </main>
  )
}

export function NewsDetail({ id }) {
  const items = useContent('news', fallbackNews)
  const item = items.find((article) => String(article.id) === String(id))

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [id])

  if (!item) {
    return (
      <main>
        <PageIntro
          eyebrow="KABAR DARI PKM CENTER"
          title={<>Berita tidak<br /><em>ditemukan.</em></>}
          copy="Artikel yang Anda cari tidak tersedia atau telah dihapus. Kembali ke daftar berita untuk melihat kabar terbaru."
        />
        <p className="back-cta"><a className="back-link" href="#berita">← Semua berita</a></p>
      </main>
    )
  }

  const image = item.thumbnailUrl || item.mediaUrl
  const paragraphs = splitBody(item.body)

  return (
    <main>
      <article className="article-detail">
        <a className="back-link" href="#berita">← Semua berita</a>
        <p className="eyebrow">{formatDate(item)} · {item.category}</p>
        <h1>{item.title}</h1>
        <div className={`article-image ${item.color}`}>
          {image && <img src={image} alt={item.title} onError={hideBrokenImage} />}
          <span>PKM CENTER<br />UNIVERSITAS LAMPUNG</span>
        </div>
        <p className="lead">{item.description}</p>
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </article>
    </main>
  )
}