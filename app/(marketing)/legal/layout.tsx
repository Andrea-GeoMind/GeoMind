export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <div className="space-y-8 text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  )
}
