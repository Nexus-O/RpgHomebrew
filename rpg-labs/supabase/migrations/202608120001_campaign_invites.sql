alter table public.campaigns
  add column if not exists logo_url text,
  add column if not exists invite_code text;

create unique index if not exists campaigns_invite_code_unique_idx
  on public.campaigns (invite_code)
  where invite_code is not null;

create or replace function public.join_campaign_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_campaign_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória';
  end if;

  select id into target_campaign_id
  from public.campaigns
  where invite_code = upper(trim(code));

  if target_campaign_id is null then
    raise exception 'Código de campanha inválido';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (target_campaign_id, auth.uid(), 'player')
  on conflict (campaign_id, user_id) do nothing;

  return target_campaign_id;
end;
$$;

grant execute on function public.join_campaign_by_code(text) to authenticated;

insert into storage.buckets (id, name, public)
values ('campaign-logos', 'campaign-logos', true)
on conflict (id) do update set public = true;

create policy "campaign logos: authenticated uploads own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'campaign-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
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
