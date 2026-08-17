alter table public.characters
  add column if not exists vida_atual integer not null default 10,
  add column if not exists vida_base integer not null default 10,
  add column if not exists sanidade_atual integer not null default 10,
  add column if not exists sanidade_base integer not null default 10;

update public.characters
set
  vida_atual = case
    when coalesce(atributos -> 'deprac' ->> 'vitality', '') ~ '^\s*\d+\s*/\s*\d+\s*$'
      then split_part(atributos -> 'deprac' ->> 'vitality', '/', 1)::integer
    else vida_atual
  end,
  vida_base = case
    when coalesce(atributos -> 'deprac' ->> 'vitality', '') ~ '^\s*\d+\s*/\s*\d+\s*$'
      then split_part(atributos -> 'deprac' ->> 'vitality', '/', 2)::integer
    else vida_base
  end,
  sanidade_atual = case
    when coalesce(atributos -> 'deprac' ->> 'stress', '') ~ '^\s*\d+\s*/\s*\d+\s*$'
      then split_part(atributos -> 'deprac' ->> 'stress', '/', 1)::integer
    else sanidade_atual
  end,
  sanidade_base = case
    when coalesce(atributos -> 'deprac' ->> 'stress', '') ~ '^\s*\d+\s*/\s*\d+\s*$'
      then split_part(atributos -> 'deprac' ->> 'stress', '/', 2)::integer
    else sanidade_base
  end;

create or replace function public.session_character_sheet(target_session_id uuid, target_character_id uuid)
returns table (
  id uuid,
  user_id uuid,
  nome text,
  classe text,
  raca text,
  nivel integer,
  descricao text,
  avatar text,
  sistema text,
  atributos jsonb,
  foto_url text,
  vida_atual integer,
  vida_base integer,
  sanidade_atual integer,
  sanidade_base integer,
  caller_is_master boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_campaign_id uuid;
  target_user_id uuid;
  is_master boolean;
begin
  select session.campaign_id
    into target_campaign_id
  from public.campaign_sessions session
  where session.id = target_session_id;

  if target_campaign_id is null or not public.is_campaign_member(target_campaign_id) then
    raise exception 'Acesso a sessao nao autorizado';
  end if;

  select participant.user_id
    into target_user_id
  from public.campaign_session_participants participant
  where participant.session_id = target_session_id
    and participant.character_id = target_character_id
    and participant.left_at is null;

  is_master := public.is_campaign_owner(target_campaign_id);
  if target_user_id is null or (not is_master and target_user_id <> auth.uid()) then
    raise exception 'Acesso a ficha nao autorizado';
  end if;

  return query
  select
    character.id,
    character.user_id,
    character.nome,
    character.classe,
    character.raca,
    character.nivel,
    character.descricao,
    character.avatar,
    character.sistema,
    character.atributos,
    character.foto_url,
    character.vida_atual,
    character.vida_base,
    character.sanidade_atual,
    character.sanidade_base,
    is_master
  from public.characters character
  where character.id = target_character_id;
end;
$$;

create or replace function public.update_session_character_vitals(
  target_session_id uuid,
  target_character_id uuid,
  next_vida_atual integer,
  next_vida_base integer,
  next_sanidade_atual integer,
  next_sanidade_base integer
)
returns table (vida_atual integer, vida_base integer, sanidade_atual integer, sanidade_base integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_campaign_id uuid;
  target_user_id uuid;
  is_master boolean;
  safe_vida_base integer := greatest(0, coalesce(next_vida_base, 0));
  safe_sanidade_base integer := greatest(0, coalesce(next_sanidade_base, 0));
begin
  select session.campaign_id
    into target_campaign_id
  from public.campaign_sessions session
  where session.id = target_session_id;

  select participant.user_id
    into target_user_id
  from public.campaign_session_participants participant
  where participant.session_id = target_session_id
    and participant.character_id = target_character_id
    and participant.left_at is null;

  if target_campaign_id is null or not public.is_campaign_member(target_campaign_id) then
    raise exception 'Alteracao da ficha nao autorizada';
  end if;

  is_master := target_campaign_id is not null and public.is_campaign_owner(target_campaign_id);
  if target_user_id is null or (not is_master and target_user_id <> auth.uid()) then
    raise exception 'Alteracao da ficha nao autorizada';
  end if;

  return query
  update public.characters character
  set
    vida_atual = least(safe_vida_base, greatest(0, coalesce(next_vida_atual, 0))),
    vida_base = safe_vida_base,
    sanidade_atual = least(safe_sanidade_base, greatest(0, coalesce(next_sanidade_atual, 0))),
    sanidade_base = safe_sanidade_base,
    atributos = jsonb_set(
      coalesce(character.atributos, '{}'::jsonb),
      '{_session}',
      jsonb_build_object(
        'vida_atual', least(safe_vida_base, greatest(0, coalesce(next_vida_atual, 0))),
        'vida_base', safe_vida_base,
        'sanidade_atual', least(safe_sanidade_base, greatest(0, coalesce(next_sanidade_atual, 0))),
        'sanidade_base', safe_sanidade_base
      ),
      true
    )
  where character.id = target_character_id
  returning character.vida_atual, character.vida_base, character.sanidade_atual, character.sanidade_base;
end;
$$;

create or replace function public.session_roster(target_session_id uuid)
returns table (user_id uuid, character_id uuid, nome text, foto_url text, avatar text, vida text, sanidade text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_campaign_id uuid;
  caller_is_master boolean;
begin
  select campaign_id into target_campaign_id from public.campaign_sessions where id = target_session_id;
  if target_campaign_id is null or not public.is_campaign_member(target_campaign_id) then
    raise exception 'Acesso a sessao nao autorizado';
  end if;
  caller_is_master := public.is_campaign_owner(target_campaign_id);
  return query
  select
    participant.user_id,
    character.id,
    character.nome,
    character.foto_url,
    character.avatar,
    concat(character.vida_atual, '/', character.vida_base),
    concat(character.sanidade_atual, '/', character.sanidade_base)
  from public.campaign_session_participants participant
  left join public.characters character on character.id = participant.character_id
  where participant.session_id = target_session_id
    and participant.left_at is null
    and (caller_is_master or participant.user_id = auth.uid());
end;
$$;

grant execute on function public.session_character_sheet(uuid, uuid) to authenticated;
grant execute on function public.update_session_character_vitals(uuid, uuid, integer, integer, integer, integer) to authenticated;
grant execute on function public.session_roster(uuid) to authenticated;
