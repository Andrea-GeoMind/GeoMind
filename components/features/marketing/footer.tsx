import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <p className="text-base font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              GEO
            </span>
            <span className="text-foreground">MIND</span>
          </p>

          <nav className="flex flex-wrap justify-center gap-6">
            <Link
              href="/blog"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              À propos
            </Link>
            <Link
              href="/legal/cgv"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              CGV
            </Link>
            <Link
              href="/legal/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Confidentialité
            </Link>
            <Link
              href="/legal/mentions"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Mentions légales
            </Link>
            <Link
              href="/legal/cookies"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookies
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">© 2026 GEOMIND</p>
        </div>
      </div>
    </footer>
  )
}
