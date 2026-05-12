import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm font-bold tracking-tight">GEOMIND</p>
          <nav className="flex flex-wrap justify-center gap-6">
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
