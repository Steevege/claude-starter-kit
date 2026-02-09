/**
 * Layout pour le dashboard (pages authentifiées)
 */

import type { Metadata } from 'next'

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
      {/* Header sera ajouté plus tard */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
