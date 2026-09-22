-- 20260921000100_app_schema_and_helpers.sql
-- Pattern 1 (tenancy): the `app` schema, JWT claim readers, and the single
-- source of truth for role -> permission mapping.
--
-- This migration must run unchanged on a real Supabase Postgres project.
-- It assumes Supabase's own `auth` schema and `auth.jwt()` / `auth.uid()`
-- functions already exist there. In tests, tests/supabase-shim.sql provides
-- a stand-in for those before this file runs.

create schema if not exists app;

-- app is not exposed over PostgREST by default (only `public` is, unless a
-- project adds `app` to db.schemas). Nothing in here needs to be reachable
-- directly by clients; policies and triggers call these functions server-side.
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- JWT claim readers. Claims come from the JWT only, never from
-- auth.users.raw_user_meta_data (a user-editable, known privilege-escalation
-- vector). Each is STABLE so Postgres can cache the result within a
-- statement, and callers wrap them as (select app.clinic_id()) so they are
-- evaluated once per statement rather than once per row.
-- ---------------------------------------------------------------------------

create function app.clinic_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'clinic_id', '')::uuid
$$;

create function app.role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.jwt() ->> 'role'
$$;

create function app.aal()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.jwt() ->> 'aal'
$$;

comment on function app.clinic_id() is 'Active clinic for this session, from the clinic_id JWT claim written by the Custom Access Token hook (step 1.5). Null if the token carries none.';
comment on function app.role() is 'Membership role for this session, from the role JWT claim.';
comment on function app.aal() is 'Authenticator assurance level (aal1/aal2) from the JWT, used to gate clinical tables on MFA.';

-- ---------------------------------------------------------------------------
-- Role -> permission map. ONE function, single source of truth, called by
-- every RLS policy that needs a role check and reusable by application code
-- (e.g. to build the same map for the UI) via an RPC if ever needed.
--
-- Roles: owner, practitioner, assistant, reception, accountant.
-- Permission keys: patients.read, patients.write, clinical.read,
-- clinical.write, schedule.read, schedule.write, messaging.send,
-- recall.manage, settings.manage, staff.manage, audit.read.
--
-- Deliberate layering (see security-plan.md #1 and build plan 5.3):
--   - reception reads/writes demographics and schedule, never clinical.
--   - assistant can read clinical context chairside but not write it.
--   - accountant has no patient/clinical access at all in this scope,
--     schedule.read only (billing will add more once money tables exist).
--   - staff.manage and audit.read are owner-only: memberships and the audit
--     trail are the two most sensitive surfaces in the schema.
-- ---------------------------------------------------------------------------

create function app.role_permissions(p_role text)
returns text[]
language sql
immutable
security invoker
set search_path = ''
as $$
  select case p_role
    when 'owner' then array[
      'patients.read', 'patients.write',
      'clinical.read', 'clinical.write',
      'schedule.read', 'schedule.write',
      'messaging.send', 'recall.manage',
      'settings.manage', 'staff.manage', 'audit.read'
    ]
    when 'practitioner' then array[
      'patients.read', 'patients.write',
      'clinical.read', 'clinical.write',
      'schedule.read', 'schedule.write',
      'messaging.send', 'recall.manage'
    ]
    when 'assistant' then array[
      'patients.read', 'patients.write',
      'clinical.read',
      'schedule.read', 'schedule.write',
      'messaging.send', 'recall.manage'
    ]
    when 'reception' then array[
      'patients.read', 'patients.write',
      'schedule.read', 'schedule.write',
      'messaging.send', 'recall.manage'
    ]
    when 'accountant' then array[
      'schedule.read'
    ]
    else array[]::text[]
  end
$$;

comment on function app.role_permissions(text) is 'Single source of truth for the role -> permission map. RLS policies and app code both read this.';

create function app.has_perm(p_perm text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(app.role(), '') != ''
     and p_perm = any (app.role_permissions(app.role()))
$$;

comment on function app.has_perm(text) is 'True if the current session role holds the given permission key.';

-- ---------------------------------------------------------------------------
-- updated_at trigger, reused by every table below.
-- ---------------------------------------------------------------------------

create function app.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function app.set_updated_at() is 'BEFORE UPDATE trigger: stamps updated_at on every write.';
