-- Migration: Fix clients default wallet balance to 0.00
-- Ensure new user registrations start with zero wallet balance instead of legacy promotional balance.

ALTER TABLE IF EXISTS public.clients
  ALTER COLUMN wallet_balance SET DEFAULT 0.00;

-- Also update any existing newly-registered customer accounts that received the 150.00 default
UPDATE public.clients
SET wallet_balance = 0.00
WHERE wallet_balance = 150.00;

-- Ensure the trigger function handle_new_user also defaults wallet_balance to 0
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.clients WHERE email = new.email) THEN
    UPDATE public.clients SET
      user_id = new.id,
      full_name = COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), public.clients.full_name)
    WHERE email = new.email;
  ELSE
    INSERT INTO public.clients (user_id, name, full_name, email, company, company_name, wallet_balance)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.email,
      COALESCE(new.raw_user_meta_data->>'company', ''),
      COALESCE(new.raw_user_meta_data->>'company_name', ''),
      0.00
    );
  END IF;
  RETURN new;
END;
$function$;
