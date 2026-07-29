import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiGet, apiPost } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { ConfirmDialog } from '@/features/adult/ConfirmDialog'
import {
  formatMadridDate,
  formatMadridDateTime,
  formatPlayDuration,
  todayMadridYmd,
} from '@/features/adult/format'
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
  getSkill,
} from '@/curriculum'
import type { AssignmentRole, CourseId, CourseMode } from '@/curriculum/types'
import { useProgress } from '@/progress/ProgressContext'

type ActivityRange = '7d' | '30d' | 'custom'

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

export function AdultPanel() {
  const { account, players, logout } = useAuth()
  const { progress, updateSchool, setActivityAssignments } = useProgress()
  const navigate = useNavigate()
  const [resolvedPlayerId, setResolvedPlayerId] = useState<number | null>(
    players[0]?.id ?? null,
  )
  const playerId = resolvedPlayerId ?? players[0]?.id ?? null

  const [overview, setOverview] = useState<AdultOverview | null>(null)
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([])
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
    async (pid: number | null = playerId) => {
      if (pid == null) return
      const params = new URLSearchParams({ playerId: String(pid), range })
      if (range === 'custom') {
        if (customFrom) params.set('from', customFrom)
        if (customTo) params.set('to', customTo)
      }
      const data = await apiGet<{ days: ActivityDay[] }>(
        `/adult/activity.php?${params.toString()}`,
      )
      setActivityDays(Array.isArray(data.days) ? data.days : [])
    },
    [playerId, range, customFrom, customTo],
  )

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pid = await loadOverview()
      await loadActivity(pid)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el panel.')
    } finally {
      setLoading(false)
    }
  }, [loadOverview, loadActivity])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  const summary = overview?.summary
  const name = overview?.player.displayName ?? 'Aray'
  const adultName = account?.displayName ?? account?.login ?? 'Familia'

  const calendarDays = useMemo(() => {
    const map = new Map(activityDays.map((d) => [d.activityDate, d]))
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [activityDays])

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

  async function assignActivityRole(activityId: string, role: AssignmentRole | '') {
    if (playerId == null) return
    setBusy(true)
    try {
      const payload: Record<string, string | null> = {
        [activityId]: role === '' ? null : role,
      }
      await apiPost('/adult/activity-assignments.php', {
        playerId,
        assignments: payload,
      })
      const next = { ...progress.activityAssignments }
      if (!role) delete next[activityId]
      else next[activityId] = role
      setActivityAssignments(next)
      await refreshAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la asignación.')
    } finally {
      setBusy(false)
    }
  }

  async function loadEducationReport() {
    if (playerId == null) return
    try {
      const params = new URLSearchParams({ playerId: String(playerId) })
      if (reportCourse !== 'all') params.set('courseId', reportCourse)
      if (reportSubject !== 'all') params.set('subjectId', reportSubject)
      const data = await apiGet<{ dashboard?: AdultOverview; educationReport?: AdultOverview['educationReport'] }>(
        `/adult/dashboard.php?${params.toString()}`,
      )
      setEduReport(data.dashboard?.educationReport ?? data.educationReport ?? null)
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
            onClick={() => void onLogout()}
          >
            Cerrar
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

      {loading || !summary ? (
        <div className="adult-panel__loading" role="status">
          {error && !loading ? 'No se pudo cargar.' : 'Cargando resumen…'}
        </div>
      ) : (
        <>
          <section className="adult-summary" aria-label="Resumen">
            <SummaryCard label="Días jugados" value={String(summary.daysPlayed)} />
            <SummaryCard
              label="Última actividad"
              value={formatMadridDateTime(summary.lastActivityAt)}
            />
            <SummaryCard
              label="Tiempo total"
              value={formatPlayDuration(summary.playSecondsTotal)}
            />
            <SummaryCard label="Partidas" value={String(summary.sessionsCount)} />
            <SummaryCard
              label="Puntos recompensa"
              value={`${summary.rewardPointsCurrent} / ${summary.rewardTarget}`}
            />
            <SummaryCard
              label="Nivel / XP"
              value={`Nv. ${summary.level} · ${summary.xp} XP`}
            />
            <SummaryCard label="Monedas" value={String(summary.coins)} />
            <SummaryCard
              label="Energía hoy"
              value={`${summary.energyToday} / ${summary.energyCap}`}
            />
            <SummaryCard
              label="Mejor racha"
              value={`${summary.bestStreak} aciertos`}
            />
            <SummaryCard
              label="Tablas dominadas"
              value={
                summary.dominatedTables.length
                  ? summary.dominatedTables.map((n) => `×${n}`).join(' · ')
                  : 'Ninguna aún'
              }
            />
            <SummaryCard
              label="Premios"
              value={`${summary.pendingPrizesCount} pendientes · ${summary.deliveredPrizesCount} entregados`}
            />
            <SummaryCard
              label="Aciertos"
              value={
                summary.accuracyPct != null
                  ? `${summary.accuracyPct}% (${summary.correctCount} bien)`
                  : 'Sin datos'
              }
            />
          </section>

          <section className="adult-block" aria-labelledby="adult-course">
            <h2 id="adult-course" className="adult-block__title">
              Curso escolar
            </h2>
            <p className="adult-block__lead">
              Actual: <strong>{courseLabel(school.currentCourseId as CourseId)}</strong>
              {school.courseMode === 'review' ? ' · modo repaso' : ''}. Cambiar de curso no borra
              XP, monedas, Robux, premios, logros ni dominio.
            </p>
            <div className="adult-card__actions">
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
                    disabled={busy}
                    onClick={() => setConfirmCourseId(course.id)}
                  >
                    {course.title}
                  </button>
                ))}
            </div>
          </section>

          <section className="adult-block" aria-labelledby="adult-assign">
            <h2 id="adult-assign" className="adult-block__title">
              Asignar actividades
            </h2>
            <p className="adult-block__lead">
              Recomendada, obligatoria, libre, repaso u oculta. Aray no puede cambiar esto.
            </p>
            <div className="adult-table-wrap">
              <table className="adult-table">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Habilidad</th>
                    <th>Rol</th>
                    <th>Asignar</th>
                  </tr>
                </thead>
                <tbody>
                  {activities
                    .filter((a) => a.status === 'active')
                    .slice(0, 24)
                    .map((activity) => {
                      const skill = getSkill(activity.skillId)
                      const effective = effectiveActivityRole(
                        activity.id,
                        school.currentCourseId as CourseId,
                        assignmentMap as Record<string, AssignmentRole>,
                      )
                      const override = assignmentMap[activity.id] ?? ''
                      return (
                        <tr key={activity.id}>
                          <td>{activity.title}</td>
                          <td>{skill?.title ?? activity.skillId}</td>
                          <td>{effective ?? '—'}</td>
                          <td>
                            <select
                              value={override}
                              disabled={busy}
                              aria-label={`Asignación de ${activity.title}`}
                              onChange={(e) =>
                                void assignActivityRole(
                                  activity.id,
                                  e.target.value as AssignmentRole | '',
                                )
                              }
                            >
                              <option value="">Por defecto del curso</option>
                              <option value="recommended">Recomendada</option>
                              <option value="mandatory">Obligatoria</option>
                              <option value="free">Libre</option>
                              <option value="review">Repaso</option>
                              <option value="hidden">Oculta</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <PendingPrizes
            pending={overview.pendingPrizes}
            delivered={overview.deliveredPrizes}
            onDeliver={(c) => {
              setDeliverCycle(c)
              setRobuxAmount(500)
              setDeliveryDate(overview.playableDate || todayMadridYmd())
              setDeliveryNote('')
            }}
            onVoid={(c) => {
              setVoidCycle(c)
              setVoidReason('')
            }}
          />

          <ActivitySection
            range={range}
            onRange={setRange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFrom={setCustomFrom}
            onCustomTo={setCustomTo}
            onApplyCustom={() => void loadActivity()}
            days={calendarDays}
          />

          <EducationSection tables={overview.education.tables} />

          <section className="adult-block" aria-labelledby="adult-report">
            <h2 id="adult-report" className="adult-block__title">
              Informe por curso / asignatura
            </h2>
            <div className="adult-filters">
              <label>
                Curso
                <select value={reportCourse} onChange={(e) => setReportCourse(e.target.value)}>
                  <option value="all">Histórico global</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Asignatura
                <select value={reportSubject} onChange={(e) => setReportSubject(e.target.value)}>
                  <option value="all">Todas</option>
                  <option value="maths">Matemáticas</option>
                  <option value="languages">Lenguas</option>
                  <option value="english">Inglés</option>
                </select>
              </label>
              <button type="button" className="btn btn-secondary" onClick={() => void loadEducationReport()}>
                Filtrar
              </button>
            </div>
            {eduReport ? (
              <ul className="adult-tables">
                {eduReport.skills.map((row) => (
                  <li key={row.skillId} className="adult-tables__item">
                    <div className="adult-tables__head">
                      <span className="adult-tables__n">
                        {row.subjectTitle} · {row.blockTitle} · {row.skillTitle}
                      </span>
                      <span className={`mastery-chip ${masteryClass(row.mastery?.label ?? 'ENTRENANDO')}`}>
                        {row.mastery?.label ?? 'Sin datos'}
                      </span>
                    </div>
                    <p className="adult-tables__meta">
                      {row.mastery
                        ? `${row.mastery.correct}/${row.mastery.attempts} aciertos`
                        : 'Sin práctica aún'}
                      {eduReport.scope === 'global' ? ' · vista global' : ' · filtrado por curso'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adult-block__empty">Pulsa Filtrar para ver el informe curricular.</p>
            )}
          </section>
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
          monedas, Robux, premios, logros, tablas ni colección. Los ejercicios de cursos
          anteriores pueden seguir como repaso.
        </p>
      </ConfirmDialog>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="adult-stat">
      <p className="adult-stat__label">{label}</p>
      <p className="adult-stat__value">{value}</p>
    </article>
  )
}

function PendingPrizes({
  pending,
  delivered,
  onDeliver,
  onVoid,
}: {
  pending: RewardCycle[]
  delivered: RewardCycle[]
  onDeliver: (c: RewardCycle) => void
  onVoid: (c: RewardCycle) => void
}) {
  return (
    <section className="adult-block adult-block--prize" aria-labelledby="adult-prizes">
      <h2 id="adult-prizes" className="adult-block__title">
        Premios
      </h2>
      {pending.length === 0 ? (
        <p className="adult-block__empty">No hay premios pendientes de entregar.</p>
      ) : (
        <ul className="adult-prize-list">
          {pending.map((c) => (
            <li key={c.id} className="adult-prize adult-prize--pending">
              <div>
                <p className="adult-prize__badge">Pendiente</p>
                <h3 className="adult-prize__title">
                  Meta del ciclo {c.cycleNumber} completada
                </h3>
                <p className="adult-prize__meta">
                  {c.earnedAt
                    ? `Logrado el ${formatMadridDateTime(c.earnedAt)}`
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
      )}

      {delivered.length > 0 ? (
        <>
          <h3 className="adult-block__subtitle">Entregados recientemente</h3>
          <ul className="adult-prize-list adult-prize-list--delivered">
            {delivered.slice(0, 5).map((c) => (
              <li key={c.id} className="adult-prize adult-prize--done">
                <div>
                  <h3 className="adult-prize__title">
                    Ciclo {c.cycleNumber}
                    {c.robuxAmount != null ? ` · ${c.robuxAmount} Robux` : ''}
                  </h3>
                  <p className="adult-prize__meta">
                    {c.deliveryDateLocal
                      ? formatMadridDate(c.deliveryDateLocal)
                      : formatMadridDateTime(c.deliveredAt)}
                    {c.deliveryNote ? ` · ${c.deliveryNote}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onVoid(c)}
                >
                  Anular
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}

function ActivitySection({
  range,
  onRange,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  onApplyCustom,
  days,
}: {
  range: ActivityRange
  onRange: (r: ActivityRange) => void
  customFrom: string
  customTo: string
  onCustomFrom: (v: string) => void
  onCustomTo: (v: string) => void
  onApplyCustom: () => void
  days: Array<[string, ActivityDay]>
}) {
  return (
    <section className="adult-block" aria-labelledby="adult-activity">
      <div className="adult-block__head">
        <h2 id="adult-activity" className="adult-block__title">
          Actividad
        </h2>
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
            <input type="date" value={customTo} onChange={(e) => onCustomTo(e.target.value)} />
          </label>
          <button type="button" className="btn btn-ghost" onClick={onApplyCustom}>
            Ver
          </button>
        </div>
      ) : null}

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
                    ? ` · +${day.rewardPointsEarned} pts`
                    : ''}
                  {day.accuracyPct != null ? ` · ${day.accuracyPct}% aciertos` : ''}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function EducationSection({ tables }: { tables: TableMasteryItem[] }) {
  return (
    <section className="adult-block" aria-labelledby="adult-edu">
      <h2 id="adult-edu" className="adult-block__title">
        Progreso de las tablas
      </h2>
      <p className="adult-block__lead">
        Etiquetas claras: Domada, Casi domada, Entrenando o Necesita refuerzo.
      </p>
      {tables.length === 0 ? (
        <p className="adult-block__empty">Todavía no ha practicado tablas.</p>
      ) : (
        <ul className="adult-tables">
          {tables.map((t) => (
            <li key={t.tableN} className="adult-tables__item">
              <div className="adult-tables__head">
                <span className="adult-tables__n">Tabla del {t.tableN}</span>
                <span className={`mastery-chip ${masteryClass(t.label)}`}>{t.label}</span>
              </div>
              <p className="adult-tables__meta">
                {t.attempts > 0
                  ? `${t.correct}/${t.attempts} aciertos`
                  : 'Sin intentos aún'}
                {t.accuracyPct != null ? ` · ${t.accuracyPct}%` : ''}
                {t.lastPracticedAt
                  ? ` · Última vez ${formatMadridDateTime(t.lastPracticedAt)}`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
