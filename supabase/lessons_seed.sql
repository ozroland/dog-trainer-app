-- Create lessons table
create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  duration_minutes integer not null,
  content_markdown text not null,
  video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create progress table
create table public.progress (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references public.dogs(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  status text not null check (status in ('Started', 'Completed')),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(dog_id, lesson_id)
);

-- Enable RLS
alter table public.lessons enable row level security;
alter table public.progress enable row level security;

-- Lessons are viewable by everyone
create policy "Lessons are viewable by everyone." on public.lessons
  for select using (true);

-- Progress policies
create policy "Users can view their own dog's progress." on public.progress
  for select using (
    exists (
      select 1 from public.dogs
      where dogs.id = progress.dog_id
      and dogs.owner_id = auth.uid()
    )
  );

create policy "Users can insert progress for their own dogs." on public.progress
  for insert with check (
    exists (
      select 1 from public.dogs
      where dogs.id = progress.dog_id
      and dogs.owner_id = auth.uid()
    )
  );

create policy "Users can update their own dog's progress." on public.progress
  for update using (
    exists (
      select 1 from public.dogs
      where dogs.id = progress.dog_id
      and dogs.owner_id = auth.uid()
    )
  );

-- Seed lessons
insert into public.lessons (title, description, difficulty, duration_minutes, content_markdown) values
('Sit Command', 'Teach your dog to sit on command - the foundation of all training.', 'Beginner', 5, '## Steps
1. Hold a treat close to your dog''s nose
2. Move your hand up, allowing their head to follow the treat
3. As their bottom touches the ground, say "Sit"
4. Give them the treat and praise
5. Repeat 5-10 times daily'),

('Stay Command', 'Build impulse control by teaching your dog to stay in place.', 'Beginner', 10, '## Steps
1. Ask your dog to sit
2. Open your palm in front of you and say "Stay"
3. Take a few steps back
4. If they stay, return and reward
5. Gradually increase distance and duration'),

('Come When Called', 'Ensure your dog returns to you reliably - a critical safety skill.', 'Intermediate', 15, '## Steps
1. Put your dog on a leash
2. Say their name followed by "Come" in an excited tone
3. Gently pull the leash toward you
4. When they reach you, reward enthusiastically
5. Practice in low-distraction environments first'),

('Loose Leash Walking', 'Enjoy peaceful walks without pulling or tugging.', 'Intermediate', 20, '## Steps
1. Start in a quiet area
2. Hold treats in your hand
3. Walk forward; if the leash tightens, stop immediately
4. Wait for your dog to return to your side
5. Reward and continue walking'),

('Leave It', 'Teach your dog to ignore distractions and potential dangers.', 'Advanced', 15, '## Steps
1. Place a treat in both hands
2. Show one closed fist with treat, say "Leave it"
3. Ignore pawing or sniffing
4. When they pull away, give treat from other hand
5. Practice with increasingly tempting items'),

('Down Command', 'A calming position that helps with impulse control.', 'Beginner', 8, '## Steps
1. Hold a treat in your closed fist
2. Hold your hand to your dog''s snout
3. Move your hand to the floor
4. Slide it along the ground to encourage lying down
5. Say "Down" and reward when they lie down');
