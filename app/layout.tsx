import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Simulador de Compra — Novo Mundo',
  description: 'Dashboard de readequação de metas e gestão de compras',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-gray-800 text-sm">Simulador de Compra</span>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Saúde do Mês</Link>
          <Link href="/compras" className="text-sm text-gray-600 hover:text-gray-900">Compras em Andamento</Link>
        </nav>
        <main className="px-6 py-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  )
}
