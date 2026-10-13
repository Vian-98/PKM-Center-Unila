import { useState } from 'react'

const DOSEN_LIST = [
  { name: 'Dr. Budi Dosen, S.T., M.T.', fakultas: 'Teknik', bidang: 'IoT, AI' },
  { name: 'Dr. Sumargono, M.Pd.', fakultas: 'FKIP', bidang: 'Pendidikan Sejarah' },
  { name: 'Darmansyah, S.T., M.T., Ph.D.', fakultas: 'FT', bidang: 'Computer Vision' },
  { name: 'Yusuf Perdana, S.Pd., M.Pd.', fakultas: 'FKIP', bidang: 'Pembelajaran' },
]

const MAHASISWA_LIST = [
  { name: 'Nadia Putri Maharani', prodi: 'Teknik Elektro', minat: 'Smart IoT' },
  { name: 'Rian Saputra', prodi: 'Kimia', minat: 'Energi Terbarukan' },
  { name: 'Fajar Nugroho', prodi: 'Proteksi Tanaman', minat: 'SIG & Pertanian' },
]

export function CariTim() {
  const [tab, setTab] = useState('dosen')

  return (
    <main className="page-dosen">
      <div className="dosen-hero">
        <div className="dosen-hero-content">
          <h1>Cari Tim & Pembimbing</h1>
          <p>Temukan dosen pembimbing dan calon anggota tim multidisiplin</p>
        </div>
      </div>

      <div style={{ padding: '1.5rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="dosen-tabs">
          <button className={`dosen-tab ${tab === 'dosen' ? 'active' : ''}`} onClick={() => setTab('dosen')}>Direktori Dosen</button>
          <button className={`dosen-tab ${tab === 'mahasiswa' ? 'active' : ''}`} onClick={() => setTab('mahasiswa')}>Mahasiswa Mencari Tim</button>
        </div>

        {tab === 'dosen' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            {DOSEN_LIST.map((d, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3>{d.name}</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{d.fakultas}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Bidang: {d.bidang}</div>
                <button style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', background: '#0b2149', color: '#fff', borderRadius: '0.375rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Undang sebagai Pembimbing</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'mahasiswa' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            {MAHASISWA_LIST.map((m, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3>{m.name}</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{m.prodi}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Minat: {m.minat}</div>
                <button style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', background: '#059669', color: '#fff', borderRadius: '0.375rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Undang ke Tim</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
