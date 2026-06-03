-- Viðbót: stuðningur við þrjár tegundir tippleikja
-- Keyrðu þetta í Supabase SQL Editor

-- Bæta deildargerð á leagues
alter table leagues add column if not exists scoring_mode text not null default 'standard';
-- 'standard' = 1X2, 'exact' = markatala, 'odds' = bookie stuðlamargfaldari

-- Leyfa annað en bara '1'/'X'/'2' (t.d. "2-1" fyrir markatölu)
alter table predictions drop constraint if exists predictions_prediction_check;
alter table results drop constraint if exists results_result_check;

-- Stuðlar fyrir bookie-mode
create table if not exists match_odds (
  match_id text primary key,
  odds_1 numeric,
  odds_x numeric,
  odds_2 numeric,
  locked boolean default false,
  commence_time timestamptz,
  updated_at timestamptz default now()
);
alter table match_odds disable row level security;
