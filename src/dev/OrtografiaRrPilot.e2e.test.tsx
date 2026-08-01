/**
 * Batería E2E del piloto RR: juega la pantalla real como un niño.
 * No conecta al flujo principal ni modifica JSON_SPEC.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { OrtografiaRrPilotScreen } from '@/dev/OrtografiaRrPilotScreen'
import rrPackJson from '@feinetas/ortografia/rr.json'
import type { OrtographyLemmaPack } from '@/feinetas/ortographyLemmaPack'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import { createInitialProgress, createLocalStorageProgressStore } from '@/progress/repository'

vi.mock('@/sound/soundEngine', () => ({
  soundEngine: {
    play: vi.fn(),
    unlock: vi.fn(),
    setMuted: vi.fn(),
    preload: vi.fn(),
    bindAutoUnlock: vi.fn(),
    getPrefs: vi.fn(() => ({
      sfxEnabled: true,
      musicEnabled: true,
      sfxVolume: 0.7,
      musicVolume: 0.18,
    })),
    applyPrefs: vi.fn(),
    subscribePrefs: vi.fn(() => () => undefined),
  },
}))

const pack = rrPackJson as OrtographyLemmaPack
const byId = new Map(pack.lemmas.map((l) => [l.id, l]))

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

function renderPilot() {
  const store = createLocalStorageProgressStore(memoryStorage())
  store.save(createInitialProgress())
  return render(
    <MemoryRouter initialEntries={['/dev/ortografia-rr']}>
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
            <Routes>
              <Route path="/dev/ortografia-rr" element={<OrtografiaRrPilotScreen />} />
              <Route path="/dev/lumo" element={<div>Lumo gallery</div>} />
            </Routes>
          </PlayProvider>
        </ProgressProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function hudLemmaId(): string {
  const idEl = document.querySelector('.rr-pilot__lemma-id')
  expect(idEl).toBeTruthy()
  return idEl!.textContent!.trim()
}

function optionButtons() {
  const group = screen.getByRole('group', { name: 'Opciones' })
  return within(group).getAllByRole('button')
}

function answerCurrent(mode: 'correct' | 'wrong') {
  const lemmaId = hudLemmaId()
  const lemma = byId.get(lemmaId)
  expect(lemma).toBeTruthy()

  const tip = document.querySelector('.rr-pilot__tip')
  if (lemma!.tip) {
    expect(tip).toBeTruthy()
    expect(tip!.textContent).toBe(lemma!.tip)
  } else {
    expect(tip).toBeNull()
  }

  const buttons = optionButtons()
  expect(buttons.length).toBeGreaterThanOrEqual(2)

  const correctBtn = buttons.find((b) => b.textContent?.trim() === lemma!.lemma)
  expect(correctBtn).toBeTruthy()

  if (mode === 'correct') {
    fireEvent.click(correctBtn!)
  } else {
    const wrongBtn = buttons.find((b) => b.textContent?.trim() !== lemma!.lemma)
    expect(wrongBtn).toBeTruthy()
    fireEvent.click(wrongBtn!)
  }

  for (const b of optionButtons()) {
    expect(b).toBeDisabled()
  }

  const feedback = document.querySelector('.rr-pilot__feedback')
  expect(feedback).toBeTruthy()
  const rule = document.querySelector('.rr-pilot__rule')
  expect(rule?.textContent).toBe(lemma!.ruleText)

  if (mode === 'correct') {
    expect(feedback!.textContent).toMatch(/Correcto/)
  } else {
    expect(feedback!.textContent).toContain(`forma bien: ${lemma!.lemma}`)
  }

  const next = screen.getByRole('button', {
    name: /Siguiente|Ver resumen/,
  })
  fireEvent.click(next)
  return lemmaId
}

function playFullRound(strategy: (i: number) => 'correct' | 'wrong') {
  const seen: string[] = []
  let expectedCorrect = 0

  for (let i = 0; i < 21; i += 1) {
    expect(screen.getByText(`${i + 1} / 21`)).toBeInTheDocument()
    const mode = strategy(i)
    if (mode === 'correct') expectedCorrect += 1
    const id = answerCurrent(mode)
    expect(seen).not.toContain(id)
    seen.push(id)
  }

  expect(seen).toHaveLength(21)
  expect(new Set(seen).size).toBe(21)
  expect(new Set(seen)).toEqual(new Set(pack.lemmas.map((l) => l.id)))

  expect(screen.getByRole('heading', { name: 'Ronda completada' })).toBeInTheDocument()
  expect(screen.getByText(`${expectedCorrect} / 21 aciertos`)).toBeInTheDocument()
  return { seen, expectedCorrect }
}

describe('E2E piloto RR — jugar como un niño', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    consoleError.mockClear()
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('completa las 21 acertando todas; sin repeticiones; resumen 21/21', () => {
    renderPilot()
    const { expectedCorrect } = playFullRound(() => 'correct')
    expect(expectedCorrect).toBe(21)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('completa las 21 fallando todas; resumen 0/21', () => {
    renderPilot()
    const { expectedCorrect } = playFullRound(() => 'wrong')
    expect(expectedCorrect).toBe(0)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('alterna aciertos y fallos; resumen = aciertos reales', () => {
    renderPilot()
    const { expectedCorrect } = playFullRound((i) => (i % 2 === 0 ? 'correct' : 'wrong'))
    expect(expectedCorrect).toBe(11)
    expect(screen.getByText('11 / 21 aciertos')).toBeInTheDocument()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('repite partida tras reiniciar; pack completo otra vez', () => {
    renderPilot()
    const first = playFullRound(() => 'correct')

    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_999)
    fireEvent.click(screen.getByRole('button', { name: 'Repetir ronda' }))

    expect(screen.getByText('1 / 21')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ronda completada' })).not.toBeInTheDocument()

    const second = playFullRound(() => 'wrong')
    expect(second.expectedCorrect).toBe(0)
    expect(new Set(second.seen)).toEqual(new Set(first.seen))
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('bloquea la UI tras responder (no doble click de acierto)', () => {
    renderPilot()
    const lemmaId = hudLemmaId()
    const lemma = byId.get(lemmaId)!
    const correctBtn = optionButtons().find((b) => b.textContent?.trim() === lemma.lemma)!
    fireEvent.click(correctBtn)
    fireEvent.click(correctBtn)
    expect(screen.getByText('Aciertos: 1')).toBeInTheDocument()
    expect(optionButtons().every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })

  it('tips solo cuando existen; ruleText siempre del lema actual', () => {
    renderPilot()
    for (let i = 0; i < 21; i += 1) {
      const lemmaId = hudLemmaId()
      const lemma = byId.get(lemmaId)!
      const tip = document.querySelector('.rr-pilot__tip')
      if (lemma.tip) {
        expect(tip?.textContent).toBe(lemma.tip)
      } else {
        expect(tip).toBeNull()
      }
      answerCurrent('correct')
    }
    expect(screen.getByText('21 / 21 aciertos')).toBeInTheDocument()
  })

  it('la pantalla y el adaptador no dependen del spelling legacy', () => {
    const screenSrc = readFileSync(
      path.resolve('src/dev/OrtografiaRrPilotScreen.tsx'),
      'utf8',
    )
    const mcqSrc = readFileSync(path.resolve('src/feinetas/ortographyMcq.ts'), 'utf8')
    expect(screenSrc).not.toMatch(/@\/spelling/)
    expect(screenSrc).not.toMatch(/SPELL_BANK|lemmas\.generated|buildSpell/)
    expect(mcqSrc).not.toMatch(/@\/spelling/)
    expect(mcqSrc).not.toMatch(/SPELL_BANK|lemmas\.generated|buildSpell/)
    expect(screenSrc).toMatch(/@feinetas\/ortografia\/rr\.json/)
  })
})
