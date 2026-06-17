-- Humble Halal — Halal Certificate Vault.
-- Verified+ owners upload halal certificate files; admins approve/reject; the
-- existing halal score (lib/halal-score.ts, written by /api/admin/verify) reflects
-- approved / expiring / expired certs. Files live in a PRIVATE storage bucket and are
-- NEVER public — reached only via short-TTL signed URLs minted server-side with the
-- service role. Builds on 0001_init, 0002_directory, 0004_automation, 0017_rls_hardening.

create table if not exists halal_certs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  issuer text,                          -- e.g. "MUIS"
  scheme text,                          -- e.g. "Eating Establishment"
  cert_no text,
  issued_on date,
  expires_on date,
  file_path text,                       -- path within the private 'certs' bucket (NEVER a public URL)
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired')),
  review_note text,                     -- admin reason on reject / note
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists halal_certs_business_idx on halal_certs(business_id);
create index if not exists halal_certs_status_idx on halal_certs(status);
create index if not exists halal_certs_expiry_idx on halal_certs(expires_on) where status = 'approved';

alter table halal_certs enable row level security;

-- Owner reads own business's certs; admins read all. Writes go through server routes
-- with the service role (which bypasses RLS) — matching the 0017 convention of no
-- public insert/update/delete policies. The public NEVER reads this table: approved
-- status + expiry surface via the businesses row, never the cert file.
create policy "halal_certs owner read" on halal_certs for select using (
  exists (
    select 1 from businesses b
    where b.id = halal_certs.business_id and b.owner_id = auth.uid()
  )
);
create policy "halal_certs admin read" on halal_certs for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── Private storage bucket for certificate files ────────────────────────────
-- public = false → no anonymous/authenticated direct access. With RLS on
-- storage.objects (Supabase default) and NO select/insert policies for this bucket,
-- only the service role can read/write — exactly what we want. The server uploads
-- with the service role and mints short-TTL signed URLs for owner/admin preview.
insert into storage.buckets (id, name, public)
  values ('certs', 'certs', false)
  on conflict (id) do nothing;
