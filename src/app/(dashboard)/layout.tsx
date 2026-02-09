/**
 * Layout pour le dashboard (pages authentifiées)
 */

import type { Metadata } from 'next'
import { DesktopHeader } from '@/components/layout/desktop-header'
import { MobileNav } from '@/components/layout/mobile-nav'

export const metadata: Metadata = {
  title: 'Mes Recettes - Mon Livre de Recettes',
  description: 'Gérez vos recettes de cuisine',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopHeader />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
