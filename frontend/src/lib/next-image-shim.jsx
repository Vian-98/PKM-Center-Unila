import React from 'react'

export default function Image({ src, alt = '', className, width, height, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      {...props}
    />
  )
}
