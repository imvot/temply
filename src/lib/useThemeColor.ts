import { useEffect } from 'react'

/**
 * Propage la couleur de la phase courante: variable CSS lue par les boutons,
 * fond du document, et couleur de barre d'adresse sur mobile.
 */
export function useThemeColor(color: string): void {
  useEffect(() => {
    document.documentElement.style.setProperty('--phase-color', color)
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    if (meta) meta.content = color
  }, [color])
}
