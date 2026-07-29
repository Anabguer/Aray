import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { comingSoonCopy } from '@/data/demo'

export function ComingSoonScreen({
  zoneKey,
  titleOverride,
}: {
  zoneKey: keyof typeof comingSoonCopy
  titleOverride?: string
}) {
  const copy = comingSoonCopy[zoneKey]
  const title = titleOverride ?? copy.title

  return (
    <AppShell title={title} showBack>
      <section className="coming-soon" aria-labelledby="coming-soon-title">
        <div className="coming-soon__panel">
          <p className="coming-soon__badge">Próximamente</p>
          <p id="coming-soon-title" className="coming-soon__title">
            {title}
          </p>
          <p className="coming-soon__body">{copy.body}</p>
          <Link to="/" className="btn btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
