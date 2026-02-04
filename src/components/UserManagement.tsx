'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/types/database'

interface Props {
  users: Profile[]
  currentUserId: string
}

export default function UserManagement({ users, currentUserId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUserId) {
      alert('No puedes cambiar tu propio rol')
      return
    }

    setLoading(userId)

    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    setLoading(null)
    router.refresh()
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUserId) {
      alert('No puedes eliminarte a ti mismo')
      return
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`
    )

    if (!confirmed) return

    setDeleting(userId)

    try {
      // Eliminar el perfil del usuario
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        alert('Error al eliminar el usuario: ' + error.message)
      } else {
        router.refresh()
      }
    } catch {
      alert('Error al eliminar el usuario')
    } finally {
      setDeleting(null)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      admin: 'bg-red-100 text-red-800',
      organizer: 'bg-blue-100 text-blue-800',
      player: 'bg-green-100 text-green-800',
    }
    const labels = {
      admin: 'Administrador',
      organizer: 'Organizador',
      player: 'Jugador',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[role]}`}>
        {labels[role]}
      </span>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Administracion de Usuarios</h1>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
          {users.length} usuarios
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Rol Actual</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Cambiar Rol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.full_name}</p>
                        {user.id === currentUserId && (
                          <span className="text-xs text-gray-500">(Tu)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    {user.id !== currentUserId ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={loading === user.id}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 text-gray-800"
                      >
                        <option value="player">Jugador</option>
                        <option value="organizer">Organizador</option>
                        <option value="admin">Administrador</option>
                      </select>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.id !== currentUserId ? (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        disabled={deleting === user.id}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {deleting === user.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Eliminando...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Eliminar</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl">��</span>
            <h3 className="font-semibold text-gray-800">Jugador</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Puede ver eventos, inscribirse a partidos y ver el estado de sus pagos.
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl">📋</span>
            <h3 className="font-semibold text-gray-800">Organizador</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Puede crear eventos, gestionar listas de jugadores y marcar pagos.
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl">👑</span>
            <h3 className="font-semibold text-gray-800">Administrador</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Acceso completo. Puede gestionar usuarios y sus roles.
          </p>
        </div>
      </div>
    </main>
  )
}
