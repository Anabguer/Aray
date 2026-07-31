import { useId, useRef, useState, type ChangeEvent } from 'react'
import { IconImage } from '@/components/Icons'

type Props = {
  label: string
  disabled?: boolean
  /** Si true, no guarda el nombre del archivo (p. ej. subida inmediata en panel). */
  clearAfterPick?: boolean
  onPick: (file: File | null) => void
}

/** Selector de foto con aspecto de la app (oculta el input file nativo). */
export function PhotoPickField({ label, disabled, clearAfterPick, onPick }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (file) {
      setFileName(file.name)
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setFileName(null)
      setPreviewUrl(null)
    }
    onPick(file)
    if (clearAfterPick && inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="photo-pick">
      <span className="photo-pick__label">{label}</span>
      <div className="photo-pick__row">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="photo-pick__preview" />
        ) : (
          <span className="photo-pick__placeholder" aria-hidden="true">
            <IconImage />
          </span>
        )}
        <div className="photo-pick__meta">
          <label htmlFor={inputId} className={`photo-pick__btn${disabled ? ' is-disabled' : ''}`}>
            {fileName ? 'Cambiar foto' : 'Elegir foto'}
          </label>
          <p className="photo-pick__hint">
            {fileName ? truncateName(fileName) : 'JPG, PNG o WebP · máx. 2 MB'}
          </p>
        </div>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        className="photo-pick__input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  )
}

function truncateName(name: string): string {
  if (name.length <= 28) return name
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  return `${name.slice(0, 18)}…${ext}`
}
