import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { GameHeader } from '@/components/game/GameHeader'

export function AppShell({
  children,
  title,
  shortTitle,
  subtitle,
  showBack = false,
  backTo = '..',
  showLobbyLink,
  hideHeader = false,
}: {
  children: ReactNode
  title?: string
  /** Título corto en móvil; escritorio sigue mostrando `title`. */
  shortTitle?: string
  subtitle?: string
  showBack?: boolean
  backTo?: string
  /** Por defecto: oculto solo en el Lobby. */
  showLobbyLink?: boolean
  /** Pantallas sin HUD (auth / casos especiales). */
  hideHeader?: boolean
}) {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''
  const resolvedTitle = title ?? (isHome ? 'LOBBY' : undefined)
  const lobbyLink = showLobbyLink ?? !isHome

  return (
    <div className="app-shell">
      <div className="app-shell__bg" aria-hidden="true" />
      <main className={['app-main', isHome ? 'app-main--lobby' : ''].filter(Boolean).join(' ')}>
        {!hideHeader && resolvedTitle ? (
          <GameHeader
            title={resolvedTitle}
            shortTitle={shortTitle}
            subtitle={subtitle}
            backTo={showBack && !isHome ? backTo : undefined}
            showLobbyLink={lobbyLink}
          />
        ) : null}
        {children}
      </main>
    </div>
  )
}
