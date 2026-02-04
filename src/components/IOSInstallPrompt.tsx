'use client'

import { useState, useEffect } from 'react'

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Detectar si es iOS y si no está instalada como PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('ios-pwa-dismissed')

    if (isIOS && !isStandalone && !dismissed) {
      // Mostrar después de 3 segundos
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('ios-pwa-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto">
        <div className="flex items-start space-x-3">
          <div className="text-3xl">📱</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">Instala Futbol OP</h3>
            <p className="text-sm text-gray-600 mt-1">
              Agrega esta app a tu pantalla de inicio para acceso rápido:
            </p>
            <ol className="text-sm text-gray-600 mt-2 space-y-1">
              <li className="flex items-center space-x-2">
                <span>1.</span>
                <span>Toca el botón</span>
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z"/>
                </svg>
                <span>de compartir</span>
              </li>
              <li>2. Selecciona &quot;Agregar a pantalla de inicio&quot;</li>
            </ol>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
