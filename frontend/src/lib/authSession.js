// Utilitas Pengelolaan Sesi & Autentikasi PKM Center Unila
// Mendukung pemisahan sessionStorage (default: sesi tab bersih saat browser ditutup)
// dan localStorage (jika user mencentang 'Ingat Saya').

export function getAuthToken() {
  return sessionStorage.getItem('pkm_token') || localStorage.getItem('pkm_token') || ''
}

export function getAuthUser() {
  // 1. Cek sessionStorage terlebih dahulu (sesi aktif tanpa "Ingat Saya")
  let raw = sessionStorage.getItem('pkm_user')

  // 2. Jika tidak ada di sessionStorage, cek di localStorage HANYA jika opsi "Ingat Saya" dicentang
  if (!raw) {
    const isRemembered = localStorage.getItem('pkm_remember') === '1'
    if (isRemembered) {
      raw = localStorage.getItem('pkm_user')
    } else {
      // Jika ada sisa sesi lama tanpa flag remember, bersihkan agar tidak tertinggal
      if (localStorage.getItem('pkm_user') || localStorage.getItem('pkm_token')) {
        localStorage.removeItem('pkm_user')
        localStorage.removeItem('pkm_token')
      }
    }
  }

  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setAuthSession(user, token, remember = false) {
  // Bersihkan data sesi sebelumnya agar bersih
  clearAuthSession()

  const storage = remember ? localStorage : sessionStorage
  if (user) {
    storage.setItem('pkm_user', typeof user === 'string' ? user : JSON.stringify(user))
  }
  if (token) {
    storage.setItem('pkm_token', token)
  }
  if (remember) {
    localStorage.setItem('pkm_remember', '1')
  }

  const nowStr = Date.now().toString()
  storage.setItem('pkm_last_activity', nowStr)
}

export function updateAuthUser(user) {
  const isSession = !!sessionStorage.getItem('pkm_user')
  const storage = isSession ? sessionStorage : localStorage
  storage.setItem('pkm_user', typeof user === 'string' ? user : JSON.stringify(user))
}

export function updateAuthToken(token) {
  const isSession = !!sessionStorage.getItem('pkm_token')
  const storage = isSession ? sessionStorage : localStorage
  storage.setItem('pkm_token', token)
}

export function clearAuthSession() {
  localStorage.removeItem('pkm_user')
  localStorage.removeItem('pkm_token')
  localStorage.removeItem('pkm_remember')
  localStorage.removeItem('pkm_last_activity')

  sessionStorage.removeItem('pkm_user')
  sessionStorage.removeItem('pkm_token')
  sessionStorage.removeItem('pkm_last_activity')
  sessionStorage.removeItem('pkm_session_only')
}

export function recordAuthActivity() {
  const storage = sessionStorage.getItem('pkm_user') ? sessionStorage : localStorage
  storage.setItem('pkm_last_activity', Date.now().toString())
}

export function checkAuthInactivity(maxMinutes = 30) {
  const raw = sessionStorage.getItem('pkm_last_activity') || localStorage.getItem('pkm_last_activity')
  if (!raw) return false
  const lastTime = parseInt(raw, 10)
  if (isNaN(lastTime)) return false
  return Date.now() - lastTime > maxMinutes * 60 * 1000
}
