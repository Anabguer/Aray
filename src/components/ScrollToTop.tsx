import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

function resetScrollContainers() {
  const top = 0
  const left = 0
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  if (!isJsdom) {
    window.scrollTo(left, top)
  }
  document.documentElement.scrollTop = top
  document.body.scrollTop = top

  document.querySelectorAll<HTMLElement>('.app-main, .app-shell, [data-scroll-root]').forEach((el) => {
    el.scrollTop = top
    el.scrollLeft = left
  })
}

/**
 * Al cambiar de ruta, abre siempre desde arriba y evita que el navegador
 * restaure un scroll previo o que el foco desplace la vista.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    if (hash) return

    resetScrollContainers()

    const main = document.querySelector<HTMLElement>('.app-main')
    if (!main) return
    if (!main.hasAttribute('tabindex')) {
      main.tabIndex = -1
    }
    main.focus({ preventScroll: true })
  }, [pathname, search, hash, navigationType])

  return null
}
