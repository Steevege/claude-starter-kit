'use client'

/**
 * Formulaire de création d'un groupe familial
 * Génère un code 6 caractères à partager
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users, Copy, Check } from 'lucide-react'

import { createGroupSchema, type CreateGroupInput } from '@/lib/schemas/family'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function CreateGroupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema) as any,
    defaultValues: {
      name: '',
      display_name: '',
    },
  })

  const onSubmit = async (data: CreateGroupInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Erreur lors de la création')
        return
      }

      setCreatedCode(result.group.code)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (!createdCode) return
    await navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleContinue = () => {
    router.refresh()
  }

  // Écran succès : afficher le code
  if (createdCode) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Groupe créé !</CardTitle>
          <CardDescription>
            Partagez ce code avec votre famille pour qu'ils rejoignent le groupe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-widest text-primary">
              {createdCode}
            </span>
            <Button variant="outline" size="icon" onClick={handleCopyCode}>
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Ce code est unique et permanent. Vous pouvez le retrouver à tout moment sur cette page.
          </p>
          <Button onClick={handleContinue} className="w-full">
            Continuer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Créer un groupe familial
        </CardTitle>
        <CardDescription>
          Créez un groupe et partagez le code avec votre famille
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du groupe</Label>
            <Input
              id="name"
              placeholder="Ex: Famille Dupont"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Votre prénom</Label>
            <Input
              id="display_name"
              placeholder="Ex: Marie"
              {...form.register('display_name')}
            />
            {form.formState.errors.display_name && (
              <p className="text-sm text-destructive">{form.formState.errors.display_name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Ce prénom sera affiché aux autres membres du groupe
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Création...' : 'Créer le groupe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
