'use client'

import { useTransition } from 'react'
import { deleteAccountAction } from '@/app/(app)/settings/account/actions'

export function DeleteAccountButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (
      !window.confirm(
        'Supprimer définitivement votre compte ? Cette action est irréversible.'
      )
    )
      return
    startTransition(async () => {
      await deleteAccountAction()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Suppression...' : 'Supprimer mon compte'}
    </button>
  )
}
