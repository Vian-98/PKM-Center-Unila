import { api } from './content'

// Helper bersama untuk modul Portal Mahasiswa (Anggota 2 — Favian).

// apiOrigin adalah origin backend tanpa suffix "/api" (untuk berkas statis).
export const apiOrigin = api.replace(/\/api\/?$/, '')

// resolveAssetUrl mengubah tautan relatif backend (mis. "/uploads/x.pdf")
// menjadi URL absolut yang dapat dibuka dari origin frontend.
export function resolveAssetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`
}

export function getToken() {
  return localStorage.getItem('pkm_token')
}

// authFetch mengirim permintaan ke backend dengan token JWT bila tersedia.
export async function authFetch(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${api}${path}`, { ...options, headers })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || `Permintaan gagal (${response.status})`)
  return result
}

// uploadFile mengirim berkas multipart ke /student/upload dan mengembalikan
// { url, name, size }. Tidak memakai header Content-Type agar boundary otomatis.
export async function uploadFile(file) {
  const token = getToken()
  const body = new FormData()
  body.append('file', file)
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${api}/student/upload`, { method: 'POST', headers, body })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Gagal mengunggah berkas')
  return result.data
}

export async function getNotifications() {
  return authFetch('/student/notifications')
}

export async function getStudents(query = '') {
  const q = query ? `?q=${encodeURIComponent(query)}` : ''
  return authFetch(`/student/students${q}`)
}

export async function markNotificationsRead() {
  return authFetch('/student/notifications/read', { method: 'POST' })
}

export const STATUS_LABELS = {
  draft: 'Draft Usulan',
  submitted: 'Sudah Diajukan',
  under_review: 'Sedang Direview',
  revision: 'Perlu Revisi',
  approved: 'Disetujui Internal',
  funded: 'Lolos Didanai',
  completed: 'Selesai',
  rejected: 'Ditolak',
  pending: 'Menunggu',
  accepted: 'Disetujui',
  assigned: 'Ditugaskan',
  in_progress: 'Sedang Berjalan',
}

// statusTone memetakan status ke kelas warna .status-pill yang tersedia.
export function statusTone(status) {
  switch (status) {
    case 'funded':
    case 'approved':
    case 'completed':
    case 'accepted':
      return 'completed'
    case 'rejected':
      return 'rejected'
    case 'submitted':
    case 'under_review':
    case 'in_progress':
    case 'assigned':
      return 'in_progress'
    default:
      return 'pending'
  }
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || 'Tidak diketahui'
}

export function formatDateID(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateTimeID(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export async function getTeamInvitations() {
  return authFetch('/student/invitations')
}

export async function sendTeamInvitation(payload) {
  return authFetch('/student/invitations', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function respondTeamInvitation(id, action) {
  return authFetch(`/student/invitations/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action })
  })
}

