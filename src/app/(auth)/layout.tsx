/**
 * Layout pour les pages d'authentification (login, signup)
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentification - Mon Livre de Recettes',
  description: 'Connexion et inscription',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
