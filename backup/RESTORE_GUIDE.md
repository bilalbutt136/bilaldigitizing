# Supabase Migration & Restore Guide

This guide explains how to migrate all schemas, database tables, and data to a new Supabase project.

---

## What Is Backed Up?

All canonical migrations, database schemas, tables, and rows from `bilaldigitizing` have been exported:
- **Canonical Schema & DDL:** `supabase/migrations/` (67 migrations covering all tables, functions, triggers, and RLS policies).
- **Production Data (SQL):** [`backup/supabase_data_restore.sql`](./supabase_data_restore.sql) (Complete transactional insert script for 46 tables and 296 rows).
- **Production Data (JSON):** [`backup/supabase_data_backup.json`](./supabase_data_backup.json) (Structured raw JSON export).
- **Summary:** [`backup/BACKUP_SUMMARY.md`](./BACKUP_SUMMARY.md).

---

## Step-by-Step: Restoring to a New Supabase Project

### Step 1: Create a New Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Choose your Organization, enter project name (e.g., `bilaldigitizing-v2`), set a strong database password, and select your preferred region (e.g. `ap-northeast-1` or `us-east-1`).
4. Note your **Project Reference ID** (found in Project Settings -> General, e.g. `abcdefghijklmno`).

---

### Step 2: Apply Database Schema & Migrations
In your local project terminal, link the new project and push all migrations:

```bash
# 1. Link your new Supabase project
npx supabase link --project-ref YOUR_NEW_PROJECT_REF

# 2. Deploy all 67 canonical schema migrations
npm run migrate
```
This automatically sets up all 46 tables, columns, indexes, RLS security policies, triggers, and storage buckets in your new database.

---

### Step 3: Restore All Backed Up Data
You have two easy ways to insert all data into the new database:

#### Method A: Via Supabase Web Dashboard (Easiest)
1. Open your new project in the Supabase Dashboard.
2. Go to the **SQL Editor** tab on the left sidebar.
3. Open [`backup/supabase_data_restore.sql`](./supabase_data_restore.sql) in your code editor.
4. Copy the entire file content, paste it into the Supabase SQL Editor, and click **Run**.
5. All 296 rows (admins, settings, orders, portfolio, messages, pricing, clients, etc.) will be inserted.

#### Method B: Via Terminal / Supabase CLI
```bash
npx supabase db query --linked -f backup/supabase_data_restore.sql
```

---

### Step 4: Update Environment Variables

1. Go to **Project Settings -> API** in your new Supabase dashboard and copy:
   - `Project URL` (e.g. `https://xyz.supabase.co`)
   - `anon public key`
   - `service_role secret key`

2. Update your local [`.env.local`](../.env.local):
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://YOUR_NEW_PROJECT.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
   ```

3. Update Vercel production environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   ```
   *(Or update them directly in the [Vercel Project Dashboard](https://vercel.com/dashboard) under Settings -> Environment Variables).*

---

### Step 5: Deploy to Vercel Production

Deploy the updated project to production:
```bash
git add .
git commit -m "chore: migrate to new Supabase project"
git push origin main
vercel --prod
```

Your live site at `https://bdigitizing.com` will immediately connect to your new Supabase backend with 100% of your data intact and a fresh 5 GB bandwidth quota!
