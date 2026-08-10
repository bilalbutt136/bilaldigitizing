# AI Agent Rules

1. **NO MOCK DATA**: Never create, inject, or use mock, fake, or testing data in the application codebase. 
2. **PRODUCTION READY**: All updates must be true production-ready features. Data must be fetched from and written to the live production database (Supabase).
3. **AUTH ENFORCEMENT**: Never use "fallbacks" that simulate a logged-in user. If a user is not authenticated through the proper backend provider, they are logged out.
4. **LIVE PRODUCTION ONLY**: No updates or testing should assume a local development environment. The application is deployed on Vercel with a live domain URL; all agents must consider the system to be a live deployed production system.
5. **AUTO-COMMIT AND PUSH**: Always automatically commit and push to git (`git add .`, `git commit -m ...`, `git push origin main`) after successfully applying code updates.
6. **APPLY SUPABASE MIGRATIONS**: Always execute Supabase migrations (if any database schema changes were made or pending) after completing an update, so that the live database stays perfectly in sync with the codebase.
