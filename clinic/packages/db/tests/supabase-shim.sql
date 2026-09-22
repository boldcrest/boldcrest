-- tests/supabase-shim.sql
-- Stand-in for the parts of a real Supabase project that our migrations
-- assume already exist. Runs FIRST in the test harness, never in production.
--
-- Two things are missing from a bare Postgres: the three Supabase roles that
-- our GRANTs name, and the `auth` schema with auth.jwt() / auth.uid().
--
-- Supabase builds auth.jwt() out of the `request.jwt.claims` GUC, which
-- PostgREST sets per request from the verified token. Tests set the same GUC
-- directly (see harness.ts), so a policy under test reads its claims exactly
-- the way it will in production — no token is ever parsed or verified here.

-- ---------------------------------------------------------------------------
-- Roles. `nologin` because nothing connects as them; the harness reaches them
-- with SET LOCAL ROLE inside a transaction.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Claim readers. Identical in shape to Supabase's own. `true` as the second
-- argument to current_setting means "return null if unset" rather than error,
-- which is what an unauthenticated request looks like.
-- ---------------------------------------------------------------------------

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), ''),
    'null'
  )::jsonb
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'role'
$$;

-- Minimal auth.users. Real Supabase has many more columns; migrations only
-- ever reference the id, and only as a foreign key target.
create table if not exists auth.users (
  id uuid primary key,
  email text unique,
  created_at timestamptz not null default now()
);
