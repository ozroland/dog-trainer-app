-- Ensure progress table exists
create table if not exists progress (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  lesson_id text not null,
  status text not null, -- 'Started', 'Completed'
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure unique constraint for ON CONFLICT support
-- We use a DO block to check if the constraint exists before adding it to avoid errors
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'progress_dog_id_lesson_id_key'
  ) then
    -- Try to add the constraint. If it fails due to duplicate data, we might need to clean up first.
    -- For now, we assume data is clean or empty enough.
    alter table progress add constraint progress_dog_id_lesson_id_key unique (dog_id, lesson_id);
  end if;
end $$;

-- Enable RLS
alter table progress enable row level security;

-- Policies (Drop existing to avoid errors if re-running)
drop policy if exists "Users can view progress for their dogs" on progress;
drop policy if exists "Users can insert/update progress for their dogs" on progress;

create policy "Users can view progress for their dogs"
  on progress for select
  using ( exists (select 1 from dogs where dogs.id = progress.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can insert/update progress for their dogs"
  on progress for all
  using ( exists (select 1 from dogs where dogs.id = progress.dog_id and dogs.owner_id = auth.uid()) );
