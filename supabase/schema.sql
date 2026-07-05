create table if not exists family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role text not null check (role in ('admin', 'member')),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null check (category in ('beach', 'restaurant', 'activity', 'viewpoint', 'town', 'excursion', 'local_tip')),
  short_description text not null,
  long_description text not null,
  area text not null,
  address text,
  latitude numeric,
  longitude numeric,
  drive_time_from_base_minutes int,
  walk_time_from_base_minutes int,
  price_level text not null check (price_level in ('free', 'budget', 'medium', 'expensive', 'luxury')),
  estimated_cost_text text,
  booking_required boolean not null default false,
  booking_url text,
  official_url text,
  image_url text,
  best_for text[] not null default '{}',
  avoid_if text[] not null default '{}',
  tags text[] not null default '{}',
  local_tip text,
  family_notes text,
  weather_notes text,
  parking_notes text,
  food_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote text not null check (vote in ('must_do', 'interested', 'not_for_me')),
  ranking int check (ranking between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create table if not exists itinerary_days (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  date date not null,
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  itinerary_day_id uuid not null references itinerary_days(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  start_time time,
  end_time time,
  order_index int not null,
  notes text
);

create table if not exists place_sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  source_title text not null,
  source_url text not null,
  source_type text not null check (source_type in ('official', 'travel_blog', 'review_site', 'local_forum', 'user_doc')),
  note text
);

alter table family_groups enable row level security;
alter table profiles enable row level security;
alter table places enable row level security;
alter table votes enable row level security;
alter table itinerary_days enable row level security;
alter table itinerary_items enable row level security;
alter table place_sources enable row level security;

create policy "family members can read places"
on places for select
using (true);

create policy "family members can read profiles in group"
on profiles for select
using (
  exists (
    select 1
    from profiles me
    where me.id = auth.uid()
      and me.family_group_id = profiles.family_group_id
  )
);

create policy "family members can read group votes"
on votes for select
using (
  exists (
    select 1
    from profiles me
    join profiles vote_owner on vote_owner.id = votes.user_id
    where me.id = auth.uid()
      and me.family_group_id = vote_owner.family_group_id
  )
);

create policy "users can manage own votes"
on votes for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
