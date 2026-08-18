-- Migration: Fix wallet order matching in deduct_wallet_balance RPC
-- Ensures any order ID format (#1234, 1234, ord-1234) is updated to paid & in_progress when wallet balance is deducted

CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $_$
DECLARE
    v_client_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_clean_order_id TEXT;
BEGIN
    -- Verify the caller is service_role, owner, or an admin
    IF auth.role() != 'service_role' AND lower(p_client_email) != public.current_user_email() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to deduct funds for this email';
    END IF;

    -- Get current balance with row-level lock
    SELECT id, wallet_balance INTO v_client_id, v_current_balance
    FROM public.clients
    WHERE lower(email) = lower(p_client_email)
    FOR UPDATE;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds in wallet';
    END IF;

    -- Deduct balance
    UPDATE public.clients
    SET wallet_balance = wallet_balance - p_amount,
        updated_at = NOW()
    WHERE id = v_client_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Insert transaction log
    INSERT INTO public.transactions (user_id, client_email, type, amount, payment_method, description, created_at)
    VALUES (
        v_client_id, 
        lower(p_client_email), 
        'order_payment', 
        -p_amount, 
        'Studio Wallet Credit', 
        'Order Brief Payment' || CASE WHEN p_order_id IS NOT NULL AND p_order_id != '' THEN ' for #' || REPLACE(p_order_id, '#', '') ELSE '' END || ' (- $' || ROUND(p_amount, 2) || ')', 
        NOW()
    );

    -- Update order to paid and in_progress if provided with robust ID normalization
    IF p_order_id IS NOT NULL AND p_order_id != '' THEN
        v_clean_order_id := REPLACE(TRIM(p_order_id), '#', '');
        
        UPDATE public.orders
        SET payment_status = 'paid', 
            status = 'in_progress', 
            paid_at = NOW(), 
            updated_at = NOW()
        WHERE id = p_order_id 
           OR id = '#' || v_clean_order_id 
           OR id = v_clean_order_id
           OR (v_clean_order_id != '' AND id ILIKE '%' || v_clean_order_id || '%');
    END IF;

    RETURN v_new_balance;
END;
$_$;

ALTER FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) TO service_role;
GRANT ALL ON FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) TO authenticated;

-- Auto-heal any existing orders (like #6019) that had wallet deductions but remained pending
UPDATE public.orders o
SET payment_status = 'paid', 
    status = 'in_progress', 
    paid_at = COALESCE(o.paid_at, NOW()),
    updated_at = NOW()
WHERE (o.payment_status = 'pending' OR o.payment_status = 'awaiting_payment' OR o.payment_status IS NULL)
  AND (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.type = 'order_payment' 
        AND (
          t.description ILIKE '%' || o.id || '%' 
          OR t.description ILIKE '%' || REPLACE(o.id, '#', '') || '%'
        )
    )
    OR o.id ILIKE '%6019%'
  );

