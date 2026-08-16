create table if not exists public.campaign_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'live', 'closed')),
  room_key text not null unique check (char_length(room_key) between 12 and 80),
  layout jsonb not null default '{"mode":"grid","featured_user_id":null}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.campaign_session_participants (
  session_id uuid not null references public.campaign_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  stream_id text not null check (char_length(stream_id) between 12 and 80),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (session_id, user_id)
);

create index if not exists campaign_sessions_campaign_created_idx on public.campaign_sessions (campaign_id, created_at desc);

alter table public.campaign_sessions enable row level security;
alter table public.campaign_session_participants enable row level security;

create policy "campaign sessions: members read" on public.campaign_sessions for select using (public.is_campaign_member(campaign_id));
create policy "campaign sessions: master creates" on public.campaign_sessions for insert with check (public.is_campaign_owner(campaign_id) and created_by = auth.uid());
create policy "campaign sessions: master updates" on public.campaign_sessions for update using (public.is_campaign_owner(campaign_id)) with check (public.is_campaign_owner(campaign_id));
create policy "campaign sessions: master deletes" on public.campaign_sessions for delete using (public.is_campaign_owner(campaign_id));

create policy "session participants: own or master read" on public.campaign_session_participants for select using (user_id = auth.uid() or exists (select 1 from public.campaign_sessions session where session.id = session_id and public.is_campaign_owner(session.campaign_id)));
create policy "session participants: member joins self" on public.campaign_session_participants for insert with check (user_id = auth.uid() and exists (select 1 from public.campaign_sessions session where session.id = session_id and public.is_campaign_member(session.campaign_id)));
create policy "session participants: own or master updates" on public.campaign_session_participants for update using (user_id = auth.uid() or exists (select 1 from public.campaign_sessions session where session.id = session_id and public.is_campaign_owner(session.campaign_id))) with check (user_id = auth.uid() or exists (select 1 from public.campaign_sessions session where session.id = session_id and public.is_campaign_owner(session.campaign_id)));

create or replace function public.session_roster(target_session_id uuid)
returns table (user_id uuid, character_id uuid, nome text, foto_url text, avatar text, vida text, sanidade text)
language plpgsql security definer set search_path = public as $$
declare target_campaign_id uuid; caller_is_master boolean;
begin
  select campaign_id into target_campaign_id from public.campaign_sessions where id = target_session_id;
  if target_campaign_id is null or not public.is_campaign_member(target_campaign_id) then raise exception 'Acesso a sessao nao autorizado'; end if;
  caller_is_master := public.is_campaign_owner(target_campaign_id);
  return query select participant.user_id, character.id, character.nome, character.foto_url, character.avatar,
    coalesce(character.atributos -> 'deprac' ->> 'vitality', character.atributos ->> 'Vitalidade', '—'),
    coalesce(character.atributos -> 'deprac' ->> 'stress', character.atributos ->> 'Sanidade', character.atributos ->> 'Corrupção', '—')
  from public.campaign_session_participants participant left join public.characters character on character.id = participant.character_id
  where participant.session_id = target_session_id and participant.left_at is null and (caller_is_master or participant.user_id = auth.uid());
end;
$$;

grant execute on function public.session_roster(uuid) to authenticated;
