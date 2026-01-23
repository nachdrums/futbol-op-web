import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0]

  // Get active events (events with date >= today)
  const { data: activeEvents } = await supabase
    .from('events')
    .select('*, players (*)')
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get the first active event for stats
  const activeEvent = activeEvents?.[0] || null
  const mainPlayers = activeEvent?.players?.filter((p: { is_bench: boolean }) => !p.is_bench).sort((a: { position: number }, b: { position: number }) => a.position - b.position) || []
  const benchPlayers = activeEvent?.players?.filter((p: { is_bench: boolean }) => p.is_bench).sort((a: { position: number }, b: { position: number }) => a.position - b.position) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="rounded-2xl p-6 mb-8 text-white relative overflow-hidden min-h-[120px]">
          <Image
            src="/op-borussia.png"
            alt="Futbol OP"
            fill
            className="object-cover z-0"
            priority
          />
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <div className="relative z-20">
            <h1 className="text-2xl font-bold mb-2">
              Hola, {profile?.full_name || 'Jugador'}!
            </h1>
            <p className="opacity-90">Bienvenido a Futbol OP</p>
          </div>
        </div>

        {/* Active Events */}
        {activeEvents && activeEvents.length > 0 ? (
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800">Eventos Activos</h2>
            {activeEvents.map((event) => {
              const eventMainPlayers = event.players?.filter((p: { is_bench: boolean }) => !p.is_bench).sort((a: { position: number }, b: { position: number }) => a.position - b.position) || []
              const eventBenchPlayers = event.players?.filter((p: { is_bench: boolean }) => p.is_bench).sort((a: { position: number }, b: { position: number }) => a.position - b.position) || []
              
              return (
                <div key={event.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                    <Link
                      href={'/events/' + event.id}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition text-center whitespace-nowrap"
                    >
                      Ver Evento
                    </Link>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Main List */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Lista Principal ({eventMainPlayers.length}/14)
                      </h4>
                      <div className="space-y-2">
                        {eventMainPlayers.slice(0, 5).map((player: { id: string; name: string; has_paid: boolean; position: number }) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                                {player.position}
                              </span>
                              <span className="text-gray-700">{player.name}</span>
                            </div>
                            {player.has_paid && <span className="text-green-500">Pagado</span>}
                          </div>
                        ))}
                        {eventMainPlayers.length > 5 && (
                          <p className="text-gray-500 text-sm text-center py-2">
                            +{eventMainPlayers.length - 5} más...
                          </p>
                        )}
                        {eventMainPlayers.length === 0 && (
                          <p className="text-gray-400 text-center py-4">Sin jugadores aún</p>
                        )}
                      </div>
                    </div>

                    {/* Bench List */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Banca ({eventBenchPlayers.length}/14)
                      </h4>
                      <div className="space-y-2">
                        {eventBenchPlayers.slice(0, 5).map((player: { id: string; name: string; has_paid: boolean; position: number }) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between bg-orange-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-medium">
                                {player.position}
                              </span>
                              <span className="text-gray-700">{player.name}</span>
                            </div>
                            {player.has_paid && <span className="text-green-500">Pagado</span>}
                          </div>
                        ))}
                        {eventBenchPlayers.length === 0 && (
                          <p className="text-gray-400 text-center py-4">Sin jugadores en banca</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No hay evento activo</h2>
            <p className="text-gray-500 mb-6">Espera a que un organizador cree un nuevo evento</p>
            <Link
              href="/events"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Ver historial de eventos
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
