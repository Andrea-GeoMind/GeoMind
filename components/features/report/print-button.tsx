'use client'

import { Printer } from 'lucide-react'

/**
 * Bouton d'export PDF (PLAN item 24) : déclenche l'impression navigateur —
 * « Enregistrer en PDF » est disponible partout, sans dépendance serveur.
 * Les styles @media print de la page rapport isolent le contenu.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 print:hidden"
    >
      <Printer size={15} />
      Télécharger en PDF
    </button>
  )
}
