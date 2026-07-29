import { useId, useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/auth/AuthContext'

export function DeviceSetupScreen() {
  const { adultLogin, authorizeDevice, redeemTempCode, players, role } = useAuth()
  const formId = useId()

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [deviceLabel, setDeviceLabel] = useState('Tablet de casa')
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
  const [tempCode, setTempCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loggedIn, setLoggedIn] = useState(role === 'adult')

  const playerList = players
  const effectivePlayerId =
    selectedPlayerId ?? (playerList.length === 1 ? playerList[0]!.id : null)

  async function onAdultSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const list = await adultLogin(login.trim(), password)
      setLoggedIn(true)
      if (list.length === 1) setSelectedPlayerId(list[0]!.id)
      setInfo('Sesión iniciada. Ahora puedes autorizar este dispositivo.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  async function onAuthorize() {
    if (effectivePlayerId == null) {
      setError('Elige el perfil del niño o la niña.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await authorizeDevice(effectivePlayerId, deviceLabel.trim() || 'Este dispositivo')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo autorizar este dispositivo.',
      )
      setBusy(false)
    }
  }

  async function onRedeem(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await redeemTempCode(tempCode.trim(), 'aray', deviceLabel.trim() || 'Este dispositivo')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Ese código no es válido o ha caducado.',
      )
      setBusy(false)
    }
  }

  return (
    <div className="device-setup">
      <div className="device-setup__glow" aria-hidden="true" />
      <div className="device-setup__card">
        <BrandLogo variant="compact" className="device-setup__logo" />
        <h1 className="device-setup__title">Preparar este dispositivo</h1>
        <p className="device-setup__lead">
          La primera vez, un adulto de la familia debe autorizar la tablet o el
          ordenador. Después, Aray podrá entrar con su PIN.
        </p>

        <section className="device-setup__section" aria-labelledby={`${formId}-adult`}>
          <h2 id={`${formId}-adult`} className="device-setup__section-title">
            Entrar como adulto
          </h2>
          <p className="device-setup__section-lead">
            Usa tu usuario y contraseña (por ejemplo, el de Neni).
          </p>

          {!loggedIn || playerList.length === 0 ? (
            <form className="device-setup__form" onSubmit={onAdultSubmit}>
              <label className="device-setup__label">
                Usuario
                <input
                  className="device-setup__input"
                  name="login"
                  autoComplete="username"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={busy}
                  required
                />
              </label>
              <label className="device-setup__label">
                Contraseña
                <input
                  className="device-setup__input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary device-setup__btn" disabled={busy}>
                Continuar
              </button>
            </form>
          ) : (
            <div className="device-setup__form">
              {playerList.length > 1 ? (
                <label className="device-setup__label">
                  Perfil
                  <select
                    className="device-setup__input"
                    value={effectivePlayerId ?? ''}
                    onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                    disabled={busy}
                  >
                    <option value="" disabled>
                      Elige perfil
                    </option>
                    {playerList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName ?? p.slug ?? `Perfil ${p.id}`}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="device-setup__profile">
                  Perfil:{' '}
                  <strong>
                    {playerList[0]?.displayName ?? playerList[0]?.slug ?? 'Aray'}
                  </strong>
                </p>
              )}
              <label className="device-setup__label">
                Nombre de este dispositivo
                <input
                  className="device-setup__input"
                  value={deviceLabel}
                  onChange={(e) => setDeviceLabel(e.target.value)}
                  disabled={busy}
                  maxLength={120}
                />
              </label>
              <button
                type="button"
                className="btn btn-primary device-setup__btn"
                onClick={() => void onAuthorize()}
                disabled={busy || effectivePlayerId == null}
              >
                Autorizar este dispositivo
              </button>
            </div>
          )}
        </section>

        <div className="device-setup__divider" role="separator">
          <span>o</span>
        </div>

        <section className="device-setup__section" aria-labelledby={`${formId}-code`}>
          <h2 id={`${formId}-code`} className="device-setup__section-title">
            Tengo un código temporal
          </h2>
          <p className="device-setup__section-lead">
            Si otro adulto ya generó un código corto en el panel familiar, puedes
            canjearlo aquí.
          </p>
          <form className="device-setup__form" onSubmit={onRedeem}>
            <label className="device-setup__label">
              Código
              <input
                className="device-setup__input device-setup__input--code"
                value={tempCode}
                onChange={(e) => setTempCode(e.target.value.toUpperCase())}
                disabled={busy}
                autoCapitalize="characters"
                autoComplete="one-time-code"
                required
              />
            </label>
            <button type="submit" className="btn btn-ghost device-setup__btn" disabled={busy}>
              Canjear código
            </button>
          </form>
        </section>

        {error ? (
          <p className="device-setup__error" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="device-setup__info" role="status">
            {info}
          </p>
        ) : null}
      </div>
    </div>
  )
}
