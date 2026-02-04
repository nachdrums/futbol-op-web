-- Futbol OP - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null default 'player' check (role in ('admin', 'organizer', 'player')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create events table
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  event_date date not null,
  event_time text not null,
  is_open boolean default true,
  is_active boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create players table
create table public.players (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  has_paid boolean default false,
  is_bench boolean default false,
  position integer not null,
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  invited_by uuid references public.profiles(id) on delete set null
);

-- Create indexes
create index idx_events_is_active on public.events(is_active);
create index idx_events_event_date on public.events(event_date);
create index idx_players_event_id on public.players(event_id);
create index idx_players_user_id on public.players(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.players enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Allow admins to update any profile
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to delete any profile (except their own)
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    and id != auth.uid()
  );

-- Events policies
create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create policy "Organizers can create events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer')
    )
  );

create policy "Organizers can update events"
  on public.events for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer')
    )
  );

-- Players policies
create policy "Players are viewable by everyone"
  on public.players for select
  using (true);

create policy "Authenticated users can add players"
  on public.players for insert
  with check (auth.uid() is not null);

create policy "Organizers can update players"
  on public.players for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer')
    )
  );

create policy "Organizers can delete players"
  on public.players for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer')
    )
  );

-- Users can delete players they invited
create policy "Users can delete their own guests"
  on public.players for delete
  using (invited_by = auth.uid());

-- Create match_pairings table to store historical team matchups
create table public.match_pairings (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  player1_name text not null,
  player2_name text not null,
  team text not null check (team in ('A', 'B')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create match_teams table to store generated teams for events
create table public.match_teams (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null unique,
  team_a text[] not null,
  team_b text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index idx_match_pairings_players on public.match_pairings(player1_name, player2_name);
create index idx_match_teams_event on public.match_teams(event_id);

-- Enable RLS
alter table public.match_pairings enable row level security;
alter table public.match_teams enable row level security;

-- Policies for match_pairings
create policy "Match pairings are viewable by everyone"
  on public.match_pairings for select
  using (true);

create policy "Organizers can manage match pairings"
  on public.match_pairings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer')
    )
  );

-- Policies for match_teams
create policy "Match teams are viewable by everyone"
  on public.match_teams for select
  using (true);

create policy "Organizers can manage match teams"
  on public.match_teams for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer')
    )
  );

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    'player'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_events_updated_at
  before update on public.events
  for each row execute procedure public.update_updated_at_column();

-- Create first admin user (update email after running)
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES ('your-user-uuid', 'your-email@example.com', 'Admin User', 'admin');
