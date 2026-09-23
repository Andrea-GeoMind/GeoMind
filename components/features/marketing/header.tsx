import Link from 'next/link'
import { Logo } from '@/components/logo'
import { MobileMenu } from '@/components/features/marketing/mobile-menu'
import { HeaderAuthActions } from '@/components/features/marketing/header-auth-actions'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo officiel */}
        <Link href="/" aria-label="GEOMIND — accueil">
          <Logo size={32} />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Fonctionnalités
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Tarifs
          </Link>
          <Link
            href="/blog"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href="/about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            À propos
          </Link>
        </nav>

        {/* `min-w` : la bascule connecté/déconnecté ne doit pas décaler la
            barre de navigation une fois la session détectée côté client. */}
        <div className="flex min-w-[9.5rem] items-center justify-end gap-2 md:min-w-[15rem] md:gap-3">
          <HeaderAuthActions />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
