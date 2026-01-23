'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Player {
  id: string
  name: string
  has_paid: boolean
  is_bench: boolean
  position: number
  user_id: string | null
}

interface Event {
  id: string
  title: string
  event_date: string
  event_time: string
  is_open: boolean
  is_active: boolean
  players: Player[]
}

interface Props {
  event: Event
  isOrganizer: boolean
  userId: string
  profileName: string
}

const MAX_MAIN_PLAYERS = 14
const MAX_BENCH_PLAYERS = 14

export default function EventDetails({ event: initialEvent, isOrganizer, userId, profileName }: Props) {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<Player[]>(initialEvent.players)
  const router = useRouter()
  const supabase = createClient()

  const event = { ...initialEvent, players }

  const mainPlayers = players
    .filter(p => !p.is_bench)
    .sort((a, b) => a.position - b.position)
  
  const benchPlayers = players
    .filter(p => p.is_bench)
    .sort((a, b) => a.position - b.position)

  // Check if current user is already registered
  const userRegistration = event.players.find(p => p.user_id === userId)
  const isUserRegistered = !!userRegistration

  const isMainListFull = mainPlayers.length >= MAX_MAIN_PLAYERS
  const isBenchListFull = benchPlayers.length >= MAX_BENCH_PLAYERS

  const handleAddPlayer = async (listType: 'main' | 'bench') => {
    if (!profileName.trim()) return

    setLoading(true)

    // Determine which list to add to
    let isBench = listType === 'bench'
    let position: number

    // If main list is full, redirect to bench
    if (listType === 'main' && isMainListFull) {
      if (isBenchListFull) {
        alert('Ambas listas están llenas')
        setLoading(false)
        return
      }
      isBench = true
      position = benchPlayers.length + 1
    } else if (listType === 'bench' && isBenchListFull) {
      // If bench is full, show error (don't redirect to main)
      alert('La banca está llena')
      setLoading(false)
      return
    } else {
      position = isBench ? benchPlayers.length + 1 : mainPlayers.length + 1
    }

    const { data, error } = await supabase.from('players').insert({
      event_id: event.id,
      user_id: userId,
      name: profileName.trim(),
      has_paid: false,
      is_bench: isBench,
      position: position,
    }).select().single()

    if (error) {
      console.error('Error al inscribirse:', error)
      alert('Error al inscribirse: ' + error.message)
      setLoading(false)
      return
    }

    // Actualización optimista - agregar el nuevo jugador al estado local
    if (data) {
      setPlayers(prev => [...prev, data])
    }
    
    setLoading(false)
  }

  const handleTogglePayment = async (playerId: string, currentStatus: boolean) => {
    // Actualización optimista - cambiar el estado inmediatamente
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, has_paid: !currentStatus } : p
    ))

    const { error } = await supabase
      .from('players')
      .update({ has_paid: !currentStatus })
      .eq('id', playerId)
    
    // Si hay error, revertir el cambio
    if (error) {
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, has_paid: currentStatus } : p
      ))
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    const playerToRemove = players.find(p => p.id === playerId)
    
    // Actualización optimista - remover inmediatamente
    setPlayers(prev => prev.filter(p => p.id !== playerId))
    
    await supabase.from('players').delete().eq('id', playerId)

    // If removing from main list and there are bench players, promote first bench player
    if (!playerToRemove?.is_bench && benchPlayers.length > 0) {
      const firstBenchPlayer = benchPlayers[0]
      await supabase
        .from('players')
        .update({ 
          is_bench: false, 
          position: mainPlayers.length 
        })
        .eq('id', firstBenchPlayer.id)
      
      // Actualizar estado local para la promoción
      setPlayers(prev => prev.map(p => 
        p.id === firstBenchPlayer.id 
          ? { ...p, is_bench: false, position: mainPlayers.length }
          : p
      ))
    }
  }

  const PlayerCard = ({ player, isBench }: { player: Player; isBench: boolean }) => (
    <div className={`flex items-center justify-between px-3 py-1 rounded-lg ${
      isBench ? 'bg-orange-100' : 'bg-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isBench 
            ? 'bg-orange-100 text-orange-700' 
            : 'bg-green-200 text-green-800'
        }`}>
          {player.position}
        </span>
        <span className="font-medium text-gray-900">{player.name}</span>
      </div>
      
      <div className="flex items-center space-x-3">
        {isOrganizer && (
          <>
            {/* Toggle Switch for Payment */}
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${player.has_paid ? 'text-green-600' : 'text-gray-500'}`}>
                {player.has_paid ? 'Pagado' : 'Por Pagar'}
              </span>
              <button
                onClick={() => handleTogglePayment(player.id, player.has_paid)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  player.has_paid ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                    player.has_paid ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={() => handleRemovePlayer(player.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              X
            </button>
          </>
        )}
        {!isOrganizer && player.has_paid && (
          <span className="text-green-500 text-sm font-medium">✓ Pagado</span>
        )}
        {/* Botón para que el jugador se quite a sí mismo */}
        {!isOrganizer && player.user_id === userId && (
          <button
            onClick={() => handleRemovePlayer(player.id)}
            className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200 font-medium text-sm border border-red-200 hover:border-red-500 hover:scale-105"
            title="Quitarme de la lista"
          >
            ✕ Drop
          </button>
        )}
      </div>
    </div>
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Event Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
            <p className="text-gray-500 mt-1">
              {new Date(event.event_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} - {event.event_time}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {event.is_active && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Activo
              </span>
            )}
            {event.is_open && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                Abierto
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add Player Form or Already Registered Message */}
      {event.is_open && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {isUserRegistered ? (
            // User is already registered
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-bold text-gray-800 text-lg mb-2">¡Ya estás inscrito!</h2>
              <p className="text-gray-600 mb-3">
                Estás en la <span className={`font-semibold ${userRegistration?.is_bench ? 'text-orange-600' : 'text-green-600'}`}>
                  {userRegistration?.is_bench ? 'Banca' : 'Lista Principal'}
                </span> como <span className="font-semibold">{userRegistration?.name}</span>
              </p>
              <p className="text-sm text-gray-500">
                Posición: #{userRegistration?.position}
              </p>
            </div>
          ) : (
            // User can register
            <>
              <h2 className="font-semibold text-gray-800 mb-4">📝 Inscribirse al Evento</h2>
              
              {/* Profile Name Display */}
              <div className="mb-4 p-3 bg-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">Te inscribirás como:</p>
                <p className="font-semibold text-gray-800">{profileName}</p>
              </div>

          {/* Inscription Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 mb-2">👇 Haz clic en una opción para inscribirte:</p>
            
            {/* Main List Button */}
            <button
              type="button"
              onClick={() => handleAddPlayer('main')}
              disabled={loading || isMainListFull}
              className={`w-full py-4 px-4 rounded-xl font-medium transition-all flex items-center justify-between border-3 shadow-md hover:shadow-lg active:scale-[0.98] ${
                isMainListFull 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300 shadow-none' 
                  : 'bg-white hover:bg-green-500 text-green-700 hover:text-white border-green-500 focus:ring-4 focus:ring-green-300 focus:outline-none cursor-pointer'
              }`}
              style={{ borderWidth: '3px' }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚽</span>
                <div className="text-left">
                  <p className="font-bold text-lg">Lista Principal</p>
                  <p className="text-sm opacity-80">
                    {isMainListFull ? '❌ Lista llena' : '✓ Jugarás el partido'}
                  </p>
                </div>
              </div>
              <div className="text-right bg-green-100 px-3 py-2 rounded-lg">
                <p className="text-xl font-bold text-green-700">{mainPlayers.length}/{MAX_MAIN_PLAYERS}</p>
                <p className="text-xs text-green-600">cupos</p>
              </div>
            </button>

            {/* Bench Button */}
            <button
              type="button"
              onClick={() => handleAddPlayer('bench')}
              disabled={loading || isBenchListFull}
              className={`w-full py-4 px-4 rounded-xl font-medium transition-all flex items-center justify-between shadow-md hover:shadow-lg active:scale-[0.98] ${
                isBenchListFull 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300 shadow-none' 
                  : 'bg-white hover:bg-orange-500 text-orange-700 hover:text-white border-orange-500 focus:ring-4 focus:ring-orange-300 focus:outline-none cursor-pointer'
              }`}
              style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: isBenchListFull ? '#d1d5db' : '#f97316' }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🪑</span>
                <div className="text-left">
                  <p className="font-bold text-lg">Banca</p>
                  <p className="text-sm opacity-80">
                    {isBenchListFull ? '❌ Banca llena' : '✓ Suplente / Reserva'}
                  </p>
                </div>
              </div>
              <div className="text-right bg-orange-100 px-3 py-2 rounded-lg">
                <p className="text-xl font-bold text-orange-700">{benchPlayers.length}/{MAX_BENCH_PLAYERS}</p>
                <p className="text-xs text-orange-600">cupos</p>
              </div>
            </button>
          </div>

          {isMainListFull && isBenchListFull && (
            <p className="text-red-600 text-sm mt-3 text-center font-medium">
              ❌ Ambas listas están llenas. No es posible inscribirse.
            </p>
          )}
            </>
          )}
        </div>
      )}

      {/* Player Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Main List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Lista Principal ({mainPlayers.length}/{MAX_MAIN_PLAYERS})
          </h2>
          <div className="space-y-1">
            {mainPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} isBench={false} />
            ))}
            {mainPlayers.length === 0 && (
              <p className="text-gray-400 text-center py-8">Sin jugadores registrados</p>
            )}
          </div>
        </div>

        {/* Bench List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Banca ({benchPlayers.length}/{MAX_BENCH_PLAYERS})
          </h2>
          <div className="space-y-1">
            {benchPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} isBench={true} />
            ))}
            {benchPlayers.length === 0 && (
              <p className="text-gray-400 text-center py-8">Sin jugadores en banca</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <p className="text-2xl font-bold text-gray-800">{mainPlayers.length + benchPlayers.length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <p className="text-2xl font-bold text-green-600">
            {event.players.filter(p => p.has_paid).length}
          </p>
          <p className="text-sm text-gray-500">Pagados</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <p className="text-2xl font-bold text-orange-600">
            {event.players.filter(p => !p.has_paid).length}
          </p>
          <p className="text-sm text-gray-500">Pendientes</p>
        </div>
      </div>
    </main>
  )
}
