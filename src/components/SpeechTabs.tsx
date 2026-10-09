import type { Speech } from '../lib/schedule'

/**
 * Rangée d'onglets façon pomofocus listant les discours de la ronde. Sur
 * téléphone, le nombre d'onglets la rendrait illisible, donc elle se réduit à
 * une position dans la ronde avec des pastilles cliquables.
 */
export default function SpeechTabs({
  schedule,
  index,
  onSelect,
}: {
  schedule: Speech[]
  index: number
  onSelect: (index: number) => void
}) {
  return (
    <>
      <div className="hidden justify-center gap-1 sm:flex">
        {schedule.map((speech, position) => {
          const active = position === index
          return (
            <button
              key={speech.id}
              type="button"
              onClick={() => onSelect(position)}
              aria-current={active ? 'step' : undefined}
              title={`${speech.title} — ${speech.speaker}`}
              className={`tabular rounded-sm px-3 py-1.5 text-sm font-bold transition-colors ${
                active ? 'bg-black/20' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {position + 1} {speech.speakerShort}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 sm:hidden">
        <span className="tabular text-xs font-bold tracking-[0.12em] uppercase opacity-70">
          Discours {index + 1} / {schedule.length}
        </span>
        <span className="flex gap-1.5">
          {schedule.map((speech, position) => (
            <button
              key={speech.id}
              type="button"
              onClick={() => onSelect(position)}
              aria-label={`Aller au discours ${position + 1}: ${speech.title}`}
              aria-current={position === index ? 'step' : undefined}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                position === index ? 'bg-white' : 'bg-white/35'
              }`}
            />
          ))}
        </span>
      </div>
    </>
  )
}
