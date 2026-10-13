import { useEffect, useState } from 'react'
import { GlowCard } from '../components/GlowCard'
import { PageIntro } from '../components/PageIntro'
import { useContent, fallbackNews, formatDate, splitBody, hideBrokenImage } from '../lib/content'

const PER_PAGE = 3

const COVER_GRADIENTS = ['c0', 'c1', 'c2']

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
    <main className="ref-news-page">
      <PageIntro
        eyebrow="KABAR DARI PKM CENTER"
        title={<>Cerita yang terus <em>bertumbuh.</em></>}
        copy="Pengumuman penting, jadwal kegiatan, dan catatan perjalanan karya mahasiswa PKM Universitas Lampung."
      />

      <section className="ref-news-container">
        <div className="ref-news-grid">
          {shown.map((item, index) => {
            const glowColor = item.color || (index === 0 ? 'gold' : index === 1 ? 'blue' : 'green')
            const coverClass = COVER_GRADIENTS[((item.id || index) - 1) % 3] || 'c0'
            const image = item.thumbnailUrl || item.mediaUrl

            return (
              <GlowCard
                key={item.id}
                customSize
                noPadding
                glowColor={glowColor}
                className="news-card-glow-wrap"
              >
                <a className="news-card-new" href={`#berita/${item.id}`}>
                  <div className={`news-cover ${coverClass}`}>
                    {image && (
                      <img src={image} alt={item.title} onError={hideBrokenImage} />
                    )}
                    <span>{item.category?.toUpperCase() || 'BERITA'}</span>
                  </div>

                  <div className="news-body">
                    <p className="news-meta">
                      <span className={`pill ${item.color || 'blue'}`}>{item.category}</span>
                      <span>{formatDate(item)}</span>
                    </p>
                    <h2 className="news-title">{item.title}</h2>
                    <p className="excerpt">{item.description}</p>
                    <span className="read">
                      Baca selengkapnya <b>&rarr;</b>
                    </span>
                  </div>
                </a>
              </GlowCard>
            )
          })}
        </div>

        {total > 1 && (
          <nav className="pagination" aria-label="Pagination berita">
            {Array.from({ length: total }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                className={number === current ? 'active' : ''}
                onClick={() => setPage(number)}
                type="button"
              >
                {number}
              </button>
            ))}
          </nav>
        )}
      </section>
    </main>
  )
}

export function NewsDetail({ id }) {
  const items = useContent('news', fallbackNews)
  const item = items.find((article) => String(article.id) === String(id))

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [id])

  if (!item) {
    return (
      <main className="ref-news-page">
        <PageIntro
          eyebrow="KABAR DARI PKM CENTER"
          title={<>Berita tidak <em>ditemukan.</em></>}
          copy="Artikel yang Anda cari tidak tersedia atau telah dihapus. Kembali ke daftar berita untuk melihat kabar terbaru."
        />
        <p className="back-cta" style={{ textAlign: 'center', margin: '2rem 0 5rem' }}>
          <a className="btn-masuk" href="#berita" style={{ textDecoration: 'none' }}>
            ← Kembali ke Semua Berita
          </a>
        </p>
      </main>
    )
  }

  const image = item.thumbnailUrl || item.mediaUrl
  const paragraphs = splitBody(item.body)

  return (
    <main className="ref-news-page">
      <div className="article-container">
        <a className="article-back-link" href="#berita">
          ← Kembali ke Semua Berita
        </a>

        <article className="article-detail-glass">
          <header className="article-header">
            <p className="article-meta-row">
              <span className={`pill ${item.color || 'blue'}`}>{item.category}</span>
              <span>{formatDate(item)}</span>
            </p>
            <h1 className="article-title">{item.title}</h1>
          </header>

          {image && (
            <div className="article-hero-wrap">
              <img src={image} alt={item.title} onError={hideBrokenImage} />
            </div>
          )}

          <div className="article-content">
            <p className="article-lead">{item.description}</p>
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}