'use client'

/**
 * Formulaire pour rejoindre un groupe familial par code
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'

import { joinGroupSchema, type JoinGroupInput } from '@/lib/schemas/family'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function JoinGroupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<JoinGroupInput>({
    resolver: zodResolver(joinGroupSchema) as any,
    defaultValues: {
      code: '',
      display_name: '',
    },
  })

  const onSubmit = async (data: JoinGroupInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Erreur lors de la connexion')
        return
      }

      router.refresh()
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Rejoindre un groupe
        </CardTitle>
        <CardDescription>
          Entrez le code reçu d'un membre de votre famille
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code famille</Label>
            <Input
              id="code"
              placeholder="Ex: ABC123"
              maxLength={6}
              className="text-center text-xl font-mono tracking-widest uppercase"
              {...form.register('code')}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="join_display_name">Votre prénom</Label>
            <Input
              id="join_display_name"
              placeholder="Ex: Marie"
              {...form.register('display_name')}
            />
            {form.formState.errors.display_name && (
              <p className="text-sm text-destructive">{form.formState.errors.display_name.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Connexion...' : 'Rejoindre'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
