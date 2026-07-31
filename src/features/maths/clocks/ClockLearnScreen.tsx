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

const STEPS_CA: LearnStep[] = [
  {
    id: 'punt',
    title: 'En punt',
    body: 'Amb la minutera al 12, és l’hora en punt. Encara no hem entrat als quarts.',
    tip: 'la una en punt · les dues en punt',
    demo: { hour: 3, minute: 0 },
  },
  {
    id: 'quart',
    title: 'Un quart → hora següent',
    body: 'Al català de campanar, els quarts miren cap a l’hora que ve. 1:15 és un quart de les dues.',
    tip: '1:15 → un quart de les dues',
    demo: { hour: 1, minute: 15 },
  },
  {
    id: 'dos-tres',
    title: 'Dos i tres quarts',
    body: '1:30 són dos quarts de les dues. 1:45 són tres quarts de les dues. Sempre cap a la següent.',
    tip: 'dos quarts · tres quarts de les dues',
    demo: { hour: 1, minute: 30 },
  },
  {
    id: 'minuts',
    title: 'Quarts i minuts',
    body: 'Si passen minuts després d’un quart, els sumem: 1:35 = dos quarts i cinc de les dues. Abans del primer quart: la una i cinc.',
    tip: '1:25 → un quart i deu de les dues',
    demo: { hour: 1, minute: 35 },
  },
]

export function ClockLearnScreen() {
  const { lang } = useClockSession()
  const steps = lang === 'ca' ? STEPS_CA : STEPS_ES
  const [index, setIndex] = useState(0)
  const step = steps[index]!
  const phrase = useMemo(() => formatClockTime(step.demo, lang), [step.demo, lang])

  const isLast = index >= steps.length - 1

  return (
    <AppShell title="APRENDE" shortTitle="Aprende" showBack backTo="/missions/mates/clocks/modes">
      <section className="clock-learn" aria-labelledby="clock-learn-title">
        <div className="clock-learn__lumo">
          <Lumo state="thinking" size="md" />
          <p className="clock-learn__bubble" id="clock-learn-title">
            {step.body}
          </p>
        </div>

        <div className="clock-learn__stage">
          <AnalogClock time={step.demo} size={240} label={`Ejemplo: ${phrase}`} />
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
            disabled={index === 0}
            onClick={() => setIndex((v) => Math.max(0, v - 1))}
          >
            Anterior
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
              Siguiente · {step.title}
            </button>
          )}
        </div>
      </section>
    </AppShell>
  )
}
