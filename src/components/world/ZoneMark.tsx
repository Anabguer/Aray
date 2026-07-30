import { zoneMarkArtUrl } from '@/assets/zones'
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
  const art = zoneMarkArtUrl(mark)

  return (
    <div
      className={['zone-mark', `zone-mark--${mark}`, art ? 'zone-mark--art' : 'zone-mark--glyph']
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <span className="zone-mark__ring" />
      <span className="zone-mark__glow" />
      {art ? (
        <span className="zone-mark__frame">
          <img className="zone-mark__art" src={art} alt="" draggable={false} width={64} height={64} />
        </span>
      ) : (
        <span className="zone-mark__glyph">{markLabel[mark]}</span>
      )}
      <span className="zone-mark__spark zone-mark__spark--a" />
      <span className="zone-mark__spark zone-mark__spark--b" />
    </div>
  )
}
