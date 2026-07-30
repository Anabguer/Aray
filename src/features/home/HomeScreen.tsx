import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ArayHubIcon } from '@/components/ArayHubIcon'
import { BrandLogo } from '@/components/BrandLogo'
import { CrateReveal } from '@/components/CrateReveal'
import { GoalCard } from '@/components/GoalCard'
import { ResetProgressControl } from '@/components/ResetProgressControl'
import { ZoneCard } from '@/components/ZoneCard'
import { rewardGoalConfig } from '@/config/rewardGoal'
import { buildLobbyMissions, type LobbyMissionCard } from '@/curriculum'
import { zoneLinks } from '@/data/demo'
import { launchLobbyMission } from '@/features/home/launchMission'
import { Lumo } from '@/lumo/Lumo'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { normalizeRewardCycles, previewSessionLoad } from '@/reward/engine'

export function HomeScreen() {
  const navigate = useNavigate()
  const { progress, chooseCrate, openCrate, collectCrate } = useProgress()
  const { selection, setSelection, setActiveMode, setPendingQueue, setLastResult } =
    usePlaySession()
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
  const sessionEnergy = previewSessionLoad(progress, rewardGoalConfig.dailyCap)

  function playMission(mission: LobbyMissionCard) {
    launchLobbyMission(mission, {
      progress,
      navigate,
      setSelection,
      setActiveMode,
      setPendingQueue,
      setLastResult,
    })
  }

  return (
    <AppShell title="LOBBY" subtitle="Tu base de aventuras" showLobbyLink={false}>
      <section className="lobby" aria-labelledby="home-greeting">
        <div className="lobby__welcome">
          <Lumo
            className="lobby__lumo"
            state={lumoState}
            intensity={lumoState === 'idle' ? 0 : 2}
            size="md"
          />
          <div className="lobby__welcome-copy">
            <h2 id="home-greeting" className="lobby__greeting">
              ¡Hola, Aray!
            </h2>
            <p className="lobby__welcome-lead">Listo para tu próxima aventura</p>
          </div>
          <div className="hero__logo-wrap lobby__logo">
            <BrandLogo variant="hero" />
          </div>
        </div>

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
                onClick={(e) => {
                  if (!primaryMission) return
                  e.preventDefault()
                  playMission(primaryMission)
                }}
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
                      <Link
                        to={m.path}
                        onClick={(e) => {
                          e.preventDefault()
                          playMission(m)
                        }}
                      >
                        {m.title}
                      </Link>
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
                      <Link
                        to={m.path}
                        onClick={(e) => {
                          e.preventDefault()
                          playMission(m)
                        }}
                      >
                        {m.title}
                      </Link>
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
                      <Link
                        to={m.path}
                        onClick={(e) => {
                          e.preventDefault()
                          playMission(m)
                        }}
                      >
                        {m.title}
                      </Link>
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
      </section>

      {import.meta.env.DEV ? (
        <section className="home-tools home-tools--dev" aria-label="Herramientas de desarrollo">
          <ResetProgressControl />
        </section>
      ) : null}
    </AppShell>
  )
}
