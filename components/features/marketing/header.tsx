import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo gradient */}
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            GEO
          </span>
          <span className="text-foreground">MIND</span>
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
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild size="sm">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:opacity-90 transition-opacity rounded-lg"
          >
            <Link href="/signup">Commencer</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
