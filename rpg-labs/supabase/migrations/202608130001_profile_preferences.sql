alter table public.profiles
  add column if not exists dashboard_color text;

update public.profiles
set dashboard_color = 'vermelho'
where dashboard_color is null;

alter table public.profiles
  alter column dashboard_color set default 'vermelho',
  alter column dashboard_color set not null;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "profile avatars: upload own" on storage.objects;
drop policy if exists "profile avatars: read own" on storage.objects;
drop policy if exists "profile avatars: update own" on storage.objects;

create policy "profile avatars: upload own" on storage.objects for insert to authenticated
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'));
create policy "profile avatars: read own" on storage.objects for select to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'));
create policy "profile avatars: update own" on storage.objects for update to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'))
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.jwt()->>'sub'));
