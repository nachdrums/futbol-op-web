import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
  const supabase = await createClient()

  // Verificar que el usuario actual está autenticado
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }

  // Verificar que el usuario actual es admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Solo los administradores pueden eliminar usuarios' },
      { status: 403 }
    )
  }

  // No permitir que el admin se elimine a sí mismo
  if (userId === user.id) {
    return NextResponse.json(
      { error: 'No puedes eliminarte a ti mismo' },
      { status: 400 }
    )
  }

  // Eliminar el perfil del usuario
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) {
    return NextResponse.json(
      { error: 'Error al eliminar el usuario: ' + error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
