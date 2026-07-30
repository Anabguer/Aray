import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/BrandLogo'
import { GameControls } from '@/components/game/GameControls'
import { PlayerHudBars, PlayerHudCoins } from '@/components/game/PlayerHudStats'
import { IconChevronLeft, IconGamepad } from '@/components/Icons'
import { derivePlayerHud } from '@/progress/playerHud'
import { useProgress } from '@/progress/ProgressContext'

/**
 * Cabecera compacta para pantallas secundarias.
 * Reutiliza estilos y datos del HUD del Lobby sin modificar el Lobby.
 */
export function GameHeader({
  title,
  subtitle,
  backTo,
}: {
  title: string
  subtitle?: string
  /** Flecha atrás al nivel anterior (no confundir con LOBBY). */
  backTo?: string
}) {
  const { progress } = useProgress()
  const hud = derivePlayerHud(progress)

  return (
    <header className="game-header">
      <div className="game-header__identity">
        {backTo ? (
          <Link to={backTo} className="game-header__back" aria-label="Atrás">
            <IconChevronLeft />
          </Link>
        ) : null}
        <span className="game-header__avatar-badge">
          <BrandLogo variant="compact" className="game-header__avatar" alt="Aray" />
        </span>
        <div className="game-header__heading">
          <h1 className="game-header__title">{title}</h1>
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

      <Link to="/" className="topbar__lobby game-header__lobby" aria-label="Ir al Lobby">
        <IconGamepad className="topbar__lobby-chevron" aria-hidden />
        <span className="topbar__lobby-label">LOBBY</span>
      </Link>
    </header>
  )
}
