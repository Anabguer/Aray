import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchScreen } from '@/features/maths/MatchScreen'
import {
  buildMatchPairs,
  buildMatchRounds,
  isCorrectMatch,
  MATCH_WRONG_MESSAGE,
  matchHintForAttempt,
  shuffleProductsNotAligned,
} from '@/math/match'
import { matchFactorRange } from '@/config/playConfig'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import { createInitialProgress, createLocalStorageProgressStore } from '@/progress/repository'

vi.mock('@/sound/soundEngine', () => ({
  soundEngine: {
    play: vi.fn(),
    setMuted: vi.fn(),
    unlock: vi.fn(),
    preload: vi.fn(),
    bindAutoUnlock: vi.fn(),
  },
}))

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

function renderMatch(table = 3) {
  const store = createLocalStorageProgressStore(memoryStorage())
  store.save(createInitialProgress())
  sessionStorage.setItem('aray.tables.selection', JSON.stringify({ tables: [table], mix: false }))
  return render(
    <MemoryRouter initialEntries={['/missions/mates/tables/match']}>
      <ProgressProvider store={store}>
        <PlayProvider>
          <Routes>
            <Route path="/missions/mates/tables/match" element={<MatchScreen />} />
            <Route path="/missions/mates/tables/summary" element={<div>Resumen</div>} />
            <Route path="/missions/mates/tables/modes" element={<div>Modos</div>} />
            <Route path="/" element={<div>Lobby</div>} />
          </Routes>
        </PlayProvider>
      </ProgressProvider>
    </MemoryRouter>,
  )
}

async function settle(ms = 550) {
  await new Promise((r) => setTimeout(r, ms))
}

describe('Empareja la tabla — lógica', () => {
  it('genera operaciones y resultados desordenados sin alinear', () => {
    const pairs = buildMatchPairs(8)
    expect(pairs).toHaveLength(10)
    expect(pairs[0].factor).toBe(matchFactorRange.min)
    expect(pairs.at(-1)?.factor).toBe(matchFactorRange.max)
    const products = shuffleProductsNotAligned(pairs, () => 0.2)
    expect(products).toHaveLength(10)
    expect(new Set(products).size).toBe(10)
    expect(products.every((p, i) => p === pairs[i].product)).toBe(false)
  })

  it('divide rondas de como máximo cinco', () => {
    expect(buildMatchRounds(buildMatchPairs(3)).map((r) => r.length)).toEqual([5, 5])
  })

  it('valida pareja correcta', () => {
    const pair = buildMatchPairs(4)[0]
    expect(isCorrectMatch(pair, pair.product)).toBe(true)
    expect(isCorrectMatch(pair, pair.product + 1)).toBe(false)
  })

  it('el primer fallo no revela la respuesta; pistas progresivas después', () => {
    expect(matchHintForAttempt(3, 15, 1)).toBeNull()
    expect(matchHintForAttempt(3, 15, 2)).toBe('Piensa en la tabla del 3')
    expect(matchHintForAttempt(3, 15, 3)).toBe('Es mayor que 10 y menor que 20')
    expect(matchHintForAttempt(3, 15, 3)).not.toContain('15')
  })
})

describe('Empareja la tabla — pantalla', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('no muestra el botón Comprobar y limita la ronda a cinco', () => {
    renderMatch(3)
    expect(screen.queryByRole('button', { name: /comprobar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/ronda 1\/2/i)).toBeInTheDocument()
    const ops = screen.getByRole('list', { name: /operaciones/i })
    expect(within(ops).getAllByRole('button')).toHaveLength(5)
  })

  it('valida y fija de inmediato una pareja correcta', async () => {
    renderMatch(3)
    fireEvent.click(screen.getByRole('button', { name: /^resultado 9$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^3 × 3$/i }))

    expect(await screen.findByRole('button', { name: /3 × 3 = 9, resuelta/i })).toBeDisabled()
    expect(screen.getByText(/¡pareja!/i)).toBeInTheDocument()
    expect(screen.getByText(/encontradas/i)).toBeInTheDocument()
  })

  it('una incorrecta vuelve disponible y registra el fallo sin revelar', async () => {
    renderMatch(3)
    fireEvent.click(screen.getByRole('button', { name: /^resultado 12$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^3 × 3$/i }))

    expect(await screen.findByText(MATCH_WRONG_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByText(/= 9/)).not.toBeInTheDocument()

    await settle()
    expect(screen.getByRole('button', { name: /^resultado 12$/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^3 × 3$/i })).toBeEnabled()
  })

  it('muestra pistas progresivas en la misma operación', async () => {
    renderMatch(3)
    const wrong = async () => {
      fireEvent.click(screen.getByRole('button', { name: /^resultado 12$/i }))
      fireEvent.click(screen.getByRole('button', { name: /^3 × 3$/i }))
      await settle()
    }

    await wrong()
    expect(screen.getByText(MATCH_WRONG_MESSAGE)).toBeInTheDocument()

    await wrong()
    expect(screen.getByText(/piensa en la tabla del 3/i)).toBeInTheDocument()

    await wrong()
    expect(screen.getByText(/mayor que 0 y menor que 10/i)).toBeInTheDocument()
  })

  it('completa la ronda solo cuando las cinco están fijas y no auto-avanza', async () => {
    renderMatch(3)
    const pairs = buildMatchRounds(buildMatchPairs(3))[0]
    for (const pair of pairs) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^resultado ${pair.product}$`, 'i') }))
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${pair.label}$`) }))
      await settle(520)
    }

    expect(await screen.findByRole('button', { name: /siguiente ronda/i })).toBeInTheDocument()
    expect(screen.getByText(/ronda lista/i)).toBeInTheDocument()
    expect(screen.queryByText(/ronda 2\/2/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /siguiente ronda/i }))
    await waitFor(() => {
      expect(screen.getByText(/ronda 2\/2/i)).toBeInTheDocument()
    })
  })

  it('bloquea interacciones mientras hay error', async () => {
    renderMatch(3)
    fireEvent.click(screen.getByRole('button', { name: /^resultado 12$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^3 × 3$/i }))
    expect(screen.getByRole('button', { name: /^resultado 9$/i })).toBeDisabled()
    await settle()
    expect(screen.getByRole('button', { name: /^resultado 9$/i })).toBeEnabled()
  })
})
