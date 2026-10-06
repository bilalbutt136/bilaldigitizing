-- Name: current_user_email(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT lower((auth.jwt() ->> 'email'))
$$;


ALTER FUNCTION public.current_user_email() OWNER TO postgres;

--

-- Name: deduct_wallet_balance(text, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
    v_client_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Verify the caller is the owner or an admin
    IF lower(p_client_email) != public.current_user_email() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to deduct funds for this email';
    END IF;

    -- Ensure amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deduction amount must be positive';
    END IF;

    -- Get current balance
    SELECT id, wallet_balance INTO v_client_id, v_current_balance
    FROM public.clients
    WHERE lower(email) = lower(p_client_email);

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds in wallet';
    END IF;

    -- Deduct balance
    UPDATE public.clients
    SET wallet_balance = wallet_balance - p_amount
    WHERE id = v_client_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Insert transaction log
    INSERT INTO public.transactions (client_email, type, amount, payment_method, description)
    VALUES (lower(p_client_email), 'order_payment', p_amount, 'Studio Wallet Credit', 'Order Brief Payment for ' || p_order_id || ' (- $' || ROUND(p_amount, 2) || ')');

    -- Update order to paid and in_progress
    IF p_order_id IS NOT NULL THEN
        UPDATE public.orders
        SET payment_status = 'paid', status = 'in_progress'
        WHERE id = p_order_id;
    END IF;

    RETURN v_new_balance;
END;
$_$;


ALTER FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) OWNER TO postgres;

--

-- Name: deposit_funds(text, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
    v_client_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- Verify the caller is the owner or an admin
    IF lower(p_client_email) != public.current_user_email() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to deposit funds for this email';
    END IF;

    -- Ensure amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be positive';
    END IF;

    -- Update balance and get new balance
    UPDATE public.clients
    SET wallet_balance = wallet_balance + p_amount
    WHERE lower(email) = lower(p_client_email)
    RETURNING id, wallet_balance INTO v_client_id, v_new_balance;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    -- Insert transaction log
    INSERT INTO public.transactions (client_email, type, amount, payment_method, description)
    VALUES (lower(p_client_email), 'deposit', p_amount, p_payment_method, 'Studio Wallet Deposit Top-up (+ $' || ROUND(p_amount, 2) || ')');

    RETURN v_new_balance;
END;
$_$;


ALTER FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) OWNER TO postgres;

--

-- Name: enforce_order_security(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_order_security() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- If not an admin, prevent changing sensitive fields
  -- Bypass if current_user is postgres or supabase_admin (e.g. running from a SECURITY DEFINER function)
  IF NOT public.is_admin() AND current_user != 'postgres' AND current_user != 'supabase_admin' THEN
    IF NEW.price IS DISTINCT FROM OLD.price THEN
      RAISE EXCEPTION 'Clients cannot modify the order price.';
    END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      RAISE EXCEPTION 'Clients cannot modify the payment status.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Clients cannot modify the order status directly.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_order_security() OWNER TO postgres;

--

-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--

-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.current_user_email() IN (
    SELECT lower(email) FROM public.admins
  )
$$;


ALTER FUNCTION public.is_admin() OWNER TO postgres;

--

-- Name: mark_order_paid(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_order_paid(p_order_id text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE public.orders
    SET payment_status = 'paid', status = 'in_progress'
    WHERE id = p_order_id;
END;
$$;


ALTER FUNCTION public.mark_order_paid(p_order_id text) OWNER TO postgres;

--

-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    email text NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--

-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    full_name text,
    email text NOT NULL,
    company text,
    company_name text,
    password text,
    role text DEFAULT 'customer'::text,
    wallet_balance numeric(10,2) DEFAULT 150.00,
    orders_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.clients OWNER TO postgres;

--

-- Name: cms_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_content (
    key text NOT NULL,
    value jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.cms_content OWNER TO postgres;

--

-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    client_name text NOT NULL,
    client_email text NOT NULL,
    client_company text,
    order_id text,
    order_title text,
    avatar text,
    status text DEFAULT 'offline'::text,
    unread_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversations OWNER TO postgres;

--

-- Name: digitizers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digitizers (
    id text NOT NULL,
    name text NOT NULL,
    role text,
    rating numeric,
    active_jobs integer DEFAULT 0 NOT NULL,
    avatar text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.digitizers OWNER TO postgres;

--

-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faqs (
    id text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text DEFAULT 'general'::text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.faqs OWNER TO postgres;

--

-- Name: hero_slides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hero_slides (
    id text NOT NULL,
    service_key text,
    badge text,
    title text NOT NULL,
    highlight text,
    description text,
    rate_label text,
    primary_cta text,
    secondary_cta text,
    banner_image text,
    trust_points jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hero_slides OWNER TO postgres;

--

-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    client_email text,
    amount numeric NOT NULL,
    method text,
    status text DEFAULT 'pending'::text NOT NULL,
    bolt_order_id text,
    payment_url text,
    reference_id text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    order_id text
);


ALTER TABLE public.invoices OWNER TO postgres;

--

-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id text NOT NULL,
    conversation_id text,
    sender text NOT NULL,
    sender_name text,
    text text,
    attachment text,
    "timestamp" text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO postgres;

--

-- Name: order_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id text,
    file_name text NOT NULL,
    file_format text NOT NULL,
    file_type text DEFAULT 'client_artwork'::text NOT NULL,
    bucket_name text DEFAULT 'client-uploads'::text NOT NULL,
    file_path text NOT NULL,
    file_url text,
    public_url text NOT NULL,
    uploaded_by text DEFAULT 'client'::text,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


ALTER TABLE public.order_files OWNER TO postgres;

--

-- Name: order_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id text,
    sender text NOT NULL,
    sender_name text DEFAULT 'Client'::text NOT NULL,
    message text,
    attachment text,
    is_internal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    sender_role text DEFAULT 'client'::text,
    attachments jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.order_messages OWNER TO postgres;

--

-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    client_id text,
    client_name text NOT NULL,
    client_email text NOT NULL,
    service_category text NOT NULL,
    service_type text,
    placement_type text,
    fabric_type text,
    dimensions jsonb DEFAULT '{"unit": "inches", "width": 3.5, "height": 3.0}'::jsonb,
    estimated_stitches integer DEFAULT 12400,
    colors_count integer DEFAULT 4,
    requested_formats text[] DEFAULT ARRAY['dst'::text, 'pes'::text, 'emb'::text, 'pdf'::text],
    is_rush boolean DEFAULT false,
    price numeric(10,2) DEFAULT 15.00,
    cost numeric(10,2) DEFAULT 15.00,
    payment_status text DEFAULT 'Paid'::text,
    notes text,
    artwork_url text,
    image_url text,
    logo text,
    status text DEFAULT 'submitted'::text,
    output_file_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


ALTER TABLE public.orders OWNER TO postgres;

--

-- Name: patch_cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patch_cards (
    id text NOT NULL,
    title text NOT NULL,
    rate text,
    unit text,
    badge text,
    popular boolean DEFAULT false NOT NULL,
    highlight boolean DEFAULT false NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text
);


ALTER TABLE public.patch_cards OWNER TO postgres;

--

-- Name: portfolio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolio (
    id text NOT NULL,
    title text,
    category text,
    stitch_count text,
    colors text,
    original_image text,
    digitized_image text,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    formats text,
    client_type text
);


ALTER TABLE public.portfolio OWNER TO postgres;

--

-- Name: pricing_cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_cards (
    id text NOT NULL,
    category text DEFAULT 'embroidery'::text NOT NULL,
    title text NOT NULL,
    rate text,
    unit text,
    badge text,
    popular boolean DEFAULT false NOT NULL,
    highlight boolean DEFAULT false NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pricing_cards OWNER TO postgres;

--

-- Name: pricing_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type text NOT NULL,
    title text NOT NULL,
    subtitle text,
    badge_text text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    price_unit text,
    turnaround_time text,
    features jsonb DEFAULT '[]'::jsonb,
    button_text text DEFAULT 'Order Now'::text,
    is_popular boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pricing_tiers_service_type_check CHECK ((service_type = ANY (ARRAY['embroidery'::text, 'vector_art'::text, 'patches'::text])))
);


ALTER TABLE public.pricing_tiers OWNER TO postgres;

--

-- Name: receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid,
    user_id uuid,
    client_email text,
    amount numeric NOT NULL,
    method text,
    bolt_order_id text,
    transaction_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.receipts OWNER TO postgres;

--

-- Name: revisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id text,
    requested_by text DEFAULT 'Client'::text NOT NULL,
    note text,
    notes text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.revisions OWNER TO postgres;

--

-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id text NOT NULL,
    title text NOT NULL,
    price text,
    stitches text,
    "time" text,
    icon text,
    route text,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--

-- Name: sew_outs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sew_outs (
    id text NOT NULL,
    title text,
    category text,
    before_img text,
    after_img text,
    stitch_count text,
    formats text,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sew_outs OWNER TO postgres;

--

-- Name: site_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_config (
    key text NOT NULL,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.site_config OWNER TO postgres;

--

-- Name: store_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.store_products (
    id text NOT NULL,
    category text,
    title text NOT NULL,
    price text,
    unit text,
    min_quantity integer,
    badge text,
    status text DEFAULT 'active'::text NOT NULL,
    image text,
    description text,
    sizes jsonb DEFAULT '[]'::jsonb NOT NULL,
    colors jsonb DEFAULT '[]'::jsonb NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.store_products OWNER TO postgres;

--

-- Name: testimonials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.testimonials (
    id text NOT NULL,
    name text NOT NULL,
    role text,
    company text,
    rating integer DEFAULT 5,
    comment text NOT NULL,
    avatar text,
    service_category text DEFAULT 'general'::text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.testimonials OWNER TO postgres;

--

-- Name: tracking_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tracking_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_name text NOT NULL,
    user_role text,
    source text,
    traffic_source text,
    value text,
    page_path text,
    event_time timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tracking_events OWNER TO postgres;

--

-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_email text NOT NULL,
    type text NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text DEFAULT 'Wallet Credit'::text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


ALTER TABLE public.transactions OWNER TO postgres;

--

-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name text NOT NULL,
    full_name text,
    email text NOT NULL,
    company text,
    company_name text,
    role text DEFAULT 'customer'::text,
    wallet_balance numeric(10,2) DEFAULT 150.00,
    orders_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--

-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (email);


--

-- Name: clients clients_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_email_key UNIQUE (email);


--

-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--

-- Name: cms_content cms_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_content
    ADD CONSTRAINT cms_content_pkey PRIMARY KEY (key);


--

-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--

-- Name: digitizers digitizers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.digitizers
    ADD CONSTRAINT digitizers_pkey PRIMARY KEY (id);


--

-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--

-- Name: hero_slides hero_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hero_slides
    ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);


--

-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--

-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--

-- Name: order_files order_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_files
    ADD CONSTRAINT order_files_pkey PRIMARY KEY (id);


--

-- Name: order_messages order_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_messages
    ADD CONSTRAINT order_messages_pkey PRIMARY KEY (id);


--

-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--

-- Name: patch_cards patch_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patch_cards
    ADD CONSTRAINT patch_cards_pkey PRIMARY KEY (id);


--

-- Name: portfolio portfolio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio
    ADD CONSTRAINT portfolio_pkey PRIMARY KEY (id);


--

-- Name: pricing_cards pricing_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_cards
    ADD CONSTRAINT pricing_cards_pkey PRIMARY KEY (id);


--

-- Name: pricing_tiers pricing_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_tiers
    ADD CONSTRAINT pricing_tiers_pkey PRIMARY KEY (id);


--

-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--

-- Name: revisions revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_pkey PRIMARY KEY (id);


--

-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--

-- Name: sew_outs sew_outs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sew_outs
    ADD CONSTRAINT sew_outs_pkey PRIMARY KEY (id);


--

-- Name: site_config site_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config
    ADD CONSTRAINT site_config_pkey PRIMARY KEY (key);


--

-- Name: store_products store_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_products
    ADD CONSTRAINT store_products_pkey PRIMARY KEY (id);


--

-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--

-- Name: tracking_events tracking_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking_events
    ADD CONSTRAINT tracking_events_pkey PRIMARY KEY (id);


--

-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--

-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--

-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--

-- Name: clients_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_email_idx ON public.clients USING btree (email);


--

-- Name: clients_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_user_id_idx ON public.clients USING btree (user_id);


--

-- Name: idx_invoices_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_order_id ON public.invoices USING btree (order_id);


--

-- Name: invoices_client_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_client_email_idx ON public.invoices USING btree (client_email);


--

-- Name: order_files_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_files_order_id_idx ON public.order_files USING btree (order_id);


--

-- Name: order_messages_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_messages_order_id_idx ON public.order_messages USING btree (order_id);


--

-- Name: orders_client_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_client_email_idx ON public.orders USING btree (client_email);


--

-- Name: orders_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_created_at_idx ON public.orders USING btree (created_at DESC);


--

-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--

-- Name: orders_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);


--

-- Name: receipts_client_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX receipts_client_email_idx ON public.receipts USING btree (client_email);


--

-- Name: revisions_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX revisions_order_id_idx ON public.revisions USING btree (order_id);


--

-- Name: transactions_client_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transactions_client_email_idx ON public.transactions USING btree (client_email);


--

-- Name: orders trg_enforce_order_security; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_order_security BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_order_security();


--

-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--

-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--

-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--

-- Name: order_files order_files_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_files
    ADD CONSTRAINT order_files_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--

-- Name: order_files order_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_files
    ADD CONSTRAINT order_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--

-- Name: order_messages order_messages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_messages
    ADD CONSTRAINT order_messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--

-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--

-- Name: receipts receipts_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--

-- Name: receipts receipts_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;


--

-- Name: receipts receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--

-- Name: revisions revisions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--

-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--

-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--

-- Name: cms_content Admin write access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin write access" ON public.cms_content USING ((auth.role() = 'authenticated'::text));


--

-- Name: digitizers Admin write access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin write access" ON public.digitizers USING ((auth.role() = 'authenticated'::text));


--

-- Name: hero_slides Admin write access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin write access" ON public.hero_slides USING ((auth.role() = 'authenticated'::text));


--

-- Name: patch_cards Admin write access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin write access" ON public.patch_cards USING ((auth.role() = 'authenticated'::text));


--

-- Name: clients Admins have full access to clients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins have full access to clients" ON public.clients USING ((auth.role() = 'authenticated'::text));


--

-- Name: users Allow public read/write on users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read/write on users" ON public.users USING (true) WITH CHECK (true);


--

-- Name: cms_content Public read access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access" ON public.cms_content FOR SELECT USING (true);


--

-- Name: digitizers Public read access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access" ON public.digitizers FOR SELECT USING (true);


--

-- Name: hero_slides Public read access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access" ON public.hero_slides FOR SELECT USING (true);


--

-- Name: patch_cards Public read access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access" ON public.patch_cards FOR SELECT USING (true);


--

-- Name: clients Users can insert their own client record; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own client record" ON public.clients FOR INSERT WITH CHECK ((auth.uid() = user_id));


--

-- Name: clients Users can update their own client record; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own client record" ON public.clients FOR UPDATE USING ((auth.uid() = user_id));


--

-- Name: clients Users can view their own client record; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own client record" ON public.clients FOR SELECT USING ((auth.uid() = user_id));


--

-- Name: admins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

--

-- Name: admins admins_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admins_admin_write ON public.admins USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: admins admins_read_only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admins_read_only ON public.admins FOR SELECT USING (public.is_admin());


--

-- Name: digitizers catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.digitizers USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: hero_slides catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.hero_slides USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: patch_cards catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.patch_cards USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: portfolio catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.portfolio USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: pricing_cards catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.pricing_cards USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: services catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.services USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: sew_outs catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.sew_outs USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: store_products catalog_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_admin_write ON public.store_products USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: digitizers catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.digitizers FOR SELECT USING (true);


--

-- Name: hero_slides catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.hero_slides FOR SELECT USING (true);


--

-- Name: patch_cards catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.patch_cards FOR SELECT USING (true);


--

-- Name: portfolio catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.portfolio FOR SELECT USING (true);


--

-- Name: pricing_cards catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.pricing_cards FOR SELECT USING (true);


--

-- Name: services catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.services FOR SELECT USING (true);


--

-- Name: sew_outs catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.sew_outs FOR SELECT USING (true);


--

-- Name: store_products catalog_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY catalog_read_all ON public.store_products FOR SELECT USING (true);


--

-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--

-- Name: clients clients_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY clients_select_own ON public.clients FOR SELECT USING (((id = auth.uid()) OR public.is_admin()));


--

-- Name: clients clients_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY clients_update_own ON public.clients FOR UPDATE USING (((id = auth.uid()) OR public.is_admin())) WITH CHECK (((id = auth.uid()) OR public.is_admin()));


--

-- Name: cms_content; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

--

-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--

-- Name: conversations conversations_access_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY conversations_access_policy ON public.conversations USING ((public.is_admin() OR (lower(client_email) = public.current_user_email()))) WITH CHECK ((public.is_admin() OR (lower(client_email) = public.current_user_email())));


--

-- Name: digitizers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.digitizers ENABLE ROW LEVEL SECURITY;

--

-- Name: faqs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

--

-- Name: faqs faqs_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY faqs_admin_write ON public.faqs USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: faqs faqs_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY faqs_read_all ON public.faqs FOR SELECT USING (true);


--

-- Name: hero_slides; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

--

-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--

-- Name: invoices invoices_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoices_select_own ON public.invoices FOR SELECT USING ((public.is_admin() OR (lower(client_email) = public.current_user_email())));


--

-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--

-- Name: messages messages_access_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY messages_access_policy ON public.messages USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((lower(c.client_email) = public.current_user_email()) OR public.is_admin())))))) WITH CHECK ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((lower(c.client_email) = public.current_user_email()) OR public.is_admin()))))));


--

-- Name: order_files; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

--

-- Name: order_files order_files_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY order_files_insert_own ON public.order_files FOR INSERT WITH CHECK ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_files.order_id) AND (lower(o.client_email) = public.current_user_email()))))));


--

-- Name: order_files order_files_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY order_files_select_own ON public.order_files FOR SELECT USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_files.order_id) AND (lower(o.client_email) = public.current_user_email()))))));


--

-- Name: order_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

--

-- Name: order_messages order_messages_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY order_messages_admin_update ON public.order_messages FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: order_messages order_messages_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY order_messages_insert_own ON public.order_messages FOR INSERT WITH CHECK ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_messages.order_id) AND ((o.user_id = auth.uid()) OR (lower(o.client_email) = public.current_user_email())))))));


--

-- Name: order_messages order_messages_secure_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY order_messages_secure_access ON public.order_messages USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_messages.order_id) AND ((o.user_id = auth.uid()) OR (lower(o.client_email) = public.current_user_email()))))))) WITH CHECK ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_messages.order_id) AND ((o.user_id = auth.uid()) OR (lower(o.client_email) = public.current_user_email())))))));


--

-- Name: order_messages order_messages_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY order_messages_select_own ON public.order_messages FOR SELECT USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_messages.order_id) AND ((o.user_id = auth.uid()) OR (lower(o.client_email) = public.current_user_email())))))));


--

-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--

-- Name: orders orders_delete_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY orders_delete_own ON public.orders FOR DELETE USING (((lower(client_email) = public.current_user_email()) OR public.is_admin()));


--

-- Name: orders orders_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY orders_insert_own ON public.orders FOR INSERT WITH CHECK (((lower(client_email) = public.current_user_email()) OR public.is_admin()));


--

-- Name: orders orders_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY orders_select_own ON public.orders FOR SELECT USING (((lower(client_email) = public.current_user_email()) OR public.is_admin()));


--

-- Name: orders orders_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY orders_update_own ON public.orders FOR UPDATE USING (((lower(client_email) = public.current_user_email()) OR public.is_admin())) WITH CHECK (((lower(client_email) = public.current_user_email()) OR public.is_admin()));


--

-- Name: patch_cards; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.patch_cards ENABLE ROW LEVEL SECURITY;

--

-- Name: portfolio; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

--

-- Name: pricing_cards; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pricing_cards ENABLE ROW LEVEL SECURITY;

--

-- Name: pricing_cards pricing_cards_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pricing_cards_read_all ON public.pricing_cards FOR SELECT USING (true);


--

-- Name: pricing_tiers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

--

-- Name: pricing_tiers pricing_tiers_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pricing_tiers_admin_write ON public.pricing_tiers USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: pricing_tiers pricing_tiers_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pricing_tiers_read_all ON public.pricing_tiers FOR SELECT USING (true);


--

-- Name: receipts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

--

-- Name: receipts receipts_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY receipts_select_own ON public.receipts FOR SELECT USING ((public.is_admin() OR (lower(client_email) = public.current_user_email())));


--

-- Name: revisions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;

--

-- Name: revisions revisions_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY revisions_insert_own ON public.revisions FOR INSERT WITH CHECK ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = revisions.order_id) AND (lower(o.client_email) = public.current_user_email()))))));


--

-- Name: revisions revisions_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY revisions_select_own ON public.revisions FOR SELECT USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = revisions.order_id) AND (lower(o.client_email) = public.current_user_email()))))));


--

-- Name: services; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--

-- Name: services services_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY services_read_all ON public.services FOR SELECT USING (true);


--

-- Name: sew_outs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sew_outs ENABLE ROW LEVEL SECURITY;

--

-- Name: site_config; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

--

-- Name: site_config site_config_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY site_config_admin_write ON public.site_config USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: site_config site_config_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY site_config_read_all ON public.site_config FOR SELECT USING (true);


--

-- Name: store_products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

--

-- Name: store_products store_products_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY store_products_read_all ON public.store_products FOR SELECT USING (true);


--

-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--

-- Name: testimonials testimonials_admin_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY testimonials_admin_write ON public.testimonials USING (public.is_admin()) WITH CHECK (public.is_admin());


--

-- Name: testimonials testimonials_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY testimonials_read_all ON public.testimonials FOR SELECT USING (true);


--

-- Name: tracking_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

--

-- Name: tracking_events tracking_events_insert_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tracking_events_insert_all ON public.tracking_events FOR INSERT WITH CHECK (true);


--

-- Name: tracking_events tracking_events_read_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tracking_events_read_admin ON public.tracking_events FOR SELECT USING (public.is_admin());


--

-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--

-- Name: transactions transactions_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY transactions_select_own ON public.transactions FOR SELECT USING ((public.is_admin() OR (lower(client_email) = public.current_user_email())));


--

-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--

-- Name: FUNCTION current_user_email(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.current_user_email() TO anon;
GRANT ALL ON FUNCTION public.current_user_email() TO authenticated;
GRANT ALL ON FUNCTION public.current_user_email() TO service_role;


--

-- Name: FUNCTION deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) TO anon;
GRANT ALL ON FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) TO authenticated;
GRANT ALL ON FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) TO service_role;


--

-- Name: FUNCTION deposit_funds(p_client_email text, p_amount numeric, p_payment_method text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) TO anon;
GRANT ALL ON FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) TO authenticated;
GRANT ALL ON FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) TO service_role;


--

-- Name: FUNCTION enforce_order_security(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enforce_order_security() TO anon;
GRANT ALL ON FUNCTION public.enforce_order_security() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_order_security() TO service_role;


--

-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--

-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;


--

-- Name: FUNCTION mark_order_paid(p_order_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_order_paid(p_order_id text) TO anon;
GRANT ALL ON FUNCTION public.mark_order_paid(p_order_id text) TO authenticated;
GRANT ALL ON FUNCTION public.mark_order_paid(p_order_id text) TO service_role;


--

-- Name: TABLE admins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admins TO anon;
GRANT ALL ON TABLE public.admins TO authenticated;
GRANT ALL ON TABLE public.admins TO service_role;


--

-- Name: TABLE clients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;


--

-- Name: TABLE cms_content; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cms_content TO anon;
GRANT ALL ON TABLE public.cms_content TO authenticated;
GRANT ALL ON TABLE public.cms_content TO service_role;


--

-- Name: TABLE conversations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.conversations TO anon;
GRANT ALL ON TABLE public.conversations TO authenticated;
GRANT ALL ON TABLE public.conversations TO service_role;


--

-- Name: TABLE digitizers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.digitizers TO anon;
GRANT ALL ON TABLE public.digitizers TO authenticated;
GRANT ALL ON TABLE public.digitizers TO service_role;


--

-- Name: TABLE faqs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.faqs TO anon;
GRANT ALL ON TABLE public.faqs TO authenticated;
GRANT ALL ON TABLE public.faqs TO service_role;


--

-- Name: TABLE hero_slides; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.hero_slides TO anon;
GRANT ALL ON TABLE public.hero_slides TO authenticated;
GRANT ALL ON TABLE public.hero_slides TO service_role;


--

-- Name: TABLE invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.invoices TO anon;
GRANT ALL ON TABLE public.invoices TO authenticated;
GRANT ALL ON TABLE public.invoices TO service_role;


--

-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;


--

-- Name: TABLE order_files; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_files TO anon;
GRANT ALL ON TABLE public.order_files TO authenticated;
GRANT ALL ON TABLE public.order_files TO service_role;


--

-- Name: TABLE order_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_messages TO anon;
GRANT ALL ON TABLE public.order_messages TO authenticated;
GRANT ALL ON TABLE public.order_messages TO service_role;


--

-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--

-- Name: TABLE patch_cards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.patch_cards TO anon;
GRANT ALL ON TABLE public.patch_cards TO authenticated;
GRANT ALL ON TABLE public.patch_cards TO service_role;


--

-- Name: TABLE portfolio; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.portfolio TO anon;
GRANT ALL ON TABLE public.portfolio TO authenticated;
GRANT ALL ON TABLE public.portfolio TO service_role;


--

-- Name: TABLE pricing_cards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pricing_cards TO anon;
GRANT ALL ON TABLE public.pricing_cards TO authenticated;
GRANT ALL ON TABLE public.pricing_cards TO service_role;


--

-- Name: TABLE pricing_tiers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pricing_tiers TO anon;
GRANT ALL ON TABLE public.pricing_tiers TO authenticated;
GRANT ALL ON TABLE public.pricing_tiers TO service_role;


--

-- Name: TABLE receipts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.receipts TO anon;
GRANT ALL ON TABLE public.receipts TO authenticated;
GRANT ALL ON TABLE public.receipts TO service_role;


--

-- Name: TABLE revisions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.revisions TO anon;
GRANT ALL ON TABLE public.revisions TO authenticated;
GRANT ALL ON TABLE public.revisions TO service_role;


--

-- Name: TABLE services; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.services TO anon;
GRANT ALL ON TABLE public.services TO authenticated;
GRANT ALL ON TABLE public.services TO service_role;


--

-- Name: TABLE sew_outs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sew_outs TO anon;
GRANT ALL ON TABLE public.sew_outs TO authenticated;
GRANT ALL ON TABLE public.sew_outs TO service_role;


--

-- Name: TABLE site_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_config TO anon;
GRANT ALL ON TABLE public.site_config TO authenticated;
GRANT ALL ON TABLE public.site_config TO service_role;


--

-- Name: TABLE store_products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.store_products TO anon;
GRANT ALL ON TABLE public.store_products TO authenticated;
GRANT ALL ON TABLE public.store_products TO service_role;


--

-- Name: TABLE testimonials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.testimonials TO anon;
GRANT ALL ON TABLE public.testimonials TO authenticated;
GRANT ALL ON TABLE public.testimonials TO service_role;


--

-- Name: TABLE tracking_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tracking_events TO anon;
GRANT ALL ON TABLE public.tracking_events TO authenticated;
GRANT ALL ON TABLE public.tracking_events TO service_role;


--

-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--

-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--

-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--

-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--

-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--

-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--

-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--

-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--