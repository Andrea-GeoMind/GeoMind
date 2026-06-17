'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { LogoMark } from '@/components/logo'

/**
 * Coque mobile de la sidebar (PLAN item 19) : barre supérieure avec hamburger
 * en dessous de lg, drawer plein écran par-dessus le contenu. La sidebar
 * desktop reste inchangée (cachée < lg dans le layout).
 */
export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Fermer le drawer à chaque navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Bloquer le scroll du body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Barre supérieure mobile */}
      <div className="flex h-14 shrink-0 items-center justify-between bg-[#16304B] px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="text-base font-extrabold tracking-tight text-white">
            GEO<span className="text-white/70">MIND</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B2C8DE] transition-colors hover:bg-white/10 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            {children}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#B2C8DE] transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
