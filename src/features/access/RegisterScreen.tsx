import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiUpload } from '@/api/client'
import { useAuth, type RegisterChildInput } from '@/auth/AuthContext'
import { BrandLogo } from '@/components/BrandLogo'
import { PhotoPickField } from '@/components/PhotoPickField'
import { useProgress } from '@/progress/ProgressContext'
import './access.css'

type KidDraft = RegisterChildInput & { file: File | null; key: string }

const COURSES = [
  { id: 'primary-3', label: '3º primaria' },
  { id: 'primary-4', label: '4º primaria' },
  { id: 'primary-5', label: '5º primaria' },
] as const

function newKid(): KidDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    displayName: '',
    courseId: 'primary-3',
    file: null,
  }
}

export function RegisterScreen() {
  const { registerFamily, enterAsChild } = useAuth()
  const { refreshFromServer } = useProgress()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [kids, setKids] = useState<KidDraft[]>([newKid()])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function updateKid(key: string, patch: Partial<KidDraft>) {
    setKids((prev) => prev.map((k) => (k.key === key ? { ...k, ...patch } : k)))
  }

  async function onTutorNext(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (login.trim().length < 3 || password.length < 8 || displayName.trim().length < 2 || pin.length !== 4) {
      setError('Revisa usuario, contraseña, nombre y PIN de 4 dígitos.')
      return
    }
    setStep(2)
  }

  async function onFinish(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const cleaned = kids
      .map((k) => ({
        displayName: k.displayName.trim(),
        courseId: k.courseId,
        file: k.file,
      }))
      .filter((k) => k.displayName.length >= 2)
    if (cleaned.length < 1) {
      setError('Añade al menos un niño con nombre.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const players = await registerFamily({
        login: login.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
        pin,
        children: cleaned.map(({ displayName: n, courseId }) => ({ displayName: n, courseId })),
      })

      for (let i = 0; i < cleaned.length; i++) {
        const file = cleaned[i]?.file
        const player = players[i]
        if (file && player?.id) {
          const form = new FormData()
          form.set('playerId', String(player.id))
          form.set('avatar', file)
          try {
            await apiUpload('/players/avatar.php', form)
          } catch {
            /* avatar opcional en el alta */
          }
        }
      }

      if (players.length > 1) {
        await refreshFromServer()
        navigate('/pick-profile', { replace: true })
        return
      }
      if (players[0]?.slug) {
        await enterAsChild(players[0].slug)
      }
      await refreshFromServer()
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'csrf_invalid'
          ? 'No se pudo validar la sesión. Recarga la página (F5) e inténtalo otra vez.'
          : err instanceof ApiError && err.message.trim() !== ''
            ? err.message
            : 'No se pudo crear la familia.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="access-page">
      <div className="access-page__card access-page__card--wide">
        <BrandLogo variant="compact" className="access-page__logo access-page__logo--sm" />
        <h1 className="access-page__title">Crear usuario</h1>
        <p className="access-page__lead">
          {step === 1
            ? 'Datos del tutor: con ellos entrarás y verás el panel familiar.'
            : 'Añade a los niños que van a jugar (puedes poner más después).'}
        </p>

        {step === 1 ? (
          <form className="access-form" onSubmit={(e) => void onTutorNext(e)}>
            <label className="access-form__label">
              Tu nombre (tutor)
              <input
                className="access-form__input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                maxLength={40}
              />
            </label>
            <label className="access-form__label">
              Usuario
              <input
                className="access-form__input"
                autoComplete="username"
                value={login}
                onChange={(e) => setLogin(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                required
                minLength={3}
                maxLength={32}
              />
            </label>
            <label className="access-form__label">
              Contraseña
              <input
                className="access-form__input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <label className="access-form__label">
              PIN del panel (4 dígitos)
              <input
                className="access-form__input"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D+/g, '').slice(0, 4))}
                required
                maxLength={4}
              />
            </label>
            {error ? (
              <p className="access-form__error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn-primary">
              Siguiente: niños
            </button>
          </form>
        ) : (
          <form className="access-form" onSubmit={(e) => void onFinish(e)}>
            {kids.map((kid, index) => (
              <fieldset key={kid.key} className="access-kid">
                <legend className="access-kid__legend">Niño {index + 1}</legend>
                <label className="access-form__label">
                  Nombre
                  <input
                    className="access-form__input"
                    value={kid.displayName}
                    onChange={(e) => updateKid(kid.key, { displayName: e.target.value })}
                    required
                    minLength={2}
                    maxLength={40}
                  />
                </label>
                <label className="access-form__label">
                  Curso
                  <select
                    className="access-form__input"
                    value={kid.courseId}
                    onChange={(e) => updateKid(kid.key, { courseId: e.target.value })}
                  >
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <PhotoPickField
                  label="Foto (opcional)"
                  onPick={(file) => updateKid(kid.key, { file })}
                />
                {kids.length > 1 ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setKids((prev) => prev.filter((k) => k.key !== kid.key))}
                  >
                    Quitar
                  </button>
                ) : null}
              </fieldset>
            ))}

            {kids.length < 6 ? (
              <button type="button" className="btn btn-secondary" onClick={() => setKids((p) => [...p, newKid()])}>
                Añadir otro niño
              </button>
            ) : null}

            {error ? (
              <p className="access-form__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="access-form__row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={busy}>
                Atrás
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Creando…' : 'Crear y jugar'}
              </button>
            </div>
          </form>
        )}

        <p className="access-page__footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/access" className="access-page__link">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
