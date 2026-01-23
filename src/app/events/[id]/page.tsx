import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EventDetails from '@/components/EventDetails'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: event } = await supabase
    .from('events')
    .select('*, players (*)')
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <EventDetails event={event} isOrganizer={isOrganizer} userId={user.id} profileName={profile?.full_name || ''} />
    </div>
  )
}
