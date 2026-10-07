-- Steg 2 – Studoras riktiga roller: chef, lärare, elev
-- Ersätter admin/student (från steg 1) så att det finns ETT rollsystem.

-- 1) Byt rollvärden utan parallella system
alter table public.profiles alter column role drop default;

alter table public.profiles alter column role type text using (role::text);

update public.profiles
set role = case role
  when 'admin'   then 'chef'
  when 'student' then 'elev'
  else 'elev'
end;

drop type public.app_role;

create type public.app_role as enum ('chef', 'lärare', 'elev');

alter table public.profiles
  alter column role type public.app_role
  using (role::public.app_role);

alter table public.profiles alter column role set default 'elev'::public.app_role;

comment on column public.profiles.role is 'Studoras roller: chef > lärare > elev (chef har alltid lärarbehörighet).';

-- 2) Ta bort policies/funktioner som hänvisar till gamla is_admin()
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop function if exists public.is_admin();

-- 3) Behörighetshierarki: chef ⇒ allt lärare kan; lärare ⇒ elevfunktioner
create or replace function public.is_chef()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'chef'
  );
$$;

create or replace function public.is_larare()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('chef', 'lärare')
  );
$$;

revoke execute on function public.is_chef() from public, anon;
revoke execute on function public.is_larare() from public, anon;
grant execute on function public.is_chef() to authenticated;
grant execute on function public.is_larare() to authenticated;

-- 4) Rolländring: bara chef får ändra roller (ersätter gamla prevent_role_change)
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_chef() then
    raise exception 'Only chef can change roles';
  end if;
  return new;
end;
$$;

-- 5) Chef-policies på profiles (ersätter admin-policies)
create policy "profiles_select_chef"
  on public.profiles for select
  to authenticated
  using (public.is_chef());

create policy "profiles_update_chef"
  on public.profiles for update
  to authenticated
  using (public.is_chef())
  with check (public.is_chef());

-- 6) Service-role-uppdateringar tillåts från backend (steg 2-fix)
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_chef() then
    raise exception 'Only chef can change roles';
  end if;
  return new;
end;
$$;
