# AI Agent Rules

1. **NO MOCK DATA**: Never create, inject, or use mock, fake, or testing data in the application codebase. 
2. **PRODUCTION READY**: All updates must be true production-ready features. Data must be fetched from and written to the live production database (Supabase).
3. **AUTH ENFORCEMENT**: Never use "fallbacks" that simulate a logged-in user. If a user is not authenticated through the proper backend provider, they are logged out.
