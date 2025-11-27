-- Enable delete for users based on owner_id
create policy "Users can delete their own dogs"
on dogs for delete
using ( auth.uid() = owner_id );
