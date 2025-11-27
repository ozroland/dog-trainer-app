-- Drop the old function signature to avoid ambiguity/overloading issues
drop function if exists complete_lesson(uuid, text);

-- Function to complete a lesson and check for achievements
create or replace function complete_lesson(
  p_dog_id uuid,
  p_lesson_id uuid
)
returns setof achievements
language plpgsql
security definer
as $$
declare
  v_lesson_count integer;
  v_new_achievement achievements%rowtype;
  v_progress_exists boolean;
begin
  -- 1. Insert or Update Progress
  select exists(select 1 from progress where dog_id = p_dog_id and lesson_id = p_lesson_id) into v_progress_exists;
  
  if v_progress_exists then
    update progress 
    set status = 'Completed', completed_at = now()
    where dog_id = p_dog_id and lesson_id = p_lesson_id;
  else
    insert into progress (dog_id, lesson_id, status, completed_at)
    values (p_dog_id, p_lesson_id, 'Completed', now());
  end if;

  -- 2. Count total completed lessons for this dog
  select count(*) into v_lesson_count
  from progress
  where dog_id = p_dog_id and status = 'Completed';

  -- 3. Check for 'lesson_count' achievements
  for v_new_achievement in
    select * from achievements
    where condition_type = 'lesson_count'
    and condition_value <= v_lesson_count
    and id not in (select achievement_id from dog_achievements where dog_id = p_dog_id)
  loop
    -- Insert into dog_achievements
    insert into dog_achievements (dog_id, achievement_id)
    values (p_dog_id, v_new_achievement.id);

    -- Return the achievement so the UI can show it
    return next v_new_achievement;
  end loop;

  -- 4. Check for 'specific_lesson' achievements
  -- Commented out for now as condition_value (int) cannot match p_lesson_id (uuid) directly.
  -- Future implementation needed if specific lessons trigger badges.
  /*
  for v_new_achievement in
    select * from achievements
    where condition_type = 'specific_lesson'
    and condition_value::text = p_lesson_id::text
    and id not in (select achievement_id from dog_achievements where dog_id = p_dog_id)
  loop
     insert into dog_achievements (dog_id, achievement_id)
     values (p_dog_id, v_new_achievement.id);
     return next v_new_achievement;
  end loop;
  */

  return;
end;
$$;
