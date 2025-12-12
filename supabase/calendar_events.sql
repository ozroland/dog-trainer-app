-- Create calendar_events table
create table public.calendar_events (
    id uuid default gen_random_uuid() primary key,
    dog_id uuid references public.dogs(id) on delete cascade not null,
    title text not null,
    date date not null,
    time time without time zone,
    type text not null check (type in ('training', 'grooming', 'vet_visit', 'other')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.calendar_events enable row level security;

-- Create policies
create policy "Users can view their dogs' events"
    on public.calendar_events for select
    using (auth.uid() in (
        select owner_id from public.dogs where id = calendar_events.dog_id
    ));

create policy "Users can insert events for their dogs"
    on public.calendar_events for insert
    with check (auth.uid() in (
        select owner_id from public.dogs where id = calendar_events.dog_id
    ));

create policy "Users can update their dogs' events"
    on public.calendar_events for update
    using (auth.uid() in (
        select owner_id from public.dogs where id = calendar_events.dog_id
    ));

create policy "Users can delete their dogs' events"
    on public.calendar_events for delete
    using (auth.uid() in (
        select owner_id from public.dogs where id = calendar_events.dog_id
    ));
