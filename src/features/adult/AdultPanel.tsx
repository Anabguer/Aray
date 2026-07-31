import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiGet, apiPost } from '@/api/client'
import type { HubIconId } from '@/assets/icons/hub'
import { useAuth } from '@/auth/AuthContext'
import { ArayHubIcon } from '@/components/ArayHubIcon'
import { IconBolt, IconGem } from '@/components/Icons'
import { rewardGoalConfig } from '@/config/rewardGoal'
import { ConfirmDialog } from '@/features/adult/ConfirmDialog'
import {
  formatFriendlyWhen,
  formatMadridDate,
  formatPlayDuration,
  todayMadridYmd,
} from '@/features/adult/format'
import '@/features/adult/adult-panel.css'
import type {
  ActivityDay,
  AdultOverview,
  RewardCycle,
  TableMasteryItem,
} from '@/features/adult/types'
import {
  activities,
  changeCourse,
  courseLabel,
  courses,
  effectiveActivityRole,
  getBlock,
  getSkill,
  getSubject,
  skills,
  subjects,
} from '@/curriculum'
import type { AssignmentRole, CourseId, CourseMode } from '@/curriculum/types'
import {
  alphabetModeStatus,
  hardAlphabetLetters,
  normalizeAlphabetModeProgress,
  type AlphabetProgress,
} from '@/alphabet/progress'
import { useProgress } from '@/progress/ProgressContext'

type ActivityRange = '7d' | '30d' | 'custom'
type PanelSection = 'activities' | 'tables' | 'abc' | 'report' | 'course' | null
type AccTone = 'mates' | 'tablas' | 'lengua' | 'misiones' | 'informe' | 'curso'
type KpiTone = 'ok' | 'warn' | 'bad' | 'neutral'

const SECTION_STORAGE_KEY = 'aray-adult-open-section'

const ROLE_LABELS: Record<AssignmentRole | '', string> = {
  '': 'Por defecto del curso',
  recommended: 'Recomendada',
  mandatory: 'Obligatoria',
  free: 'Libre',
  review: 'Repaso',
  hidden: 'Oculta',
}

function masteryClass(label: string): string {
  switch (label) {
    case 'DOMADA':
      return 'mastery-chip--domada'
    case 'CASI DOMADA':
      return 'mastery-chip--casi'
    case 'NECESITA REFUERZO':
      return 'mastery-chip--refuerzo'
    default:
      return 'mastery-chip--entrenando'
  }
}

function masteryTone(label: string): 'refuerzo' | 'progreso' | 'domada' {
  if (label === 'NECESITA REFUERZO') return 'refuerzo'
  if (label === 'DOMADA') return 'domada'
  return 'progreso'
}

function tablesKpi(needs: number, dominated: number, practiced: number): {
  tone: KpiTone
  status: string
  detail: string
} {
  if (practiced === 0) {
    return { tone: 'neutral', status: 'Sin datos', detail: 'Aún no ha practicado' }
  }
  if (needs > 0) {
    return {
      tone: needs >= 2 ? 'bad' : 'warn',
      status: needs === 1 ? '1 a reforzar' : `${needs} a reforzar`,
      detail: dominated > 0 ? `${dominated} ya domina` : 'Conviene repasar',
    }
  }
  if (dominated > 0) {
    return {
      tone: 'ok',
      status: 'Va bien',
      detail: `${dominated} tabla${dominated === 1 ? '' : 's'} dominada${dominated === 1 ? '' : 's'}`,
    }
  }
  return { tone: 'warn', status: 'En progreso', detail: 'Sigue entrenando' }
}

function alphabetKpi(
  server: NonNullable<AdultOverview['education']['alphabet']> | undefined,
  local: AlphabetProgress,
): { tone: KpiTone; status: string; detail: string } {
  const rounds = server?.roundsPlayed ?? local.roundsPlayed
  if (rounds <= 0) {
    return { tone: 'neutral', status: 'Sin datos', detail: 'Aún no ha jugado ABC' }
  }
  const needs = server?.needsReviewModes ?? 0
  const dominated =
    server?.dominatedModes ??
    ['missing', 'neighbor', 'order-letters', 'order-words'].filter((m) =>
      normalizeAlphabetModeProgress(local.modes[m]).everMastered,
    ).length
  if (needs > 0) {
    return {
      tone: needs >= 2 ? 'bad' : 'warn',
      status: needs === 1 ? '1 modo flojo' : `${needs} modos flojos`,
      detail: `${rounds} rondas jugadas`,
    }
  }
  return {
    tone: 'ok',
    status: dominated > 0 ? 'Va bien' : 'En progreso',
    detail:
      dominated > 0
        ? `${dominated} modo${dominated === 1 ? '' : 's'} domado${dominated === 1 ? '' : 's'}`
        : `${rounds} rondas jugadas`,
  }
}

function readStoredSection(): PanelSection {
  try {
    const v = sessionStorage.getItem(SECTION_STORAGE_KEY)
    if (v === 'activities' || v === 'tables' || v === 'report' || v === 'course') return v
  } catch {
    /* ignore */
  }
  return null
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`adult-acc__chevron${open ? ' is-open' : ''}`}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AdultPanel() {
  const { account, players, logout, refreshMe } = useAuth()
  const { progress, updateSchool, setActivityAssignments, refreshFromServer } = useProgress()
  const navigate = useNavigate()
  const [resolvedPlayerId, setResolvedPlayerId] = useState<number | null>(
    players[0]?.id ?? null,
  )
  const playerId = resolvedPlayerId ?? players[0]?.id ?? null

  const [overview, setOverview] = useState<AdultOverview | null>(null)
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([])
  const [weekPlaySeconds, setWeekPlaySeconds] = useState(0)
  const [range, setRange] = useState<ActivityRange>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [deliverCycle, setDeliverCycle] = useState<RewardCycle | null>(null)
  const [robuxAmount, setRobuxAmount] = useState(500)
  const [deliveryDate, setDeliveryDate] = useState(todayMadridYmd())
  const [deliveryNote, setDeliveryNote] = useState('')

  const [voidCycle, setVoidCycle] = useState<RewardCycle | null>(null)
  const [voidReason, setVoidReason] = useState('')

  const [confirmCourseId, setConfirmCourseId] = useState<CourseId | null>(null)
  const [reportCourse, setReportCourse] = useState<string>('all')
  const [reportSubject, setReportSubject] = useState<string>('all')
  const [eduReport, setEduReport] = useState<
    NonNullable<AdultOverview['educationReport']> | null
  >(null)
  const [reportLoaded, setReportLoaded] = useState(false)

  const [openSection, setOpenSection] = useState<PanelSection>(() => readStoredSection())
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [prizeHistoryOpen, setPrizeHistoryOpen] = useState(false)
  const [pendingListOpen, setPendingListOpen] = useState(false)

  const sectionRefs = useRef<Partial<Record<NonNullable<PanelSection>, HTMLElement | null>>>({})

  const loadOverview = useCallback(async () => {
    const qs = playerId != null ? `?playerId=${playerId}` : ''
    const data = await apiGet<AdultOverview & { ok?: boolean }>(
      `/adult/overview.php${qs}`,
    )
    setOverview(data)
    if (data.player?.id) setResolvedPlayerId(data.player.id)
    return data.player?.id ?? playerId
  }, [playerId])

  const loadActivity = useCallback(
    async (pid: number | null = playerId, activityRange: ActivityRange = range) => {
      if (pid == null) return
      const params = new URLSearchParams({
        playerId: String(pid),
        range: activityRange,
      })
      if (activityRange === 'custom') {
        if (customFrom) params.set('from', customFrom)
        if (customTo) params.set('to', customTo)
      }
      const data = await apiGet<{ days: ActivityDay[] }>(
        `/adult/activity.php?${params.toString()}`,
      )
      const days = Array.isArray(data.days) ? data.days : []
      setActivityDays(days)
      return days
    },
    [playerId, range, customFrom, customTo],
  )

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pid = await loadOverview()
      const days = await loadActivity(pid)
      if (range === '7d' && days) {
        setWeekPlaySeconds(days.reduce((acc, d) => acc + (d.playSeconds || 0), 0))
      } else if (pid != null) {
        const week = await apiGet<{ days: ActivityDay[] }>(
          `/adult/activity.php?${new URLSearchParams({
            playerId: String(pid),
            range: '7d',
          }).toString()}`,
        )
        const weekDays = Array.isArray(week.days) ? week.days : []
        setWeekPlaySeconds(weekDays.reduce((acc, d) => acc + (d.playSeconds || 0), 0))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el panel.')
    } finally {
      setLoading(false)
    }
  }, [loadOverview, loadActivity, range])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  useEffect(() => {
    try {
      if (openSection) sessionStorage.setItem(SECTION_STORAGE_KEY, openSection)
      else sessionStorage.removeItem(SECTION_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [openSection])

  const toggleSection = useCallback((id: NonNullable<PanelSection>) => {
    setOpenSection((prev) => {
      const next = prev === id ? null : id
      if (next) {
        requestAnimationFrame(() => {
          const el = sectionRefs.current[next]
          if (!el) return
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
        })
      }
      return next
    })
  }, [])

  const summary = overview?.summary
  const name = overview?.player.displayName ?? 'Aray'
  const adultName = account?.displayName ?? account?.login ?? 'Familia'

  const calendarDays = useMemo(() => {
    const map = new Map(activityDays.map((d) => [d.activityDate, d]))
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [activityDays])

  const needsReview = overview?.education.needsReview ?? []
  const learning = overview?.education.learning ?? []
  const dominated = overview?.education.dominated ?? []

  async function confirmDeliver() {
    if (!deliverCycle || playerId == null) return
    setBusy(true)
    try {
      await apiPost('/adult/reward-deliver.php', {
        playerId,
        cycleId: deliverCycle.id,
        robuxAmount,
        deliveryDate,
        note: deliveryNote,
      })
      setDeliverCycle(null)
      setDeliveryNote('')
      await refreshAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo marcar como entregado.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmVoid() {
    if (!voidCycle || playerId == null) return
    setBusy(true)
    try {
      await apiPost('/adult/reward-void.php', {
        playerId,
        cycleId: voidCycle.id,
        reason: voidReason,
      })
      setVoidCycle(null)
      setVoidReason('')
      await refreshAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo anular la entrega.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmCourseChange() {
    if (!confirmCourseId || playerId == null) return
    const mode: CourseMode = confirmCourseId === 'primary-3' ? 'review' : 'standard'
    setBusy(true)
    try {
      await apiPost('/adult/course-set.php', {
        playerId,
        courseId: confirmCourseId,
        courseMode: mode,
      })
      updateSchool(changeCourse(progress.school, confirmCourseId, mode))
      setConfirmCourseId(null)
      await refreshAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el curso.')
    } finally {
      setBusy(false)
    }
  }

  async function assignActivityRoles(assignments: Record<string, AssignmentRole | null>) {
    if (playerId == null) return
    setBusy(true)
    try {
      await apiPost('/adult/activity-assignments.php', {
        playerId,
        assignments,
      })
      const next = { ...progress.activityAssignments }
      for (const [activityId, role] of Object.entries(assignments)) {
        if (!role) delete next[activityId]
        else next[activityId] = role
      }
      setActivityAssignments(next)
      await refreshAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la asignación.')
    } finally {
      setBusy(false)
    }
  }

  async function assignActivityRole(activityId: string, role: AssignmentRole | '') {
    await assignActivityRoles({ [activityId]: role === '' ? null : role })
  }

  async function recommendTablePractice(tableN: number) {
    const trainId = `mult-table-${tableN}-train`
    await assignActivityRole(trainId, 'recommended')
  }

  async function loadEducationReport() {
    if (playerId == null) return
    try {
      const params = new URLSearchParams({ playerId: String(playerId) })
      if (reportCourse !== 'all') params.set('courseId', reportCourse)
      if (reportSubject !== 'all') params.set('subjectId', reportSubject)
      const data = await apiGet<{
        dashboard?: AdultOverview
        educationReport?: AdultOverview['educationReport']
      }>(`/adult/dashboard.php?${params.toString()}`)
      setEduReport(data.dashboard?.educationReport ?? data.educationReport ?? null)
      await loadActivity(playerId)
      setReportLoaded(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el informe.')
    }
  }

  const school = overview?.school ?? progress.school
  const assignmentMap = overview?.school?.activityAssignments ?? progress.activityAssignments

  async function onLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  function openDeliver(c: RewardCycle) {
    setDeliverCycle(c)
    setRobuxAmount(500)
    setDeliveryDate(overview?.playableDate || todayMadridYmd())
    setDeliveryNote('')
  }

  const reinforcementLabel = useMemo(() => {
    if (needsReview.length === 0) return null
    const names = needsReview.map((t) => t.tableN)
    if (names.length === 1) return `Tablas del ${names[0]}`
    if (names.length === 2) return `Tablas del ${names[0]} y del ${names[1]}`
    return `Tablas del ${names.slice(0, -1).join(', ')} y del ${names[names.length - 1]}`
  }, [needsReview])

  const reinforcementPct = needsReview[0]?.accuracyPct

  return (
    <div className="adult-panel">
      <header className="adult-panel__header">
        <div>
          <p className="adult-panel__eyebrow">Panel familiar</p>
          <h1 className="adult-panel__title">Hola, {adultName}</h1>
          <p className="adult-panel__subtitle">
            Seguimiento de <strong>{name}</strong>
          </p>
        </div>
        <div className="adult-panel__header-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              void (async () => {
                try {
                  await apiPost('/auth/child-enter.php', {})
                } catch {
                  /* dispositivo aún no autorizado */
                }
                await refreshFromServer()
                navigate('/', { replace: true })
              })()
            }}
          >
            Volver al juego
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void onLogout()}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {error ? (
        <p className="adult-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading || !summary || !overview ? (
        <div className="adult-panel__loading" role="status">
          {error && !loading ? 'No se pudo cargar.' : 'Cargando resumen…'}
        </div>
      ) : (
        <>
          <PendingPrizeHero
            pending={overview.pendingPrizes}
            delivered={overview.deliveredPrizes}
            energyCurrent={summary.rewardPointsCurrent}
            energyTarget={summary.rewardTarget}
            cycleNumber={summary.currentCycleNumber}
            historyOpen={prizeHistoryOpen}
            pendingListOpen={pendingListOpen}
            onToggleHistory={() => setPrizeHistoryOpen((v) => !v)}
            onTogglePendingList={() => setPendingListOpen((v) => !v)}
            onDeliver={openDeliver}
            onVoid={(c) => {
              setVoidCycle(c)
              setVoidReason('')
            }}
          />

          <SubjectKpiStrip
            maths={(() => {
              const practiced = overview.education.tables.filter((t) => t.practiced).length
              if (practiced === 0) {
                return { tone: 'neutral' as const, status: 'Sin datos', detail: 'Aún sin partidas' }
              }
              if (needsReview.length > 0) {
                return {
                  tone: (needsReview.length >= 2 ? 'bad' : 'warn') as KpiTone,
                  status: 'A mejorar',
                  detail: `${dominated.length} ok · ${needsReview.length} flojas`,
                }
              }
              return {
                tone: 'ok' as const,
                status: 'Va bien',
                detail: `${dominated.length} tabla${dominated.length === 1 ? '' : 's'} ok`,
              }
            })()}
            tables={tablesKpi(
              needsReview.length,
              dominated.length,
              overview.education.tables.filter((t) => t.practiced).length,
            )}
            alphabet={alphabetKpi(overview.education.alphabet, progress.alphabet)}
            activities={activityAssignmentSummary(
              school.currentCourseId as CourseId,
              assignmentMap,
            )}
            courseLabel={courseLabel(school.currentCourseId as CourseId)}
            onOpen={(section) => {
              setOpenSection(section)
              requestAnimationFrame(() => {
                const el = sectionRefs.current[section]
                if (!el) return
                const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                el.scrollIntoView({
                  behavior: reduced ? 'auto' : 'smooth',
                  block: 'start',
                })
              })
            }}
          />

          <section className="adult-overview" aria-labelledby="adult-overview-title">
            <div className="adult-overview__head">
              <h2 id="adult-overview-title" className="adult-overview__title">
                Resumen de {name}
              </h2>
            </div>
            <div className="adult-overview__grid">
              <SummaryCard
                label="Última vez que jugó"
                value={formatFriendlyWhen(summary.lastActivityAt)}
                iconId="misiones"
                tone="misiones"
              />
              <SummaryCard
                label="Tiempo esta semana"
                value={formatPlayDuration(weekPlaySeconds)}
                iconId="coleccion"
                tone="curso"
              />
              <SummaryCard
                label="Energía para el próximo premio"
                value={`${summary.rewardPointsCurrent} / ${summary.rewardTarget}`}
                iconId="drop_robot"
                tone="informe"
              />
              <SummaryCard
                label="Necesita más refuerzo"
                value={
                  reinforcementLabel
                    ? reinforcementLabel
                    : dominated.length > 0
                      ? 'Va bien · sin alertas'
                      : 'Aún sin datos'
                }
                iconId="tablas"
                tone={reinforcementLabel ? 'tablas' : 'mates'}
              />
            </div>

            {needsReview.length > 0 ? (
              <aside className="adult-need" aria-label="Aviso de refuerzo">
                <div className="adult-need__body">
                  <p className="adult-need__eyebrow">Necesita practicar</p>
                  <p className="adult-need__title">{reinforcementLabel}</p>
                  <p className="adult-need__meta">
                    Último resultado:{' '}
                    {reinforcementPct != null ? `${reinforcementPct} %` : 'Sin datos'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary adult-need__cta"
                  onClick={() => {
                    setOpenSection('tables')
                    requestAnimationFrame(() => {
                      const el = sectionRefs.current.tables
                      if (!el) return
                      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      el.scrollIntoView({
                        behavior: reduced ? 'auto' : 'smooth',
                        block: 'start',
                      })
                    })
                  }}
                >
                  Ver qué necesita repasar
                </button>
              </aside>
            ) : null}

            <button
              type="button"
              className="adult-link-btn"
              aria-expanded={statsExpanded}
              aria-controls="adult-stats-more"
              onClick={() => setStatsExpanded((v) => !v)}
            >
              {statsExpanded ? 'Ocultar estadísticas' : 'Ver todas las estadísticas'}
            </button>

            <div
              id="adult-stats-more"
              className={`adult-stats-more${statsExpanded ? ' is-open' : ''}`}
              hidden={!statsExpanded}
            >
              <div className="adult-stats-more__grid">
                <SummaryCard compact label="Días jugados" value={String(summary.daysPlayed)} />
                <SummaryCard compact label="Partidas" value={String(summary.sessionsCount)} />
                <SummaryCard
                  compact
                  label="Nivel y XP"
                  value={`Nv. ${summary.level} · ${summary.xp} XP`}
                />
                <SummaryCard
                  compact
                  label="Energía (ciclo)"
                  value={`${summary.rewardPointsCurrent} / ${summary.rewardTarget}`}
                />
                <SummaryCard
                  compact
                  label="Mejor racha"
                  value={`${summary.bestStreak} aciertos`}
                />
                <SummaryCard
                  compact
                  label="Tablas dominadas"
                  value={
                    summary.dominatedTables.length
                      ? summary.dominatedTables.map((n) => `×${n}`).join(' · ')
                      : 'Ninguna aún'
                  }
                />
                <SummaryCard
                  compact
                  label="Aciertos"
                  value={
                    summary.accuracyPct != null
                      ? `${summary.accuracyPct}% (${summary.correctCount} bien)`
                      : 'Sin datos'
                  }
                />
                <SummaryCard
                  compact
                  label="Premios entregados"
                  value={String(summary.deliveredPrizesCount)}
                />
                <SummaryCard
                  compact
                  label="Energía hoy"
                  value={`${summary.energyToday} / ${summary.energyCap}`}
                />
                <SummaryCard
                  compact
                  label="Tiempo total"
                  value={formatPlayDuration(summary.playSecondsTotal)}
                />
              </div>
            </div>
          </section>

          <div className="adult-sections" role="region" aria-label="Secciones de gestión">
            <AccordionSection
              id="activities"
              open={openSection === 'activities'}
              onToggle={() => toggleSection('activities')}
              hubIcon="misiones"
              tone="misiones"
              title="Actividades asignadas"
              description="Decide qué actividades aparecen en el juego."
              summary={activityAssignmentSummary(school.currentCourseId as CourseId, assignmentMap)}
              sectionRef={(el) => {
                sectionRefs.current.activities = el
              }}
            >
              <ActivitiesPanel
                courseId={school.currentCourseId as CourseId}
                assignmentMap={assignmentMap as Record<string, AssignmentRole>}
                busy={busy}
                onAssign={(id, role) => void assignActivityRole(id, role)}
                onAssignGroup={(ids, role) => {
                  const payload: Record<string, AssignmentRole | null> = {}
                  for (const id of ids) payload[id] = role === '' ? null : role
                  void assignActivityRoles(payload)
                }}
              />
            </AccordionSection>

            <AccordionSection
              id="tables"
              open={openSection === 'tables'}
              onToggle={() => toggleSection('tables')}
              hubIcon="tablas"
              tone="tablas"
              title="Progreso en tablas"
              description="Consulta qué tablas domina y cuáles debe repasar."
              summary={`${dominated.length} dominadas · ${needsReview.length} necesitan refuerzo`}
              sectionRef={(el) => {
                sectionRefs.current.tables = el
              }}
            >
              <TablesProgressPanel
                needsReview={needsReview}
                learning={learning}
                dominated={dominated}
                allTables={overview.education.tables}
                busy={busy}
                onRecommend={(n) => void recommendTablePractice(n)}
              />
            </AccordionSection>

            <AccordionSection
              id="abc"
              open={openSection === 'abc'}
              onToggle={() => toggleSection('abc')}
              hubIcon="castellano"
              tone="lengua"
              title="Progreso ABC"
              description="Modos del abecedario, si conviene repasar y letras que más cuestan."
              summary={
                overview.education.alphabet && overview.education.alphabet.roundsPlayed > 0
                  ? `${overview.education.alphabet.roundsPlayed} rondas · ${overview.education.alphabet.dominatedModes} modos domados`
                  : progress.alphabet.roundsPlayed > 0
                    ? `${progress.alphabet.roundsPlayed} rondas · ${
                        ['missing', 'neighbor', 'order-letters', 'order-words'].filter((m) =>
                          normalizeAlphabetModeProgress(progress.alphabet.modes[m]).everMastered,
                        ).length
                      } modos domados`
                    : 'Aún sin rondas de ABC'
              }
              sectionRef={(el) => {
                sectionRefs.current.abc = el
              }}
            >
              <AlphabetProgressPanel
                server={overview.education.alphabet}
                local={progress.alphabet}
              />
            </AccordionSection>

            <AccordionSection
              id="report"
              open={openSection === 'report'}
              onToggle={() => toggleSection('report')}
              hubIcon="matematicas"
              tone="informe"
              title="Informe escolar"
              description="Revisa su progreso por curso y asignatura."
              summary={`${courseLabel(school.currentCourseId as CourseId)} · histórico global`}
              sectionRef={(el) => {
                sectionRefs.current.report = el
              }}
            >
              <ReportPanel
                reportCourse={reportCourse}
                reportSubject={reportSubject}
                range={range}
                customFrom={customFrom}
                customTo={customTo}
                onReportCourse={setReportCourse}
                onReportSubject={setReportSubject}
                onRange={setRange}
                onCustomFrom={setCustomFrom}
                onCustomTo={setCustomTo}
                onSubmit={() => void loadEducationReport()}
                reportLoaded={reportLoaded}
                eduReport={eduReport}
                days={calendarDays}
              />
            </AccordionSection>

            <AccordionSection
              id="course"
              open={openSection === 'course'}
              onToggle={() => toggleSection('course')}
              hubIcon="coleccion"
              tone="curso"
              title="Curso y configuración"
              description="Gestiona el curso y otras opciones del juego."
              summary={courseLabel(school.currentCourseId as CourseId)}
              sectionRef={(el) => {
                sectionRefs.current.course = el
              }}
            >
              <div className="adult-course-cfg">
                <p className="adult-course-cfg__current">
                  Curso actual:{' '}
                  <strong>{courseLabel(school.currentCourseId as CourseId)}</strong>
                  {school.courseMode === 'review' ? ' · modo repaso' : ''}
                </p>
                <p className="adult-course-cfg__note" role="note">
                  Cambiar de curso no borra su progreso, XP, energía ni premios.
                </p>
                <div className="adult-course-cfg__actions">
                  {courses
                    .filter((c) => c.status !== 'future')
                    .map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        className={
                          school.currentCourseId === course.id
                            ? 'btn btn-primary'
                            : 'btn btn-ghost'
                        }
                        disabled={busy || school.currentCourseId === course.id}
                        onClick={() => setConfirmCourseId(course.id)}
                      >
                        {course.title}
                      </button>
                    ))}
                </div>
              </div>
            </AccordionSection>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deliverCycle != null}
        title="Marcar premio como entregado"
        confirmLabel="Marcar como entregado"
        busy={busy}
        onCancel={() => setDeliverCycle(null)}
        onConfirm={() => void confirmDeliver()}
      >
        <p>
          Ciclo {deliverCycle?.cycleNumber}: confirma que ya has entregado los Robux.
        </p>
        <label className="adult-field">
          Cantidad de Robux
          <input
            type="number"
            min={1}
            max={99999}
            value={robuxAmount}
            onChange={(e) => setRobuxAmount(Number(e.target.value) || 0)}
          />
        </label>
        <label className="adult-field">
          Fecha de entrega
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </label>
        <label className="adult-field">
          Nota (opcional)
          <textarea
            rows={2}
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="Ej. Entregado en Roblox el domingo"
          />
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={voidCycle != null}
        title="Anular entrega"
        confirmLabel="Anular entrega"
        busy={busy}
        onCancel={() => setVoidCycle(null)}
        onConfirm={() => void confirmVoid()}
      >
        <p>
          Esto deshace la marca de entrega del ciclo {voidCycle?.cycleNumber}. Úsalo
          solo si fue un error.
        </p>
        <label className="adult-field">
          Motivo
          <textarea
            rows={2}
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            required
            placeholder="Ej. Me equivoqué al marcar"
          />
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmCourseId != null}
        title="Cambiar curso escolar"
        confirmLabel="Confirmar cambio"
        busy={busy}
        onCancel={() => setConfirmCourseId(null)}
        onConfirm={() => void confirmCourseChange()}
      >
        <p>
          ¿Pasar a {confirmCourseId ? courseLabel(confirmCourseId) : ''}? No se reinician XP,
          XP, energía, Robux, premios, logros, tablas ni colección. Los ejercicios de cursos
          anteriores pueden seguir como repaso.
        </p>
      </ConfirmDialog>
    </div>
  )
}

function activityAssignmentSummary(
  courseId: CourseId,
  assignmentMap: Record<string, string>,
): string {
  let recommended = 0
  let mandatory = 0
  for (const activity of activities.filter((a) => a.status === 'active').slice(0, 24)) {
    const role = effectiveActivityRole(
      activity.id,
      courseId,
      assignmentMap as Record<string, AssignmentRole>,
    )
    if (role === 'recommended') recommended += 1
    if (role === 'mandatory') mandatory += 1
  }
  return `${recommended} recomendadas · ${mandatory} obligatorias`
}

function SummaryCard({
  label,
  value,
  compact = false,
  iconId,
  tone,
}: {
  label: string
  value: string
  compact?: boolean
  iconId?: HubIconId
  tone?: AccTone
}) {
  return (
    <article
      className={`adult-stat${compact ? ' adult-stat--compact' : ''}${
        tone ? ` adult-stat--${tone}` : ''
      }`}
    >
      {iconId && !compact ? (
        <span className="adult-stat__icon" aria-hidden="true">
          <ArayHubIcon id={iconId} className="adult-stat__hub" />
        </span>
      ) : null}
      <div className="adult-stat__body">
        <p className="adult-stat__label">{label}</p>
        <p className="adult-stat__value">{value}</p>
      </div>
    </article>
  )
}

function SubjectKpiStrip({
  maths,
  tables,
  alphabet,
  activities,
  courseLabel: courseText,
  onOpen,
}: {
  maths: { tone: KpiTone; status: string; detail: string }
  tables: { tone: KpiTone; status: string; detail: string }
  alphabet: { tone: KpiTone; status: string; detail: string }
  activities: string
  courseLabel: string
  onOpen: (section: NonNullable<PanelSection>) => void
}) {
  const items: Array<{
    key: string
    section: NonNullable<PanelSection>
    hubIcon: HubIconId
    title: string
    tone: KpiTone
    status: string
    detail: string
    accent: AccTone
  }> = [
    {
      key: 'mates',
      section: 'tables',
      hubIcon: 'matematicas',
      title: 'Matemáticas',
      tone: maths.tone,
      status: maths.status,
      detail: maths.detail,
      accent: 'mates',
    },
    {
      key: 'tablas',
      section: 'tables',
      hubIcon: 'tablas',
      title: 'Tablas',
      tone: tables.tone,
      status: tables.status,
      detail: tables.detail,
      accent: 'tablas',
    },
    {
      key: 'lengua',
      section: 'abc',
      hubIcon: 'castellano',
      title: 'Lengua · ABC',
      tone: alphabet.tone,
      status: alphabet.status,
      detail: alphabet.detail,
      accent: 'lengua',
    },
    {
      key: 'ingles',
      section: 'report',
      hubIcon: 'ingles',
      title: 'Inglés',
      tone: 'neutral',
      status: 'Sin datos',
      detail: 'Aún sin actividad',
      accent: 'informe',
    },
    {
      key: 'acts',
      section: 'activities',
      hubIcon: 'misiones',
      title: 'Actividades',
      tone: 'neutral',
      status: 'Asignadas',
      detail: activities,
      accent: 'misiones',
    },
    {
      key: 'curso',
      section: 'course',
      hubIcon: 'coleccion',
      title: 'Curso',
      tone: 'ok',
      status: courseText,
      detail: 'Configuración',
      accent: 'curso',
    },
  ]

  return (
    <section className="adult-kpi" aria-labelledby="adult-kpi-title">
      <div className="adult-kpi__head">
        <h2 id="adult-kpi-title" className="adult-kpi__title">
          Cómo va en cada mundo
        </h2>
        <p className="adult-kpi__lead">Toca una tarjeta para ver el detalle.</p>
      </div>
      <div className="adult-kpi__row" role="list">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="listitem"
            className={`adult-kpi__card adult-kpi__card--${item.accent} adult-kpi__card--${item.tone}`}
            onClick={() => onOpen(item.section)}
          >
            <span className="adult-kpi__icon" aria-hidden="true">
              <ArayHubIcon id={item.hubIcon} className="adult-kpi__hub" />
            </span>
            <span className="adult-kpi__label">{item.title}</span>
            <span className={`adult-kpi__status adult-kpi__status--${item.tone}`}>
              {item.status}
            </span>
            <span className="adult-kpi__detail">{item.detail}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function AccordionSection({
  open,
  onToggle,
  hubIcon,
  tone,
  title,
  description,
  summary,
  children,
  sectionRef,
}: {
  id: string
  open: boolean
  onToggle: () => void
  hubIcon: HubIconId
  tone: AccTone
  title: string
  description: string
  summary: string
  children: ReactNode
  sectionRef: (el: HTMLElement | null) => void
}) {
  const panelId = useId()
  const headerId = useId()
  return (
    <section
      className={`adult-acc adult-acc--${tone}${open ? ' is-open' : ''}`}
      ref={sectionRef}
      aria-labelledby={headerId}
    >
      <h2 className="adult-acc__heading">
        <button
          type="button"
          id={headerId}
          className="adult-acc__trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={`adult-acc__icon adult-acc__icon--${tone}`} aria-hidden="true">
            <ArayHubIcon id={hubIcon} className="adult-acc__hub" />
          </span>
          <span className="adult-acc__text">
            <span className="adult-acc__title">{title}</span>
            <span className="adult-acc__desc">{description}</span>
            <span className="adult-acc__summary">{summary}</span>
          </span>
          <IconChevron open={open} />
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={`adult-acc__panel${open ? ' is-open' : ''}`}
        hidden={!open}
      >
        <div className="adult-acc__panel-inner">{children}</div>
      </div>
    </section>
  )
}

function PendingPrizeHero({
  pending,
  delivered,
  energyCurrent,
  energyTarget,
  cycleNumber,
  historyOpen,
  pendingListOpen,
  onToggleHistory,
  onTogglePendingList,
  onDeliver,
  onVoid,
}: {
  pending: RewardCycle[]
  delivered: RewardCycle[]
  energyCurrent: number
  energyTarget: number
  cycleNumber: number
  historyOpen: boolean
  pendingListOpen: boolean
  onToggleHistory: () => void
  onTogglePendingList: () => void
  onDeliver: (c: RewardCycle) => void
  onVoid: (c: RewardCycle) => void
}) {
  const ready = pending[0] ?? null
  const nextPending = pending[1] ?? null
  const prizeName = ready?.robuxAmount
    ? `${ready.robuxAmount} Robux`
    : rewardGoalConfig.rewardLabel
  const inProgress = !ready
  const pct = ready
    ? 100
    : Math.min(100, Math.round((energyCurrent / Math.max(1, energyTarget)) * 100))
  const energyNow = ready ? energyTarget : energyCurrent
  const statusLabel = ready ? 'Listo para entregar' : 'En progreso'

  return (
    <section
      className={`adult-prize-hero${ready ? ' adult-prize-hero--ready' : ''}`}
      aria-labelledby="adult-prize-title"
    >
      <div className="adult-prize-hero__top">
        <div className="adult-prize-hero__visual" aria-hidden="true">
          <ArayHubIcon id="drop_robot" className="adult-prize-hero__img" />
        </div>
        <div className="adult-prize-hero__main">
          <p className="adult-prize-hero__eyebrow">Premio pendiente</p>
          <h2 id="adult-prize-title" className="adult-prize-hero__name">
            {inProgress && pending.length === 0 && delivered.length === 0 && energyCurrent === 0
              ? rewardGoalConfig.rewardLabel
              : prizeName}
          </h2>
          <p className={`adult-prize-hero__status adult-prize-hero__status--${ready ? 'ready' : 'progress'}`}>
            {statusLabel}
            {ready ? ` · Ciclo ${ready.cycleNumber}` : ` · Ciclo ${cycleNumber}`}
          </p>
          {ready?.earnedAt ? (
            <p className="adult-prize-hero__date">
              Desbloqueado: {formatFriendlyWhen(ready.earnedAt)}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="adult-prize-hero__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={energyTarget}
        aria-valuenow={energyNow}
        aria-label={`Energía del premio: ${energyNow} de ${energyTarget}`}
      >
        <div className="adult-prize-hero__meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="adult-prize-hero__energy">
        <IconBolt className="adult-prize-hero__bolt" />
        {energyNow} / {energyTarget} de energía
      </p>

      <div className="adult-prize-hero__actions">
        {ready ? (
          <button
            type="button"
            className="btn btn-primary adult-prize-hero__cta"
            onClick={() => onDeliver(ready)}
          >
            Marcar como entregado
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost"
          aria-expanded={historyOpen}
          onClick={onToggleHistory}
        >
          Ver historial de premios
        </button>
      </div>

      {nextPending || (pending.length > 1 && !pendingListOpen) ? (
        <div className="adult-prize-hero__next">
          {nextPending ? (
            <p>
              Siguiente premio listo: ciclo {nextPending.cycleNumber}
              {nextPending.earnedAt
                ? ` · ${formatFriendlyWhen(nextPending.earnedAt)}`
                : ''}
            </p>
          ) : null}
          {pending.length > 1 ? (
            <button
              type="button"
              className="adult-link-btn"
              aria-expanded={pendingListOpen}
              onClick={onTogglePendingList}
            >
              {pendingListOpen
                ? 'Ocultar lista de premios'
                : `Ver los ${pending.length} premios pendientes`}
            </button>
          ) : null}
        </div>
      ) : null}

      {pendingListOpen && pending.length > 1 ? (
        <ul className="adult-prize-list">
          {pending.map((c) => (
            <li key={c.id} className="adult-prize adult-prize--pending">
              <div>
                <p className="adult-prize__badge">Listo para entregar</p>
                <h3 className="adult-prize__title">
                  {rewardGoalConfig.rewardLabel} · Ciclo {c.cycleNumber}
                </h3>
                <p className="adult-prize__meta">
                  {c.earnedAt
                    ? `Desbloqueado: ${formatFriendlyWhen(c.earnedAt)}`
                    : 'Listo para entregar'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary adult-prize__cta"
                onClick={() => onDeliver(c)}
              >
                Marcar como entregado
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!ready && pending.length === 0 && energyCurrent === 0 && delivered.length === 0 ? (
        <p className="adult-prize-hero__empty">
          Todavía no hay un premio pendiente. Cuando {rewardGoalConfig.rewardLabel} se
          desbloquee, aparecerá aquí para entregarlo.
        </p>
      ) : null}

      {historyOpen ? (
        <div className="adult-prize-history">
          <h3 className="adult-block__subtitle">Historial de premios</h3>
          {delivered.length === 0 ? (
            <p className="adult-block__empty">Aún no hay premios entregados.</p>
          ) : (
            <ul className="adult-prize-list adult-prize-list--delivered">
              {delivered.slice(0, 8).map((c) => (
                <li key={c.id} className="adult-prize adult-prize--done">
                  <div>
                    <p className="adult-prize__badge adult-prize__badge--done">Entregado</p>
                    <h3 className="adult-prize__title">
                      {c.robuxAmount != null
                        ? `${c.robuxAmount} Robux`
                        : rewardGoalConfig.rewardLabel}
                      {` · Ciclo ${c.cycleNumber}`}
                    </h3>
                    <p className="adult-prize__meta">
                      {c.deliveryDateLocal
                        ? formatMadridDate(c.deliveryDateLocal)
                        : formatFriendlyWhen(c.deliveredAt)}
                      {c.deliveryNote ? ` · ${c.deliveryNote}` : ''}
                    </p>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => onVoid(c)}>
                    Anular
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}

function ActivitiesPanel({
  courseId,
  assignmentMap,
  busy,
  onAssign,
  onAssignGroup,
}: {
  courseId: CourseId
  assignmentMap: Record<string, AssignmentRole>
  busy: boolean
  onAssign: (activityId: string, role: AssignmentRole | '') => void
  onAssignGroup: (activityIds: string[], role: AssignmentRole | '') => void
}) {
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('all')

  const activeActivities = useMemo(
    () => activities.filter((a) => a.status === 'active').slice(0, 24),
    [],
  )

  const groups = useMemo(() => {
    const map = new Map<
      string,
      {
        skillId: string
        title: string
        subjectId: string
        subjectTitle: string
        items: typeof activeActivities
      }
    >()
    for (const activity of activeActivities) {
      const skillMeta = getSkill(activity.skillId)
      const subjectId = skillMeta
        ? (getBlock(skillMeta.blockId)?.subjectId ?? 'maths')
        : 'maths'
      const subjectTitle = getSubject(subjectId)?.title ?? subjectId
      const key = activity.skillId
      const existing = map.get(key)
      if (existing) existing.items.push(activity)
      else {
        map.set(key, {
          skillId: activity.skillId,
          title: skillMeta?.title ?? activity.skillId,
          subjectId,
          subjectTitle,
          items: [activity],
        })
      }
    }
    return [...map.values()].filter((g) => {
      if (subjectFilter !== 'all' && g.subjectId !== subjectFilter) return false
      if (skillFilter !== 'all' && g.skillId !== skillFilter) return false
      return true
    })
  }, [activeActivities, subjectFilter, skillFilter])

  const skillOptions = useMemo(() => {
    const ids = new Set(activeActivities.map((a) => a.skillId))
    return skills.filter((s) => ids.has(s.id))
  }, [activeActivities])

  return (
    <div className="adult-assign">
      <div className="adult-filters adult-filters--row">
        <label className="adult-field">
          Asignatura
          <select
            className="adult-select"
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value)
              setSkillFilter('all')
            }}
          >
            <option value="all">Todas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="adult-field">
          Habilidad
          <select
            className="adult-select"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
          >
            <option value="all">Todas</option>
            {skillOptions
              .filter((s) => {
                if (subjectFilter === 'all') return true
                return getBlock(s.blockId)?.subjectId === subjectFilter
              })
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
          </select>
        </label>
      </div>

      {groups.length === 0 ? (
        <p className="adult-block__empty">No hay actividades con estos filtros.</p>
      ) : (
        <ul className="adult-assign__groups">
          {groups.map((group) => (
            <li key={group.skillId} className="adult-assign__group">
              <div className="adult-assign__group-head">
                <div>
                  <h3 className="adult-assign__group-title">{group.title}</h3>
                  <p className="adult-assign__group-meta">{group.subjectTitle}</p>
                </div>
                <label className="adult-field adult-field--inline">
                  <span className="visually-hidden">Aplicar a todo el grupo</span>
                  <select
                    className="adult-select"
                    disabled={busy}
                    defaultValue=""
                    aria-label={`Aplicar estado a ${group.title}`}
                    onChange={(e) => {
                      const v = e.target.value as AssignmentRole | ''
                      onAssignGroup(
                        group.items.map((i) => i.id),
                        v,
                      )
                      e.target.value = ''
                    }}
                  >
                    <option value="" disabled>
                      Aplicar a todo el grupo…
                    </option>
                    <option value="">Por defecto del curso</option>
                    <option value="recommended">Recomendada</option>
                    <option value="mandatory">Obligatoria</option>
                    <option value="free">Libre</option>
                    <option value="review">Repaso</option>
                    <option value="hidden">Oculta</option>
                  </select>
                </label>
              </div>
              <ul className="adult-assign__items">
                {group.items.map((activity) => {
                  const effective = effectiveActivityRole(
                    activity.id,
                    courseId,
                    assignmentMap,
                  )
                  const override = assignmentMap[activity.id] ?? ''
                  return (
                    <li key={activity.id} className="adult-assign__item">
                      <div className="adult-assign__item-info">
                        <p className="adult-assign__item-name">{activity.title}</p>
                        <p className="adult-assign__item-state">
                          Estado: {ROLE_LABELS[effective ?? ''] ?? effective ?? '—'}
                        </p>
                      </div>
                      <label className="adult-field adult-field--inline">
                        <span className="visually-hidden">Asignación de {activity.title}</span>
                        <select
                          className="adult-select"
                          value={override}
                          disabled={busy}
                          aria-label={`Asignación de ${activity.title}`}
                          onChange={(e) =>
                            onAssign(activity.id, e.target.value as AssignmentRole | '')
                          }
                        >
                          <option value="">Por defecto del curso</option>
                          <option value="recommended">Recomendada</option>
                          <option value="mandatory">Obligatoria</option>
                          <option value="free">Libre</option>
                          <option value="review">Repaso</option>
                          <option value="hidden">Oculta</option>
                        </select>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AlphabetProgressPanel({
  server,
  local,
}: {
  server: NonNullable<AdultOverview['education']['alphabet']> | undefined
  local: AlphabetProgress
}) {
  if (server && server.roundsPlayed > 0) {
    return (
      <div className="adult-abc-panel">
        <p className="adult-abc-panel__meta">
          {server.roundsPlayed} rondas · {server.perfectRounds} perfectas · mejor racha{' '}
          {server.bestStreak}
          {server.needsReviewModes > 0 ? ` · ${server.needsReviewModes} a repasar` : ''}
        </p>
        <ul className="adult-abc-panel__modes">
          {server.modes.map((m) => (
            <li key={m.modeKey}>
              <strong>{m.title}</strong>
              <span>{m.label}</span>
              <span>
                {m.lastRoundScore != null ? `Última ${m.lastRoundScore}/10` : 'Sin ronda'}
                {m.everMastered ? ' · Domado' : ''}
              </span>
            </li>
          ))}
        </ul>
        {server.hardLetters.length > 0 ? (
          <div className="adult-abc-panel__hard">
            <h3>Letras que más cuestan</h3>
            <ul>
              {server.hardLetters.map((h) => (
                <li key={h.letter}>
                  <strong>{h.letter}</strong>
                  <span>
                    {h.wrong} fallos / {h.attempts} intentos
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="adult-empty">Sin letras difíciles registradas aún.</p>
        )}
      </div>
    )
  }

  const modes: Array<{ id: string; title: string }> = [
    { id: 'missing', title: 'Letra que falta' },
    { id: 'neighbor', title: 'Siguiente / anterior' },
    { id: 'order-letters', title: 'Ordena letras' },
    { id: 'order-words', title: 'Ordena palabras' },
    { id: 'random', title: 'Random' },
  ]
  const hard = hardAlphabetLetters(local, 8)

  if (local.roundsPlayed === 0) {
    return (
      <p className="adult-empty">
        Todavía no hay rondas de ABC en el servidor. Cuando practique online, aquí verás dominio y
        letras difíciles.
      </p>
    )
  }

  return (
    <div className="adult-abc-panel">
      <p className="adult-abc-panel__meta">
        {local.roundsPlayed} rondas · {local.perfectRounds} perfectas · mejor racha {local.bestStreak}{' '}
        (caché local)
      </p>
      <ul className="adult-abc-panel__modes">
        {modes.map((m) => {
          const prog = normalizeAlphabetModeProgress(local.modes[m.id])
          const st = alphabetModeStatus(prog)
          return (
            <li key={m.id}>
              <strong>{m.title}</strong>
              <span>{st.label}</span>
              <span>
                {prog.lastRoundScore != null ? `Última ${prog.lastRoundScore}/10` : 'Sin ronda'}
                {prog.everMastered ? ' · Domado' : ''}
              </span>
            </li>
          )
        })}
      </ul>
      {hard.length > 0 ? (
        <div className="adult-abc-panel__hard">
          <h3>Letras que más cuestan</h3>
          <ul>
            {hard.map((h) => (
              <li key={h.letter}>
                <strong>{h.letter}</strong>
                <span>
                  {h.wrong} fallos / {h.attempts} intentos
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="adult-empty">Sin letras difíciles registradas aún.</p>
      )}
    </div>
  )
}

function TablesProgressPanel({
  needsReview,
  learning,
  dominated,
  allTables,
  busy,
  onRecommend,
}: {
  needsReview: TableMasteryItem[]
  learning: TableMasteryItem[]
  dominated: TableMasteryItem[]
  allTables: TableMasteryItem[]
  busy: boolean
  onRecommend: (tableN: number) => void
}) {
  if (allTables.length === 0) {
    return <p className="adult-block__empty">Todavía no ha practicado tablas.</p>
  }

  const sections: Array<{
    key: string
    title: string
    items: TableMasteryItem[]
    showRecommend?: boolean
  }> = [
    { key: 'review', title: 'Necesita refuerzo', items: needsReview, showRecommend: true },
    { key: 'learning', title: 'En progreso', items: learning },
    { key: 'dominated', title: 'Dominadas', items: dominated },
  ]

  return (
    <div className="adult-tables-panel">
      {sections.map((section) =>
        section.items.length === 0 ? null : (
          <div key={section.key} className="adult-tables-panel__section">
            <h3 className="adult-tables-panel__heading">{section.title}</h3>
            <ul className="adult-tables adult-tables--cards">
              {section.items.map((t) => {
                const tone = masteryTone(t.label)
                const pct = t.accuracyPct ?? 0
                return (
                  <li
                    key={t.tableN}
                    className={`adult-table-card adult-table-card--${tone}`}
                  >
                    <div className="adult-table-card__head">
                      <span className="adult-tables__n">Tabla del {t.tableN}</span>
                      <span className={`mastery-chip ${masteryClass(t.label)}`}>
                        {t.label}
                      </span>
                    </div>
                    <p className="adult-tables__meta">
                      {t.attempts > 0
                        ? `${t.correct}/${t.attempts} aciertos`
                        : 'Sin intentos aún'}
                      {t.accuracyPct != null ? ` · ${t.accuracyPct} %` : ''}
                    </p>
                    <p className="adult-tables__meta">
                      Última práctica:{' '}
                      {t.lastPracticedAt
                        ? formatFriendlyWhen(t.lastPracticedAt)
                        : 'Todavía no'}
                    </p>
                    <div
                      className="adult-table-card__bar"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={`Precisión ${pct} %`}
                    >
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    {section.showRecommend ? (
                      <button
                        type="button"
                        className="btn btn-secondary adult-table-card__cta"
                        disabled={busy}
                        onClick={() => onRecommend(t.tableN)}
                      >
                        Recomendar práctica
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ),
      )}
    </div>
  )
}

function ReportPanel({
  reportCourse,
  reportSubject,
  range,
  customFrom,
  customTo,
  onReportCourse,
  onReportSubject,
  onRange,
  onCustomFrom,
  onCustomTo,
  onSubmit,
  reportLoaded,
  eduReport,
  days,
}: {
  reportCourse: string
  reportSubject: string
  range: ActivityRange
  customFrom: string
  customTo: string
  onReportCourse: (v: string) => void
  onReportSubject: (v: string) => void
  onRange: (r: ActivityRange) => void
  onCustomFrom: (v: string) => void
  onCustomTo: (v: string) => void
  onSubmit: () => void
  reportLoaded: boolean
  eduReport: NonNullable<AdultOverview['educationReport']> | null
  days: Array<[string, ActivityDay]>
}) {
  const mastered = eduReport?.skills.filter((s) => s.mastery?.label === 'DOMADA').length ?? 0
  const needs = eduReport?.skills.filter((s) => s.mastery?.label === 'NECESITA REFUERZO').length ?? 0

  return (
    <div className="adult-report">
      <div className="adult-filters adult-filters--report">
        <label className="adult-field">
          Curso
          <select
            className="adult-select"
            value={reportCourse}
            onChange={(e) => onReportCourse(e.target.value)}
          >
            <option value="all">Histórico global</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="adult-field">
          Asignatura
          <select
            className="adult-select"
            value={reportSubject}
            onChange={(e) => onReportSubject(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="maths">Matemáticas</option>
            <option value="languages">Lenguas</option>
            <option value="english">Inglés</option>
          </select>
        </label>
        <div className="adult-field">
          <span>Periodo</span>
          <div className="adult-range" role="group" aria-label="Periodo">
            {(
              [
                ['7d', '7 días'],
                ['30d', '30 días'],
                ['custom', 'Personalizado'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`adult-range__btn${range === id ? ' is-active' : ''}`}
                onClick={() => onRange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {range === 'custom' ? (
          <div className="adult-custom-range">
            <label className="adult-field">
              Desde
              <input
                type="date"
                value={customFrom}
                onChange={(e) => onCustomFrom(e.target.value)}
              />
            </label>
            <label className="adult-field">
              Hasta
              <input
                type="date"
                value={customTo}
                onChange={(e) => onCustomTo(e.target.value)}
              />
            </label>
          </div>
        ) : null}
        <button type="button" className="btn btn-primary adult-report__submit" onClick={onSubmit}>
          Ver informe
        </button>
      </div>

      {!reportLoaded ? (
        <p className="adult-report__hint">
          Elige curso, asignatura y periodo para ver el progreso escolar y la actividad de
          esos días. El dominio de las tablas es global (no se reinicia al cambiar de curso).
        </p>
      ) : (
        <>
          {eduReport ? (
            <div className="adult-report__summary">
              <IconGem className="adult-report__summary-icon" />
              <div>
                <p className="adult-report__summary-title">Resumen del informe</p>
                <p className="adult-report__summary-text">
                  {eduReport.skills.length} habilidades · {mastered} dominadas · {needs}{' '}
                  necesitan refuerzo
                  {eduReport.scope === 'global' ? ' · vista global' : ' · filtrado por curso'}
                </p>
              </div>
            </div>
          ) : null}

          <h3 className="adult-tables-panel__heading">Actividad del periodo</h3>
          {days.length === 0 ? (
            <p className="adult-block__empty">Sin actividad en este periodo.</p>
          ) : (
            <ul className="adult-calendar">
              {days.map(([date, day]) => {
                const intensity = Math.min(1, day.playSeconds / 1800)
                return (
                  <li
                    key={date}
                    className="adult-calendar__day"
                    style={{ ['--day-heat' as string]: String(0.18 + intensity * 0.72) }}
                  >
                    <p className="adult-calendar__date">{formatMadridDate(date)}</p>
                    <p className="adult-calendar__time">
                      {formatPlayDuration(day.playSeconds)}
                    </p>
                    <p className="adult-calendar__meta">
                      {day.sessionsCount} partida{day.sessionsCount === 1 ? '' : 's'}
                      {day.rewardPointsEarned > 0
                        ? ` · +${day.rewardPointsEarned} energía`
                        : ''}
                      {day.accuracyPct != null ? ` · ${day.accuracyPct}% aciertos` : ''}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}

          <h3 className="adult-tables-panel__heading">Progreso por habilidad</h3>
          {eduReport ? (
            <ul className="adult-tables">
              {eduReport.skills.map((row) => (
                <li key={row.skillId} className="adult-tables__item">
                  <div className="adult-tables__head">
                    <span className="adult-tables__n">
                      {row.subjectTitle} · {row.skillTitle}
                    </span>
                    <span
                      className={`mastery-chip ${masteryClass(row.mastery?.label ?? 'ENTRENANDO')}`}
                    >
                      {row.mastery?.label ?? 'Sin datos'}
                    </span>
                  </div>
                  <p className="adult-tables__meta">
                    {row.mastery
                      ? `${row.mastery.correct}/${row.mastery.attempts} aciertos`
                      : 'Sin práctica aún'}
                    {row.mastery?.lastPracticedAt
                      ? ` · ${formatFriendlyWhen(row.mastery.lastPracticedAt)}`
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adult-block__empty">No hay datos de habilidades para este filtro.</p>
          )}
        </>
      )}
    </div>
  )
}
