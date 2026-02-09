'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UserMenu({ variant = 'desktop' }: { variant?: 'mobile' | 'desktop' }) {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleSignOut}
        className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
      >
        <User className="size-5" />
        <span className="text-xs">Compte</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {email && (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {email}
        </span>
      )}
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        <LogOut className="size-4" />
        Déconnexion
      </Button>
    </div>
  )
}
