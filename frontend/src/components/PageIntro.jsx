export function PageIntro({ eyebrow, title, copy }) {
  return <section className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></section>
}