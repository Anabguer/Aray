import { useState } from 'react'
import { ConfirmDialog } from '@/components/quiz/QuizWidgets'
import { useProgress } from '@/progress/ProgressContext'

export function ResetProgressControl() {
  const { resetProgress } = useProgress()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="btn btn-ghost btn-block reset-btn" onClick={() => setOpen(true)}>
        Reiniciar progreso de demostración
      </button>
      <ConfirmDialog
        open={open}
        title="¿Reiniciar progreso?"
        body="Se borrarán XP, energía, rachas y el historial de tablas guardado en este dispositivo. No se puede deshacer."
        confirmLabel="Sí, reiniciar"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          resetProgress()
          setOpen(false)
        }}
      />
    </>
  )
}
