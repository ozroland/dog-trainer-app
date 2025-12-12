-- Dog Photos table for gallery feature
-- Run this after schema.sql

create table if not exists photos (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  url text not null,
  caption text,
  milestone text, -- Optional: 'first_sit', 'first_walk', 'training', etc.
  taken_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table photos enable row level security;

-- Policies
create policy "Users can view photos of their dogs"
  on photos for select
  using ( exists (select 1 from dogs where dogs.id = photos.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can insert photos for their dogs"
  on photos for insert
  with check ( exists (select 1 from dogs where dogs.id = photos.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can update photos of their dogs"
  on photos for update
  using ( exists (select 1 from dogs where dogs.id = photos.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can delete photos of their dogs"
  on photos for delete
  using ( exists (select 1 from dogs where dogs.id = photos.dog_id and dogs.owner_id = auth.uid()) );
