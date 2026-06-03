-- HM 2026 Tippleikur - Auth + RLS uppfærsla
-- ATHUGA: Þetta eyðir öllum núverandi gögnum og endurbyggir með magic-link auth
-- Keyra í Supabase SQL Editor

-- 1. Hreinsa gamalt
drop table if exists predictions cascade;
drop table if exists results cascade;
drop table if exists knockout_teams cascade;
drop table if exists match_odds cascade;
drop table if exists members cascade;
drop table if exists leagues cascade;

-- 2. Endurbyggja með auth
create table leagues (
  code text primary key,
  name text not null,
  admin_pin text not null,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  scoring_mode text not null default 'standard',
  created_at timestamptz default now()
);

create table members (
  user_id uuid not null references auth.users(id) on delete cascade,
  league_code text not null references leagues(code) on delete cascade,
  name text not null,
  joined_at timestamptz default now(),
  primary key (user_id, league_code)
);

create table predictions (
  user_id uuid not null references auth.users(id) on delete cascade,
  league_code text not null references leagues(code) on delete cascade,
  match_id text not null,
  prediction text not null,
  updated_at timestamptz default now(),
  primary key (user_id, league_code, match_id)
);

create table results (
  match_id text primary key,
  result text not null,
  updated_at timestamptz default now()
);

create table knockout_teams (
  match_id text primary key,
  home text not null default 'TBD',
  away text not null default 'TBD'
);

create table match_odds (
  match_id text primary key,
  odds_1 numeric,
  odds_x numeric,
  odds_2 numeric,
  locked boolean default false,
  commence_time timestamptz,
  updated_at timestamptz default now()
);

-- 3. Hjálparfall: er notandinn admin í deild?
create or replace function is_league_admin(code text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from leagues where leagues.code = code and admin_user_id = auth.uid()
  );
$$;

-- 4. RLS á allar töflur
alter table leagues enable row level security;
alter table members enable row level security;
alter table predictions enable row level security;
alter table results enable row level security;
alter table knockout_teams enable row level security;
alter table match_odds enable row level security;

-- 5. Reglur
-- leagues: allir auth notendur lesa, hver sem er skráir sig sem admin (verður þá admin), aðeins admin breytir
create policy "leagues_select" on leagues for select to authenticated using (true);
create policy "leagues_insert" on leagues for insert to authenticated with check (auth.uid() = admin_user_id);
create policy "leagues_update" on leagues for update to authenticated using (auth.uid() = admin_user_id);
create policy "leagues_delete" on leagues for delete to authenticated using (auth.uid() = admin_user_id);

-- members: meðlimir í sömu deild sjá hver annan, hver skráir sig sjálfur, admin getur eytt
create policy "members_select" on members for select to authenticated using (
  league_code in (select league_code from members where user_id = auth.uid())
  or is_league_admin(league_code)
);
create policy "members_insert" on members for insert to authenticated with check (auth.uid() = user_id);
create policy "members_delete" on members for delete to authenticated using (
  auth.uid() = user_id or is_league_admin(league_code)
);

-- predictions: meðlimir í sömu deild sjá spár, hver skrifar bara sínar
create policy "predictions_select" on predictions for select to authenticated using (
  league_code in (select league_code from members where user_id = auth.uid())
  or is_league_admin(league_code)
);
create policy "predictions_write" on predictions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- results: allir lesa, aðeins league admins skrifa (notum service role fyrir cron)
create policy "results_select" on results for select using (true);
create policy "results_write" on results for all to authenticated using (
  exists (select 1 from leagues where admin_user_id = auth.uid())
);

-- knockout_teams: allir lesa, admins skrifa
create policy "ko_select" on knockout_teams for select using (true);
create policy "ko_write" on knockout_teams for all to authenticated using (
  exists (select 1 from leagues where admin_user_id = auth.uid())
);

-- match_odds: allir lesa (service role fyrir cron)
create policy "odds_select" on match_odds for select using (true);
