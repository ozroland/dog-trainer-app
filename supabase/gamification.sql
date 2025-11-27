-- Create achievements table
create table if not exists achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null, -- Emoji or icon name
  sticker_url text, -- URL for the sticker overlay
  condition_type text not null, -- 'lesson_count', 'streak_days', 'specific_lesson'
  condition_value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create dog_achievements table (tracking unlocks)
create table if not exists dog_achievements (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  achievement_id text references achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(dog_id, achievement_id)
);

-- Enable RLS
alter table achievements enable row level security;
alter table dog_achievements enable row level security;

-- Policies for achievements (Public read, admin write - assuming admin for now)
create policy "Achievements are viewable by everyone"
  on achievements for select
  using ( true );

-- Policies for dog_achievements
create policy "Users can view achievements for their dogs"
  on dog_achievements for select
  using ( exists (select 1 from dogs where dogs.id = dog_achievements.dog_id and dogs.owner_id = auth.uid()) );

create policy "Users can insert achievements for their dogs"
  on dog_achievements for insert
  with check ( exists (select 1 from dogs where dogs.id = dog_achievements.dog_id and dogs.owner_id = auth.uid()) );

-- Seed initial achievements
insert into achievements (id, title, description, icon, condition_type, condition_value) values
('first_step', 'First Step', 'Complete your first lesson', 'paw', 'lesson_count', 1),
('dedicated_student', 'Dedicated Student', 'Complete 5 lessons', 'book', 'lesson_count', 5),
('streak_master', 'Streak Master', 'Maintain a 3-day streak', 'flame', 'streak_days', 3),
('puppy_grad', 'Puppy Graduate', 'Complete the Basic Commands course', 'school', 'specific_lesson', 100) -- Placeholder ID
on conflict (id) do nothing;
