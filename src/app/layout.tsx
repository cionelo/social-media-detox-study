import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/ui/Footer'

export const metadata: Metadata = {
  title: 'Social Media Detox Study',
  description: 'Cognitive assessment platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-parchment font-mono antialiased">
        {children}
        <Footer />
      </body>
    </html>
  )
}
