import { absoluteEndSec } from '../lib/cues'
import { isFullyProtected, type Speech } from '../lib/schedule'

interface Zone {
  startSec: number
  endSec: number
  color: string
}

/**
 * Barre discrète situant le discours: la portion claire est la fenêtre de POI,
 * la portion sombre à droite les secondes de grâce. Les couleurs sont des
 * opacités de blanc pour rester lisibles quel que soit le fond.
 */
export default function SpeechProgress({
  speech,
  elapsedSec,
}: {
  speech: Speech
  elapsedSec: number
}) {
  const total = absoluteEndSec(speech)
  const percent = (sec: number) => (sec / total) * 100

  const zones: Zone[] = isFullyProtected(speech)
    ? []
    : [
        {
          startSec: speech.poiStartSec as number,
          endSec: speech.poiEndSec as number,
          color: 'rgb(255 255 255 / 0.22)',
        },
      ]
  zones.push({
    startSec: speech.durationSec,
    endSec: total,
    color: 'rgb(0 0 0 / 0.28)',
  })

  const progress = Math.min(100, Math.max(0, percent(elapsedSec)))

  return (
    <div className="relative h-1.5 overflow-hidden rounded-full bg-black/15">
      {zones.map((zone) => (
        <div
          key={zone.startSec}
          className="absolute inset-y-0"
          style={{
            left: `${percent(zone.startSec)}%`,
            width: `${percent(zone.endSec - zone.startSec)}%`,
            backgroundColor: zone.color,
          }}
        />
      ))}
      <div
        className="absolute inset-y-0 left-0 bg-white/80"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
