-- Run this in your Supabase SQL Editor to fix the on_auth_user_created trigger

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (user_id, name, full_name, email, company, company_name, wallet_balance)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'company', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    0
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = COALESCE(EXCLUDED.full_name, public.clients.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
