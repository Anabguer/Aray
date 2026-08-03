import { formatEuro } from '@/money'
import type { MoneyPiece, MoneySceneGroup } from '@/money/types'
import { COIN_LABEL, type CoinEuro } from '@/money/types'

const SCATTER = [
  { rot: -9, x: -2, y: 6 },
  { rot: 7, x: 6, y: -4 },
  { rot: -4, x: -4, y: 2 },
  { rot: 11, x: 3, y: 8 },
  { rot: -12, x: 5, y: -6 },
  { rot: 5, x: -6, y: 4 },
  { rot: -7, x: 2, y: -2 },
] as const

const BILL_TONES: Record<number, string> = {
  500: '5',
  1000: '10',
  2000: '20',
  5000: '50',
  10000: '100',
  20000: '200',
  50000: '500',
}

function coinTone(cents: number): string {
  if (cents >= 100) return 'euro'
  if (cents >= 10) return 'gold'
  return 'copper'
}

function pieceLabel(piece: MoneyPiece): string {
  if (piece.kind === 'coin' && piece.cents in COIN_LABEL) {
    return COIN_LABEL[piece.cents as CoinEuro]
  }
  return formatEuro(piece.cents)
}

function PieceCard({ piece, index }: { piece: MoneyPiece; index: number }) {
  const scatter = SCATTER[index % SCATTER.length]!
  const billTone = BILL_TONES[piece.cents] ?? 'generic'
  const className =
    piece.kind === 'bill'
      ? `money-piece money-piece--bill money-piece--bill-${billTone}`
      : `money-piece money-piece--coin money-piece--coin-${coinTone(piece.cents)}`

  return (
    <span
      className={className}
      style={{
        ['--money-rot' as string]: `${scatter.rot}deg`,
        ['--money-x' as string]: `${scatter.x}px`,
        ['--money-y' as string]: `${scatter.y}px`,
      }}
      aria-hidden="true"
    >
      <span className="money-piece__value">{pieceLabel(piece)}</span>
      {piece.kind === 'bill' ? <span className="money-piece__mark">€</span> : null}
    </span>
  )
}

function PieceRow({ pieces }: { pieces: MoneyPiece[] }) {
  return (
    <div className="money-scatter__row">
      {pieces.map((piece, i) => (
        <PieceCard key={`${piece.kind}-${piece.cents}-${i}`} piece={piece} index={i} />
      ))}
    </div>
  )
}

export function MoneyPiecesBoard({
  pieces,
  scene,
  caption,
}: {
  pieces?: MoneyPiece[]
  scene?: MoneySceneGroup[]
  caption?: string
}) {
  if (scene && scene.length > 0) {
    return (
      <div className="money-scatter money-scatter--scene" role="img" aria-label={caption}>
        {caption ? <span className="visually-hidden">{caption}</span> : null}
        {scene.map((group) => (
          <div key={group.label} className="money-scatter__group">
            <p className="money-scatter__label">{group.label}</p>
            <PieceRow pieces={group.pieces} />
          </div>
        ))}
      </div>
    )
  }

  if (!pieces || pieces.length === 0) return null

  return (
    <div className="money-scatter" role="img" aria-label={caption}>
      {caption ? <span className="visually-hidden">{caption}</span> : null}
      <PieceRow pieces={pieces} />
    </div>
  )
}
