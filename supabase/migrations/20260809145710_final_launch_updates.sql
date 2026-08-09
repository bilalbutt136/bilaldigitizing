-- Add new columns to invoices for tracking payments and preventing checkout crashes
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS method TEXT,
ADD COLUMN IF NOT EXISTS bolt_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update the handle_new_user trigger to bootstrap the first registered user as an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (id, email, first_name, last_name, company_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'company', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', '')
  );

  -- Bootstrap first user as admin if no admins exist
  IF NOT EXISTS (SELECT 1 FROM public.admins) THEN
    INSERT INTO public.admins (email, name)
    VALUES (new.email, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
    
    UPDATE public.clients SET role = 'admin' WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
