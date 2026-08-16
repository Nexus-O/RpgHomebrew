insert into storage.buckets (id, name, public)
values ('campaign-logos', 'campaign-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "campaign logos: authenticated uploads own folder" on storage.objects;
drop policy if exists "campaign logos: owners read own folder" on storage.objects;
drop policy if exists "campaign logos: owners update own folder" on storage.objects;
drop policy if exists "campaign logos: owners delete own folder" on storage.objects;

create policy "campaign logos: authenticated uploads own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'campaign-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "campaign logos: owners read own folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'campaign-logos'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

create policy "campaign logos: owners update own folder"
on storage.objects for update to authenticated
using (
  bucket_id = 'campaign-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'campaign-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "campaign logos: owners delete own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'campaign-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
