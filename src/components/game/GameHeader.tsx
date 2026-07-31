import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/BrandLogo'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { GameControls } from '@/components/game/GameControls'
import { PlayerHudBars, PlayerHudCoins } from '@/components/game/PlayerHudStats'
import { IconChevronLeft, IconGamepad } from '@/components/Icons'
import { useAuth } from '@/auth/AuthContext'
import { derivePlayerHud } from '@/progress/playerHud'
import { useProgress } from '@/progress/ProgressContext'

/**
 * HUD persistente del juego: Lobby y pantallas secundarias.
 * Un solo componente, mismos datos reales de progreso.
 */
export function GameHeader({
  title,
  shortTitle,
  subtitle,
  backTo,
  showLobbyLink = true,
}: {
  title: string
  /** Variante corta para móvil (p. ej. Mates). Si falta, se usa `title` en todos los anchos. */
  shortTitle?: string
  subtitle?: string
  /** Flecha atrás al nivel anterior (no confundir con LOBBY). */
  backTo?: string
  /** En el Lobby no se muestra el acceso al Lobby. */
  showLobbyLink?: boolean
}) {
  const { progress } = useProgress()
  const { player, familyPlayers } = useAuth()
  const active = player ?? familyPlayers[0] ?? null
  const childName = active?.displayName?.trim() || 'Aray'
  const hud = derivePlayerHud(progress)
  const displayTitle = shortTitle?.trim() || title

  return (
    <header className={`game-header${showLobbyLink ? '' : ' game-header--home'}`}>
      <div className="game-header__identity">
        {backTo ? (
          <Link to={backTo} className="game-header__back" aria-label="Atrás">
            <IconChevronLeft />
          </Link>
        ) : null}
        <span className="game-header__avatar-wrap">
          <span className="game-header__avatar-halo" aria-hidden="true" />
          <span className="game-header__avatar-badge">
            {active?.avatarUrl ? (
              <PlayerAvatar
                url={active.avatarUrl}
                name={childName}
                size="sm"
                className="game-header__avatar"
              />
            ) : (
              <BrandLogo variant="compact" className="game-header__avatar" alt={childName} />
            )}
          </span>
        </span>
        <div className="game-header__heading">
          <h1 className="game-header__title">{displayTitle}</h1>
          {subtitle ? <p className="game-header__subtitle">{subtitle}</p> : null}
        </div>
      </div>

      <div className="game-header__bars">
        <PlayerHudBars hud={hud} compact />
      </div>

      <div className="game-header__coins">
        <PlayerHudCoins hud={hud} />
      </div>

      <div className="game-header__actions">
        <GameControls />
      </div>

      {showLobbyLink ? (
        <Link to="/" className="topbar__lobby game-header__lobby" aria-label="Ir al Lobby">
          <IconGamepad className="topbar__lobby-chevron" aria-hidden />
          <span className="topbar__lobby-label">LOBBY</span>
        </Link>
      ) : null}
    </header>
  )
}
