import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import { IconChevronLeft, IconGamepad } from '@/components/Icons'

export function AppShell({
  children,
  title,
  showBack = false,
  backTo = '..',
  trailing,
}: {
  children: ReactNode
  title?: string
  showBack?: boolean
  backTo?: string
  trailing?: ReactNode
}) {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''

  return (
    <div className="app-shell">
      <div className="app-shell__bg" aria-hidden="true" />
      <header className="topbar">
        <div className="topbar__left">
          {showBack && !isHome ? (
            <Link to={backTo} className="icon-btn" aria-label="Volver">
              <IconChevronLeft />
            </Link>
          ) : isHome ? (
            <span className="topbar__spacer" aria-hidden="true" />
          ) : (
            <Link to="/" className="brand" aria-label="ARAY — Lobby">
              <BrandLogo variant="compact" alt="" />
              <span className="brand__wordmark">ARAY</span>
            </Link>
          )}
        </div>
        <div className="topbar__center">
          {isHome ? (
            <p className="topbar__location" aria-current="page">
              <IconGamepad className="topbar__location-icon" aria-hidden />
              <span>LOBBY</span>
            </p>
          ) : title ? (
            <h1 className="topbar__title">{title}</h1>
          ) : null}
        </div>
        <div className="topbar__right topbar__right--actions">
          {trailing}
          {!isHome ? (
            <Link to="/" className="topbar__lobby" aria-label="Ir al Lobby">
              <IconChevronLeft className="topbar__lobby-chevron" aria-hidden />
              <span className="topbar__lobby-label">LOBBY</span>
            </Link>
          ) : !trailing ? (
            <span className="topbar__spacer" aria-hidden="true" />
          ) : null}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
