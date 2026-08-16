-- 1. Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text,
    author text,
    image_url text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to blogs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Allow public read access on blogs'
  ) THEN
    CREATE POLICY "Allow public read access on blogs"
    ON public.blogs FOR SELECT
    USING (true);
  END IF;
END $$;

-- 2. Drop the vestigial public.users table (auth profiles are handled in public.clients)
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. Create a helper function to increment unread counts on conversations
CREATE OR REPLACE FUNCTION public.increment_unread_count(conv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET unread_count = COALESCE(unread_count, 0) + 1,
        updated_at = now()
    WHERE id = conv_id;
END;
$$;
