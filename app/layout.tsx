import './globals.css'
import type { Metadata } from 'next'
import { Space_Grotesk, Fira_Code } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"


const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
})

export const metadata: Metadata = {
  title: 'LaTeX Typeracer',
  description: 'Boost your LaTeX typing skills with interactive tests and races. Perfect your speed and accuracy with live-rendered math expressions to master the art of the type.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${firaCode.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css"
          integrity="sha384-Xi8rHCmBmhbuyyhbI88391ZKP2dmfnOl4rT9ZfRI7mLTdk1wblIUnrIq35nqwEvC"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">{children}
      <Analytics />
      </body>
    </html>
  )
}

