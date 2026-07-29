import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ArayHubIcon } from '@/components/ArayHubIcon'
import { BrandLogo } from '@/components/BrandLogo'
import { CrateReveal } from '@/components/CrateReveal'
import { GoalCard } from '@/components/GoalCard'
import { IconBolt, IconCoin } from '@/components/Icons'
import { ResetProgressControl } from '@/components/ResetProgressControl'
import { ZoneCard } from '@/components/ZoneCard'
import { MuteToggle } from '@/components/quiz/QuizWidgets'
import { rewardGoalConfig } from '@/config/rewardGoal'
import { buildLobbyMissions, courseLabel } from '@/curriculum'
import { zoneLinks } from '@/data/demo'
import { AdultPinModal } from '@/features/access/AdultPinModal'
import { Lumo } from '@/lumo/Lumo'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { normalizeRewardCycles, previewSessionLoad } from '@/reward/engine'

const XP_PER_LEVEL = 100

export function HomeScreen() {
  const { progress, setSoundMuted, chooseCrate, openCrate, collectCrate } = useProgress()
  const { selection } = usePlaySession()
  const [adultPinOpen, setAdultPinOpen] = useState(false)
  const missionTable = selection.tables[0] ?? 7
  const lobby = buildLobbyMissions(progress, 4)
  const primaryMission =
    lobby.mandatory[0] ?? lobby.review[0] ?? lobby.recommended[0] ?? null
  const reward = normalizeRewardCycles(progress.reward)
  const lumoState =
    reward.pendingCycleNumbers.length > 0 || reward.goalStatus === 'completed'
      ? 'celebration'
      : reward.dailyPoints >= 10
        ? 'streak'
        : 'idle'

  const pendingCrate = progress.crates.pending
  const energyToday = Math.min(reward.dailyPoints, rewardGoalConfig.dailyCap)
  const sessionEnergy = previewSessionLoad(progress, rewardGoalConfig.dailyCap)
  const level = Math.floor(progress.xp / XP_PER_LEVEL) + 1
  const xpIntoLevel = progress.xp % XP_PER_LEVEL
  const xpPct = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100))
  const energyBarPct = Math.min(100, Math.round((energyToday / rewardGoalConfig.dailyCap) * 100))

  return (
    <AppShell
      trailing={
        <div className="lobby__trailing">
          <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
          <button
            type="button"
            className="lobby__adult-btn"
            aria-label="Acceso adulto"
            title="Adultos"
            onClick={() => setAdultPinOpen(true)}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </div>
      }
    >
      <section className="lobby" aria-labelledby="home-greeting">
        <header className="lobby__header">
          <div className="lobby__welcome">
            <Lumo
              className="lobby__lumo"
              state={lumoState}
              intensity={lumoState === 'idle' ? 0 : 2}
              size="md"
            />
            <h1 id="home-greeting" className="lobby__greeting">
              ¡Hola, Aray!
            </h1>
          </div>

          <div className="lobby-hud" aria-label="Progreso">
            <div className="lobby-hud__bars">
              <div className="lobby-hud__xp">
                <div className="lobby-hud__xp-top">
                  <span className="lobby-hud__level">Nv. {level}</span>
                  <span className="lobby-hud__xp-label">XP</span>
                </div>
                <div
                  className="lobby-hud__bar lobby-hud__bar--xp"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={XP_PER_LEVEL}
                  aria-valuenow={xpIntoLevel}
                  aria-label={`Nivel ${level}: ${xpIntoLevel} de ${XP_PER_LEVEL} XP`}
                >
                  <span style={{ width: `${xpPct}%` }} />
                </div>
                <p className="lobby-hud__bar-text">
                  {xpIntoLevel} / {XP_PER_LEVEL} XP
                </p>
              </div>

              <div className="lobby-hud__energy">
                <div className="lobby-hud__energy-top">
                  <IconBolt className="lobby-hud__bolt" aria-hidden />
                  <span>Energía</span>
                </div>
                <div
                  className="lobby-hud__bar lobby-hud__bar--energy"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={rewardGoalConfig.dailyCap}
                  aria-valuenow={energyToday}
                  aria-label={`Energía: ${energyToday} de ${rewardGoalConfig.dailyCap}`}
                >
                  <span style={{ width: `${energyBarPct}%` }} />
                </div>
                <p className="lobby-hud__bar-text">
                  {energyToday} / {rewardGoalConfig.dailyCap}
                </p>
              </div>
            </div>

            <div className="lobby-hud__profile">
              <div className="lobby-hud__coins" aria-label={`${progress.coins} monedas`}>
                <IconCoin className="lobby-hud__coin-icon" aria-hidden />
                <strong className="lobby-hud__coin-value">{progress.coins}</strong>
              </div>
              <div className="hero__logo-wrap lobby__logo">
                <BrandLogo variant="hero" />
              </div>
            </div>
          </div>
        </header>

        {pendingCrate ? (
          <CrateReveal
            pending={pendingCrate}
            onChoose={chooseCrate}
            onOpen={openCrate}
            onCollect={() => {
              collectCrate()
            }}
          />
        ) : null}

        <div className="lobby__main">
          <article className="lobby-mission" aria-labelledby="mission-today-title">
            <div className="lobby-mission__art" aria-hidden="true">
              <ArayHubIcon id="tablas" priority className="lobby-mission__icon" />
            </div>
            <div className="lobby-mission__body">
              <p className="lobby-mission__eyebrow">
                {primaryMission
                  ? primaryMission.reason === 'review'
                    ? 'Para repasar'
                    : primaryMission.reason === 'mandatory'
                      ? 'Pendiente'
                      : 'Misión recomendada'
                  : `Matemáticas · Tabla del ${missionTable}`}
              </p>
              <h2 id="mission-today-title" className="lobby-mission__title">
                {primaryMission?.title ?? 'Tu misión de hoy'}
              </h2>
              <p className="lobby-mission__rewards">
                {primaryMission?.description ??
                  `Practica y gana hasta ⚡ ${sessionEnergy}`}
              </p>
              <Link
                to={primaryMission?.path ?? '/missions/mates/tables'}
                className="btn btn-primary lobby-mission__cta"
              >
                <span className="lobby-mission__play" aria-hidden="true">
                  ▶
                </span>
                JUGAR
              </Link>
            </div>
          </article>

          <GoalCard compact />
        </div>

        {(lobby.mandatory.length > 0 ||
          lobby.review.length > 0 ||
          lobby.recommended.length > 1 ||
          lobby.free.length > 0) && (
          <section className="lobby-quests" aria-label="Actividades para ti">
            {lobby.mandatory.length > 0 ? (
              <div className="lobby-quests__group">
                <h3 className="lobby-quests__title">Pendientes</h3>
                <ul className="lobby-quests__list">
                  {lobby.mandatory.map((m) => (
                    <li key={m.activityId}>
                      <Link to={m.path}>{m.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lobby.review.length > 0 ? (
              <div className="lobby-quests__group">
                <h3 className="lobby-quests__title">Para repasar</h3>
                <ul className="lobby-quests__list">
                  {lobby.review.slice(0, 3).map((m) => (
                    <li key={m.activityId}>
                      <Link to={m.path}>{m.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lobby.free.length > 0 ? (
              <div className="lobby-quests__group">
                <h3 className="lobby-quests__title">Libres</h3>
                <ul className="lobby-quests__list">
                  {lobby.free.slice(0, 3).map((m) => (
                    <li key={m.activityId}>
                      <Link to={m.path}>{m.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        <section className="lobby-zones" aria-label="Zonas">
          <div className="zones__grid lobby-zones__grid">
            {zoneLinks.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} />
            ))}
          </div>
        </section>

        <details className="lobby-help lobby-help--icon">
          <summary aria-label="Ayuda: XP, monedas y drop">
            <span className="lobby-help__i" aria-hidden="true">
              ?
            </span>
          </summary>
          <p>
            XP y monedas son para jugar. El drop de Robux se carga con energía (aparte de las monedas).
            Las cajas son sorpresas extra al completar actividades.
          </p>
          <p className="lobby-help__course">
            Estás en repaso de {courseLabel(progress.school.currentCourseId)}. El curso lo cambia un
            adulto.
          </p>
        </details>
      </section>

      <AdultPinModal open={adultPinOpen} onClose={() => setAdultPinOpen(false)} />

      {import.meta.env.DEV ? (
        <section className="home-tools home-tools--dev" aria-label="Herramientas de desarrollo">
          <ResetProgressControl />
        </section>
      ) : null}
    </AppShell>
  )
}
