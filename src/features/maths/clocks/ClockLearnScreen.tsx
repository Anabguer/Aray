import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnalogClock } from '@/components/AnalogClock'
import { AppShell } from '@/components/AppShell'
import { formatClockTime } from '@/clock/format'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockTime } from '@/clock/types'
import { Lumo } from '@/lumo/Lumo'

interface LearnStep {
  id: string
  title: string
  body: string
  tip: string
  demo: ClockTime
  /** Trozo de pizza iluminados (0–4). Solo ayuda catalana. */
  pizzaSlices?: 0 | 1 | 2 | 3 | 4
  slogan?: string
}

const STEPS_ES: LearnStep[] = [
  {
    id: 'punto',
    title: 'En punto',
    body: 'Cuando la minutera está en el 12, es la hora en punto. La horaria marca la hora.',
    tip: 'la una en punto · las dos en punto',
    demo: { hour: 3, minute: 0 },
  },
  {
    id: 'cuarto',
    title: 'Y cuarto',
    body: 'Si la minutera llega al 3, han pasado 15 minutos: decimos y cuarto.',
    tip: 'la una y cuarto',
    demo: { hour: 1, minute: 15 },
  },
  {
    id: 'media',
    title: 'Y media',
    body: 'En el 6 son 30 minutos: y media. Después puedes seguir sumando o decir menos…',
    tip: 'la una y media · las dos menos cuarto',
    demo: { hour: 1, minute: 30 },
  },
  {
    id: 'menos',
    title: 'Menos cuarto',
    body: 'Cerca de la hora siguiente usamos menos. En el 9: menos cuarto de la hora que viene.',
    tip: 'las dos menos cuarto (son la 1:45)',
    demo: { hour: 1, minute: 45 },
  },
]

/** Ayuda catalana: metáfora «pizza de la hora» (miramos la hora a la que vamos). */
const STEPS_CA: LearnStep[] = [
  {
    id: 'pizza',
    title: 'La pizza de la hora',
    body: 'Imagina la hora como una pizza de 4 trozos. Cada trozo es un quart. Cuando comes los 4, ¡llegas a la hora nueva!',
    tip: '1 trozo = un quart · 2 = dos · 3 = tres · 4 = hora nueva',
    demo: { hour: 1, minute: 0 },
    pizzaSlices: 0,
    slogan: 'En castellano miramos la hora en la que estamos. En catalán, la hora a la que vamos.',
  },
  {
    id: 'un-quart',
    title: '1 trozo → un quart',
    body: '1:15 — Ha pasado 1 trozo del camino hacia las 2. Decimos: un quart de les dues.',
    tip: '1:15 → un quart de les dues',
    demo: { hour: 1, minute: 15 },
    pizzaSlices: 1,
  },
  {
    id: 'dos-quarts',
    title: '2 y 3 trozos',
    body: '1:30 = 2 trozos → dos quarts de les dues. 1:45 = 3 trozos → tres quarts de les dues. Siempre hacia la hora que viene.',
    tip: '1:30 dos quarts · 1:45 tres quarts (de les dues)',
    demo: { hour: 1, minute: 30 },
    pizzaSlices: 2,
  },
  {
    id: 'arribada',
    title: '4 trozos = ¡llegaste!',
    body: '2:00 — Ya hemos llegado a las 2. Se acabó la pizza: són les dues en punt.',
    tip: '4 trozos → hora nueva',
    demo: { hour: 2, minute: 0 },
    pizzaSlices: 4,
  },
  {
    id: 'i-minuts',
    title: 'Si no es exacto',
    body: 'Si pasan minutos después de un trozo, los sumamos: 1:35 = dos quarts i cinc de les dues. 1:25 = un quart i deu de les dues.',
    tip: 'trozo + 5 o + 10 minutos',
    demo: { hour: 1, minute: 35 },
    pizzaSlices: 2,
  },
]

/** Pizza de 4 quarts: trozos “comidos” = camino hacia la hora siguiente. */
function HourPizza({ slices }: { slices: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <div className="hour-pizza" aria-hidden="true">
      <svg className="hour-pizza__svg" viewBox="0 0 120 120" width="148" height="148">
        <circle cx="60" cy="60" r="54" fill="#fff7ed" stroke="#9a3412" strokeWidth="3" />
        {/* 4 sectores: 12→3, 3→6, 6→9, 9→12 */}
        {[0, 1, 2, 3].map((i) => {
          const start = (i * 90 - 90) * (Math.PI / 180)
          const end = ((i + 1) * 90 - 90) * (Math.PI / 180)
          const x1 = 60 + Math.cos(start) * 54
          const y1 = 60 + Math.sin(start) * 54
          const x2 = 60 + Math.cos(end) * 54
          const y2 = 60 + Math.sin(end) * 54
          const filled = i < slices
          return (
            <path
              key={i}
              d={`M60 60 L${x1} ${y1} A54 54 0 0 1 ${x2} ${y2} Z`}
              fill={filled ? '#fb923c' : '#ffedd5'}
              stroke="#9a3412"
              strokeWidth="2"
            />
          )
        })}
        <circle cx="60" cy="60" r="8" fill="#fdba74" stroke="#9a3412" strokeWidth="2" />
      </svg>
      <ul className="hour-pizza__legend">
        <li className={slices >= 1 ? 'is-on' : ''}>1 trozo = un quart</li>
        <li className={slices >= 2 ? 'is-on' : ''}>2 trozos = dos quarts</li>
        <li className={slices >= 3 ? 'is-on' : ''}>3 trozos = tres quarts</li>
        <li className={slices >= 4 ? 'is-on' : ''}>4 trozos = ¡hora nueva!</li>
      </ul>
    </div>
  )
}

export function ClockLearnScreen() {
  const { lang, setLang } = useClockSession()
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)

  const steps = lang === 'ca' ? STEPS_CA : STEPS_ES
  const step = steps[Math.min(index, steps.length - 1)]!
  const phrase = useMemo(() => formatClockTime(step.demo, lang), [step.demo, lang])

  const isLast = index >= steps.length - 1
  const showPizza = lang === 'ca' && step.pizzaSlices != null

  function startWith(next: 'es' | 'ca') {
    setLang(next)
    setIndex(0)
    setStarted(true)
  }

  if (!started) {
    return (
      <AppShell title="APRENDE" shortTitle="Aprende" showBack backTo="/missions/mates/clocks">
        <section className="clock-lang" aria-labelledby="clock-lang-title">
          <div className="clock-learn__lumo" style={{ marginBottom: '1rem' }}>
            <Lumo state="thinking" size="md" />
            <p className="clock-learn__bubble" id="clock-lang-title">
              ¿Qué quieres que te explique: las horas en castellano o en catalán?
            </p>
          </div>
          <div className="clock-lang__grid">
            <button type="button" className="clock-lang__card" onClick={() => startWith('es')}>
              <span className="clock-lang__flag" aria-hidden="true">
                ES
              </span>
              <span className="clock-lang__name">Castellano</span>
              <span className="clock-lang__sample">la una y cuarto · y media · menos cuarto</span>
            </button>
            <button type="button" className="clock-lang__card" onClick={() => startWith('ca')}>
              <span className="clock-lang__flag" aria-hidden="true">
                CA
              </span>
              <span className="clock-lang__name">Català</span>
              <span className="clock-lang__sample">la pizza de quarts · un quart de les dues</span>
            </button>
          </div>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell title="APRENDE" shortTitle="Aprende" showBack backTo="/missions/mates/clocks">
      <section className="clock-learn" aria-labelledby="clock-learn-title">
        <div className="clock-learn__lumo">
          <Lumo state="thinking" size="md" />
          <div className="clock-learn__bubble-wrap">
            <p className="clock-learn__bubble" id="clock-learn-title">
              {step.body}
            </p>
            {step.slogan ? <p className="clock-learn__slogan">{step.slogan}</p> : null}
          </div>
        </div>

        <div className="clock-learn__stage">
          <div className={`clock-learn__visuals${showPizza ? ' clock-learn__visuals--split' : ''}`}>
            <AnalogClock time={step.demo} size={showPizza ? 200 : 240} label={`Ejemplo: ${phrase}`} />
            {showPizza ? <HourPizza slices={step.pizzaSlices!} /> : null}
          </div>
          <p className="clock-learn__phrase">{phrase}</p>
          <p className="clock-learn__tip">{step.tip}</p>
        </div>

        <div className="clock-learn__dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.id} className={`clock-learn__dot${i === index ? ' is-on' : ''}`} />
          ))}
        </div>

        <div className="clock-learn__actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (index === 0) {
                setStarted(false)
                return
              }
              setIndex((v) => Math.max(0, v - 1))
            }}
          >
            {index === 0 ? 'Cambiar idioma' : 'Anterior'}
          </button>
          {isLast ? (
            <Link to="/missions/mates/clocks/train" className="btn btn-primary">
              ¡A entrenar!
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIndex((v) => Math.min(steps.length - 1, v + 1))}
            >
              Siguiente · {steps[Math.min(index + 1, steps.length - 1)]!.title}
            </button>
          )}
        </div>
      </section>
    </AppShell>
  )
}
