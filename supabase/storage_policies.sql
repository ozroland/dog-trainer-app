-- Create a new storage bucket for dog photos
-- Note: This requires the storage schema which is standard in Supabase
insert into storage.buckets (id, name, public)
values ('dog_photos', 'dog_photos', true)
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload images to the 'dog_photos' bucket
-- We assume the folder structure might be used, but for now just checking bucket_id
create policy "Authenticated users can upload dog photos"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'dog_photos' );

-- Policy to allow anyone to view dog photos (since the bucket is public)
create policy "Anyone can view dog photos"
on storage.objects for select
to public
using ( bucket_id = 'dog_photos' );

-- Policy to allow users to update their own dog photos
create policy "Users can update their own dog photos"
on storage.objects for update
to authenticated
using ( bucket_id = 'dog_photos' AND auth.uid() = owner );

-- Policy to allow users to delete their own dog photos
create policy "Users can delete their own dog photos"
on storage.objects for delete
to authenticated
using ( bucket_id = 'dog_photos' AND auth.uid() = owner );
