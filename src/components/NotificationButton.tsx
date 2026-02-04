'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationButton() {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    loading, 
    error,
    subscribe, 
    unsubscribe 
  } = usePushNotifications()

  const handleClick = async () => {
    console.log('NotificationButton clicked', { isSupported, isSubscribed, permission })
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  // Si el permiso fue denegado permanentemente
  if (permission === 'denied') {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
        title="Las notificaciones están bloqueadas en tu navegador"
      >
        <span className="text-lg">🔕</span>
        <span className="hidden sm:inline">Bloqueadas</span>
      </button>
    )
  }

  // Mostrar botón deshabilitado si no está soportado
  if (!isSupported) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
        title="Las notificaciones push no están disponibles"
      >
        <span className="text-lg">🔕</span>
        <span className="hidden sm:inline">No disponible</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
          isSubscribed
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${loading ? 'opacity-50 cursor-wait' : ''}`}
        title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
      >
        <span className="text-lg">{isSubscribed ? '🔔' : '🔕'}</span>
        <span className="hidden sm:inline">
          {loading 
            ? 'Procesando...' 
            : isSubscribed 
              ? 'Activas' 
              : 'Activar'
          }
        </span>
      </button>
      
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 text-red-600 text-xs p-2 rounded shadow-lg whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  )
}
