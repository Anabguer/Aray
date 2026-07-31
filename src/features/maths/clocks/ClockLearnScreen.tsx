import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clockLangArtUrl } from '@/assets/clocks'
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
  demo: ClockTime | null
  /** Trozo de pizza iluminados (0–4). Solo ayuda catalana. */
  pizzaSlices?: 0 | 1 | 2 | 3 | 4
  /** Solo pizza (sin reloj analógico): paso introductorio. */
  pizzaOnly?: boolean
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

/** Ayuda catalana: primero la pizza; después el reloj con ejemplos. */
const STEPS_CA: LearnStep[] = [
  {
    id: 'pizza',
    title: 'La pizza de la hora',
    body: 'Imagina la hora como una pizza de 4 trozos. Cada trozo es un quart. Cuando comes los 4, ¡llegas a la hora nueva!',
    tip: 'Primero entiende la pizza. Luego veremos el reloj.',
    demo: null,
    pizzaSlices: 0,
    pizzaOnly: true,
  },
  {
    id: 'un-quart',
    title: '1 trozo → un quart',
    body: '1:15 — Ha pasado 1 trozo del camino hacia las 2. Decimos: un quart de les dues.',
    tip: '',
    demo: { hour: 1, minute: 15 },
    pizzaSlices: 1,
  },
  {
    id: 'dos-quarts',
    title: '2 y 3 trozos',
    body: '1:30 = 2 trozos → dos quarts de les dues. 1:45 = 3 trozos → tres quarts de les dues. Siempre hacia la hora que viene.',
    tip: '',
    demo: { hour: 1, minute: 30 },
    pizzaSlices: 2,
  },
  {
    id: 'arribada',
    title: '4 trozos = ¡llegaste!',
    body: '2:00 — Ya hemos llegado a las 2. Se acabó la pizza: són les dues en punt.',
    tip: '',
    demo: { hour: 2, minute: 0 },
    pizzaSlices: 4,
  },
  {
    id: 'i-minuts',
    title: 'Si no es exacto',
    body: 'Si pasan minutos después de un trozo, los sumamos: 1:35 = dos quarts i cinc de les dues. 1:25 = un quart i deu de les dues.',
    tip: '',
    demo: { hour: 1, minute: 35 },
    pizzaSlices: 2,
  },
]

/** Pizza de 4 quarts: trozos “comidos” = camino hacia la hora siguiente. */
function HourPizza({
  slices,
  size = 148,
  showNumbers = false,
}: {
  slices: 0 | 1 | 2 | 3 | 4
  size?: number
  showNumbers?: boolean
}) {
  return (
    <div className="hour-pizza">
      <svg
        className="hour-pizza__svg"
        viewBox="0 0 120 120"
        width={size}
        height={size}
        role="img"
        aria-label="Pizza de la hora: 4 trozos iguales"
      >
        <circle cx="60" cy="60" r="54" fill="#fff7ed" stroke="#9a3412" strokeWidth="3" />
        {[0, 1, 2, 3].map((i) => {
          const start = (i * 90 - 90) * (Math.PI / 180)
          const end = ((i + 1) * 90 - 90) * (Math.PI / 180)
          const mid = (i * 90 + 45 - 90) * (Math.PI / 180)
          const x1 = 60 + Math.cos(start) * 54
          const y1 = 60 + Math.sin(start) * 54
          const x2 = 60 + Math.cos(end) * 54
          const y2 = 60 + Math.sin(end) * 54
          const filled = i < slices
          const lx = 60 + Math.cos(mid) * 28
          const ly = 60 + Math.sin(mid) * 28
          return (
            <g key={i}>
              <path
                d={`M60 60 L${x1} ${y1} A54 54 0 0 1 ${x2} ${y2} Z`}
                fill={filled ? '#fb923c' : '#ffedd5'}
                stroke="#9a3412"
                strokeWidth="2"
              />
              {showNumbers ? (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#9a3412"
                  fontSize="16"
                  fontWeight="800"
                >
                  {i + 1}
                </text>
              ) : null}
            </g>
          )
        })}
        <circle cx="60" cy="60" r="8" fill="#fdba74" stroke="#9a3412" strokeWidth="2" />
      </svg>
      <ul className="hour-pizza__legend">
        <li className={slices >= 1 || showNumbers ? 'is-on' : ''}>1 trozo = un quart</li>
        <li className={slices >= 2 || showNumbers ? 'is-on' : ''}>2 trozos = dos quarts</li>
        <li className={slices >= 3 || showNumbers ? 'is-on' : ''}>3 trozos = tres quarts</li>
        <li className={slices >= 4 || showNumbers ? 'is-on' : ''}>4 trozos = ¡hora nueva!</li>
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
  const phrase = useMemo(
    () => (step.demo ? formatClockTime(step.demo, lang) : ''),
    [step.demo, lang],
  )

  const isLast = index >= steps.length - 1
  const pizzaOnly = Boolean(step.pizzaOnly)
  const showPizza = lang === 'ca' && step.pizzaSlices != null
  const showClock = Boolean(step.demo) && !pizzaOnly

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
            <button type="button" className="clock-lang__card clock-lang__card--art" onClick={() => startWith('es')}>
              <span className="clock-lang__media" aria-hidden="true">
                <img
                  src={clockLangArtUrl('es')}
                  alt=""
                  className="clock-lang__img"
                  width={640}
                  height={640}
                  draggable={false}
                  decoding="async"
                />
                <span className="clock-lang__fade" />
              </span>
              <span className="clock-lang__body">
                <span className="clock-lang__flag">ES</span>
                <span className="clock-lang__name">Castellano</span>
                <span className="clock-lang__sample">la una y cuarto · y media · menos cuarto</span>
              </span>
            </button>
            <button type="button" className="clock-lang__card clock-lang__card--art" onClick={() => startWith('ca')}>
              <span className="clock-lang__media" aria-hidden="true">
                <img
                  src={clockLangArtUrl('ca')}
                  alt=""
                  className="clock-lang__img"
                  width={640}
                  height={640}
                  draggable={false}
                  decoding="async"
                />
                <span className="clock-lang__fade" />
              </span>
              <span className="clock-lang__body">
                <span className="clock-lang__flag">CA</span>
                <span className="clock-lang__name">Català</span>
                <span className="clock-lang__sample">la pizza de quarts · un quart de les dues</span>
              </span>
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
          </div>
        </div>

        <div className="clock-learn__stage">
          {pizzaOnly && showPizza ? (
            <div className="clock-learn__visuals clock-learn__visuals--pizza-first">
              <HourPizza slices={step.pizzaSlices!} size={200} showNumbers />
            </div>
          ) : (
            <div
              className={`clock-learn__visuals${showClock && showPizza ? ' clock-learn__visuals--split' : ''}`}
            >
              {showClock && step.demo ? (
                <AnalogClock
                  time={step.demo}
                  size={showPizza ? 200 : 240}
                  label={`Ejemplo: ${phrase}`}
                />
              ) : null}
              {showPizza ? <HourPizza slices={step.pizzaSlices!} size={120} /> : null}
            </div>
          )}
          {phrase ? (
            <p className="clock-learn__phrase">
              <span className="clock-learn__phrase-label">Se dice</span>
              <span className="clock-learn__phrase-text">{phrase}</span>
            </p>
          ) : null}
          {step.tip ? <p className="clock-learn__tip">{step.tip}</p> : null}
        </div>

        {lang === 'ca' ? (
          <p className="clock-learn__hint" role="note">
            <span className="clock-learn__hint-ico" aria-hidden="true">
              💡
            </span>
            <span>
              En catalán contamos el camino hacia la siguiente hora, no desde la anterior.
            </span>
          </p>
        ) : null}

        <div className="clock-learn__dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.id} className={`clock-learn__dot${i === index ? ' is-on' : ''}`} />
          ))}
        </div>

        <div className="clock-learn__actions">
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
          {index === 0 ? (
            <button
              type="button"
              className="clock-learn__lang-link"
              onClick={() => setStarted(false)}
            >
              Cambiar idioma
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIndex((v) => Math.max(0, v - 1))}
            >
              Anterior
            </button>
          )}
        </div>
      </section>
    </AppShell>
  )
}
