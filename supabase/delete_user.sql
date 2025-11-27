-- Create a function that allows users to delete their own account
create or replace function delete_user()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users
  where id = auth.uid();
end;
$$;
