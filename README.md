# REMASTER EDITION

Modern FiveM roleplay server portal built with Next.js App Router, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase, Discord, and FiveM values.

3. Run the app:

```bash
npm run dev
```

## Supabase setup

Create a public Storage bucket named `gallery`.

Run this SQL in the Supabase SQL editor:

```sql
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  short_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  alt text,
  created_at timestamptz not null default now()
);

create table if not exists public.factions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

alter table public.news enable row level security;
alter table public.gallery_images enable row level security;
alter table public.factions enable row level security;

create policy "Public can read news"
on public.news for select
using (true);

create policy "Authenticated users manage news"
on public.news for all
to authenticated
using (true)
with check (true);

create policy "Public can read gallery"
on public.gallery_images for select
using (true);

create policy "Authenticated users manage gallery"
on public.gallery_images for all
to authenticated
using (true)
with check (true);

create policy "Public can read factions"
on public.factions for select
using (true);

create policy "Authenticated users manage factions"
on public.factions for all
to authenticated
using (true)
with check (true);
```

For Storage policies, this is a simple starting point for the public `gallery` bucket:

```sql
create policy "Public can read gallery files"
on storage.objects for select
using (bucket_id = 'gallery');

create policy "Authenticated users upload gallery files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'gallery');

create policy "Authenticated users delete gallery files"
on storage.objects for delete
to authenticated
using (bucket_id = 'gallery');
```

## Admin

The admin panel is available at `/admin`. Create an admin user in Supabase Auth with email/password login enabled.

## Deploy

Deploy to Vercel and add these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FIVEM_CONNECT_URL`
- `NEXT_PUBLIC_DISCORD_URL`
