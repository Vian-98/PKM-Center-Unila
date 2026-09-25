export function Breadcrumb({ trail }) {
  return (
    <nav className="breadcrumb" aria-label="Jalur navigasi">
      {trail.map(([label, href], index) => (
        <span key={label} className={href ? '' : 'breadcrumb-current'}>
          {href ? <a href={href}>{label}</a> : <span aria-current="page">{label}</span>}
          {index < trail.length - 1 && <b aria-hidden="true">/</b>}
        </span>
      ))}
    </nav>
  )
}