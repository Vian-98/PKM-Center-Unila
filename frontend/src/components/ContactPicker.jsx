import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

const initialsOf = name => (name || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'PK'

// Pemilih akun untuk chat baru. Pengganti <select> bawaan browser:
// daftar selalu terbuka ke bawah (di dalam alur modal), bisa dicari, dan dikelompokkan per peran.
export function ContactPicker({ options, groups, value, onChange, placeholder = 'Pilih akun terdaftar' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)

  const selected = options.find(o => o.id === value)

  useEffect(() => {
    if (!open) return
    const focusTimer = setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 30)
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = o => !q || `${o.name} ${o.faculty || ''}`.toLowerCase().includes(q)
    return groups
      .map(g => ({ ...g, items: options.filter(o => g.match(o) && match(o)) }))
      .filter(g => g.items.length > 0)
  }, [options, groups, query])

  const pick = (id) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const first = grouped[0]?.items[0]
      if (first) pick(first.id)
    }
  }

  return (
    <div className={`contact-picker ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="contact-picker-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="contact-picker-value">
            <span className="contact-picker-avatar">{initialsOf(selected.name)}</span>
            <span className="contact-picker-text">
              <strong>{selected.name}</strong>
              {selected.faculty && <small>{selected.faculty}</small>}
            </span>
          </span>
        ) : (
          <span className="contact-picker-placeholder">{placeholder}</span>
        )}
        <ChevronDown size={18} className="contact-picker-chevron" />
      </button>

      {open && (
        <div className="contact-picker-panel" onKeyDown={onKeyDown}>
          <div className="contact-picker-search">
            <Search size={16} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Cari nama atau fakultas..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="contact-picker-list" role="listbox">
            {options.length === 0 ? (
              <div className="contact-picker-empty">Memuat direktori akun...</div>
            ) : grouped.length === 0 ? (
              <div className="contact-picker-empty">Tidak ada akun yang cocok.</div>
            ) : (
              grouped.map(g => (
                <div key={g.label} className="contact-picker-group">
                  <div className="contact-picker-group-label">{g.label}</div>
                  {g.items.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      role="option"
                      aria-selected={o.id === value}
                      className={`contact-picker-option ${o.id === value ? 'selected' : ''}`}
                      onClick={() => pick(o.id)}
                    >
                      <span className="contact-picker-avatar">{initialsOf(o.name)}</span>
                      <span className="contact-picker-text">
                        <strong>{o.name}</strong>
                        {o.faculty && <small>{o.faculty}</small>}
                      </span>
                      {o.id === value && <Check size={16} className="contact-picker-check" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
