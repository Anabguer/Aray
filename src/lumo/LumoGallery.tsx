import { Lumo } from '@/lumo/Lumo'
import type { LumoIntensity, LumoState } from '@/lumo/types'

const states: { state: LumoState; intensity: LumoIntensity; title: string; note: string }[] = [
  { state: 'idle', intensity: 0, title: 'Idle', note: 'Respiración, parpadeo, mirada ocasional' },
  { state: 'thinking', intensity: 0, title: 'Thinking', note: 'Esperando respuesta — fidget breve' },
  { state: 'correct', intensity: 1, title: 'Correct', note: 'Acierto — saltito y manitas arriba' },
  { state: 'incorrect', intensity: 1, title: 'Incorrect', note: 'Pensativo — inclina y reintenta' },
  { state: 'streak', intensity: 2, title: 'Streak / energía', note: 'Pulso de barriga una vez' },
  { state: 'celebration', intensity: 4, title: 'Celebration', note: 'Meta / racha alta' },
]

/** Galería de estados de Lumo para QA visual. Ruta: /dev/lumo */
export function LumoGallery() {
  return (
    <div className="lumo-gallery">
      <header className="lumo-gallery__head">
        <h1>Lumo — estados</h1>
        <p>Tamaños sm / md / lg y cada estado animable.</p>
      </header>

      <section className="lumo-gallery__sizes" aria-label="Tamaños en cabecera">
        <h2>Tamaño real (hero lg · juego md · meta sm)</h2>
        <div className="lumo-gallery__size-row">
          <figure>
            <Lumo state="idle" size="lg" />
            <figcaption>lg · 7rem · hero</figcaption>
          </figure>
          <figure>
            <Lumo state="idle" size="md" />
            <figcaption>md · 5.5rem · juego</figcaption>
          </figure>
          <figure>
            <Lumo state="idle" size="sm" />
            <figcaption>sm · 3.75rem · meta</figcaption>
          </figure>
        </div>
      </section>

      <section className="lumo-gallery__states" aria-label="Estados">
        <h2>Estados</h2>
        <div className="lumo-gallery__grid">
          {states.map((item) => (
            <figure key={item.state} className="lumo-gallery__card" data-state={item.state}>
              <Lumo state={item.state} intensity={item.intensity} size="lg" />
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <style>{`
        .lumo-gallery {
          max-width: 56rem;
          margin: 0 auto;
          padding: 1.25rem 1rem 3rem;
          color: var(--text, #eef7ff);
        }
        .lumo-gallery__head h1 {
          margin: 0 0 0.25rem;
          font-family: var(--font-display, Outfit, sans-serif);
          font-size: 1.5rem;
        }
        .lumo-gallery__head p,
        .lumo-gallery__sizes h2,
        .lumo-gallery__states h2 {
          margin: 0 0 1rem;
          color: var(--text-muted, #9db6d4);
          font-size: 0.95rem;
        }
        .lumo-gallery__sizes h2,
        .lumo-gallery__states h2 {
          margin-top: 1.5rem;
          color: var(--text, #eef7ff);
          font-family: var(--font-display, Outfit, sans-serif);
          font-size: 1.1rem;
        }
        .lumo-gallery__size-row,
        .lumo-gallery__grid {
          display: grid;
          gap: 1rem;
        }
        .lumo-gallery__size-row {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: end;
        }
        .lumo-gallery__grid {
          grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
        }
        .lumo-gallery figure {
          margin: 0;
          display: grid;
          justify-items: center;
          gap: 0.65rem;
          padding: 1rem 0.75rem;
          border-radius: 1rem;
          background: rgba(16, 40, 74, 0.65);
          border: 1px solid rgba(56, 189, 248, 0.18);
        }
        .lumo-gallery figcaption {
          display: grid;
          gap: 0.2rem;
          text-align: center;
          font-size: 0.78rem;
          color: var(--text-muted, #9db6d4);
        }
        .lumo-gallery figcaption strong {
          color: var(--text, #eef7ff);
          font-size: 0.88rem;
        }
      `}</style>
    </div>
  )
}
