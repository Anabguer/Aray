import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthContext'
import { DailyMissionProvider } from '@/daily/DailyMissionContext'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import { createInitialProgress, createLocalStorageProgressStore } from '@/progress/repository'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network disabled in tests'))),
  )
})

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key) {
      map.delete(key)
    },
    setItem(key, value) {
      map.set(key, value)
    },
  }
}

function renderAt(
  path: string,
  session?: {
    role?: 'adult' | 'child' | null
    deviceAuthorized?: boolean
  },
) {
  const store = createLocalStorageProgressStore(memoryStorage())
  store.save(createInitialProgress())
  const role = session && Object.prototype.hasOwnProperty.call(session, 'role')
    ? (session.role ?? null)
    : 'child'
  const deviceAuthorized = session?.deviceAuthorized ?? true
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider
        initialSession={{
          role,
          account: null,
          player:
            role === 'child'
              ? { id: 1, slug: 'aray', displayName: 'Aray', avatarUrl: null }
              : null,
          players: [{ id: 1, slug: 'aray', displayName: 'Aray', avatarUrl: null }],
          csrf: 'test-csrf',
          deviceAuthorized,
          tutorDisplayName: 'Neni',
        }}
      >
        <ProgressProvider store={store} skipHydration>
          <PlayProvider>
            <DailyMissionProvider>
              <App />
            </DailyMissionProvider>
          </PlayProvider>
        </ProgressProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ARAY navigation shell', () => {
  it('muestra la portada lobby', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /^lobby$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /¡ey, aray!/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^jugar$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ir al lobby/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/¿jugamos, aray\?/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tu espacio para misiones/i)).not.toBeInTheDocument()
  })

  it('abre la pantalla de misiones con matemáticas jugable', () => {
    renderAt('/missions')
    expect(screen.getByRole('heading', { name: /^mis mundos$/i })).toBeInTheDocument()
    expect(screen.getByText(/elige tu próxima aventura/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /jugar matemáticas/i })).toHaveAttribute(
      'href',
      '/missions/mates',
    )
    expect(screen.getByRole('link', { name: /ir al lobby/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^volver$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: /controles del juego/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/cómo se juega/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ajustes de sonido/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /acceso adulto/i })).toBeInTheDocument()
  })

  it('abre el mapa de niveles sin 1 ni 10', () => {
    renderAt('/missions/mates/tables')
    expect(screen.getByRole('heading', { name: /^niveles$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mezcla tablas|mezcla/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/mezcla tablas del 2 al 9/i)).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: /tablas del 2 al 9/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /jugar tabla del/i })).toBeInTheDocument()
  })

  it('muestra modos con Empareja y misión random', () => {
    renderAt('/missions/mates/tables/modes')
    expect(screen.getByLabelText(/elige tu modo/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir al lobby/i })).toHaveTextContent(/lobby/i)
    expect(screen.getByRole('button', { name: /empareja/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /random/i })).toBeInTheDocument()
  })

  it('muestra controles unificados: sonido y acceso adulto', () => {
    renderAt('/')
    expect(screen.getByRole('toolbar', { name: /controles del juego/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/cómo se juega/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ajustes de sonido/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /acceso adulto/i })).toBeInTheDocument()
  })

  it('redirige /adult al acceso sin sesión adulta', () => {
    renderAt('/adult', { role: null, deviceAuthorized: false })
    expect(screen.getByRole('heading', { name: /afk academy/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /crear usuario/i })).toBeInTheDocument()
    expect(screen.queryByText(/panel familiar/i)).not.toBeInTheDocument()
  })
})
