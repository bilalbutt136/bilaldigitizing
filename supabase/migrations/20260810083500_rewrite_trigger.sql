CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
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
      0
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
