import { useState } from 'react'
import { GlowCard } from '../components/GlowCard'
import {
  useContent, fallbackNews, fallbackGallery,
  useStats, useTimeline, submitFeedback, schemeNames,
  formatDate, hideBrokenImage,
} from '../lib/content'

function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">RUANG TUMBUH IDE MAHASISWA</p>
        <h1>Gagasan kecil.<br /><em>Dampak besar.</em></h1>
        <p className="intro">PKM Center Unila adalah titik temu bagi rasa ingin tahu, riset yang berani, dan karya yang memberi arti.</p>
        <div className="actions">
          <a className="button dark" href="#berita">Lihat kabar terbaru <b>↗</b></a>
          <a className="text-link" href="#tentang">Kenali PKM <b>↓</b></a>
        </div>
      </div>
      <div className="hero-art">
        <div className="sun" /><div className="arch arch-one" /><div className="arch arch-two" />
        <div className="orb orb-one" /><div className="orb orb-two" />
        <div className="note">IDE<br />TUMBUH</div>
        <p className="art-caption">UNILA<br /><i>CREATIVE<br />ECOSYSTEM</i></p>
      </div>
    </section>
  )
}

function Ticker() {
  return (
    <section className="ticker" aria-hidden="true">
      <span>BERPIKIR</span><b>✦</b><span>BERKARYA</span><b>✦</b><span>BERDAMPAK</span><b>✦</b><span>BERSAMA UNILA</span>
    </section>
  )
}

function StatsSection() {
  const stats = useStats()
  const accent = ['gold', 'blue', 'red', 'green']
  return (
    <section className="home-stats">
      <div className="section-heading">
        <p className="eyebrow">ANGKA PER SKEMA</p>
        <h2>Usulan yang lahir<br />dari rasa ingin tahu.</h2>
        <p className="section-copy">Jumlah usulan proposal PKM Universitas Lampung pada periode pengusulan terakhir.</p>
      </div>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <article className={`stat-card ${accent[index % accent.length]}`} key={stat.id ?? stat.scheme}>
            <span className="stat-scheme">{stat.scheme}</span>
            <strong>{stat.count}</strong>
            <small>{schemeNames[stat.scheme] || 'Skema PKM'}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

const services = [
  { icon: '✧', title: 'Pendampingan & Konsultasi', copy: 'Sesi konsultasi per kelompok bersama fasilitator berpengalaman dari penyusunan hingga pelaporan.' },
  { icon: '✦', title: 'Klinik & Pelatihan', copy: 'Kelas intensif, klinik proposal, dan pelatihan penulisan bagi pengusul baru maupun lanjutan.' },
  { icon: '◈', title: 'Review & Validasi', copy: 'Pemeriksaan kelengkapan dan kualitas proposal sebelum diteruskan ke tingkat nasional.' },
  { icon: '❖', title: 'Diseminasi & Luaran', copy: 'Pendampingan publikasi, HAKI, dan penyebarluasan hasil karya mahasiswa ke masyarakat.' },
]

function ServicesSection() {
  return (
    <section className="services-section">
      <div className="section-heading">
        <p className="eyebrow">PERAN PKM CENTER</p>
        <h2>Apa yang kami lakukan.</h2>
        <p className="section-copy">Layanan yang menemani mahasiswa sejak gagasan pertama hingga karya benar-benar berdampak.</p>
      </div>
      <div className="services-grid">
        {services.map((service) => (
          <article className="service-card" key={service.title}>
            <span className="service-icon" aria-hidden="true">{service.icon}</span>
            <h3>{service.title}</h3>
            <p>{service.copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function AboutSection() {
  const schemes = Object.entries(schemeNames)
  return (
    <section className="journey" id="tentang">
      <div className="section-heading">
        <p className="eyebrow">SATU IDE, BANYAK KEMUNGKINAN</p>
        <h2>Temukan lintasanmu.</h2>
        <p className="section-copy">Didirikan sebagai pusat pengembangan Program Kreativitas Mahasiswa, PKM Center Unila mendampingi seluruh fakultas — dari memahami latar belakang, tujuan, hingga memilih skema yang paling sesuai dengan gagasanmu.</p>
      </div>
      <div className="path-grid">
        <article><span>01</span><h3>Jelajahi</h3><p>Temukan bentuk PKM yang paling dekat dengan kegelisahanmu.</p></article>
        <article><span>02</span><h3>Racik</h3><p>Ubah pertanyaan menjadi proposal yang kuat dan terarah.</p></article>
        <article><span>03</span><h3>Wujudkan</h3><p>Bawa gagasanmu keluar kelas untuk menciptakan perubahan.</p></article>
      </div>
      <div className="skema-grid">
        {schemes.map(([code, name]) => (
          <div className="skema-chip" key={code}><b>{code}</b><span>{name}</span></div>
        ))}
      </div>
    </section>
  )
}

function NewsPreview() {
  const items = useContent('news', fallbackNews).slice(0, 3)
  return (
    <section className="preview-section">
      <div className="section-heading">
        <p className="eyebrow">KABAR TERBARU</p>
        <h2>Yang terjadi<br />di PKM Center.</h2>
        <a className="text-link" href="#berita">Lihat semua berita <b>↗</b></a>
      </div>
      <div className="news-grid">
        {items.map((item) => (
          <GlowCard glowColor={item.color} className="news-glow" key={item.id}>
            <a className={`news-card ${item.color}`} href={`#berita/${item.id}`}>
              <div className={`news-visual ${item.thumbnailUrl ? 'has-image' : ''} ${item.color}`}>
                {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" aria-hidden="true" onError={hideBrokenImage} />}
                <span>{item.category}</span><b>↗</b>
              </div>
              <p className="card-meta">{formatDate(item)} · {item.category}</p>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <span className="read-more">Baca selengkapnya →</span>
            </a>
          </GlowCard>
        ))}
      </div>
    </section>
  )
}

function TimelineSection() {
  const timeline = useTimeline()
  const years = [...new Set(timeline.map((item) => item.year))].sort((a, b) => b - a)
  const accent = ['gold', 'blue', 'red', 'green']
  return (
    <section className="timeline-section">
      <div className="section-heading">
        <p className="eyebrow">TIMELINE PKM</p>
        <h2>Dari submit<br />hingga PIMNAS.</h2>
        <p className="section-copy">Tahapan pengusulan, penilaian, dan pelaksanaan PKM setiap tahunnya.</p>
      </div>
      <div className="timeline-wrap">
        {years.map((year) => {
          const stages = timeline.filter((item) => item.year === year).sort((a, b) => a.order - b.order)
          return (
            <details className={`timeline-card ${accent[years.indexOf(year) % accent.length]}`} key={year} open={year === years[0]}>
              <summary><b>{year}</b><span>{stages.length} tahapan</span></summary>
              <ol className="timeline-stages">
                {stages.map((stage) => (
                  <li key={stage.id ?? stage.stage}>
                    <span className="timeline-dot" aria-hidden="true" />
                    <div><h3>{stage.stage}</h3><p className="timeline-label">{stage.label}</p>{stage.note && <p className="timeline-note">{stage.note}</p>}</div>
                  </li>
                ))}
              </ol>
            </details>
          )
        })}
      </div>
    </section>
  )
}

function GalleryPreview() {
  const items = useContent('gallery', fallbackGallery).slice(0, 4)
  return (
    <section className="preview-section">
      <div className="section-heading">
        <p className="eyebrow">GALERI KEGIATAN</p>
        <h2>Melihat ide bekerja.</h2>
        <a className="text-link" href="#galeri">Lihat semua galeri <b>↗</b></a>
      </div>
      <div className="gallery-grid">
        {items.map((item, index) => (
          <GlowCard glowColor={item.color} className="gallery-glow" key={item.id}>
            <a className={`gallery-item ${item.color}${item.mediaUrl ? ' has-image' : ''}`} href="#galeri" aria-label={`Lihat foto: ${item.title}`}>
              {item.mediaUrl && <img className="gallery-thumb" src={item.mediaUrl} alt={item.title} onError={hideBrokenImage} />}
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              <b>↗</b>
            </a>
          </GlowCard>
        ))}
      </div>
    </section>
  )
}

function FeedbackForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [state, setState] = useState({ sending: false, done: false, error: '' })

  const submit = async (event) => {
    event.preventDefault()
    setState({ sending: true, done: false, error: '' })
    try {
      await submitFeedback({ kind: 'saran', name: form.name, email: form.email, message: form.message })
      setForm({ name: '', email: '', message: '' })
      setState({ sending: false, done: true, error: '' })
    } catch (error) {
      setState({ sending: false, done: false, error: error.message })
    }
  }

  return (
    <section className="feedback-section">
      <div className="section-heading">
        <p className="eyebrow">KRITIK & SARAN</p>
        <h2>Suaramu membantu<br />kami bertumbuh.</h2>
        <p className="section-copy">Ceritakan pengalamanmu mengikuti program, pendampingan, atau sekadar ide untuk PKM Center.</p>
      </div>
      <form className="content-form feedback-form" onSubmit={submit}>
        {state.done && <p className="feedback-success">✓ Terima kasih! Masukanmu sudah kami terima.</p>}
        {state.error && <p className="error">{state.error}</p>}
        <label>Nama (opsional)<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Namamu" /></label>
        <label>Email (opsional)<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></label>
        <label>Masukan<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={3} placeholder="Tulis kritik, saran, atau idemu di sini…" /></label>
        <button className="button dark" type="submit" disabled={state.sending}>{state.sending ? 'Mengirim…' : 'Kirim masukan'} <b>→</b></button>
        <p className="hint">Masukan dikirim langsung ke tim PKM Center dan dibaca di panel admin.</p>
      </form>
    </section>
  )
}

export function Home() {
  return (
    <main id="beranda">
      <HeroSection />
      <Ticker />
      <StatsSection />
      <ServicesSection />
      <AboutSection />
      <NewsPreview />
      <TimelineSection />
      <GalleryPreview />
      <FeedbackForm />
    </main>
  )
}