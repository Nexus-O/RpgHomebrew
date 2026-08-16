create or replace function public.session_stage_roster(target_session_id uuid)
returns table (
  user_id uuid,
  stream_id text,
  nome text,
  foto_url text,
  avatar text
)
language plpgsql
security definer
set search_path = public
as $$
declare target_campaign_id uuid;
begin
  select campaign_id into target_campaign_id from public.campaign_sessions where id = target_session_id;
  if target_campaign_id is null or not public.is_campaign_member(target_campaign_id) then
    raise exception 'Acesso a sessao nao autorizado';
  end if;

  return query
  select participant.user_id, participant.stream_id, character.nome, character.foto_url, character.avatar
  from public.campaign_session_participants participant
  left join public.characters character on character.id = participant.character_id
  where participant.session_id = target_session_id
    and participant.left_at is null
  order by participant.joined_at asc;
end;
$$;

grant execute on function public.session_stage_roster(uuid) to authenticated;
