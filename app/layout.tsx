import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'CollabKaro — India\'s Influencer Marketing Platform',
  description: 'Connect brands with the right influencers. Seamless collaboration, secure payments, guaranteed results.',
  keywords: 'influencer marketing, brand collaboration, india, instagram influencer, youtube creator',
  openGraph: {
    title: 'CollabKaro',
    description: 'Connect brands with the right influencers.',
    url: 'https://collabkaro-phi.vercel.app',
    siteName: 'CollabKaro',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  )
}