create or replace function public.campaign_character_roster(target_campaign_id uuid)
returns table (
  user_id uuid,
  role text,
  character_id uuid,
  character_name text,
  character_avatar text,
  character_photo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    campaign_member.user_id,
    campaign_member.role,
    selected_character.id,
    selected_character.nome,
    selected_character.avatar,
    selected_character.foto_url
  from public.campaign_members campaign_member
  left join lateral (
    select character.id, character.nome, character.avatar, character.foto_url
    from public.characters character
    where character.user_id = campaign_member.user_id
      and character.campaign_id = campaign_member.campaign_id
    order by character.updated_at desc, character.created_at desc
    limit 1
  ) selected_character on true
  where campaign_member.campaign_id = target_campaign_id
    and (
      public.is_campaign_member(target_campaign_id)
      or public.is_campaign_owner(target_campaign_id)
    )
  order by
    case when campaign_member.role = 'master' then 0 else 1 end,
    selected_character.nome nulls last,
    campaign_member.user_id;
$$;

revoke all on function public.campaign_character_roster(uuid) from public;
grant execute on function public.campaign_character_roster(uuid) to authenticated;
