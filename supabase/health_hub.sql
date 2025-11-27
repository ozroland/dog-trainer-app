-- Create weight_logs table
create table if not exists weight_logs (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  weight numeric not null,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create health_records table
create type health_record_type as enum ('vaccination', 'vet_visit', 'medication');

create table if not exists health_records (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  type text not null check (type in ('vaccination', 'vet_visit', 'medication')),
  title text not null,
  date date default current_date not null,
  notes text,
  next_due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table weight_logs enable row level security;
alter table health_records enable row level security;

-- Policies for weight_logs
create policy "Users can view weight logs for their dogs"
  on weight_logs for select
  using ( exists (select 1 from dogs where dogs.id = weight_logs.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can insert weight logs for their dogs"
  on weight_logs for insert
  with check ( exists (select 1 from dogs where dogs.id = weight_logs.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can delete weight logs for their dogs"
  on weight_logs for delete
  using ( exists (select 1 from dogs where dogs.id = weight_logs.dog_id and dogs.owner_id = auth.uid()) );

-- Policies for health_records
create policy "Users can view health records for their dogs"
  on health_records for select
  using ( exists (select 1 from dogs where dogs.id = health_records.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can insert health records for their dogs"
  on health_records for insert
  with check ( exists (select 1 from dogs where dogs.id = health_records.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can update health records for their dogs"
  on health_records for update
  using ( exists (select 1 from dogs where dogs.id = health_records.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can delete health records for their dogs"
  on health_records for delete
  using ( exists (select 1 from dogs where dogs.id = health_records.dog_id and dogs.owner_id = auth.uid()) );
