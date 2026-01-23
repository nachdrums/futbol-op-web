export type UserRole = 'admin' | 'organizer' | 'player'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface GameEvent {
  id: string
  title: string
  event_date: string
  event_time: string
  is_open: boolean
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  event_id: string
  user_id: string | null
  name: string
  has_paid: boolean
  is_bench: boolean
  position: number
  registered_at: string
}

export interface EventWithPlayers extends GameEvent {
  main_players: Player[]
  bench_players: Player[]
  creator?: Profile
}
