import { loadStore, saveStore } from './dosenReviewerData'

const INVITATIONS_KEY = 'pkm_mhs_team_invitations_global'

/**
 * Memuat semua undangan dari localStorage, sekaligus memindai undangan yang
 * sebelumnya tersimpan di store tim individual (pkm_mhs_team_*).
 */
export function getGlobalInvitations() {
  const globalList = loadStore(INVITATIONS_KEY, [])
  const scanned = [...globalList]
  const seenIds = new Set(globalList.map(i => i.id))

  // Pindai semua key localStorage untuk mendeteksi undangan yang dikirim sebelum sinkronisasi global
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('pkm_mhs_team_')) {
        const teamData = loadStore(key, null)
        if (teamData && Array.isArray(teamData.invitations)) {
          const senderName = teamData.leader || teamData.name?.replace('Tim PKM ', '') || 'Ketua Pengusul'
          const teamName = teamData.name || 'Tim PKM'
          const scheme = teamData.scheme || 'PKM-KC'
          const teamId = teamData.id || key.replace('pkm_mhs_team_', 'team-')

          teamData.invitations.forEach((inv, idx) => {
            const invId = inv.id || `${key}-inv-${idx}`
            if (!seenIds.has(invId)) {
              seenIds.add(invId)
              scanned.push({
                id: invId,
                teamId: teamId,
                teamName: teamName,
                scheme: scheme,
                senderId: teamId,
                senderName: senderName,
                senderEmail: teamData.leaderEmail || '',
                senderFaculty: 'FMIPA',
                senderProdi: 'S1 Ilmu Komputer',
                recipientId: inv.recipientId || inv.id,
                recipientName: inv.name,
                recipientEmail: inv.email || '',
                recipientNpm: inv.npm || '',
                recipientFaculty: inv.faculty || 'Universitas Lampung',
                recipientProdi: inv.prodi || '',
                roleOffered: inv.role || 'Calon Anggota Multidisiplin',
                message: `Halo ${inv.name}, kami mengundang Anda untuk bergabung ke dalam ${teamName} (${scheme}) sebagai ${inv.role || 'Calon Anggota Multidisiplin'}.`,
                status: inv.status?.toLowerCase().includes('terima') || inv.status === 'accepted' ? 'accepted' : (inv.status === 'rejected' ? 'rejected' : 'pending'),
                date: inv.date || 'Hari ini',
                createdAt: inv.createdAt || new Date().toISOString()
              })
            }
          })
        }
      }
    }
  } catch (err) {
    console.warn('Error scanning local team invitations:', err)
  }

  return scanned
}

/**
 * Menyimpan seluruh daftar undangan ke localStorage
 */
export function saveGlobalInvitations(invitations) {
  saveStore(INVITATIONS_KEY, invitations)
}

/**
 * Mencatat undangan baru ke global store
 */
export function recordNewInvitation(invite) {
  const all = getGlobalInvitations()
  const exists = all.find(i => 
    i.id === invite.id || 
    (i.teamId === invite.teamId && i.recipientName === invite.recipientName && i.status === 'pending')
  )
  if (exists) return all

  const updated = [invite, ...all]
  saveGlobalInvitations(updated)
  return updated
}

/**
 * Mengambil undangan masuk yang ditujukan kepada pengguna yang sedang aktif/login
 */
export function getIncomingInvitationsForUser(user, globalList) {
  if (!user) return []
  const list = globalList || getGlobalInvitations()
  const userEmail = (user.email || '').toLowerCase().trim()
  const userNpm = (user.studentNumber || user.npm || '').trim()
  const userName = (user.name || '').toLowerCase().trim()
  const userId = user.id

  return list.filter(inv => {
    // Abaikan jika bukan pending
    if (inv.status !== 'pending') return false

    // Cocokkan berdasarkan ID
    if (userId && inv.recipientId === userId) return true
    // Cocokkan berdasarkan Email
    if (userEmail && inv.recipientEmail && inv.recipientEmail.toLowerCase().trim() === userEmail) return true
    // Cocokkan berdasarkan NPM
    if (userNpm && inv.recipientNpm && inv.recipientNpm.trim() === userNpm) return true
    // Cocokkan berdasarkan Nama (e.g. Siti Nurhaliza)
    if (userName && inv.recipientName) {
      const rec = inv.recipientName.toLowerCase().trim()
      if (rec === userName || rec.includes(userName) || userName.includes(rec)) return true
    }
    return false
  })
}

/**
 * Mengambil undangan keluar yang dikirim oleh pengguna yang sedang aktif/login
 */
export function getOutgoingInvitationsForUser(user, globalList) {
  if (!user) return []
  const list = globalList || getGlobalInvitations()
  const userEmail = (user.email || '').toLowerCase().trim()
  const userName = (user.name || '').toLowerCase().trim()
  const userId = user.id

  return list.filter(inv => {
    if (userId && inv.senderId === userId) return true
    if (userEmail && inv.senderEmail && inv.senderEmail.toLowerCase().trim() === userEmail) return true
    if (userName && inv.senderName && inv.senderName.toLowerCase().trim() === userName) return true
    return false
  })
}

/**
 * Memperbarui status undangan lokal (accept / reject) dan menyinkronkannya
 * ke tim pengirim di localStorage agar anggota resmi bertambah.
 */
export function updateLocalInvitationStatus(inviteId, newStatus, currentUser = null) {
  const all = getGlobalInvitations()
  let targetInv = null

  const updated = all.map(inv => {
    if (inv.id === inviteId || inv.id?.includes(inviteId) || inviteId?.includes(inv.id)) {
      targetInv = {
        ...inv,
        status: newStatus,
        respondedAt: new Date().toISOString()
      }
      return targetInv
    }
    return inv
  })
  saveGlobalInvitations(updated)

  // Jika diterima, tambahkan juga mahasiswa ke tim pengirim
  if (targetInv && newStatus === 'accepted' && currentUser) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('pkm_mhs_team_')) {
          const teamData = loadStore(key, null)
          if (teamData && (teamData.id === targetInv.teamId || teamData.name === targetInv.teamName)) {
            const existingMembers = teamData.members || []
            const alreadyMember = existingMembers.some(m => 
              m.name?.toLowerCase() === currentUser.name?.toLowerCase() ||
              (currentUser.npm && m.npm === currentUser.npm)
            )
            if (!alreadyMember && existingMembers.length < 5) {
              const newMember = {
                name: currentUser.name || targetInv.recipientName,
                role: `Anggota ${existingMembers.length} (Multidisiplin)`,
                prodi: currentUser.studyProgram || currentUser.department || currentUser.faculty || 'Universitas Lampung',
                npm: currentUser.studentNumber || currentUser.npm || '-'
              }
              const updatedTeam = {
                ...teamData,
                members: [...existingMembers, newMember],
                invitations: (teamData.invitations || []).map(inv => 
                  inv.name?.toLowerCase() === (currentUser.name || targetInv.recipientName)?.toLowerCase()
                    ? { ...inv, status: 'Diterima' }
                    : inv
                )
              }
              saveStore(key, updatedTeam)
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error updating sender team store:', e)
    }
  }

  return { updatedList: updated, targetInv }
}
