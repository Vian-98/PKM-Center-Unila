import { useEffect } from 'react'
import { GlowCard } from '../components/GlowCard'
import { HeroBrandLogo } from '../components/brand/HeroBrandLogo'
import { useContent, fallbackNews, useTimeline, usePedoman, formatDate, hideBrokenImage } from '../lib/content'

function HeroSection({ onMulaiAjukan }) {
  return (
    <section className="ref-hero">
      <div className="ref-hero-copy">
        <h1>
          <span className="hero-title-main">PUSAT KREATIVITAS MAHASISWA</span>
          <span className="hl-blue underline-gold hero-title-uni">UNIVERSITAS LAMPUNG</span>
        </h1>
        <p className="ref-sub">Wujudkan gagasan, temukan kolaborator, dan raih prestasi melalui ekosistem PKM terintegrasi berbasis AI.</p>
        <div className="ref-cta">
          <button className="btn-primary" type="button" onClick={onMulaiAjukan}>Mulai ajukan proposal <b>&rarr;</b></button>
          <a className="link-more" href="#tentang">Pelajari PKM <b>&rsaquo;</b></a>
        </div>
        <div className="ref-social">
          <div className="avatars" aria-hidden="true"><span>AR</span><span>DN</span><span>RS</span><span className="more">&bull;</span></div>
          <p><b>1.248 mahasiswa</b><br />telah bergabung tahun ini</p>
        </div>
      </div>
      <div className="ref-hero-art">
        <HeroBrandLogo />
      </div>
    </section>
  )
}

function StatsBar() {
  const items = [
    ['321', 'Proposal terdata (2026)'],
    ['168', 'Dosen pembimbing'],
    ['23', 'Reviewer internal'],
    ['8', 'Fakultas berpartisipasi'],
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
    {
      tag: 'DIDUKUNG AI',
      tagClass: 'gold',
      title: 'Uji kekuatan idemu',
      copy: 'Dapatkan analisis kebaruan, dampak, dan kelayakan ide sebelum menyusun proposal.',
      link: 'Coba PKMATE',
      href: '#pkmate',

      dark: true,
    },
    {
      tag: 'KOLABORASI MULTIDISIPLIN',
      tagClass: 'blue',
      title: 'Temukan tim multidisiplin',
      copy: 'Rekomendasi anggota dengan kompetensi yang saling melengkapi dari seluruh fakultas.',
      link: 'Cari anggota',
      href: '#mahasiswa/caritim',
      dark: false,
    },
    {
      tag: 'MENTORSHIP TERARAH',
      tagClass: 'green',
      title: 'Terhubung dengan mentor',
      copy: 'Pilih dosen pembimbing berdasarkan bidang riset dan pengalaman PKM.',
      link: 'Lihat pembimbing',
      href: '#mahasiswa/caritim',
      dark: false,
    },
  ]
  return (
    <section className="ref-eco" id="tentang">
      <p className="ref-eyebrow gold">EKOSISTEM TERINTEGRASI</p>
      <h2>Ide hebat dimulai dari <span className="hl-blue">langkah</span> <span className="hl-blue underline-gold">pertama.</span></h2>
      <p className="ref-desc">Teknologi membantu proses, kolaborasi menguatkan ide, dan mentor mengarahkanmu menuju dampak yang nyata.</p>
      <div className="ref-eco-grid">
        {cards.map((c, i) => (
          <GlowCard
            key={c.title}
            customSize
            dark={c.dark}
            glowColor={c.dark ? 'gold' : i === 1 ? 'blue' : 'green'}
            className={`eco-card ${c.dark ? 'dark' : ''}`}
          >
            <div className="eco-top">
              {c.tag && <span className={`eco-tag ${c.tagClass || ''}`}>{c.tag}</span>}
            </div>
            <h3>{c.title}</h3>
            <p>{c.copy}</p>
            <a href={c.href}>
              {c.link} <span aria-hidden="true">&rarr;</span>
            </a>
          </GlowCard>
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
        <button className="btn-outline" type="button" onClick={() => window.alert('Fitur kalender segera hadir.')}>Tambahkan ke kalender</button>
      </div>
      <ol className="tl-right">
        {shown.map((s, i) => (
          <li key={s.id ?? i} className={i === 0 ? 'active' : ''}>
            <span className="tl-num">{i === 0 ? '01' : `0${i + 1}`}</span>
            <div>
              <small>{i === 0 ? 'SEDANG BERLANGSUNG' : s.note?.toUpperCase().includes('TAHAP') ? s.note : `TAHAP ${i + 1}`}</small>
              <h3>{s.stage}</h3>
              <p>{s.label}</p>
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
      <div className="ref-news-head"><h2>Berita dari PKM Center</h2><a href="#berita">Lihat semua berita <b>&rarr;</b></a></div>
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
              <span className="read">Baca selengkapnya <b>&rarr;</b></span>
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
      <div className="panduan-ico" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
      </div>
      <div>
        <p className="ref-eyebrow gold left small">PANDUAN RESMI</p>
        <h2>Siap menyusun proposal terbaikmu?</h2>
        <p>Unduh panduan PKM {latest?.year || 2025} dan pahami setiap ketentuan sebelum memulai.</p>
      </div>
      <a className="btn-primary" href={latest?.fileUrl || '#pedoman'} target={latest?.fileUrl ? '_blank' : undefined} rel="noreferrer">Unduh panduan PKM {latest?.year || 2025} <b>&rarr;</b></a>
    </section>
  )
}

export function Home({ anchor = 'beranda', user, onLogin }) {
  useEffect(() => {
    if (anchor && anchor !== 'beranda') {
      const el = document.getElementById(anchor)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50)
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [anchor])

  const handleMulaiAjukan = () => {
    if (!user) {
      onLogin()
      return
    }
    if (user.role === 'mahasiswa') {
      window.location.hash = '#mahasiswa/ajukan-proposal'
    } else {
      window.location.hash = '#kontak'
    }
  }

  return (
    <main className="ref-page">
      <div className="ref-hero-screen" id="beranda">
        <HeroSection onMulaiAjukan={handleMulaiAjukan} />
        <StatsBar />
      </div>
      <Ecosystem />
      <Timeline />
      <NewsPreview />
      <PanduanBanner />
    </main>
  )
}
