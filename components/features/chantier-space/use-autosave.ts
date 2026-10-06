'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { saveChantierFieldAction } from '@/app/chantier/espace/actions'

/**
 * Enregistrement automatique de l'espace client.
 *
 * - une sauvegarde par champ, 800 ms après la dernière modification ;
 * - jamais deux envois en vol pour le même champ : une valeur arrivée pendant
 *   un envoi part juste après, la dernière l'emporte ;
 * - réseau coupé ou erreur serveur : la valeur reste en attente et repart
 *   seule (2 s, 5 s, 10 s, puis toutes les 20 s, et dès le retour du réseau) ;
 * - lien devenu invalide : la page est rechargée et affiche l'état du lien.
 */

export type SlotStatus = 'saving' | 'saved' | 'error' | 'invalid'
export type GlobalStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveRequest {
  establishmentId: string | null
  fieldKey: string
  value: unknown
}

const DEBOUNCE_MS = 800
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000]

export function slotKey(establishmentId: string | null, fieldKey: string): string {
  return `${establishmentId ?? '-'}|${fieldKey}`
}

export function useAutosave(onStored: (slot: string, value: unknown) => void) {
  const [statuses, setStatuses] = useState<Record<string, SlotStatus>>({})
  const pending = useRef(new Map<string, SaveRequest>())
  const inFlight = useRef(new Set<string>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const attempts = useRef(new Map<string, number>())
  const onStoredRef = useRef(onStored)
  onStoredRef.current = onStored

  const setStatus = useCallback((slot: string, status: SlotStatus | null) => {
    setStatuses((prev) => {
      if (status === null) {
        if (!(slot in prev)) return prev
        const next = { ...prev }
        delete next[slot]
        return next
      }
      return prev[slot] === status ? prev : { ...prev, [slot]: status }
    })
  }, [])

  const flush = useCallback(
    async (slot: string): Promise<void> => {
      const timer = timers.current.get(slot)
      if (timer) clearTimeout(timer)
      timers.current.delete(slot)

      const request = pending.current.get(slot)
      if (!request || inFlight.current.has(slot)) return
      pending.current.delete(slot)
      inFlight.current.add(slot)
      setStatus(slot, 'saving')

      let retry = false
      try {
        const result = await saveChantierFieldAction(request)
        if (result.ok) {
          attempts.current.delete(slot)
          // Une valeur plus récente attend : on ne remplace pas ce que le client tape
          if (!pending.current.has(slot)) onStoredRef.current(slot, result.value)
          setStatus(slot, 'saved')
        } else if (result.error === 'access') {
          window.location.reload()
          return
        } else if (result.error === 'server') {
          retry = true
        } else {
          setStatus(slot, 'invalid')
        }
      } catch {
        // Réseau coupé, serveur injoignable
        retry = true
      } finally {
        inFlight.current.delete(slot)
      }

      if (retry) {
        if (!pending.current.has(slot)) pending.current.set(slot, request)
        setStatus(slot, 'error')
        const n = attempts.current.get(slot) ?? 0
        attempts.current.set(slot, n + 1)
        const delay = RETRY_DELAYS_MS[Math.min(n, RETRY_DELAYS_MS.length - 1)]
        timers.current.set(slot, setTimeout(() => void flush(slot), delay))
        return
      }
      if (pending.current.has(slot)) void flush(slot)
    },
    [setStatus]
  )

  /** Programme l'enregistrement d'un champ (immediate : choix, cases à cocher). */
  const queue = useCallback(
    (request: SaveRequest, options: { immediate?: boolean } = {}) => {
      const slot = slotKey(request.establishmentId, request.fieldKey)
      pending.current.set(slot, request)
      attempts.current.delete(slot)
      const timer = timers.current.get(slot)
      if (timer) clearTimeout(timer)
      timers.current.set(
        slot,
        setTimeout(() => void flush(slot), options.immediate ? 0 : DEBOUNCE_MS)
      )
    },
    [flush]
  )

  /** Saisie refusée avant envoi (ex. e-mail incomplet) : rien ne part. */
  const markInvalid = useCallback(
    (establishmentId: string | null, fieldKey: string) => {
      const slot = slotKey(establishmentId, fieldKey)
      pending.current.delete(slot)
      const timer = timers.current.get(slot)
      if (timer) clearTimeout(timer)
      setStatus(slot, 'invalid')
    },
    [setStatus]
  )

  // Retour du réseau : tout ce qui attend repart aussitôt
  useEffect(() => {
    const retryAll = () => {
      for (const slot of pending.current.keys()) void flush(slot)
    }
    window.addEventListener('online', retryAll)
    return () => window.removeEventListener('online', retryAll)
  }, [flush])

  // Quitter la page avec des modifications non enregistrées : le navigateur prévient
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0 || inFlight.current.size > 0) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const global: GlobalStatus = useMemo(() => {
    const values = Object.values(statuses)
    if (values.includes('error')) return 'error'
    if (values.includes('saving')) return 'saving'
    // Une saisie invalide est signalée sous son champ, pas dans l'en-tête
    if (values.includes('saved')) return 'saved'
    return 'idle'
  }, [statuses])

  return { queue, markInvalid, statuses, global }
}
