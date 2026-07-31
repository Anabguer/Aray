import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { WorldMapScenery } from '@/components/world/WorldMapScenery'
import { WorldStationNode } from '@/components/world/WorldStationNode'
import type { WorldLevelMapProps, WorldStation } from '@/components/world/types'
import '@/components/world/world-level-map.css'

function orderStations(stations: WorldStation[]): WorldStation[] {
  const rank: Record<WorldStation['mapSlot'], number> = {
    start: 0,
    'mid-high': 1,
    'mid-low': 2,
    end: 3,
  }
  return [...stations].sort((a, b) => rank[a.mapSlot] - rank[b.mapSlot])
}

function buildCurvePath(
  points: Array<{ x: number; y: number }>,
  opts?: { softVertical?: boolean },
): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const midY = (prev.y + curr.y) / 2
    const nearlyVertical = Math.abs(curr.x - prev.x) < 12
    if (opts?.softVertical && nearlyVertical) {
      // Carril móvil a la izquierda: curva suave hacia la tarjeta (x positivo).
      const sway = i % 2 === 0 ? 18 : 11
      const cx = prev.x + sway
      d += ` C ${cx} ${midY}, ${cx} ${midY}, ${curr.x} ${curr.y}`
    } else {
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`
    }
  }
  return d
}

export function WorldLevelMap({
  theme,
  guideTip,
  stations,
}: WorldLevelMapProps) {
  const ordered = orderStations(stations)
  const stageRef = useRef<HTMLDivElement>(null)
  const [pathD, setPathD] = useState('')
  const [pathBox, setPathBox] = useState({ w: 0, h: 0 })

  const updatePath = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const w = stage.clientWidth
    const h = Math.max(stage.scrollHeight, stage.clientHeight)
    setPathBox({ w, h })

    const ports = [...stage.querySelectorAll<HTMLElement>('.map-station__port')]
    if (ports.length === 0) {
      setPathD('')
      return
    }
    const sr = stage.getBoundingClientRect()
    const points = ports.map((port) => {
      const r = port.getBoundingClientRect()
      return {
        x: r.left + r.width / 2 - sr.left + stage.scrollLeft,
        y: r.top + r.height / 2 - sr.top + stage.scrollTop,
      }
    })
    const softVertical = window.matchMedia('(max-width: 719px)').matches
    setPathD(buildCurvePath(points, { softVertical }))
  }, [])

  useLayoutEffect(() => {
    updatePath()
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => updatePath())
    ro.observe(stage)
    window.addEventListener('resize', updatePath)
    const t = window.setTimeout(updatePath, 120)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updatePath)
      window.clearTimeout(t)
    }
  }, [updatePath, ordered.length])

  return (
    <section className={`world-level-map world-level-map--${theme}`}>
      <WorldMapScenery theme={theme} />

      <div className="world-level-map__stage" ref={stageRef} onScroll={updatePath}>
        <svg
          className="world-level-map__path"
          width={pathBox.w || undefined}
          height={pathBox.h || undefined}
          viewBox={pathBox.w && pathBox.h ? `0 0 ${pathBox.w} ${pathBox.h}` : undefined}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="worldMapPathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.95)" />
              <stop offset="55%" stopColor="rgba(167,139,250,0.88)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0.55)" />
            </linearGradient>
          </defs>
          {pathD ? (
            <>
              <path
                className="world-level-map__path-glow"
                d={pathD}
                fill="none"
                stroke="url(#worldMapPathGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.28"
              />
              <path
                className="world-level-map__path-line"
                d={pathD}
                fill="none"
                stroke="url(#worldMapPathGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="1 14"
              />
            </>
          ) : null}
        </svg>

        <ol className="world-level-map__stations">
          {ordered.map((station, index) => {
            const side = index % 2 === 0 ? 'left' : 'right'
            const isFirstRecommended =
              station.status === 'recommended' &&
              ordered.findIndex((item) => item.status === 'recommended') === index
            return (
              <li
                key={station.id}
                className={`world-level-map__slot world-level-map__slot--${side}`}
              >
                <WorldStationNode
                  station={station}
                  guideTip={isFirstRecommended ? guideTip : undefined}
                />
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
