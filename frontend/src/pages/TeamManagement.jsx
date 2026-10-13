import { useState, useEffect } from 'react'
import { loadStore, saveStore } from '../lib/dosenReviewerData'

export function TeamManagement() {
  const [team, setTeam] = useState(() => loadStore('pkm_mhs_team', {
    name: 'Tim PKM Unggulan',
    leader: 'Nadia Putri Maharani',
    members: [
      { name: 'Nadia Putri Maharani', role: 'Ketua' },
      { name: 'Rian Saputra', role: 'Anggota' },
      { name: 'Fajar Nugroho', role: 'Anggota' },
    ],
    invitations: []
  }))

  useEffect(() => { saveStore('pkm_mhs_team', team) }, [team])

  return (
    <main className="page-dosen">
      <div className="dosen-hero">
        <div className="dosen-hero-content">
          <h1>Manajemen Tim</h1>
          <p>Kelola anggota tim dan undangan rekrutmen</p>
        </div>
      </div>

      <div style={{ padding: '1.5rem 2rem 2rem', maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h3>Anggota Tim</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {team.members.map((m, i) => (
              <div key={i} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h3>Undangan Terkirim</h3>
          <div style={{ marginTop: '1rem', color: '#64748b' }}>
            {team.invitations.length === 0 ? 'Belum ada undangan' : team.invitations.map((inv, i) => (
              <div key={i}>{inv.name} - {inv.status}</div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
