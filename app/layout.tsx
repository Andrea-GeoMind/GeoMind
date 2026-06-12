import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
// Validation des variables d'environnement au boot — crash explicitement si manquantes
import '@/lib/env'
import { Toaster } from '@/components/ui/toaster'
import { InstallPrompt } from '@/components/install-prompt'
import { CookieBanner } from '@/components/cookie-banner'
import { PostHogProvider } from '@/components/posthog-provider'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://geomind.fr'),
  title: {
    default: 'GEOMIND — Êtes-vous cité par ChatGPT ? Auditez votre visibilité IA',
    template: '%s — GEOMIND',
  },
  description:
    'GEOMIND audite la visibilité de votre site dans ChatGPT, Perplexity, Gemini et Claude, et vous donne un plan d’action concret. Pensé pour les TPE/PME, en français.',
  manifest: '/manifest.json',
  alternates: {
    canonical: './',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://geomind.fr',
    siteName: 'GEOMIND',
    title: 'GEOMIND — Êtes-vous cité par ChatGPT ?',
    description:
      'Auditez votre visibilité dans les moteurs IA (ChatGPT, Perplexity, Gemini, Claude) et obtenez un plan d’action concret. 1 analyse offerte, sans carte bancaire.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEOMIND — Êtes-vous cité par ChatGPT ?',
    description:
      'Auditez votre visibilité dans les moteurs IA et obtenez un plan d’action concret. 1 analyse offerte.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GEOMIND',
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <PostHogProvider>
          {children}
          <Toaster />
          <InstallPrompt />
          <CookieBanner />
        </PostHogProvider>
      </body>
    </html>
  )
}
