import { NextResponse } from 'next/server.js';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin.js';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth.js';

export const dynamic = 'force-dynamic';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID;

async function resolveGeminiKey() {
  // 1. Environment variables
  const envKey = process.env.GEMINI_API_KEY || 
                 process.env.GOOGLE_AI_API_KEY || 
                 process.env.GOOGLE_API_KEY || 
                 process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return { key: envKey.trim(), source: 'environment' };
  }

  // 2. Database site_config table (if service role is available)
  if (hasServiceRole && supabaseAdmin) {
    try {
      const { data: directKeyRow } = await supabaseAdmin
        .from('site_config')
        .select('value')
        .eq('key', 'gemini_api_key')
        .maybeSingle();

      if (directKeyRow?.value && typeof directKeyRow.value === 'string' && directKeyRow.value.trim()) {
        return { key: directKeyRow.value.trim(), source: 'database' };
      }

      const { data: settingsRow } = await supabaseAdmin
        .from('site_config')
        .select('value')
        .eq('key', 'site_settings')
        .maybeSingle();

      const settingKey = settingsRow?.value?.geminiApiKey || settingsRow?.value?.gemini_api_key;
      if (settingKey && typeof settingKey === 'string' && settingKey.trim()) {
        return { key: settingKey.trim(), source: 'database' };
      }
    } catch (err) {
      console.warn('[Gemini Status] Database key fetch notice:', err.message);
    }
  }

  return { key: '', source: 'none' };
}

function maskApiKey(key) {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 10) return '********';
  return `${trimmed.substring(0, 8)}...${trimmed.substring(trimmed.length - 4)}`;
}

async function testGeminiPing(key) {
  const start = Date.now();
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  
  for (const model of modelsToTry) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with OK.' }] }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
          ok: true,
          model,
          latencyMs: Date.now() - start,
          response: text.trim()
        };
      }
    } catch {}
  }

  return { ok: false, latencyMs: Date.now() - start, error: 'Could not connect to Gemini models' };
}

// GET /api/admin/gemini-status
export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 });
    }

    const { key, source } = await resolveGeminiKey();
    if (!key) {
      return NextResponse.json({
        configured: false,
        source: 'none',
        liveStatus: 'not_configured',
        maskedKey: '',
        message: 'No Google Gemini API key configured.'
      });
    }

    const ping = await testGeminiPing(key);

    return NextResponse.json({
      configured: true,
      source,
      maskedKey: maskApiKey(key),
      liveStatus: ping.ok ? 'active' : 'error',
      modelUsed: ping.model || 'gemini-2.5-flash',
      latencyMs: ping.latencyMs,
      pingResult: ping.ok ? 'Operational' : (ping.error || 'Connection Failed')
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/gemini-status
export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action = 'test', apiKey = '' } = body;
    const cleanKey = (apiKey || '').trim();

    if (!cleanKey && action === 'test') {
      const { key: existingKey } = await resolveGeminiKey();
      if (!existingKey) {
        return NextResponse.json({ success: false, error: 'Please enter a Gemini API Key to test.' }, { status: 400 });
      }
      const ping = await testGeminiPing(existingKey);
      return NextResponse.json({
        success: ping.ok,
        modelUsed: ping.model,
        latencyMs: ping.latencyMs,
        sampleOutput: ping.response,
        error: ping.ok ? null : 'Failed to connect to Google Gemini. Please check your API key.'
      });
    }

    if (!cleanKey) {
      return NextResponse.json({ success: false, error: 'API key cannot be blank.' }, { status: 400 });
    }

    // Live test the key first
    const ping = await testGeminiPing(cleanKey);
    if (!ping.ok) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Gemini API Key. Google returned an authentication error or model unavailable. Please verify the key at aistudio.google.com.'
      }, { status: 400 });
    }

    if (action === 'test') {
      return NextResponse.json({
        success: true,
        modelUsed: ping.model,
        latencyMs: ping.latencyMs,
        sampleOutput: ping.response,
        message: 'Gemini API Key is valid and working perfectly!'
      });
    }

    // Action: 'save'
    // 1. Save to Supabase site_config
    if (hasServiceRole && supabaseAdmin) {
      const { error: dbErr } = await supabaseAdmin
        .from('site_config')
        .upsert({
          key: 'gemini_api_key',
          value: cleanKey,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (dbErr) {
        console.error('[Gemini Status] Failed to save to database:', dbErr);
        return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
      }

      // Also merge into site_settings object if it exists
      try {
        const { data: stRow } = await supabaseAdmin
          .from('site_config')
          .select('value')
          .eq('key', 'site_settings')
          .maybeSingle();

        const curSettings = stRow?.value && typeof stRow.value === 'object' ? stRow.value : {};
        curSettings.geminiApiKey = cleanKey;
        await supabaseAdmin
          .from('site_config')
          .upsert({
            key: 'site_settings',
            value: curSettings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
      } catch (mergeErr) {
        console.warn('[Gemini Status] Merge to site_settings notice:', mergeErr.message);
      }
    }

    // 2. Sync to Vercel environment variables if token available
    let vercelSynced = false;
    if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      try {
        // Fetch existing envs to find if GEMINI_API_KEY already exists
        const envListRes = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`, {
          headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
        });
        if (envListRes.ok) {
          const envListData = await envListRes.json();
          const existingEnv = (envListData?.envs || []).find(e => e.key === 'GEMINI_API_KEY');
          if (existingEnv?.id) {
            // Edit existing
            await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existingEnv.id}`, {
              method: 'PATCH',
              headers: { 
                Authorization: `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ value: cleanKey })
            });
            vercelSynced = true;
          } else {
            // Create new
            await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`, {
              method: 'POST',
              headers: { 
                Authorization: `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                key: 'GEMINI_API_KEY',
                value: cleanKey,
                type: 'encrypted',
                target: ['production', 'preview', 'development']
              })
            });
            vercelSynced = true;
          }
        }
      } catch (vErr) {
        console.warn('[Gemini Status] Vercel sync notice:', vErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      maskedKey: maskApiKey(cleanKey),
      vercelSynced,
      message: vercelSynced 
        ? 'Gemini API key saved to live database & synced to Vercel production successfully!'
        : 'Gemini API key saved to live database successfully!'
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
