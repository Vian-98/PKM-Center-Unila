import { useEffect } from 'react'
import { useContent, fallbackNews, useTimeline, usePedoman, formatDate, hideBrokenImage } from '../lib/content'

function HeroSection() {
  return (
    <section className="ref-hero" id="beranda">
      <div className="ref-hero-copy">
        <p className="ref-badge"><span aria-hidden="true">✦</span> PUSAT KREATIVITAS MAHASISWA UNIVERSITAS LAMPUNG</p>
        <h1>Ide hebat dimulai dari <span className="hl-blue">langkah</span><br /><span className="hl-blue underline-gold">pertama.</span></h1>
        <p className="ref-sub">Wujudkan gagasan, temukan kolaborator, dan raih prestasi melalui ekosistem PKM terintegrasi berbasis AI.</p>
        <div className="ref-cta">
          <a className="btn-primary" href="#kontak">Mulai ajukan proposal <b>→</b></a>
          <a className="link-more" href="#tentang">Pelajari PKM <b>›</b></a>
        </div>
        <div className="ref-social">
          <div className="avatars" aria-hidden="true"><span>AR</span><span>DN</span><span>RS</span><span className="more">•</span></div>
          <p><b>1.248 mahasiswa</b><br />telah bergabung tahun ini</p>
        </div>
      </div>
      <div className="ref-hero-art" aria-hidden="true">
        <div className="art-bg" />
        <div className="art-person"><div className="head" /><div className="body" /><div className="arm" /><div className="laptop"><span>PKM</span></div></div>
        <div className="card score">
          <span className="bulb">◍</span>
          <small>IDEA SCORE</small>
          <strong>92<small>/100</small></strong>
          <span className="bar"><i /></span>
          <em>Sangat potensial untuk dikembangkan</em>
        </div>
        <div className="card team">
          <span className="team-ico">⚇</span>
          <div><b>Tim terbaik ditemukan</b><small>98% kecocokan bidang</small></div>
          <span className="check">✓</span>
        </div>
        <span className="deco sigma">Σ</span><span className="deco ai">AI</span><span className="deco star">✦</span>
      </div>
    </section>
  )
}

function StatsBar() {
  const items = [
    ['438', 'Proposal diajukan'],
    ['127', 'Tim terbentuk'],
    ['64', 'Dosen pembimbing'],
    ['18', 'Proposal didanai'],
  ]
  return (
    <section className="ref-stats" aria-label="Statistik PKM">
      {items.map(([num, label]) => (
        <div className="ref-stat" key={label}><strong>{num}</strong><span>{label}</span></div>
      ))}
    </section>
  )
}

function Ecosystem() {
  const cards = [
    { tag: 'DIDUKUNG AI', title: 'Uji kekuatan idemu', copy: 'Dapatkan analisis kebaruan, dampak, dan kelayakan ide sebelum menyusun proposal.', link: 'Coba Idea Lab', href: '#kontak', dark: true, icon: '◍' },
    { title: 'Temukan tim multidisiplin', copy: 'Rekomendasi anggota dengan kompetensi yang saling melengkapi dari seluruh fakultas.', link: 'Cari anggota', href: '#portofolio', icon: '⚇' },
    { title: 'Terhubung dengan mentor', copy: 'Pilih dosen pembimbing berdasarkan bidang riset dan pengalaman PKM.', link: 'Lihat pembimbing', href: '#kontak', icon: '○' },
  ]
  return (
    <section className="ref-eco" id="tentang">
      <p className="ref-eyebrow gold">EKOSISTEM TERINTEGRASI</p>
      <h2>Satu ruang untuk setiap langkah perjalananmu</h2>
      <p className="ref-desc">Teknologi membantu proses, kolaborasi menguatkan ide, dan mentor mengarahkanmu menuju dampak yang nyata.</p>
      <div className="ref-eco-grid">
        {cards.map((c) => (
          <article className={`eco-card ${c.dark ? 'dark' : ''}`} key={c.title}>
            <div className="eco-top">{c.tag && <span className="eco-tag">{c.tag}</span>}<span className="eco-icon" aria-hidden="true">{c.icon}</span></div>
            <h3>{c.title}</h3>
            <p>{c.copy}</p>
            <a href={c.href}>{c.link} <b>→</b></a>
          </article>
        ))}
      </div>
    </section>
  )
}

function Timeline() {
  const timeline = useTimeline()
  const items2025 = timeline.filter((t) => t.year === 2025).sort((a, b) => a.order - b.order).slice(0, 4)
  const shown = items2025.length ? items2025 : [
    { stage: 'Pendaftaran & Pengajuan', label: '12 Mei – 14 Juni 2025', note: 'SEDANG BERLANGSUNG' },
    { stage: 'Seleksi Administrasi', label: '16 – 20 Juni 2025', note: 'TAHAP 2' },
    { stage: 'Review & Perbaikan', label: '23 Juni – 11 Juli 2025', note: 'TAHAP 3' },
    { stage: 'Pengumuman Internal', label: '18 Juli 2025', note: 'TAHAP 4' },
  ]
  return (
    <section className="ref-timeline" id="timeline">
      <div className="tl-left">
        <p className="ref-eyebrow gold">TIMELINE PKM UNILA 2025</p>
        <h2>Catat setiap tahap. Jangan lewatkan kesempatan.</h2>
        <p>Pastikan timmu menyelesaikan setiap proses tepat waktu untuk mengikuti seleksi internal.</p>
        <button className="btn-outline" type="button" onClick={() => window.alert('Fitur kalender segera hadir.')}>▢ Tambahkan ke kalender</button>
      </div>
      <ol className="tl-right">
        {shown.map((s, i) => (
          <li key={s.id ?? i} className={i === 0 ? 'active' : ''}>
            <span className="tl-num">{i === 0 ? '✓' : `0${i + 1}`}</span>
            <div>
              <small>{i === 0 ? 'SEDANG BERLANGSUNG' : s.note?.toUpperCase().includes('TAHAP') ? s.note : `TAHAP ${i + 1}`}</small>
              <h3>{s.stage}</h3>
              <p>◷ {s.label}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

const NEWS_COVER = ['PKM 2025', 'KLINIK IDE', 'PRESTASI']

function NewsPreview() {
  const items = useContent('news', fallbackNews).slice(0, 3)
  return (
    <section className="ref-news">
      <p className="ref-eyebrow gold left">KABAR TERKINI</p>
      <div className="ref-news-head"><h2>Berita dari PKM Center</h2><a href="#berita">Lihat semua berita <b>→</b></a></div>
      <div className="ref-news-grid">
        {items.map((item, i) => (
          <a className="news-card-new" href={`#berita/${item.id}`} key={item.id}>
            <div className={`news-cover c${i % 3}`}>
              {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" aria-hidden="true" onError={hideBrokenImage} />}
              <span>{NEWS_COVER[i % 3]}</span>
            </div>
            <div className="news-body">
              <p className="news-meta"><span className="pill">{item.category}</span> {formatDate(item)}</p>
              <h3>{item.title}</h3>
              <p className="excerpt">{item.description}</p>
              <span className="read">Baca selengkapnya <b>→</b></span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function PanduanBanner() {
  const pedoman = usePedoman()
  const latest = [...pedoman].sort((a, b) => b.year - a.year)[0]
  return (
    <section className="ref-panduan">
      <div className="panduan-ico" aria-hidden="true">▢</div>
      <div>
        <p className="ref-eyebrow gold left small">PANDUAN RESMI</p>
        <h2>Siap menyusun proposal terbaikmu?</h2>
        <p>Unduh panduan PKM {latest?.year || 2025} dan pahami setiap ketentuan sebelum memulai.</p>
      </div>
      <a className="btn-primary" href={latest?.fileUrl || '#pedoman'} target={latest?.fileUrl ? '_blank' : undefined} rel="noreferrer">⤓ Unduh panduan PKM {latest?.year || 2025}</a>
    </section>
  )
}

export function Home({ anchor = 'beranda' }) {
  useEffect(() => {
    if (anchor && anchor !== 'beranda') {
      const el = document.getElementById(anchor)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [anchor])
  return (
    <main className="ref-page">
      <HeroSection />
      <StatsBar />
      <Ecosystem />
      <Timeline />
      <NewsPreview />
      <PanduanBanner />
    </main>
  )
}
