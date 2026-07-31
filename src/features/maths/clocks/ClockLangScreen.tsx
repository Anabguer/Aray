import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockLang } from '@/clock/types'

export function ClockLangScreen() {
  const navigate = useNavigate()
  const { lang, setLang } = useClockSession()

  function choose(next: ClockLang) {
    setLang(next)
    navigate('/missions/mates/clocks/modes')
  }

  return (
    <AppShell title="HORAS" shortTitle="Horas" showBack backTo="/missions/mates">
      <section className="clock-lang" aria-labelledby="clock-lang-title">
        <h2 id="clock-lang-title" className="clock-lang__title">
          ¿En qué idioma practicas?
        </h2>
        <p className="clock-lang__lead">
          Catalán con sistema de campanar (quarts) o castellano. Puedes cambiarlo cuando quieras.
        </p>
        <div className="clock-lang__grid">
          <button
            type="button"
            className={`clock-lang__card${lang === 'es' ? ' is-active' : ''}`}
            onClick={() => choose('es')}
          >
            <span className="clock-lang__flag" aria-hidden="true">
              ES
            </span>
            <span className="clock-lang__name">Castellano</span>
            <span className="clock-lang__sample">la una y cuarto</span>
          </button>
          <button
            type="button"
            className={`clock-lang__card${lang === 'ca' ? ' is-active' : ''}`}
            onClick={() => choose('ca')}
          >
            <span className="clock-lang__flag" aria-hidden="true">
              CA
            </span>
            <span className="clock-lang__name">Català</span>
            <span className="clock-lang__sample">un quart de les dues</span>
          </button>
        </div>
      </section>
    </AppShell>
  )
}
