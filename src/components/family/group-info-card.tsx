'use client'

/**
 * Carte d'informations du groupe familial
 * Affiche le nom, code, membres et bouton quitter
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, LogOut, Crown, User } from 'lucide-react'

import type { FamilyGroup, FamilyMember } from '@/lib/types/family'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface GroupInfoCardProps {
  group: FamilyGroup
  members: FamilyMember[]
  currentUserId: string
}

export function GroupInfoCard({ group, members, currentUserId }: GroupInfoCardProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const currentMember = members.find(m => m.user_id === currentUserId)
  const isOwner = currentMember?.role === 'owner'

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(group.code.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = async () => {
    setIsLeaving(true)
    try {
      const response = await fetch('/api/family/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        setDialogOpen(false)
        router.refresh()
      }
    } catch {
      // Ignorer l'erreur
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">{group.name}</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Quitter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quitter le groupe ?</DialogTitle>
              <DialogDescription>
                {isOwner && members.length > 1
                  ? 'En tant que créateur, le rôle sera transféré au membre le plus ancien.'
                  : isOwner
                    ? 'Vous êtes le dernier membre. Le groupe sera supprimé.'
                    : 'Vos recettes partagées redeviendront privées.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isLeaving}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeave}
                disabled={isLeaving}
              >
                {isLeaving ? 'Départ...' : 'Quitter le groupe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code du groupe */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Code d'invitation</p>
            <span className="text-2xl font-mono font-bold tracking-widest">
              {group.code.trim()}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={handleCopyCode}>
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Liste des membres */}
        <div>
          <p className="text-sm font-medium mb-2">
            {members.length} {members.length > 1 ? 'membres' : 'membre'}
          </p>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2">
                  {member.role === 'owner' ? (
                    <Crown className="w-4 h-4 text-amber-500" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {member.display_name}
                    {member.user_id === currentUserId && (
                      <span className="text-muted-foreground"> (vous)</span>
                    )}
                  </span>
                </div>
                {member.role === 'owner' && (
                  <Badge variant="secondary" className="text-xs">
                    Créateur
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
