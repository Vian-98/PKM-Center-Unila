import { useEffect, useState } from 'react'
import { GlowCard } from '../components/GlowCard'
import { PageIntro } from '../components/PageIntro'
import { useContent, fallbackVideos, fallbackGallery, hideBrokenImage } from '../lib/content'

function getYouTubeID(url = '') {
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || ''
  } catch { return '' }
}

function getYouTubeEmbed(url = '') {
  const id = getYouTubeID(url)
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : ''
}

function VideoCard({ item, onPreview }) {
  const youtubeID = getYouTubeID(item.mediaUrl)
  const thumbnail = item.thumbnailUrl || (youtubeID ? `https://i.ytimg.com/vi/${youtubeID}/hqdefault.jpg` : '')
  return (
    <GlowCard glowColor={item.color} className={`video-card ${item.color}`}>
      <div className="video-thumbnail">
        {thumbnail
          ? <img src={thumbnail} alt={`Preview ${item.title}`} onError={hideBrokenImage} />
          : item.mediaUrl
            ? <video src={item.mediaUrl} muted preload="metadata" />
            : <div className="video-placeholder">VIDEO<br />BELUM DITAUTKAN</div>}
        <button className="play video-play" type="button" onClick={() => onPreview(item)} aria-label={`Putar ${item.title}`}>▶</button>
      </div>
      <div className="video-copy">
        <p className="card-meta">VIDEO · {item.category || 'KEGIATAN'}</p>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </GlowCard>
  )
}

function VideoPreview({ item, close }) {
  const embed = getYouTubeEmbed(item.mediaUrl)
  return (
    <div className="lightbox video-preview" onMouseDown={close}>
      <section className="video-preview-content" onMouseDown={(event) => event.stopPropagation()}>
        <button className="close" onClick={close}>×</button>
        <p className="eyebrow">VIDEO KEGIATAN</p>
        <h2>{item.title}</h2>
        {embed
          ? <iframe src={embed} title={item.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          : item.mediaUrl
            ? <video src={item.mediaUrl} controls autoPlay>Browser Anda belum mendukung pemutar video.</video>
            : <div className="video-empty"><b>▶</b><p>Video belum ditautkan oleh admin.</p><small>Tambahkan URL YouTube atau berkas video pada panel Kelola konten.</small></div>}
      </section>
    </div>
  )
}

export function Gallery() {
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(null)
  const videoItems = useContent('video', fallbackVideos)
  const galleryItems = useContent('gallery', fallbackGallery)

  const open = (offset) => setSelected((current) => {
    if (current === null || galleryItems.length === 0) return current
    return (current + offset + galleryItems.length) % galleryItems.length
  })

  useEffect(() => {
    if (selected === null) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowLeft') open(-1)
      if (event.key === 'ArrowRight') open(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, galleryItems.length])

  const current = selected !== null ? galleryItems[selected] : null

  return (
    <main>
      <PageIntro
        eyebrow="DOKUMENTASI KEGIATAN"
        title={<>Ruang, proses,<br /><em>dan perjumpaan.</em></>}
        copy="Potongan momen dari perjalanan belajar, berkolaborasi, dan berkarya bersama PKM Center."
      />

      <section className="video-section">
        <div className="section-heading">
          <p className="eyebrow">VIDEO KEGIATAN</p>
          <h2>Putar kembali prosesnya.</h2>
        </div>
        <div className="video-grid">
          {videoItems.map((item) => <VideoCard item={item} onPreview={setPreview} key={item.id} />)}
        </div>
      </section>

      <section className="gallery-section" id="galeri">
        <div className="section-heading">
          <p className="eyebrow">GALERI FOTO</p>
          <h2>Melihat ide bekerja.</h2>
        </div>
        <div className="gallery-grid">
          {galleryItems.map((item, index) => (
            <GlowCard glowColor={item.color} className="gallery-glow" key={item.id}>
              <button
                className={`gallery-item ${item.color}${item.mediaUrl ? ' has-image' : ''}`}
                onClick={() => setSelected(index)}
                aria-label={`Lihat foto: ${item.title}`}
              >
                {item.mediaUrl && <img className="gallery-thumb" src={item.mediaUrl} alt={item.title} onError={hideBrokenImage} />}
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.title}</strong>
                <b>↗</b>
              </button>
            </GlowCard>
          ))}
        </div>
      </section>

      {preview && <VideoPreview item={preview} close={() => setPreview(null)} />}

      {current && (
        <div className="lightbox" onMouseDown={() => setSelected(null)}>
          <section className={`lightbox-content ${current.color}`} onMouseDown={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <span className="lightbox-counter">GALERI PKM CENTER · {String(selected + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}</span>
            <h2>{current.title}</h2>
            <p>{current.description}</p>
            {current.mediaUrl
              ? <img className="lightbox-image" src={current.mediaUrl} alt={current.title} onError={hideBrokenImage} />
              : <div className="lightbox-empty">FOTO<br />BELUM DITAUTKAN</div>}
            <div className="lightbox-nav">
              <button type="button" onClick={() => open(-1)}>← Sebelumnya</button>
              <button type="button" onClick={() => open(1)}>Berikutnya →</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}