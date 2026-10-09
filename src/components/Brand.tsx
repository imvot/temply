/**
 * Marque de Temply: un petit chronomètre suivi du nom. Deux tailles, parce que
 * la page d'accueil doit porter le nom et la page de chrono seulement le
 * rappeler.
 */

function LogoMark({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.5 5h7" />
      <path d="M16 5v3.2" />
      <path d="M22.6 8.4 24.4 6.6" />
      <circle cx="16" cy="19" r="10" />
      <path d="M16 19V12.2" />
      <circle cx="16" cy="19" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BrandHero() {
  return (
    <div className="flex flex-col items-center text-center">
      <LogoMark className="h-9 w-9" />
      <h1 className="mt-2 text-[2.75rem] leading-none font-bold tracking-tight sm:text-6xl">
        Temply
      </h1>
      <p className="mt-3 text-sm opacity-75">
        Le chrono du débat parlementaire canadien
      </p>
    </div>
  )
}

export function BrandHeader() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <LogoMark className="h-[1.15rem] w-[1.15rem]" />
      <span className="text-lg leading-none font-bold tracking-tight">
        Temply
      </span>
    </span>
  )
}
