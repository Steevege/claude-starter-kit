import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Cron keep-alive : ping Supabase tous les 5 jours
 * pour éviter la mise en pause du free tier (7 jours d'inactivité)
 */
export async function GET(request: Request) {
  // Vérifier le secret pour éviter les appels non autorisés
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      recipes_count: count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    )
  }
}
