import type { ClockTime } from '@/clock/types'

/** Reloj analógico de solo lectura (SVG). */
export function AnalogClock({
  time,
  size = 220,
  showMarks = true,
  className = '',
  label,
}: {
  time: ClockTime
  size?: number
  showMarks?: boolean
  className?: string
  label?: string
}) {
  const { hour, minute } = time
  const minuteAngle = minute * 6
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const r = 100
  const cx = 110
  const cy = 110

  return (
    <svg
      className={`analog-clock ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 220 220"
      role="img"
      aria-label={label ?? `Reloj: ${hour}:${String(minute).padStart(2, '0')}`}
    >
      <defs>
        <radialGradient id="analog-clock-face" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="70%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#analog-clock-face)" stroke="#1e3a5f" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke="rgba(14, 116, 144, 0.25)" strokeWidth="2" />

      {showMarks
        ? Array.from({ length: 12 }, (_, i) => {
            const a = ((i + 1) * 30 * Math.PI) / 180
            const outer = r - 14
            const inner = i % 3 === 2 ? r - 28 : r - 22
            const x1 = cx + Math.sin(a) * outer
            const y1 = cy - Math.cos(a) * outer
            const x2 = cx + Math.sin(a) * inner
            const y2 = cy - Math.cos(a) * inner
            const numR = r - 40
            const nx = cx + Math.sin(a) * numR
            const ny = cy - Math.cos(a) * numR
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#0f172a"
                  strokeWidth={i % 3 === 2 ? 3.5 : 2}
                  strokeLinecap="round"
                />
                <text
                  x={nx}
                  y={ny}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#0f172a"
                  fontSize="16"
                  fontWeight="700"
                  fontFamily="Segoe UI, system-ui, sans-serif"
                >
                  {i + 1}
                </text>
              </g>
            )
          })
        : null}

      {/* Minutera */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.sin((minuteAngle * Math.PI) / 180) * 72}
        y2={cy - Math.cos((minuteAngle * Math.PI) / 180) * 72}
        stroke="#0e7490"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Horaria */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.sin((hourAngle * Math.PI) / 180) * 48}
        y2={cy - Math.cos((hourAngle * Math.PI) / 180) * 48}
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="6" fill="#f97316" stroke="#0f172a" strokeWidth="2" />
    </svg>
  )
}
