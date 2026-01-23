'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAYS_OF_WEEK_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] // Starts with Monday
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

// Hours from 6:00 to 23:00
const HOURS = Array.from({ length: 18 }, (_, i) => (i + 6).toString().padStart(2, '0'))
// Minutes in 5-minute intervals
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

export default function CreateEventPage() {
  const [eventName, setEventName] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedHour, setSelectedHour] = useState('10')
  const [selectedMinute, setSelectedMinute] = useState('00')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { isOrganizer } = useAuth()
  const supabase = createClient()

  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-gray-200">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso restringido</h2>
            <p className="text-gray-500">Solo organizadores y administradores pueden crear eventos</p>
          </div>
        </main>
      </div>
    )
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    // Returns 0-6 where 0 is Monday and 6 is Sunday
    const day = new Date(year, month, 1).getDay()
    // Convert from Sunday=0 to Monday=0 format
    return day === 0 ? 6 : day - 1
  }

  const isDatePast = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateSelect = (day: number) => {
    if (isDatePast(day)) return // Don't allow selecting past dates
    const date = new Date(selectedYear, selectedMonth, day)
    setSelectedDate(date)
  }

  const formatEventTitle = () => {
    if (!selectedDate || !eventName) return 'Vista previa del título'
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()]
    const day = selectedDate.getDate()
    const month = MONTHS[selectedDate.getMonth()]
    const time = `${selectedHour}:${selectedMinute}`
    return `${eventName} ${dayName} ${day} ${month} ${time}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !eventName) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Deactivate all other events
      await supabase
        .from('events')
        .update({ is_active: false })
        .eq('is_active', true)

      // Create new event
      const { error: insertError } = await supabase.from('events').insert({
        title: formatEventTitle(),
        event_date: selectedDate.toISOString().split('T')[0],
        event_time: `${selectedHour}:${selectedMinute}`,
        is_open: true,
        is_active: true,
        created_by: user?.id,
      })

      if (insertError) throw insertError

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear evento')
      setLoading(false)
    }
  }

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
  const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">➕ Crear Nuevo Evento</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="bg-white rounded-xl shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del evento
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Lista OP"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-900"
              required
            />
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Fecha del evento
            </label>
            
            {/* Month/Year Selector */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11)
                    setSelectedYear(selectedYear - 1)
                  } else {
                    setSelectedMonth(selectedMonth - 1)
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 font-bold text-xl border border-gray-300"
              >
                ◀
              </button>
              <span className="font-semibold text-gray-800 text-lg">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0)
                    setSelectedYear(selectedYear + 1)
                  } else {
                    setSelectedMonth(selectedMonth + 1)
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 font-bold text-xl border border-gray-300"
              >
                ▶
              </button>
            </div>

            {/* Days of week header - starts with Monday */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK_SHORT.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="p-3" />
              ))}
              {days.map((day) => {
                const isSelected = selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === selectedMonth &&
                  selectedDate?.getFullYear() === selectedYear
                const isPast = isDatePast(day)
                
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={isPast}
                    className={`p-3 rounded-lg text-center transition ${
                      isSelected
                        ? 'bg-green-500 text-white font-bold'
                        : isPast
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Selector */}
          <div className="bg-white rounded-xl shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Hora del evento
            </label>
            <div className="flex items-center gap-4">
              {/* Hour Selector */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hora</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full px-4 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-900 bg-white text-lg"
                >
                  {HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
              
              <span className="text-2xl font-bold text-gray-400 mt-5">:</span>
              
              {/* Minute Selector */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Minutos</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full px-4 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-900 bg-white text-lg"
                >
                  {MINUTES.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-green-50 rounded-xl p-6">
            <p className="text-sm text-green-600 mb-2">Vista previa del evento:</p>
            <p className="text-lg font-bold text-green-800">{formatEventTitle()}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedDate || !eventName}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando evento...' : 'Crear Evento'}
          </button>
        </form>
      </main>
    </div>
  )
}
