-- Migration: 20260906000008_order_messages_worker_rls.sql
-- Description: Allow assigned workers to read and insert into order_messages for their assigned orders

DO $$
BEGIN
    -- 1. Drop existing restrictive policies on order_messages
    DROP POLICY IF EXISTS order_messages_insert_own ON public.order_messages;
    DROP POLICY IF EXISTS order_messages_select_own ON public.order_messages;
    DROP POLICY IF EXISTS order_messages_secure_access ON public.order_messages;

    -- 2. Create updated SELECT policy allowing Admins, Customers, and Assigned Workers
    CREATE POLICY order_messages_select_own ON public.order_messages
        FOR SELECT
        USING (
            public.is_admin()
            OR (EXISTS (
                SELECT 1
                FROM public.orders o
                WHERE o.id = order_messages.order_id
                  AND (
                      o.user_id = auth.uid()
                      OR lower(o.client_email) = public.current_user_email()
                      OR o.worker_id = auth.uid()
                  )
            ))
        );

    -- 3. Create updated INSERT policy allowing Admins, Customers, and Assigned Workers
    CREATE POLICY order_messages_insert_own ON public.order_messages
        FOR INSERT
        WITH CHECK (
            public.is_admin()
            OR (EXISTS (
                SELECT 1
                FROM public.orders o
                WHERE o.id = order_messages.order_id
                  AND (
                      o.user_id = auth.uid()
                      OR lower(o.client_email) = public.current_user_email()
                      OR o.worker_id = auth.uid()
                  )
            ))
        );

    -- 4. Create updated UPDATE policy for read receipts
    DROP POLICY IF EXISTS order_messages_update_own ON public.order_messages;
    CREATE POLICY order_messages_update_own ON public.order_messages
        FOR UPDATE
        USING (
            public.is_admin()
            OR (EXISTS (
                SELECT 1
                FROM public.orders o
                WHERE o.id = order_messages.order_id
                  AND (
                      o.user_id = auth.uid()
                      OR lower(o.client_email) = public.current_user_email()
                      OR o.worker_id = auth.uid()
                  )
            ))
        )
        WITH CHECK (
            public.is_admin()
            OR (EXISTS (
                SELECT 1
                FROM public.orders o
                WHERE o.id = order_messages.order_id
                  AND (
                      o.user_id = auth.uid()
                      OR lower(o.client_email) = public.current_user_email()
                      OR o.worker_id = auth.uid()
                  )
            ))
        );
END $$;

-- 5. Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
