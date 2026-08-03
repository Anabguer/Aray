import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthContext'
import { DailyMissionProvider } from '@/daily/DailyMissionContext'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import { createInitialProgress, createLocalStorageProgressStore } from '@/progress/repository'
import { blocksForSubject } from '@/curriculum'
import { activeWordsExercises, wordsExerciseHref } from '@/features/languages/words/exercises'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network disabled in tests'))),
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
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

function renderAt(path: string) {
  const store = createLocalStorageProgressStore(memoryStorage())
  store.save(createInitialProgress())
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider
        initialSession={{
          role: 'child',
          account: null,
          player: { id: 1, slug: 'aray', displayName: 'Aray', avatarUrl: null },
          players: [{ id: 1, slug: 'aray', displayName: 'Aray', avatarUrl: null }],
          csrf: 'test-csrf',
          deviceAuthorized: true,
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

describe('navegación Lengua → Palabras', () => {
  it('el hub de Lengua solo tiene Ortografía, Palabras y Orden alfabético', () => {
    const langBlocks = blocksForSubject('languages')
    expect(langBlocks.map((b) => b.id)).toEqual(['spelling', 'words', 'alphabet'])
    expect(langBlocks.map((b) => b.title)).toEqual([
      'Ortografía',
      'Palabras',
      'Orden alfabético',
    ])
    expect(langBlocks.find((b) => b.id === 'words')?.description).toBe('Jugar con las palabras')
    expect(langBlocks.some((b) => b.id === 'writing' || b.title === 'Escritura')).toBe(false)
    expect(langBlocks.some((b) => b.id === 'comprehension' || b.title === 'Comprensión')).toBe(
      false,
    )
  })

  it('abre Palabras y muestra Formar, Clasifica y modos MCQ', () => {
    renderAt('/missions/languages/words')
    expect(screen.getByRole('heading', { name: /^palabras$/i })).toBeInTheDocument()
    const formar = screen.getByRole('listitem', { name: /formar palabras/i })
    expect(formar).toHaveAttribute('href', '/missions/languages/formar-palabras')
    expect(screen.getByRole('listitem', { name: /clasifica/i })).toHaveAttribute(
      'href',
      '/missions/languages/words/clasifica',
    )
    expect(screen.queryByRole('listitem', { name: /singular \/ plural/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('listitem', { name: /masculino \/ femenino/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: /sinónimos y antónimos/i })).toBeInTheDocument()
    expect(screen.queryByRole('listitem', { name: /^sinónimos$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('listitem', { name: /^antónimos$/i })).not.toBeInTheDocument()
  })

  it('Ortografía no muestra Formar palabras', () => {
    renderAt('/missions/languages/spelling')
    expect(screen.getByRole('heading', { name: /^ortografía$/i })).toBeInTheDocument()
    expect(screen.queryByRole('listitem', { name: /formar palabras/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/formar palabras/i)).not.toBeInTheDocument()
  })

  it('Formar palabras abre en la ruta canónica', () => {
    renderAt('/missions/languages/formar-palabras')
    expect(screen.getByRole('heading', { name: /formar/i })).toBeInTheDocument()
    expect(screen.getByText(/ordena las letras/i)).toBeInTheDocument()
  })

  it('el catálogo de Palabras incluye formar + clasifica + relaciones + monta + varios', () => {
    const active = activeWordsExercises()
    expect(active.map((e) => e.id)).toEqual([
      'formar-palabras',
      'clasifica',
      'sinonimos-antonimos',
      'monta-frase',
      'quien-hace-que',
      'comun-propio',
    ])
    expect(wordsExerciseHref(active[0]!)).toBe('/missions/languages/formar-palabras')
    expect(wordsExerciseHref(active[1]!)).toBe('/missions/languages/words/clasifica')
    expect(wordsExerciseHref(active[3]!)).toBe('/missions/languages/words/monta-frase')
  })

  it('el mapa de Lengua no muestra Escritura ni Comprensión', () => {
    renderAt('/missions/languages')
    const map = screen.getByRole('list')
    expect(within(map).getByText(/^ortografía$/i)).toBeInTheDocument()
    expect(within(map).getByText(/^palabras$/i)).toBeInTheDocument()
    expect(within(map).getByText(/^orden alfabético$/i)).toBeInTheDocument()
    expect(within(map).getByText(/jugar con las palabras/i)).toBeInTheDocument()
    expect(within(map).queryByText(/^escritura$/i)).not.toBeInTheDocument()
    expect(within(map).queryByText(/^comprensión$/i)).not.toBeInTheDocument()
  })
})
