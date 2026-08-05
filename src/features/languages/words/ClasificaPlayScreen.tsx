import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { grantWordsMissionReward } from '@/features/languages/words/wordsMissionReward'
import {
  buildClasificaSession,
  CLASIFICA_ROUNDS,
  type ClasificaChip,
  type ClasificaRound,
} from '@/minigames/adapters/palabrasClasifica'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { soundEngine } from '@/sound/soundEngine'
import './clasifica.css'

const WORDS_PATH = '/missions/languages/words'
const SUMMARY_PATH = '/missions/languages/words/clasifica/summary'

type Placement = Record<string, string | null> // chipId → binId

export function ClasificaPlayScreen() {
  const navigate = useNavigate()
  const { grantActivityEnergy, playerId } = useProgress()
  const { recordProgress } = useDailyMission()
  const { consumeMissionOfDay } = usePlaySession()
  const seedRef = useRef(Date.now())
  const startedAtRef = useRef(Date.now())
  const openedRef = useRef(false)
  const correctRef = useRef(0)
  const totalChipsRef = useRef(0)

  const session = useMemo(
    () => buildClasificaSession(CLASIFICA_ROUNDS, seedRef.current),
    [],
  )

  const [roundIndex, setRoundIndex] = useState(0)
  const [placement, setPlacement] = useState<Placement>({})
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [locked, setLocked] = useState<Set<string>>(new Set())
  const [wrongFlash, setWrongFlash] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [busy, setBusy] = useState(false)

  const round: ClasificaRound | undefined = session[roundIndex]

  const resetRound = useCallback((r: ClasificaRound) => {
    setPlacement(Object.fromEntries(r.chips.map((c) => [c.id, null])))
    setSelectedChipId(null)
    setLocked(new Set())
    setWrongFlash(null)
    setBusy(false)
  }, [])

  useEffect(() => {
    if (!session[0]) return
    resetRound(session[0])
    totalChipsRef.current = session.reduce((n, r) => n + r.chips.length, 0)
  }, [resetRound, session])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  const finish = useCallback(() => {
    grantWordsMissionReward({
      correct: correctRef.current,
      total: totalChipsRef.current,
      modeLabel: 'clasifica',
      playerId,
      startedAtMs: startedAtRef.current,
      recordProgress,
      grantActivityEnergy,
      consumeMissionOfDay,
    })
    navigate(SUMMARY_PATH, {
      replace: true,
      state: {
        correct: correctRef.current,
        total: totalChipsRef.current,
        title: 'Clasifica',
      },
    })
  }, [consumeMissionOfDay, grantActivityEnergy, navigate, playerId, recordProgress])

  const goNextRound = useCallback(() => {
    const next = roundIndex + 1
    if (next >= session.length) {
      finish()
      return
    }
    setRoundIndex(next)
    resetRound(session[next]!)
  }, [finish, resetRound, roundIndex, session])

  const tryPlace = useCallback(
    (chipId: string, binId: string) => {
      if (!round || busy || locked.has(chipId)) return
      const chip = round.chips.find((c) => c.id === chipId)
      if (!chip) return

      if (chip.binId === binId) {
        soundEngine.play('answer-correct')
        const nextLocked = new Set(locked)
        nextLocked.add(chipId)
        setLocked(nextLocked)
        setPlacement((p) => ({ ...p, [chipId]: binId }))
        setSelectedChipId(null)
        correctRef.current += 1
        setCorrectCount(correctRef.current)

        const allDone = round.chips.every((c) => nextLocked.has(c.id))
        if (allDone) {
          setBusy(true)
          window.setTimeout(() => goNextRound(), 650)
        }
        return
      }

      soundEngine.play('answer-wrong')
      setWrongFlash(binId)
      setBusy(true)
      window.setTimeout(() => {
        setWrongFlash(null)
        setBusy(false)
        setSelectedChipId(null)
      }, 480)
    },
    [busy, goNextRound, locked, round],
  )

  const onChipTap = (chip: ClasificaChip) => {
    if (busy || locked.has(chip.id)) return
    setSelectedChipId((prev) => (prev === chip.id ? null : chip.id))
  }

  const onBinTap = (binId: string) => {
    if (!selectedChipId || busy) return
    tryPlace(selectedChipId, binId)
  }

  if (!round) return null

  const poolChips = round.chips.filter((c) => !locked.has(c.id))
  const binsClass =
    round.bins.length <= 2
      ? 'clasifica-bins--2'
      : round.bins.length === 3
        ? 'clasifica-bins--3'
        : 'clasifica-bins--4'

  return (
    <AppShell title="CLASIFICA" shortTitle="Clasifica" showBack backTo={WORDS_PATH}>
      <div className="clasifica-play">
        <header className="clasifica-head">
          <p className="clasifica-progress" aria-live="polite">
            Ronda {roundIndex + 1} / {session.length} · {correctCount} bien
          </p>
          <h2 className="clasifica-prompt">{round.prompt}</h2>
          <p className="clasifica-hint">{round.help}</p>
          <p className="clasifica-hint clasifica-hint--action">
            {selectedChipId
              ? 'Ahora toca el bando correcto'
              : 'Toca una palabra y luego su bando'}
          </p>
        </header>

        <div className={`clasifica-bins ${binsClass}`} role="group" aria-label="Bandos">
          {round.bins.map((bin) => {
            const inBin = round.chips.filter(
              (c) => locked.has(c.id) && placement[c.id] === bin.id,
            )
            const isWrong = wrongFlash === bin.id
            const isTarget = Boolean(selectedChipId) && !busy
            return (
              <button
                key={bin.id}
                type="button"
                className={`clasifica-bin${isWrong ? ' is-wrong' : ''}${isTarget ? ' is-target' : ''}`}
                onClick={() => onBinTap(bin.id)}
                disabled={busy || !selectedChipId}
                aria-label={`Bando ${bin.label}`}
              >
                <span className="clasifica-bin__label">{bin.label}</span>
                <ul className="clasifica-bin__list">
                  {inBin.map((c) => (
                    <li key={c.id} className="clasifica-chip clasifica-chip--placed">
                      {c.word}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <ul className="clasifica-pool" aria-label="Palabras">
          {poolChips.map((chip) => (
            <li key={chip.id}>
              <button
                type="button"
                className={`clasifica-chip${selectedChipId === chip.id ? ' is-selected' : ''}`}
                onClick={() => onChipTap(chip)}
                disabled={busy}
              >
                {chip.word}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}
