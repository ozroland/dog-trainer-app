-- Add delete policy for walks
create policy "Users can delete their own walks"
  on public.walks for delete
  using (auth.uid() = user_id);

-- Add delete policy for walk_events (cascade delete handles this, but just in case)
create policy "Users can delete events for their walks"
  on public.walk_events for delete
  using (
    exists (
      select 1 from public.walks
      where walks.id = walk_events.walk_id
      and walks.user_id = auth.uid()
    )
  );
