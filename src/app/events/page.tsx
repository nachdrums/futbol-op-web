import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get all events
  const { data: events } = await supabase
    .from('events')
    .select('*, players (id)')
    .order('event_date', { ascending: false })

  // Get today's date for comparison
  const today = new Date().toISOString().split('T')[0]

  // Separate active (future) and past events based on date
  const activeEvents = events?.filter(e => e.event_date >= today) || []
  const pastEvents = events?.filter(e => e.event_date < today) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
        </div>

        {/* Active Events Section */}
        {activeEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Eventos Activos
            </h2>
            <div className="grid gap-4">
              {activeEvents.map((event) => (
                <Link
                  key={event.id}
                  href={'/events/' + event.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 block border-l-4 border-green-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          Activo
                        </span>
                      </div>
                      <p className="text-gray-500">
                        {new Date(event.event_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} - {event.event_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {event.players?.length || 0}
                      </p>
                      <p className="text-sm text-gray-500">jugadores</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              Eventos Anteriores
            </h2>
            <div className="grid gap-4">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={'/events/' + event.id}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 block opacity-75 hover:opacity-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">{event.title}</h3>
                      <p className="text-gray-500">
                        {new Date(event.event_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} - {event.event_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-600">
                        {event.players?.length || 0}
                      </p>
                      <p className="text-sm text-gray-500">jugadores</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No events message */}
        {(!events || events.length === 0) && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No hay eventos</h2>
            <p className="text-gray-500">Aún no se han creado eventos</p>
          </div>
        )}
      </main>
    </div>
  )
}
