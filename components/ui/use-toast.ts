'use client'

import { useState, useEffect } from 'react'

type ToastVariant = 'default' | 'destructive'

interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastState = ToastData[]

const TOAST_LIMIT = 3
const TOAST_DEFAULT_DURATION = 5000

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = []

function dispatch(next: ToastState) {
  memoryState = next
  listeners.forEach((l) => l(memoryState))
}

export function toast(props: Omit<ToastData, 'id'>) {
  const id = genId()
  const entry: ToastData = { ...props, id }
  dispatch([entry, ...memoryState].slice(0, TOAST_LIMIT))
  setTimeout(() => {
    dispatch(memoryState.filter((t) => t.id !== id))
  }, props.duration ?? TOAST_DEFAULT_DURATION)
  return id
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState>(memoryState)

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    toasts,
    dismiss: (id: string) => dispatch(memoryState.filter((t) => t.id !== id)),
  }
}
