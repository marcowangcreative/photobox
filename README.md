# Prints

Wedding photo galleries that feel like opening a box of prints.

## Stack

- **Next.js 15** on Vercel
- **Supabase** (Postgres + Storage + Auth)
- **Sharp** for server-side image processing

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com). Run the migration:

```sql
-- Copy contents of supabase/migrations/001_initial.sql
-- into the Supabase SQL editor and execute
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials from the project settings.

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Deploy

```bash
vercel
```

Add the env vars in Vercel project settings.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/admin` | Gallery dashboard — create, manage |
| `/admin/[id]` | Gallery editor — upload photos, set names, publish |
| `/g/[slug]` | Public gallery — the print stack experience |

## How It Works

1. Go to `/admin`, create a gallery with couple names
2. Upload photos — auto-resized to 2400px, landscape auto-detected
3. Publish when ready
4. Share the `/g/[slug]` link

Photos are stored in Supabase Storage. The gallery component renders client-side with the tray/stack/scatter experience. Share generates a 1080x1350 image via Canvas API for social.

## Project Structure

```
app/
  page.tsx              — Landing
  layout.tsx            — Root layout
  admin/
    page.tsx            — Gallery dashboard
    [id]/page.tsx       — Gallery editor
  g/[slug]/page.tsx     — Public gallery (SSR)
  api/
    galleries/route.ts  — Gallery CRUD
    upload/route.ts     — Photo upload + Sharp processing
components/
  PhotoGallery.tsx      — The gallery component
lib/
  supabase.ts           — Client + helpers
  types.ts              — TypeScript types
supabase/
  migrations/           — SQL schema
```
