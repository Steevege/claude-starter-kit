'use client'

/**
 * Bouton de suppression avec confirmation
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DeleteRecipeButtonProps {
  recipeId: string
  recipeTitle: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Si true, affiche uniquement l'icône sans texte */
  iconOnly?: boolean
  /** Callback après suppression (remplace la redirection par défaut) */
  onDeleted?: () => void
}

export function DeleteRecipeButton({
  recipeId,
  recipeTitle,
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  onDeleted,
}: DeleteRecipeButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const supabase = createClient()

      // Supprimer la recette
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)

      if (error) {
        console.error('Erreur suppression:', error)
        alert('Erreur lors de la suppression')
        return
      }

      if (onDeleted) {
        onDeleted()
      } else {
        router.push('/recettes')
      }
      router.refresh()
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="text-red-600 hover:text-red-700">
          <Trash2 className={iconOnly ? 'w-4 h-4' : 'w-4 h-4 mr-2'} />
          {!iconOnly && 'Supprimer'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la recette ?</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer "{recipeTitle}" ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
