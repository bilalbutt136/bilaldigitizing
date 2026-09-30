-- Customer order reviews with admin-controlled publication.
-- Reviews are submitted through authenticated server APIs; direct client table access stays blocked.

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  customer_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  display_name TEXT NOT NULL DEFAULT 'Verified Customer',
  order_title TEXT,
  service_category TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL CHECK (char_length(btrim(review_text)) BETWEEN 3 AND 1600),
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'published', 'hidden')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_moderation
  ON public.customer_reviews (moderation_status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_published
  ON public.customer_reviews (is_published, published_at DESC)
  WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_customer_reviews_customer
  ON public.customer_reviews (customer_user_id, submitted_at DESC);

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.customer_reviews FROM anon, authenticated;
GRANT ALL ON TABLE public.customer_reviews TO service_role;

COMMENT ON TABLE public.customer_reviews IS
  'Verified feedback attached to completed customer orders. Publication is admin-controlled.';
