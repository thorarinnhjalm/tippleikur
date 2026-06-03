-- HM 2026 Tippleikur - Supabase uppsetning
-- Keyrðu þetta í SQL Editor í Supabase verkefninu þínu

create table if not exists leagues (
  code text primary key,
  name text not null,
  admin_pin text not null,
  created_at timestamptz default now()
);

create table if not exists members (
  id text primary key,
  league_code text not null references leagues(code) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists predictions (
  user_id text not null,
  match_id text not null,
  prediction text not null check (prediction in ('1','X','2')),
  updated_at timestamptz default now(),
  primary key (user_id, match_id)
);

create table if not exists results (
  match_id text primary key,
  result text not null check (result in ('1','X','2')),
  updated_at timestamptz default now()
);

create table if not exists knockout_teams (
  match_id text primary key,
  home text not null default 'TBD',
  away text not null default 'TBD'
);

-- Slökktu á RLS (appið notar eigið PIN-kerfi)
alter table leagues disable row level security;
alter table members disable row level security;
alter table predictions disable row level security;
alter table results disable row level security;
alter table knockout_teams disable row level security;
