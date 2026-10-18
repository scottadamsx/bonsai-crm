# BONSAI CRM

Lightweight sales CRM for solo operators. An 80% functional clone of Close CRM, minus the luxury 20%.

## Features

- **Contacts** — Full list with search/filter, detail pages, CSV import, add/edit/delete
- **Pipeline** — Drag-and-drop kanban (Lead → Contacted → Mockup Sent → Proposal → Client → Care Plan)
- **Activities** — Log calls, emails, SMS, meetings, notes with timeline view
- **Smart Views** — Saved filtered lists
- **Follow-ups** — Reminders with daily due view and overdue highlighting
- **Email** — Templates + Day 0/4/11 sequences
- **Calling** — Click-to-call tel: links with outcome logging
- **Dashboard** — Pipeline value, conversion rate, follow-ups due

## Setup

### 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Enable **Email provider** in Authentication → Providers
4. Create your user: Authentication → Users → Add User (email + password)
5. **Disable public signup**: Authentication → Settings → uncheck "Enable sign up"

### 2. Environment

```bash
cp .env.example .env.local
# Fill in your Supabase URL and keys
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Seed Data

```bash
# Add SUPABASE_SERVICE_ROLE_KEY to .env.local first
npx tsx scripts/seed.ts
```

This imports 20 website prospects and 12 clubs, and adds them to pipelines.

### 5. Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel, set project name to `bonsaiCRM`
3. Add environment variables (Supabase URL + anon key)
4. Deploy → live at `bonsaiCRM.vercel.app`

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Postgres + Auth)
- Tailwind CSS
- TypeScript

## What We Skipped (Close's luxury 20%)

- Built-in VoIP / predictive dialer
- AI agent
- Multi-user / teams / permissions
- Advanced workflow automation
- Shared inbox
