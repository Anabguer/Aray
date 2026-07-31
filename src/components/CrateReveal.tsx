import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { crateArt, type CrateRarity } from '@/assets/rewards'
import { crateConfig, type CrateRewardSpec } from '@/config/crateConfig'
import type { PendingCrate } from '@/crates/engine'
import { Lumo } from '@/lumo/Lumo'
import { flyEnergyToBar } from '@/feedback/energyFly'
import { soundEngine } from '@/sound/soundEngine'

type CrateRevealProps = {
  pending: PendingCrate
  onChoose: (index: number) => void
  onOpen: () => void
  onCollect: () => void
}

function rewardLabel(reward: CrateRewardSpec): string {
  if (reward.kind === 'energy') return `+${reward.amount} de energía`
  return `+${reward.amount} XP`
}

function rewardHint(reward: CrateRewardSpec): string {
  if (reward.kind === 'energy') return 'Van a la barra de energía ↑'
  return 'Van a tu XP / nivel ↑'
}

function collectLabel(reward: CrateRewardSpec): string {
  if (reward.kind === 'energy') return '¡Sumar energía!'
  return '¡Sumar XP!'
}

function rarityLabel(r: CrateRarity): string {
  if (r === 'epica') return 'Legendaria'
  if (r === 'especial') return 'Épica'
  return 'Buena'
}

const CHOICE_LEADS = [
  'Una está bien… y la otra es LEGENDARIA. ¿Cuál eliges, crack?',
  '¡Drop! Una da más energía. ¿Izquierda o derecha?',
  'Modo Random: elige una y ¡a ver qué te toca!',
  'Dos cofres, un premio gordo. ¿Cuál abres?',
  '¡Streamy vibes! Confía en tu intuición… o ve a lo loco.',
  'Como cuando cae loot: una normalita y otra pro. ¡Elige!',
] as const

function choiceLeadFor(completionId: string): string {
  let hash = 0
  for (let i = 0; i < completionId.length; i += 1) {
    hash = (hash * 31 + completionId.charCodeAt(i)) >>> 0
  }
  return CHOICE_LEADS[hash % CHOICE_LEADS.length]!
}

const CONFETTI = Array.from({ length: 18 }, (_, i) => i)

export function CrateReveal({ pending, onChoose, onOpen, onCollect }: CrateRevealProps) {
  const titleId = useId()
  const leadId = useId()
  const [phase, setPhase] = useState<'enter' | 'idle' | 'open' | 'reveal'>('enter')
  const [party, setParty] = useState(false)
  const choiceLead = useMemo(() => choiceLeadFor(pending.completionId), [pending.completionId])
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const t = window.setTimeout(() => setPhase('idle'), reduced ? 80 : crateConfig.animMs.enter)
    return () => window.clearTimeout(t)
  }, [reduced])

  useEffect(() => {
    if (pending.opened) {
      setPhase('reveal')
      setParty(true)
    }
  }, [pending.opened])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const showChoice = pending.isChoice && pending.chosenIndex === null
  const activeIndex = pending.chosenIndex ?? 0
  const active = pending.options[activeIndex] ?? pending.options[0]!

  function handleOpen() {
    if (pending.chosenIndex === null) return
    setPhase('open')
    soundEngine.play(active.rarity === 'epica' ? 'perfect-complete' : 'points-earned')
    window.setTimeout(
      () => {
        onOpen()
        setPhase('reveal')
        setParty(true)
        soundEngine.play('perfect-complete')
      },
      reduced ? 120 : crateConfig.animMs.open,
    )
  }

  function handleCollect() {
    const btn = document.querySelector('.crate-reveal__collect')
    const fromRect = btn?.getBoundingClientRect()
    soundEngine.play('points-earned')
    onCollect()
    if (pending.reward.kind === 'energy') {
      flyEnergyToBar({
        amount: pending.reward.amount,
        fromPoint: fromRect
          ? { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 }
          : null,
      })
    }
  }

  return createPortal(
    <div className="crate-reveal__backdrop" role="presentation">
      <section
        className={`crate-reveal${party ? ' is-party' : ''}`}
        aria-labelledby={titleId}
        aria-describedby={showChoice ? leadId : undefined}
        role="dialog"
        aria-modal="true"
      >
        {party && !reduced ? (
          <div className="crate-confetti" aria-hidden="true">
            {CONFETTI.map((i) => (
              <span
                key={i}
                className={`crate-confetti__bit crate-confetti__bit--${i % 6}`}
                style={{
                  left: `${6 + ((i * 17) % 88)}%`,
                  animationDelay: `${(i % 8) * 45}ms`,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="crate-reveal__lumo" aria-hidden="true">
          <Lumo
            state={phase === 'reveal' ? 'celebration' : phase === 'open' ? 'streak' : 'idle'}
            intensity={phase === 'reveal' ? 4 : 2}
            size="sm"
          />
        </div>

        <h2 id={titleId} className="crate-reveal__title">
          {showChoice
            ? '¡Qué suerte!'
            : phase === 'reveal'
              ? '¡Premio encontrado!'
              : '¡Te ha caído una caja!'}
        </h2>

        {showChoice ? (
          <>
            <p id={leadId} className="crate-reveal__lead">
              {choiceLead}
            </p>
            <div className="crate-reveal__choice">
              {pending.options.map((opt, i) => (
                <button
                  key={`${opt.rarity}-${i}`}
                  type="button"
                  className="crate-pick crate-pick--mystery"
                  onClick={() => onChoose(i)}
                >
                  <img
                    src={crateArt.especial}
                    alt={`Caja misteriosa ${i === 0 ? 'A' : 'B'}`}
                    className="crate-pick__img"
                    draggable={false}
                  />
                  <span className="crate-pick__name">Caja {i === 0 ? 'A' : 'B'}</span>
                  <span className="crate-pick__hint">¿Será la pro?</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              className={`crate-stage crate-stage--${active.rarity} is-${phase}${reduced ? ' is-reduced' : ''}${party ? ' is-party' : ''}`}
            >
              <span className="crate-stage__flash" aria-hidden="true" />
              <span className="crate-stage__ring" aria-hidden="true" />
              <span className="crate-stage__spark crate-stage__spark--a" aria-hidden="true" />
              <span className="crate-stage__spark crate-stage__spark--b" aria-hidden="true" />
              <span className="crate-stage__spark crate-stage__spark--c" aria-hidden="true" />
              <span className="crate-stage__spark crate-stage__spark--d" aria-hidden="true" />
              <span className="crate-stage__spark crate-stage__spark--e" aria-hidden="true" />
              {phase !== 'reveal' ? (
                <img
                  src={crateArt[active.rarity]}
                  alt={`Caja ${rarityLabel(active.rarity)}`}
                  className="crate-stage__img"
                  draggable={false}
                />
              ) : (
                <div className="crate-stage__prize-wrap">
                  <p className="crate-stage__prize" aria-live="polite">
                    {rewardLabel(pending.reward)}
                  </p>
                  <p className="crate-stage__hint">{rewardHint(pending.reward)}</p>
                </div>
              )}
            </div>
            {phase !== 'reveal' ? (
              <button type="button" className="btn btn-primary btn-block" onClick={handleOpen}>
                Abrir caja
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-block crate-reveal__collect"
                onClick={handleCollect}
              >
                {collectLabel(pending.reward)}
              </button>
            )}
          </>
        )}
      </section>
    </div>,
    document.body,
  )
}
