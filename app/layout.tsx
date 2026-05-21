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
  title: 'GEOMIND — Auditez votre visibilité IA',
  description:
    'Sachez où vous êtes cité dans les IA. Comprenez pourquoi pas. Améliorez votre visibilité GEO.',
  manifest: '/manifest.json',
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
