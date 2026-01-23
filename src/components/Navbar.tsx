'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, isAdmin, isOrganizer } = useAuth()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/', label: 'Inicio', icon: '🏠' },
    { href: '/events', label: 'Eventos', icon: '📅' },
  ]

  if (isOrganizer) {
    navItems.push({ href: '/create-event', label: 'Crear Evento', icon: '➕' })
  }

  if (isAdmin) {
    navItems.push({ href: '/admin/users', label: 'Usuarios', icon: '👥' })
  }

  const getRoleBadge = () => {
    if (!profile) return null
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      organizer: 'bg-blue-100 text-blue-800',
      player: 'bg-green-100 text-green-800',
    }
    const roleLabels = {
      admin: 'Admin',
      organizer: 'Organizador',
      player: 'Jugador',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[profile.role]}`}>
        {roleLabels[profile.role]}
      </span>
    )
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚽</span>
              <span className="font-bold text-xl text-gray-800">Futbol OP</span>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === item.href
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <span className="text-sm text-gray-400">Cargando...</span>
            ) : user && profile ? (
              <>
                <div className="flex items-center space-x-3">
                  {getRoleBadge()}
                  <span className="text-sm text-gray-600">{profile.full_name}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Cerrar sesión
                </button>
              </>
            ) : user ? (
              <span className="text-sm text-gray-400">Cargando perfil...</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t">
        {/* User profile for mobile */}
        {loading ? (
          <div className="flex items-center justify-center px-4 py-3 bg-gray-50 border-b">
            <span className="text-sm text-gray-400">Cargando...</span>
          </div>
        ) : user && profile ? (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center space-x-2">
              <span className="text-xl">👤</span>
              <span className="text-sm font-medium text-gray-800">{profile.full_name}</span>
              {getRoleBadge()}
            </div>
            <button
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Salir
            </button>
          </div>
        ) : null}
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-2 text-xs ${
                pathname === item.href ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
