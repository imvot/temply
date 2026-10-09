import type { ReactNode } from 'react'

/**
 * Icônes à trait épais, dans l'esprit plat de pomofocus. Deux familles:
 * celles de l'en-tête, dessinées sur une grille de 24, et celles des gestes,
 * sur une grille de 32 pour laisser la place au plan de table.
 */

function HeaderIcon({
  children,
  struck,
}: {
  children: ReactNode
  /** Barre l'icône quand la fonction est désactivée. */
  struck?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {children}
      {struck && <path d="M3.5 20.5 20.5 3.5" />}
    </svg>
  )
}

export const SettingsIcon = (
  <HeaderIcon>
    <path d="M4 8h16" />
    <path d="M4 16h16" />
    <circle cx="9.5" cy="8" r="2.4" fill="currentColor" stroke="none" />
    <circle cx="15" cy="16" r="2.4" fill="currentColor" stroke="none" />
  </HeaderIcon>
)

export function SoundIcon({ on }: { on: boolean }) {
  return (
    <HeaderIcon struck={!on}>
      <path
        d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M15.6 9.4a3.8 3.8 0 0 1 0 5.2" />
      <path d="M18.4 6.8a7.6 7.6 0 0 1 0 10.4" />
    </HeaderIcon>
  )
}

export function VibrationIcon({ on }: { on: boolean }) {
  return (
    <HeaderIcon struck={!on}>
      <rect x="8.5" y="3.5" width="7" height="17" rx="1.8" />
      <path d="M5 9v6" />
      <path d="M19 9v6" />
      <path d="M2.2 10.6v2.8" />
      <path d="M21.8 10.6v2.8" />
    </HeaderIcon>
  )
}

export function FlashIcon({ on }: { on: boolean }) {
  return (
    <HeaderIcon struck={!on}>
      <path
        d="M13.2 2.2 5 13.6h5.2l-1 8.2 8.4-11.6h-5.2z"
        fill="currentColor"
        stroke="none"
      />
    </HeaderIcon>
  )
}

export const ResetIcon = (
  <HeaderIcon>
    <path d="M20 12a8 8 0 1 1-2.5-5.8" />
    <path d="M20 3.6V8h-4.4" />
  </HeaderIcon>
)

export const NextIcon = (
  <HeaderIcon>
    <path d="M6 5.5 15.5 12 6 18.5z" fill="currentColor" stroke="none" />
    <path d="M18.5 5.5v13" />
  </HeaderIcon>
)

function GestureIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-auto"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/**
 * Paume ouverte, doigts vers le bas, qui frappe le plan de la table. La main
 * est dessinée doigts vers le haut puis retournée, et les deux éclats de part
 * et d'autre du contact marquent la frappe.
 */
export const TapIcon = (
  <GestureIcon>
    <g transform="translate(4 -1) rotate(180 12 12)">
      <path d="M18 11V6a2 2 0 0 0-4 0" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15" />
    </g>
    <path d="M3 28.5h26" />
    <path d="m7.5 23.5-1.8 2.6" />
    <path d="m24.5 23.5 1.8 2.6" />
  </GestureIcon>
)

/** Main refermée en « C », l'ouverture tournée vers l'avant. */
export const CIcon = (
  <GestureIcon>
    <path
      d="M23.5 8.5a11 11 0 1 0 0 15"
      strokeWidth="4.2"
      strokeLinecap="round"
    />
  </GestureIcon>
)

/** Chiffre du compte à rebours, cerclé pour garder le même gabarit. */
export function CountdownIcon({ digit }: { digit: number }) {
  return (
    <GestureIcon>
      <circle cx="16" cy="16" r="14" />
      <text
        x="16"
        y="16.8"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="17"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {digit}
      </text>
    </GestureIcon>
  )
}

const RIM_RADIUS = 13.5
const HAND_LENGTH = 10.5

/**
 * Horloge dont l'aiguille des secondes parcourt le quart de tour que
 * représentent les 15 secondes de grâce, de midi à trois heures. L'arc sur le
 * cadran montre le chemin déjà parcouru.
 *
 * `progress` va de 0 au début du sursis à 1 à la fin absolue.
 */
export function ClockIcon({ progress }: { progress: number }) {
  const angle = Math.min(1, Math.max(0, progress)) * 90
  const radians = (angle * Math.PI) / 180
  const point = (radius: number) =>
    `${(16 + radius * Math.sin(radians)).toFixed(2)} ${(16 - radius * Math.cos(radians)).toFixed(2)}`

  return (
    <GestureIcon>
      <circle cx="16" cy="16" r={RIM_RADIUS} />
      <path d="M16 4.2v2.1M27.8 16h-2.1M16 27.8v-2.1M4.2 16h2.1" />
      {angle > 1 && (
        <path
          d={`M16 ${16 - RIM_RADIUS} A ${RIM_RADIUS} ${RIM_RADIUS} 0 0 1 ${point(RIM_RADIUS)}`}
          strokeWidth="3.4"
          opacity="0.45"
        />
      )}
      <path d={`M16 16 ${point(HAND_LENGTH)}`} strokeWidth="2.3" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </GestureIcon>
  )
}

export const StopIcon = (
  <GestureIcon>
    <circle cx="16" cy="16" r="13.5" />
    <path d="m10.5 10.5 11 11" />
    <path d="m21.5 10.5-11 11" />
  </GestureIcon>
)
