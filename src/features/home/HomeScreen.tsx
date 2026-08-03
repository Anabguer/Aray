import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { CrateReveal } from '@/components/CrateReveal'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { GoalCard } from '@/components/GoalCard'
import { ResetProgressControl } from '@/components/ResetProgressControl'
import { SyncStatusBanner } from '@/components/SyncStatusBanner'
import { ZoneCard } from '@/components/ZoneCard'
import { energyCopy, rewardGoalConfig } from '@/config/rewardGoal'
import { buildLobbyMissions, pickDailyChallenge, type LobbyMissionCard } from '@/curriculum'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { zoneLinks } from '@/data/demo'
import { challengeArtUrl } from '@/features/home/challengeArt'
import { launchLobbyMission } from '@/features/home/launchMission'
import { DailyMissionCard } from '@/features/home/DailyMissionCard'
import { Lumo } from '@/lumo/Lumo'
import { useAuth } from '@/auth/AuthContext'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { normalizeRewardCycles, previewSessionLoad } from '@/reward/engine'

/** Copy solo Lobby: no altera títulos del catálogo en otras pantallas. */
function lobbyMissionTitle(mission: LobbyMissionCard | null): string {
  if (!mission) return 'Tu reto de hoy'
  const learn = mission.title.match(/^Aprende la tabla del (\d+)$/i)
  if (learn) return `Domina la tabla del ${learn[1]}`
  return mission.title
}

function lobbyMissionDescription(
  mission: LobbyMissionCard | null,
  sessionEnergy: number,
): string {
  if (!mission) return `Practica y gana hasta ⚡ ${sessionEnergy}`
  if (mission.description === 'Repasa la tabla sin prisa') {
    return 'Gana XP y déjala dominada'
  }
  return mission.description
}

export function HomeScreen() {
  const navigate = useNavigate()
  const { progress, chooseCrate, openCrate, collectCrate } = useProgress()
  const { player, familyPlayers } = useAuth()
  const active = player ?? familyPlayers[0] ?? null
  const childName = active?.displayName?.trim() || 'campeón'
  const avatarUrl =
    active?.avatarUrl ||
    familyPlayers.find((p) => p.id === active?.id)?.avatarUrl ||
    null
  const { setSelection, setActiveMode, setPendingQueue, setLastResult, setMissionOfDay } =
    usePlaySession()
  const { challengeDone } = useDailyMission()
  const lobby = buildLobbyMissions(progress, 4)
  const dailyChallenge = pickDailyChallenge(progress)
  const primaryMission =
    dailyChallenge ??
    lobby.mandatory[0] ??
    lobby.review[0] ??
    lobby.recommended[0] ??
    null
  const reward = normalizeRewardCycles(progress.reward)
  const lumoState =
    reward.pendingCycleNumbers.length > 0 || reward.goalStatus === 'completed'
      ? 'celebration'
      : reward.dailyPoints >= rewardGoalConfig.dailyCap
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
      setMissionOfDay,
    })
  }

  return (
    <AppShell title="LOBBY" subtitle="Tu zona de juego" showLobbyLink={false}>
      <SyncStatusBanner />
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
              ¡Ey, {childName}!
            </h2>
            <p className="lobby__welcome-lead">
              {reward.dailyPoints >= rewardGoalConfig.dailyCap ? (
                <>
                  Soy <span className="lobby__lumo-name">Lumo</span>. ¡Barra llena! Sigue por vicio.
                </>
              ) : (
                <>
                  Soy <span className="lobby__lumo-name">Lumo</span>. ¿Qué vamos a farmear hoy?
                </>
              )}
            </p>
          </div>
          <div className="hero__logo-wrap lobby__logo">
            <PlayerAvatar
              url={avatarUrl}
              name={childName}
              size="lg"
            />
          </div>
        </div>

        <DailyEnergyNote />

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

        <DailyMissionCard />

        <div className="lobby__main">
          <div className="lobby__main-left">
            <article
              className={`lobby-mission${challengeDone ? ' lobby-mission--done' : ''}`}
              aria-labelledby="mission-today-title"
            >
              <div className="lobby-mission__art" aria-hidden="true">
                <img
                  src={challengeArtUrl(primaryMission)}
                  alt=""
                  className="lobby-mission__icon"
                  width={128}
                  height={128}
                  draggable={false}
                  decoding="async"
                />
              </div>
              <div className="lobby-mission__body">
                <p className="lobby-mission__eyebrow">
                  {challengeDone ? energyCopy.challengeDone : energyCopy.challengeCta}
                </p>
                <h2 id="mission-today-title" className="lobby-mission__title">
                  {lobbyMissionTitle(primaryMission)}
                </h2>
                <p className="lobby-mission__rewards">
                  {challengeDone
                    ? 'Ya sumaste el +10 de hoy. Puedes practicar otra vez.'
                    : lobbyMissionDescription(primaryMission, sessionEnergy)}
                </p>
              </div>
              <Link
                to={primaryMission?.path ?? '/missions/mates/tables'}
                className={`btn btn-ghost lobby-mission__cta${challengeDone ? ' lobby-mission__cta--done' : ''}`}
                aria-label={
                  challengeDone
                    ? 'Reto del día hecho. Jugar otra vez sin bonus'
                    : undefined
                }
                onClick={(e) => {
                  if (!primaryMission) return
                  e.preventDefault()
                  playMission(primaryMission)
                }}
              >
                {challengeDone ? (
                  <>
                    <span className="lobby-mission__play" aria-hidden="true">
                      ✓
                    </span>
                    HECHO
                  </>
                ) : (
                  <>
                    <span className="lobby-mission__play" aria-hidden="true">
                      ▶
                    </span>
                    JUGAR
                  </>
                )}
              </Link>
            </article>

            {zoneLinks
              .filter((zone) => zone.id === 'collection')
              .map((zone) => (
                <ZoneCard key={zone.id} zone={zone} />
              ))}
          </div>

          <GoalCard compact />
        </div>

        {(lobby.mandatory.length > 0 ||
          lobby.review.length > 0 ||
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

        <footer className="lobby-legal">
          <p>
            © {new Date().getFullYear()} AFK Academy. Todos los derechos reservados a{' '}
            <a
              href="https://intocables13.com"
              target="_blank"
              rel="noopener noreferrer"
              className="lobby-legal__link"
            >
              @intocables13
            </a>
            .
          </p>
        </footer>
      </section>

      {import.meta.env.DEV ? (
        <section className="home-tools home-tools--dev" aria-label="Herramientas de desarrollo">
          <ResetProgressControl />
        </section>
      ) : null}
    </AppShell>
  )
}
