import { useMemo, useState } from 'react'
import {
  buildSchedule,
  formatDuration,
  isFullyProtected,
  type RoundSettings,
  type TimeType,
} from '../lib/schedule'
import { BrandHero } from './Brand'

interface Option {
  value: TimeType
  label: string
  detail: string
}

const GOV_OPTIONS: Option[] = [
  {
    value: 'standard',
    label: 'Temps standard',
    detail: 'PM: ouverture 6 min, clôture 4 min. Temps protégé de 30 s.',
  },
  {
    value: 'allonge',
    label: 'Temps allongé',
    detail: 'PM: ouverture 7 min, clôture 3 min. Temps protégé de 1 min.',
  },
]

const OPP_OPTIONS: Option[] = [
  {
    value: 'standard',
    label: 'Temps standard',
    detail: 'CO ouvre 7 min, MO répond 7 min, CO clôt 3 min.',
  },
  {
    value: 'allonge',
    label: 'Temps allongé',
    detail: 'MO ouvre 7 min, CO répond et clôt en un seul discours de 10 min.',
  },
]

function OptionGroup({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: Option[]
  value: TimeType
  onChange: (value: TimeType) => void
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 text-xs font-bold tracking-[0.12em] uppercase opacity-70">
        {legend}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`rounded-sm border-2 p-3 text-left transition-colors ${
                selected
                  ? 'border-white/80 bg-white/20'
                  : 'border-transparent bg-black/10 hover:bg-black/20'
              }`}
            >
              <span className="block text-base font-bold">{option.label}</span>
              <span className="mt-1 block text-[0.8125rem] leading-snug opacity-75">
                {option.detail}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function SetupScreen({
  initialSettings,
  onStart,
}: {
  initialSettings: RoundSettings
  onStart: (settings: RoundSettings) => void
}) {
  const [gov, setGov] = useState<TimeType>(initialSettings.gov)
  const [opp, setOpp] = useState<TimeType>(initialSettings.opp)
  const schedule = useMemo(() => buildSchedule({ gov, opp }), [gov, opp])

  return (
    <div className="mx-auto w-full max-w-[30rem] px-4 pb-16">
      <header className="pt-8 pb-8 sm:pt-12 sm:pb-10">
        <BrandHero />
      </header>

      <div className="card p-4 sm:p-6">
        <p className="text-center text-sm font-bold tracking-wide">
          Temps de parole
        </p>
        <p className="mt-1 text-center text-sm opacity-70">
          Chaque équipe choisit son format. Les deux sont indépendants.
        </p>

        <div className="mt-5 space-y-5">
          <OptionGroup
            legend="Gouvernement"
            options={GOV_OPTIONS}
            value={gov}
            onChange={setGov}
          />
          <OptionGroup
            legend="Opposition"
            options={OPP_OPTIONS}
            value={opp}
            onChange={setOpp}
          />
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-xs font-bold tracking-[0.12em] uppercase opacity-70">
            Ordre des discours
          </h2>
          <ol className="space-y-1">
            {schedule.map((speech, index) => (
              <li
                key={speech.id}
                className="flex items-baseline gap-2 rounded-sm bg-black/10 px-3 py-2 text-sm"
              >
                <span className="tabular w-4 shrink-0 text-right opacity-50">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block leading-tight font-bold">
                    {speech.title}
                  </span>
                  <span className="block text-xs opacity-70">
                    {speech.speaker} ({speech.speakerShort}) &middot;{' '}
                    {isFullyProtected(speech)
                      ? 'entièrement protégé'
                      : `POI de ${formatDuration(speech.poiStartSec as number)} à ${formatDuration(speech.poiEndSec as number)}`}
                  </span>
                </span>
                <span className="tabular shrink-0 font-bold">
                  {formatDuration(speech.durationSec)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-center text-xs opacity-60">
            17 minutes par équipe.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="push-button w-full sm:w-auto"
            onClick={() => onStart({ gov, opp })}
          >
            Commencer
          </button>
        </div>
      </div>
    </div>
  )
}
