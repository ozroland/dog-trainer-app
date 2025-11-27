-- Create walks table
create table public.walks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  dog_id uuid references public.dogs not null,
  start_time timestamptz default now() not null,
  end_time timestamptz,
  duration_seconds int default 0,
  distance_meters float default 0,
  route_coordinates jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- Create walk_events table
create table public.walk_events (
  id uuid default gen_random_uuid() primary key,
  walk_id uuid references public.walks on delete cascade not null,
  event_type text not null, -- 'poop', 'pee', 'reaction', 'sniff', 'water'
  latitude float not null,
  longitude float not null,
  timestamp timestamptz default now() not null
);

-- Enable RLS
alter table public.walks enable row level security;
alter table public.walk_events enable row level security;

-- Policies for walks
create policy "Users can view their own walks"
  on public.walks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own walks"
  on public.walks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own walks"
  on public.walks for update
  using (auth.uid() = user_id);

-- Policies for walk_events
create policy "Users can view events for their walks"
  on public.walk_events for select
  using (
    exists (
      select 1 from public.walks
      where walks.id = walk_events.walk_id
      and walks.user_id = auth.uid()
    )
  );

create policy "Users can insert events for their walks"
  on public.walk_events for insert
  with check (
    exists (
      select 1 from public.walks
      where walks.id = walk_events.walk_id
      and walks.user_id = auth.uid()
    )
  );
