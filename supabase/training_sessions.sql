-- Add training_sessions table for streak tracking
create table public.training_sessions (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references public.dogs(id) on delete cascade not null,
  trained_at date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(dog_id, trained_at)
);

-- Enable RLS
alter table public.training_sessions enable row level security;

-- Policies for training_sessions
create policy "Users can view their own dog's training sessions." on public.training_sessions
  for select using (
    exists (
      select 1 from public.dogs
      where dogs.id = training_sessions.dog_id
      and dogs.owner_id = auth.uid()
    )
  );

create policy "Users can insert training sessions for their own dogs." on public.training_sessions
  for insert with check (
    exists (
      select 1 from public.dogs
      where dogs.id = training_sessions.dog_id
      and dogs.owner_id = auth.uid()
    )
  );

-- Function to automatically create training session when progress is marked
create or replace function public.create_training_session()
returns trigger as $$
begin
  insert into public.training_sessions (dog_id, trained_at)
  values (new.dog_id, current_date)
  on conflict (dog_id, trained_at) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create session when lesson is completed
create trigger on_lesson_completed
  after insert or update on public.progress
  for each row
  when (new.status = 'Completed')
  execute function public.create_training_session();
