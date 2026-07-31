import { masteryThresholds } from '@/config/rewards'
import { rewardRules } from '@/config/rewards'
import type { AlphabetPlayMode, AlphabetQuestion } from '@/alphabet/types'
import type { ProgressState } from '@/math/types'
import { grantRewardPoints, localDateString } from '@/reward/engine'

/** Modos con dominio propio (random actualiza los que toquen + sí mismo). */
export type AlphabetTrackMode =
  | 'missing'
  | 'neighbor'
  | 'order-letters'
  | 'order-words'
  | 'random'

export interface AlphabetModeProgress {
  practiced: boolean
  attempts: number
  correct: number
  masteryScore: number
  lastPracticedAt: string | null
  bestRoundScore: number
  lastRoundScore: number | null
  consecutiveLowRounds: number
  everMastered: boolean
}

export interface AlphabetLetterStats {
  attempts: number
  correct: number
  wrong: number
  lastSeenAt: string | null
}

export interface AlphabetProgress {
  modes: Record<string, AlphabetModeProgress>
  letters: Record<string, AlphabetLetterStats>
  roundsPlayed: number
  perfectRounds: number
  bestStreak: number
}

export interface AlphabetAnswerRecord {
  questionId: string
  kind: AlphabetQuestion['kind']
  correct: boolean
  firstTry: boolean
  /** Letra clave del ítem (respuesta o letra mostrada). */
  focusLetter?: string
  attemptId: string
}

export interface AlphabetSessionResult {
  mode: AlphabetPlayMode
  total: number
  correct: number
  bestStreak: number
  roundScore: number
  xpEarned: number
  coinsEarned: number
  rewardPointsEarned: number
  rewardDailyComplete: boolean
  sessionId: string
  recommendReview: boolean
  statusLabel: string
}

export const alphabetRoundConfig = {
  targetSize: 10,
  passScore: 8,
  consecutiveLowsToNeedsTrain: 2,
  /** Energía / premio por ronda completada. */
  rewardPointsPerRound: 3,
} as const

export const ALPHABET_TRACK_MODES: AlphabetTrackMode[] = [
  'missing',
  'neighbor',
  'order-letters',
  'order-words',
  'random',
]

export function emptyAlphabetModeProgress(): AlphabetModeProgress {
  return {
    practiced: false,
    attempts: 0,
    correct: 0,
    masteryScore: 0,
    lastPracticedAt: null,
    bestRoundScore: 0,
    lastRoundScore: null,
    consecutiveLowRounds: 0,
    everMastered: false,
  }
}

export function emptyAlphabetProgress(): AlphabetProgress {
  return {
    modes: {},
    letters: {},
    roundsPlayed: 0,
    perfectRounds: 0,
    bestStreak: 0,
  }
}

export function normalizeAlphabetModeProgress(
  raw: Partial<AlphabetModeProgress> | null | undefined,
): AlphabetModeProgress {
  const base = emptyAlphabetModeProgress()
  if (!raw || typeof raw !== 'object') return base
  const bestRoundScore =
    typeof raw.bestRoundScore === 'number' ? clampScore(raw.bestRoundScore) : 0
  const everMastered = Boolean(raw.everMastered) || bestRoundScore >= alphabetRoundConfig.passScore
  return {
    practiced: Boolean(raw.practiced),
    attempts: typeof raw.attempts === 'number' ? Math.max(0, raw.attempts) : 0,
    correct: typeof raw.correct === 'number' ? Math.max(0, raw.correct) : 0,
    masteryScore:
      typeof raw.masteryScore === 'number' ? Math.max(0, Math.min(100, raw.masteryScore)) : 0,
    lastPracticedAt: typeof raw.lastPracticedAt === 'string' ? raw.lastPracticedAt : null,
    bestRoundScore,
    lastRoundScore: typeof raw.lastRoundScore === 'number' ? clampScore(raw.lastRoundScore) : null,
    consecutiveLowRounds:
      typeof raw.consecutiveLowRounds === 'number' ? Math.max(0, raw.consecutiveLowRounds) : 0,
    everMastered,
  }
}

export function normalizeAlphabetProgress(raw: unknown): AlphabetProgress {
  const base = emptyAlphabetProgress()
  if (!raw || typeof raw !== 'object') return base
  const parsed = raw as Partial<AlphabetProgress>
  const modes: Record<string, AlphabetModeProgress> = {}
  if (parsed.modes && typeof parsed.modes === 'object') {
    for (const [key, value] of Object.entries(parsed.modes)) {
      modes[key] = normalizeAlphabetModeProgress(value)
    }
  }
  const letters: Record<string, AlphabetLetterStats> = {}
  if (parsed.letters && typeof parsed.letters === 'object') {
    for (const [key, value] of Object.entries(parsed.letters)) {
      if (!value || typeof value !== 'object') continue
      letters[key] = {
        attempts: typeof value.attempts === 'number' ? Math.max(0, value.attempts) : 0,
        correct: typeof value.correct === 'number' ? Math.max(0, value.correct) : 0,
        wrong: typeof value.wrong === 'number' ? Math.max(0, value.wrong) : 0,
        lastSeenAt: typeof value.lastSeenAt === 'string' ? value.lastSeenAt : null,
      }
    }
  }
  return {
    modes,
    letters,
    roundsPlayed: typeof parsed.roundsPlayed === 'number' ? Math.max(0, parsed.roundsPlayed) : 0,
    perfectRounds: typeof parsed.perfectRounds === 'number' ? Math.max(0, parsed.perfectRounds) : 0,
    bestStreak: typeof parsed.bestStreak === 'number' ? Math.max(0, parsed.bestStreak) : 0,
  }
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(alphabetRoundConfig.targetSize, Math.round(n)))
}

/** Escala aciertos de la ronda a /10. */
export function evaluateAlphabetRoundScore(correct: number, total: number): number {
  if (total <= 0) return 0
  return clampScore((correct / total) * alphabetRoundConfig.targetSize)
}

export function applyAlphabetEvaluableRound(
  prev: AlphabetModeProgress,
  roundScore: number,
  now: string,
  attemptDelta: { attempts: number; correct: number },
): AlphabetModeProgress {
  const score = clampScore(roundScore)
  const passed = score >= alphabetRoundConfig.passScore
  const bestRoundScore = Math.max(prev.bestRoundScore, score)
  const everMastered = prev.everMastered || bestRoundScore >= alphabetRoundConfig.passScore
  const consecutiveLowRounds = passed ? 0 : prev.consecutiveLowRounds + 1
  const floor = everMastered ? masteryThresholds.mastered : 0
  const masteryScore = Math.max(prev.masteryScore, bestRoundScore * 10, floor)

  return {
    practiced: true,
    attempts: prev.attempts + attemptDelta.attempts,
    correct: prev.correct + attemptDelta.correct,
    masteryScore: Math.min(100, masteryScore),
    lastPracticedAt: now,
    bestRoundScore,
    lastRoundScore: score,
    consecutiveLowRounds,
    everMastered,
  }
}

export type AlphabetStatusKind =
  | 'new'
  | 'learning'
  | 'solid'
  | 'mastered'
  | 'mastered_review'
  | 'needs_train'

export interface AlphabetStatusView {
  kind: AlphabetStatusKind
  label: string
  recommendPractice: boolean
}

export function alphabetModeStatus(t: AlphabetModeProgress): AlphabetStatusView {
  const ever = t.everMastered || t.bestRoundScore >= alphabetRoundConfig.passScore

  if (t.consecutiveLowRounds >= alphabetRoundConfig.consecutiveLowsToNeedsTrain) {
    return {
      kind: 'needs_train',
      label: 'Necesita entreno',
      recommendPractice: true,
    }
  }
  if (ever && t.consecutiveLowRounds >= 1) {
    return {
      kind: 'mastered_review',
      label: 'Domado · Conviene repasar',
      recommendPractice: true,
    }
  }
  if (ever) {
    return { kind: 'mastered', label: '¡Domado!', recommendPractice: false }
  }
  if (t.masteryScore >= masteryThresholds.solid) {
    return { kind: 'solid', label: 'Sólido', recommendPractice: false }
  }
  if (t.practiced) {
    return { kind: 'learning', label: 'En marcha', recommendPractice: false }
  }
  return { kind: 'new', label: 'Sin practicar', recommendPractice: false }
}

function calculateAlphabetRewards(
  answers: AlphabetAnswerRecord[],
): { xpEarned: number; bestStreak: number } {
  let xp = 0
  let streak = 0
  let bestStreak = 0
  for (const answer of answers) {
    if (answer.correct) {
      xp += rewardRules.xpPerCorrect
      if (answer.firstTry) {
        streak += 1
        bestStreak = Math.max(bestStreak, streak)
        if (streak > 0 && streak % rewardRules.xpStreakBonusEvery === 0) {
          xp += rewardRules.xpStreakBonus
        }
      } else {
        streak = 0
      }
    } else {
      streak = 0
    }
  }
  return { xpEarned: xp, bestStreak }
}

export function applyAlphabetSessionToProgress(
  progress: ProgressState,
  input: {
    mode: AlphabetPlayMode
    answers: AlphabetAnswerRecord[]
    sessionId: string
    bestStreakInRound: number
  },
  today: string = localDateString(),
): { next: ProgressState; result: AlphabetSessionResult } {
  const alphabet = normalizeAlphabetProgress(progress.alphabet)
  const already = progress.reward.appliedSessionIds.includes(input.sessionId)

  const correct = input.answers.filter((a) => a.correct).length
  const total = input.answers.length
  const roundScore = evaluateAlphabetRoundScore(correct, total)
  const rewards = calculateAlphabetRewards(input.answers)
  const sessionBestStreak = Math.max(input.bestStreakInRound, rewards.bestStreak)

  if (already) {
    const modeProg = normalizeAlphabetModeProgress(alphabet.modes[input.mode])
    const status = alphabetModeStatus(modeProg)
    return {
      next: progress,
      result: {
        mode: input.mode,
        total,
        correct,
        bestStreak: sessionBestStreak,
        roundScore,
        xpEarned: 0,
        coinsEarned: 0,
        rewardPointsEarned: 0,
        rewardDailyComplete:
          progress.reward.dailyPoints >= 10 || progress.reward.goalStatus !== 'active',
        sessionId: input.sessionId,
        recommendReview: status.recommendPractice,
        statusLabel: status.label,
      },
    }
  }

  const now = new Date().toISOString()
  const grant = grantRewardPoints(
    progress.reward,
    {
      requestedPoints: alphabetRoundConfig.rewardPointsPerRound,
      sessionId: input.sessionId,
      attemptIds: input.answers.filter((a) => a.correct).map((a) => a.attemptId),
    },
    today,
  )

  const nextAlphabet: AlphabetProgress = {
    ...alphabet,
    modes: { ...alphabet.modes },
    letters: { ...alphabet.letters },
    roundsPlayed: alphabet.roundsPlayed + 1,
    perfectRounds: alphabet.perfectRounds + (correct === total && total > 0 ? 1 : 0),
    bestStreak: Math.max(alphabet.bestStreak, sessionBestStreak),
  }

  // Actualizar dominio del modo elegido
  const trackKeys = new Set<AlphabetTrackMode>([input.mode])
  if (input.mode === 'random') {
    for (const a of input.answers) trackKeys.add(a.kind as AlphabetTrackMode)
  }

  for (const key of trackKeys) {
    const prev = normalizeAlphabetModeProgress(nextAlphabet.modes[key])
    const kindAnswers =
      key === input.mode && input.mode !== 'random'
        ? input.answers
        : key === 'random'
          ? input.answers
          : input.answers.filter((a) => a.kind === key)
    if (kindAnswers.length === 0) continue
    const kindCorrect = kindAnswers.filter((a) => a.correct).length
    const kindScore =
      key === input.mode
        ? roundScore
        : evaluateAlphabetRoundScore(kindCorrect, kindAnswers.length)
    nextAlphabet.modes[key] = applyAlphabetEvaluableRound(prev, kindScore, now, {
      attempts: kindAnswers.length,
      correct: kindCorrect,
    })
  }

  for (const answer of input.answers) {
    const letter = answer.focusLetter?.toUpperCase()
    if (!letter) continue
    const prev = nextAlphabet.letters[letter] ?? {
      attempts: 0,
      correct: 0,
      wrong: 0,
      lastSeenAt: null,
    }
    nextAlphabet.letters[letter] = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (answer.correct ? 1 : 0),
      wrong: prev.wrong + (answer.correct ? 0 : 1),
      lastSeenAt: now,
    }
  }

  const primary = normalizeAlphabetModeProgress(nextAlphabet.modes[input.mode])
  const status = alphabetModeStatus(primary)

  const next: ProgressState = {
    ...progress,
    version: 5,
    alphabet: nextAlphabet,
    xp: progress.xp + rewards.xpEarned,
    coins: progress.coins + rewardRules.coinsTrainComplete,
    bestStreak: Math.max(progress.bestStreak, sessionBestStreak),
    lastPracticeAt: now,
    reward: grant.reward,
  }

  return {
    next,
    result: {
      mode: input.mode,
      total,
      correct,
      bestStreak: sessionBestStreak,
      roundScore,
      xpEarned: rewards.xpEarned,
      coinsEarned: rewardRules.coinsTrainComplete,
      rewardPointsEarned: grant.granted,
      rewardDailyComplete: grant.dailyComplete,
      sessionId: input.sessionId,
      recommendReview: status.recommendPractice,
      statusLabel: status.label,
    },
  }
}

export function hardAlphabetLetters(
  alphabet: AlphabetProgress,
  limit = 8,
): Array<{ letter: string; wrong: number; attempts: number }> {
  return Object.entries(alphabet.letters)
    .filter(([, s]) => s.wrong > 0)
    .map(([letter, s]) => ({ letter, wrong: s.wrong, attempts: s.attempts }))
    .sort((a, b) => b.wrong - a.wrong || b.attempts - a.attempts)
    .slice(0, limit)
}
