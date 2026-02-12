'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, PlusCircle, Video, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'

const navItems = [
  { href: '/recettes', label: 'Recettes', icon: Home },
  { href: '/favoris', label: 'Favoris', icon: Heart },
  { href: '/recettes/new', label: 'Nouvelle', icon: PlusCircle },
  { href: '/videos', label: 'Vidéos', icon: Video },
  { href: '/famille', label: 'Famille', icon: Users },
] as const

export function MobileNav() {
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-h-[48px] text-muted-foreground transition-colors',
                active && 'text-primary font-semibold'
              )}
            >
              <item.icon className="size-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
        <UserMenu variant="mobile" />
      </div>
    </nav>
  )
}
