import { useEffect, useId, useState } from 'react'
import { crateArt, type CrateRarity } from '@/assets/rewards'
import { crateConfig, type CrateRewardSpec } from '@/config/crateConfig'
import type { PendingCrate } from '@/crates/engine'
import { soundEngine } from '@/sound/soundEngine'

type CrateRevealProps = {
  pending: PendingCrate
  onChoose: (index: number) => void
  onOpen: () => void
  onCollect: () => void
}

function rewardLabel(reward: CrateRewardSpec): string {
  if (reward.kind === 'coins') return `+${reward.amount} monedas`
  if (reward.kind === 'energy') return `+${reward.amount} de energía`
  return `+${reward.amount} XP`
}

function rarityLabel(r: CrateRarity): string {
  if (r === 'epica') return 'Épica'
  if (r === 'especial') return 'Especial'
  return 'Normal'
}

export function CrateReveal({ pending, onChoose, onOpen, onCollect }: CrateRevealProps) {
  const titleId = useId()
  const [phase, setPhase] = useState<'enter' | 'idle' | 'open' | 'reveal'>('enter')
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const t = window.setTimeout(() => setPhase('idle'), reduced ? 80 : crateConfig.animMs.enter)
    return () => window.clearTimeout(t)
  }, [reduced])

  useEffect(() => {
    if (pending.opened) setPhase('reveal')
  }, [pending.opened])

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
      },
      reduced ? 120 : crateConfig.animMs.open,
    )
  }

  return (
    <section className="crate-reveal" aria-labelledby={titleId} role="dialog" aria-modal="true">
      <h2 id={titleId} className="crate-reveal__title">
        {showChoice
          ? 'Elige una'
          : phase === 'reveal'
            ? '¡Premio encontrado!'
            : '¡Te ha caído una caja!'}
      </h2>

      {showChoice ? (
        <div className="crate-reveal__choice">
          {pending.options.map((opt, i) => (
            <button
              key={`${opt.rarity}-${i}`}
              type="button"
              className={`crate-pick crate-pick--${opt.rarity}`}
              onClick={() => onChoose(i)}
            >
              <img
                src={crateArt[opt.rarity]}
                alt={`Caja ${rarityLabel(opt.rarity)}`}
                className="crate-pick__img"
                draggable={false}
              />
              <span>Caja {i + 1}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div
            className={`crate-stage crate-stage--${active.rarity} is-${phase}${reduced ? ' is-reduced' : ''}`}
          >
            <span className="crate-stage__flash" aria-hidden="true" />
            <span className="crate-stage__spark crate-stage__spark--a" aria-hidden="true" />
            <span className="crate-stage__spark crate-stage__spark--b" aria-hidden="true" />
            <span className="crate-stage__spark crate-stage__spark--c" aria-hidden="true" />
            {phase !== 'reveal' ? (
              <img
                src={crateArt[active.rarity]}
                alt={`Caja ${rarityLabel(active.rarity)}`}
                className="crate-stage__img"
                draggable={false}
              />
            ) : (
              <p className="crate-stage__prize" aria-live="polite">
                {rewardLabel(pending.reward)}
              </p>
            )}
          </div>
          {phase !== 'reveal' ? (
            <button type="button" className="btn btn-primary btn-block" onClick={handleOpen}>
              Abrir caja
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={onCollect}>
              Recoger
            </button>
          )}
        </>
      )}
    </section>
  )
}
