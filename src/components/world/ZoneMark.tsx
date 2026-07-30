import type { WorldZoneMark } from '@/components/world/types'

const markLabel: Record<WorldZoneMark, string> = {
  tables: '×',
  calc: '∑',
  problems: '?',
  clocks: '◷',
  alphabet: 'A',
  writing: '✎',
  reading: '▣',
  spelling: 'Aa',
  words: 'Hi',
  match: '↔',
  phrases: '…',
  nature: '❀',
  body: '♥',
  map: '◎',
}

export function ZoneMark({ mark }: { mark: WorldZoneMark }) {
  return (
    <div className={`zone-mark zone-mark--${mark}`} aria-hidden="true">
      <span className="zone-mark__ring" />
      <span className="zone-mark__glow" />
      <span className="zone-mark__glyph">{markLabel[mark]}</span>
      <span className="zone-mark__spark zone-mark__spark--a" />
      <span className="zone-mark__spark zone-mark__spark--b" />
    </div>
  )
}
