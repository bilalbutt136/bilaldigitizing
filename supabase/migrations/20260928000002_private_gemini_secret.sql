-- Move Gemini API credentials out of publicly readable site_config.
DO $$
DECLARE
  v_key text := '';
BEGIN
  SELECT COALESCE(
    CASE
      WHEN jsonb_typeof(value) = 'string' THEN value #>> '{}'
      WHEN jsonb_typeof(value) = 'object' THEN COALESCE(value->>'apiKey', value->>'key')
      ELSE ''
    END,
    ''
  )
  INTO v_key
  FROM public.site_config
  WHERE key = 'gemini_api_key'
  LIMIT 1;

  IF COALESCE(btrim(v_key), '') = '' THEN
    SELECT COALESCE(value->>'geminiApiKey', value->>'gemini_api_key', '')
    INTO v_key
    FROM public.site_config
    WHERE key = 'site_settings'
      AND jsonb_typeof(value) = 'object'
    LIMIT 1;
  END IF;

  IF COALESCE(btrim(v_key), '') <> '' THEN
    INSERT INTO public.private_server_config (key, value, updated_at)
    VALUES (
      'gemini_api_key',
      jsonb_build_object('apiKey', btrim(v_key)),
      timezone('utc'::text, now())
    )
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at;
  END IF;

  DELETE FROM public.site_config
  WHERE key = 'gemini_api_key';

  UPDATE public.site_config
  SET value = value - 'geminiApiKey' - 'gemini_api_key',
      updated_at = timezone('utc'::text, now())
  WHERE key = 'site_settings'
    AND jsonb_typeof(value) = 'object'
    AND (value ? 'geminiApiKey' OR value ? 'gemini_api_key');
END $$;
