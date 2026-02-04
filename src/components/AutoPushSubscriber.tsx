'use client'

import { useEffect, useRef } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Componente que solicita automáticamente permisos de notificaciones
 * cuando el usuario está autenticado.
 * Se monta en el layout principal para activar notificaciones automáticamente.
 */
export default function AutoPushSubscriber() {
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications()
  const { user } = useAuth()
  const hasAttempted = useRef(false)

  useEffect(() => {
    // Solo intentar si:
    // - Hay un usuario autenticado
    // - Push está soportado
    // - No está suscrito aún
    // - No hemos intentado antes
    // - El permiso no ha sido denegado
    if (
      user && 
      isSupported && 
      !isSubscribed && 
      !hasAttempted.current && 
      permission !== 'denied'
    ) {
      hasAttempted.current = true
      
      // Pequeño delay para no bloquear la carga inicial
      const timer = setTimeout(() => {
        subscribe()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [user, isSupported, isSubscribed, permission, subscribe])

  // Este componente no renderiza nada visible
  return null
}
