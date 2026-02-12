'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'

const navItems = [
  { href: '/recettes', label: 'Mes Recettes' },
  { href: '/favoris', label: 'Favoris' },
  { href: '/recettes/new', label: 'Nouvelle Recette' },
  { href: '/videos', label: 'Vidéos' },
  { href: '/famille', label: 'Famille' },
] as const

export function DesktopHeader() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/recettes/new') {
      return pathname === '/recettes/new'
    }
    if (href === '/favoris') {
      return pathname === '/favoris'
    }
    if (href === '/videos') {
      return pathname === '/videos' || pathname.startsWith('/videos/')
    }
    if (href === '/famille') {
      return pathname === '/famille' || pathname.startsWith('/famille/')
    }
    if (href === '/recettes') {
      return pathname === '/recettes' || pathname.startsWith('/recettes/')
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="hidden md:block border-b bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/recettes" className="flex items-center gap-2 font-semibold text-lg">
            <ChefHat className="size-6 text-primary" />
            Mes Recettes
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <UserMenu variant="desktop" />
      </div>
    </header>
  )
}
