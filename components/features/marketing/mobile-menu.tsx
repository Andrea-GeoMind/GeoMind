'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsSignedIn } from '@/components/features/marketing/header-auth-actions'

const NAV_LINKS = [
  { href: '/#features', label: 'Fonctionnalités' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'À propos' },
] as const

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const signedIn = useIsSignedIn()

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-b border-border/60 bg-background shadow-lg">
          <nav className="flex flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                  pathname === link.href ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border/60" />
            {signedIn ? (
              <Button asChild size="sm" className="mx-3 my-2">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Mon tableau de bord
                </Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                  Se connecter
                </Link>
                <Button asChild size="sm" className="mx-3 my-2">
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    Commencer
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
