import React, { useId } from 'react'

const cleanId = (raw) => raw.replace(/[^a-zA-Z0-9_-]/g, '')

/** Bintang empat sudut kecil untuk aksen dekoratif. */
function Sparkle({ x, y, size = 8, fill = '#ffd700' }) {
  const s = size
  const k = s * 0.28
  const d = `M${x} ${y - s} L${x + k} ${y - k} L${x + s} ${y} L${x + k} ${y + k} L${x} ${y + s} L${x - k} ${y + k} L${x - s} ${y} L${x - k} ${y - k} Z`
  return <path d={d} fill={fill} />
}

/**
 * HeroIllustration — adegan "ruang kerja ide" untuk beranda.
 *
 * Menggantikan ilustrasi orang berbasis CSS dengan komposisi SVG:
 * dokumen proposal, cincin orbit, badge lampu ide, dan chip mentorship.
 * Skalanya tajam di semua resolusi dan otomatis menghormati
 * prefers-reduced-motion lewat CSS.
 */
export function HeroIllustration() {
  const uid = cleanId(useId())
  const id = (name) => `${uid}-${name}`

  return (
    <svg
      className="hero-illustration"
      viewBox="0 0 460 440"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id('doc')} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef7ff" />
        </linearGradient>
        <linearGradient id={id('navy')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c6398" />
          <stop offset="1" stopColor="#123b66" />
        </linearGradient>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4aa6e3" />
          <stop offset="1" stopColor="#175b91" />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe45c" />
          <stop offset="1" stopColor="#e0a800" />
        </linearGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#cfeeff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#cfeeff" stopOpacity="0" />
        </radialGradient>
        <filter id={id('soft')} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#123b66" floodOpacity="0.18" />
        </filter>
      </defs>

      <g className="hero-illustration__scene">
        <ellipse cx="242" cy="222" rx="206" ry="196" fill={`url(#${id('halo')})`} />

        <g className="hero-illustration__orbits" stroke="#123b66" fill="none">
          <ellipse cx="246" cy="222" rx="182" ry="166" strokeOpacity="0.13" strokeWidth="1.6" strokeDasharray="2 12" />
          <ellipse cx="246" cy="222" rx="142" ry="126" strokeOpacity="0.1" strokeWidth="1.2" strokeDasharray="2 9" />
        </g>

        <g stroke="#2f8fd0" strokeOpacity="0.34" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="5 8" fill="none">
          <path d="M120 128 C150 150 168 168 186 186" />
          <path d="M104 330 C140 322 160 300 176 274" />
          <path d="M352 138 C342 160 334 176 326 196" />
        </g>
        <circle cx="120" cy="128" r="4" fill="#ffd700" />
        <circle cx="104" cy="330" r="4" fill="#0f766e" />
        <circle cx="352" cy="138" r="3.4" fill="#2f8fd0" />

        <g transform="rotate(8 250 220)">
          <rect x="176" y="86" width="168" height="228" rx="22" fill="#d9ecfa" opacity="0.72" />
        </g>

        <g transform="rotate(-4 250 220)" filter={`url(#${id('soft')})`}>
          <rect x="170" y="88" width="168" height="228" rx="22" fill={`url(#${id('doc')})`} stroke="#d7e9f8" strokeWidth="1.5" />
          <path d="M192 88 H316 A22 22 0 0 1 338 110 V150 H170 V110 A22 22 0 0 1 192 88 Z" fill={`url(#${id('navy')})`} />
          <circle cx="192" cy="112" r="7" fill="#ffd700" />
          <rect x="208" y="106" width="66" height="7" rx="3.5" fill="#ffffff" fillOpacity="0.92" />
          <rect x="208" y="119" width="44" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.5" />
          <rect x="300" y="104" width="22" height="6" rx="3" fill="#ffd700" fillOpacity="0.85" />

          <rect x="190" y="170" width="94" height="8" rx="4" fill="#c9dff1" />
          <rect x="190" y="187" width="128" height="8" rx="4" fill="#e2eef9" />
          <rect x="190" y="204" width="112" height="8" rx="4" fill="#e2eef9" />
          <rect x="190" y="221" width="72" height="8" rx="4" fill="#ffd700" fillOpacity="0.85" />

          <rect x="190" y="262" width="18" height="32" rx="6" fill="#cfe4f4" />
          <rect x="214" y="250" width="18" height="44" rx="6" fill="#9dcdf0" />
          <rect x="238" y="258" width="18" height="36" rx="6" fill="#cfe4f4" />
          <rect x="262" y="240" width="18" height="54" rx="6" fill={`url(#${id('sky')})`} />

          <circle cx="316" cy="288" r="18" fill={`url(#${id('gold')})`} />
          <path d="M308 288 L314 294 L325 281" stroke="#5b4400" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g filter={`url(#${id('soft')})`}>
          <circle cx="352" cy="96" r="33" fill="#ffffff" stroke="#ffe08a" strokeWidth="2" />
          <path
            d="M352 78c-8.3 0-15 6.7-15 15 0 4.6 2 8.2 5 10.9 1.8 1.7 2.6 3.2 2.8 4.6h14.4c.2-1.4 1-2.9 2.8-4.6 3-2.7 5-6.3 5-10.9 0-8.3-6.7-15-15-15Z"
            fill={`url(#${id('gold')})`}
          />
          <path d="M345 110.5h14" stroke="#c8930a" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M352 86v11M346.5 91.5h11" stroke="#8a6500" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        <g filter={`url(#${id('soft')})`}>
          <rect x="48" y="300" width="104" height="62" rx="18" fill="#ffffff" stroke="#d7ead9" strokeWidth="1.5" />
          <circle cx="78" cy="331" r="17" fill="#e8f7ef" />
          <path d="M71 329v5c0 2 3.1 3.6 7 3.6s7-1.6 7-3.6v-5" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M78 321l11 5-11 5-11-5 11-5Z" fill="#0f766e" />
          <rect x="104" y="320" width="30" height="7" rx="3.5" fill="#cbe7d8" />
          <rect x="104" y="334" width="22" height="6" rx="3" fill="#e2f2ea" />
        </g>

        <g className="hero-illustration__sparkles">
          <Sparkle x={404} y={210} size={9} />
          <Sparkle x={92} y={196} size={6} fill="#2f8fd0" />
          <Sparkle x={382} y={330} size={6} />
        </g>
      </g>
    </svg>
  )
}

/**
 * FeatureGlyph — ilustrasi mini untuk kartu ekosistem.
 * Varian: "ai" (lampu ide), "team" (kolaborasi), "mentor" (pendampingan).
 */
export function FeatureGlyph({ variant = 'ai' }) {
  const uid = cleanId(useId())
  const id = (name) => `${uid}-${name}`

  return (
    <svg
      className={`feature-glyph feature-glyph--${variant}`}
      viewBox="0 0 64 64"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe45c" />
          <stop offset="1" stopColor="#e0a800" />
        </linearGradient>
        <linearGradient id={id('blue')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4aa6e3" />
          <stop offset="1" stopColor="#175b91" />
        </linearGradient>
        <linearGradient id={id('green')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>

      {variant === 'team' && (
        <g>
          <circle cx="32" cy="34" r="25" fill="#eaf4fe" />
          <circle cx="32" cy="34" r="25" fill="none" stroke="#bfdcf5" strokeWidth="1.5" strokeDasharray="3 5" />
          <path d="M14 18 Q32 6 50 18" stroke="#7ec3ea" strokeWidth="2.2" fill="none" strokeDasharray="4 4" strokeLinecap="round" />
          <circle cx="43.5" cy="30" r="6" fill="#9fd0ef" />
          <path d="M33 49c0-5.8 4.7-10.5 10.5-10.5S54 43.2 54 49" fill="#9fd0ef" />
          <circle cx="23" cy="27" r="7.5" fill={`url(#${id('blue')})`} stroke="#ffffff" strokeWidth="2" />
          <path d="M10 49c0-7.2 5.8-13 13-13s13 5.8 13 13" fill={`url(#${id('blue')})`} stroke="#ffffff" strokeWidth="2" />
        </g>
      )}

      {variant === 'mentor' && (
        <g>
          <circle cx="32" cy="34" r="25" fill="#e9f8f0" />
          <circle cx="32" cy="34" r="25" fill="none" stroke="#b9e8d0" strokeWidth="1.5" strokeDasharray="3 5" />
          <path d="M19 27v9c0 4.6 5.8 8.5 13 8.5s13-3.9 13-8.5v-9" fill={`url(#${id('green')})`} />
          <path d="M32 14 L54 24 L32 34 L10 24 Z" fill="#0f766e" />
          <path d="M32 19 L45 24.4 L32 29.8 L19 24.4 Z" fill="#2dd4bf" fillOpacity="0.55" />
          <path d="M50 25v11" stroke="#c8930a" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="50" cy="38" r="3.2" fill="#ffd700" />
          <Sparkle x={14} y={14} size={3} fill="#ffd700" />
        </g>
      )}

      {variant === 'ai' && (
        <g>
          <circle cx="32" cy="34" r="25" fill="#fff7db" />
          <circle cx="32" cy="34" r="25" fill="none" stroke="#ffe9a3" strokeWidth="1.5" strokeDasharray="3 5" />
          <path
            d="M32 12c-9.4 0-17 7.6-17 17 0 5.2 2.3 9.3 5.7 12.4 2 1.9 2.9 3.6 3.1 5.2h16.4c.2-1.6 1.1-3.3 3.1-5.2 3.4-3.1 5.7-7.2 5.7-12.4 0-9.4-7.6-17-17-17Z"
            fill={`url(#${id('gold')})`}
          />
          <path d="M26.5 50h11" stroke="#c8930a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 21v10M27 26h10" stroke="#8a6500" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="52" cy="18" r="3" fill="#ffd700" />
          <circle cx="12" cy="46" r="2.2" fill="#e0a800" fillOpacity="0.85" />
        </g>
      )}
    </svg>
  )
}

export default HeroIllustration
