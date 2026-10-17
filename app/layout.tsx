import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import './globals.css'

const nunito = localFont({
  src: './fonts/nunito-latin.woff2',
  variable: '--font-nunito',
  weight: '400 800',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kids Timer',
  description: 'A fun visual timer for kids with mouse and race car themes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kids Timer',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#a08260',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans`}>
        {children}
        <ServiceWorkerRegister />
        {process.env.NEXT_PUBLIC_VERCEL_ENV && <Analytics />}
      </body>
    </html>
  )
}
