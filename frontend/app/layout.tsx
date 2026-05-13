import React from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'

export const metadata: Metadata = {
  title: 'AyurGPT - Ayurvedic Wellness AI',
  description: 'Discover Ayurvedic wellness with AI. Educational platform combining classical wisdom with modern AI.',
  keywords: ['Ayurveda', 'Wellness', 'AI', 'Health', 'Dosha', 'Herbs'],
  openGraph: {
    title: 'AyurGPT - Ayurvedic Wellness AI',
    description: 'Discover Ayurvedic wellness with AI',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      </head>
      <body className="font-sans">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
