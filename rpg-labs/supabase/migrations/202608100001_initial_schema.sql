create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  system text not null default 'purgatum',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('master', 'player')),
  created_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  nome text not null check (char_length(nome) between 1 and 120),
  classe text not null default '',
  raca text not null default '',
  nivel integer not null default 1 check (nivel between 1 and 99),
  descricao text not null default '',
  avatar text not null default 'avatarMago',
  sistema text not null default 'purgatum',
  atributos jsonb not null default '{}'::jsonb,
  foto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bestiary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  system text not null default 'purgatum',
  description text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists characters_user_id_created_at_idx on public.characters (user_id, created_at desc);
create index if not exists campaign_members_user_id_idx on public.campaign_members (user_id, campaign_id);
create index if not exists activities_user_id_created_at_idx on public.activities (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.is_campaign_member(target_campaign_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.campaign_members where campaign_id = target_campaign_id and user_id = auth.uid());
$$;

create or replace function public.is_campaign_owner(target_campaign_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.campaigns where id = target_campaign_id and owner_id = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;
alter table public.items enable row level security;
alter table public.bestiary_entries enable row level security;
alter table public.activities enable row level security;

create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "campaigns: members read" on public.campaigns for select using (owner_id = auth.uid() or public.is_campaign_member(id));
create policy "campaigns: owner creates" on public.campaigns for insert with check (owner_id = auth.uid());
create policy "campaigns: owner updates" on public.campaigns for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "campaigns: owner deletes" on public.campaigns for delete using (owner_id = auth.uid());
create policy "campaign members: participants read" on public.campaign_members for select using (user_id = auth.uid() or public.is_campaign_owner(campaign_id));
create policy "campaign members: owner manages" on public.campaign_members for insert with check (public.is_campaign_owner(campaign_id));
create policy "campaign members: owner updates" on public.campaign_members for update using (public.is_campaign_owner(campaign_id)) with check (public.is_campaign_owner(campaign_id));
create policy "campaign members: owner or self deletes" on public.campaign_members for delete using (public.is_campaign_owner(campaign_id) or user_id = auth.uid());
create policy "characters: owner manages" on public.characters for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "items: owner manages" on public.items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bestiary: owner manages" on public.bestiary_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "activities: owner manages" on public.activities for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('character-portraits', 'character-portraits', true)
on conflict (id) do update set public = true;
create policy "portraits: authenticated uploads own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'character-portraits' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portraits: owners update own folder" on storage.objects for update to authenticated
using (bucket_id = 'character-portraits' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'character-portraits' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portraits: owners delete own folder" on storage.objects for delete to authenticated
using (bucket_id = 'character-portraits' and (storage.foldername(name))[1] = auth.uid()::text);

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger campaigns_set_updated_at before update on public.campaigns for each row execute procedure public.set_updated_at();
create trigger characters_set_updated_at before update on public.characters for each row execute procedure public.set_updated_at();
create trigger items_set_updated_at before update on public.items for each row execute procedure public.set_updated_at();
create trigger bestiary_entries_set_updated_at before update on public.bestiary_entries for each row execute procedure public.set_updated_at();
