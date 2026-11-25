import React from 'react'

const MARK_SOURCES = {
  pkm: {
    base: 'pkm-mark',
    widths: [128, 256, 512],
    alt: 'Logo PKM Center Universitas Lampung',
  },
  unila: {
    base: 'unila-mark',
    widths: [128, 256],
    alt: 'Logo Universitas Lampung',
  },
}

/**
 * BrandMark menampilkan satu lambang (PKM Center atau Unila) dengan
 * WebP beresolusi ganda dan fallback PNG. Ukuran visual diatur CSS;
 * prop `size` hanya menjadi petunjuk ukuran intrinsik gambar.
 */
export function BrandMark({
  kind = 'pkm',
  size = 96,
  className = '',
  alt,
  loading = 'eager',
  decorative = true,
}) {
  const source = MARK_SOURCES[kind] || MARK_SOURCES.pkm
  const widths = source.widths
  const srcSet = widths
    .map((width, index) => `/brand/${source.base}-${width}.webp ${index + 1}x`)
    .join(', ')

  return (
    <span className={`brand-mark brand-mark--${kind} ${className}`.trim()}>
      <picture>
        <source type="image/webp" srcSet={srcSet} />
        <img
          src={`/brand/${source.base}-${widths[0]}.png`}
          alt={decorative ? '' : alt || source.alt}
          width={size}
          height={size}
          loading={loading}
          decoding="async"
          draggable="false"
        />
      </picture>
    </span>
  )
}

export default BrandMark
