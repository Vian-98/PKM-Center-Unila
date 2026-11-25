import React, { useRef, useState } from 'react'
import { BrandMark } from './BrandMark'

/**
 * HeroBrandLogo — emblem interaktif beranda PKM Center Unila.
 *
 * Lapisan animasi:
 *  1. Ambient radial halo yang bernapas lembut (emas & biru langit).
 *  2. Conic-gradient rim glow berputar halus di tepi luar.
 *  3. Dua lintasan orbit berlawanan arah dengan satelit cahaya (emas & biru).
 *  4. Medallion logo resolusi tinggi dengan diagonal glass sheen sweep.
 *  5. Parallax 3D tilt interaktif saat kursor melintas di atas emblem.
 *
 * Semua gerakan dinonaktifkan otomatis lewat prefers-reduced-motion.
 */
export function HeroBrandLogo({ compact = false }) {
  const stageRef = useRef(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false })

  const handleMouseMove = (event) => {
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    setTilt({
      rx: Math.max(-1, Math.min(1, -dy)) * 9,
      ry: Math.max(-1, Math.min(1, dx)) * 9,
      active: true,
    })
  }

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, active: false })
  }

  return (
    <div
      ref={stageRef}
      className={`hero-brand${compact ? ' hero-brand--compact' : ''}${tilt.active ? ' is-tilting' : ''}`}
      role="img"
      aria-label="Lambang PKM Center Universitas Lampung"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="hero-brand__stage"
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale(1.03)`
            : undefined,
        }}
      >
        <span className="hero-brand__glow" aria-hidden="true" />
        <span className="hero-brand__conic" aria-hidden="true" />

        <span className="hero-brand__orbit hero-brand__orbit--outer" aria-hidden="true">
          <span className="hero-brand__satellite hero-brand__satellite--gold" />
        </span>

        <span className="hero-brand__orbit hero-brand__orbit--inner" aria-hidden="true">
          <span className="hero-brand__satellite hero-brand__satellite--sky" />
        </span>

        <svg className="hero-brand__arc" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
          <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>

        <span className="hero-brand__mark">
          <span className="hero-brand__sheen" aria-hidden="true" />
          <BrandMark kind="pkm" size={256} loading="eager" />
        </span>
      </div>
    </div>
  )
}

export default HeroBrandLogo
