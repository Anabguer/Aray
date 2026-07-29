import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
  children: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
    >
      <form
        className="confirm-dialog__panel"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (!busy) onConfirm()
        }}
      >
        <h2 id={titleId} className="confirm-dialog__title">
          {title}
        </h2>
        <div className="confirm-dialog__body">{children}</div>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
