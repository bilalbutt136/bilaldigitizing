import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server.js';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin.js';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth.js';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit.js';

export const dynamic = 'force-dynamic';

/**
 * Resolves Gemini API Key only from server-controlled configuration.
 */
async function resolveGeminiApiKey() {
  const envKey = process.env.GEMINI_API_KEY ||
                 process.env.GOOGLE_AI_API_KEY ||
                 process.env.GOOGLE_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  if (hasServiceRole && supabaseAdmin) {
    try {
      const { data: privateRow } = await supabaseAdmin
        .from('private_server_config')
        .select('value')
        .eq('key', 'gemini_api_key')
        .maybeSingle();

      const privateValue = privateRow?.value;
      const privateKey = typeof privateValue === 'string'
        ? privateValue
        : (privateValue?.apiKey || privateValue?.key || '');
      if (privateKey && String(privateKey).trim()) {
        return String(privateKey).trim();
      }

      // Temporary server-only legacy fallback until migration cleanup completes.
      const { data: directKeyRow } = await supabaseAdmin
        .from('site_config')
        .select('value')
        .eq('key', 'gemini_api_key')
        .maybeSingle();

      const directValue = directKeyRow?.value;
      const directKey = typeof directValue === 'string'
        ? directValue
        : (directValue?.apiKey || directValue?.key || '');
      if (directKey && String(directKey).trim()) {
        return String(directKey).trim();
      }

      const { data: settingsRow } = await supabaseAdmin
        .from('site_config')
        .select('value')
        .eq('key', 'site_settings')
        .maybeSingle();

      const settingKey = settingsRow?.value?.geminiApiKey || settingsRow?.value?.gemini_api_key;
      if (settingKey && String(settingKey).trim()) {
        return String(settingKey).trim();
      }
    } catch (err) {
      console.warn('[AI Polish API] Database key lookup notice:', err.message);
    }
  }

  return '';
}

/**
 * Executes direct HTTPS REST request to Google Gemini API
 * as a high-reliability fallback if the SDK encounters issues.
 */
async function generateViaDirectRest(modelName, systemPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }]
    })
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Direct REST ${modelName} returned status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

/**
 * Cleans and un-quotes model output, removing markdown fences or commentary.
 */
function cleanModelOutput(text) {
  if (!text) return '';
  let cleaned = text.trim();

  // Strip Markdown code block wrappers e.g. ```text ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/g, '$1').trim();

  // Strip outer quotes
  cleaned = cleaned.replace(/^["'“]([\s\S]*?)["'”]$/g, '$1').trim();

  // Strip intro headers like "Polished message:" or "Here is the refined version:"
  cleaned = cleaned.replace(/^(here\s+(is|are)\s+the\s+polished\s+(message|version|draft):?|polished\s+(message|draft):?)\s*/i, '').trim();

  return cleaned;
}

async function POST_impl(request) {
  try {
    const { user } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateLimit = await checkDistributedRateLimit(`ai-polish:${user.id || ip}`, 30, 5 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.unavailable ? 'AI assistance is temporarily unavailable.' : 'Too many AI polish requests. Please wait and try again.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      text,
      tone = 'professional',
      target = 'chat'
    } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Please enter a message to polish.' }, { status: 400 });
    }

    const rawInput = text.trim().slice(0, 5000);
    const allowedTargets = new Set(['chat', 'email_subject', 'email_body']);
    const allowedTones = new Set(['professional', 'friendly', 'concise', 'promotional']);
    const safeTarget = allowedTargets.has(target) ? target : 'chat';
    const safeTone = allowedTones.has(tone) ? tone : 'professional';
    const apiKey = await resolveGeminiApiKey();

    // If no key is configured anywhere, provide a structured error and clean fallback
    if (!apiKey) {
      console.warn('[AI Polish API] No Gemini API key found in environment or database.');
      const fallbackClean = rawInput
        .replace(/\s+/g, ' ')
        .replace(/(^\w|\.\s+\w)/gm, c => c.toUpperCase());
      return NextResponse.json({
        success: false,
        isAiGenerated: false,
        notice: 'Google Gemini API key not configured. Please add your key in Admin Settings > Security.',
        error: 'Missing Google Gemini API Key. Please configure GEMINI_API_KEY in Admin Settings or Vercel.',
        polishedText: fallbackClean,
        originalText: rawInput
      }, { status: 200 });
    }

    // Contextual system prompt based on target
    let targetInstruction = '';
    if (safeTarget === 'email_subject') {
      targetInstruction = `You are polishing an EMAIL SUBJECT LINE for a commercial embroidery digitizing and vector art studio.
- Return a single compelling, clear, professional subject line.
- Do NOT use all-caps spam words or exclamation abuse.
- Keep it under 65 characters if possible.
- Do NOT wrap in quotes.`;
    } else if (safeTarget === 'email_body') {
      targetInstruction = `You are polishing a CUSTOMER MARKETING OR TRANSACTIONAL EMAIL for "BDigitizing".
- Format with a polite greeting, clear well-spaced paragraphs, and a professional studio sign-off.
- Tone should be ${safeTone === 'promotional' ? 'engaging, energetic, and value-focused' : 'courteous, warm, and professional'}.
- Do NOT use HTML tags. Return clean normal text with blank lines between paragraphs.`;
    } else {
      targetInstruction = `You are polishing a LIVE CUSTOMER SUPPORT CHAT MESSAGE for "BDigitizing" (commercial embroidery digitizing, custom patch manufacturing, and vector art conversion studio).
- Tone: ${safeTone === 'friendly' ? 'Warm, helpful, courteous' : safeTone === 'concise' ? 'Direct, clear, concise' : 'Professional, polite, and reassuring studio English'}.
- Fix all spelling, typos, and grammatical errors.`;
    }

    const systemPrompt = `You are a high-level customer communication assistant for "BDigitizing" (an international commercial embroidery digitizing, custom patch manufacturing, and vector art studio).
Your task is to refine, elevate, and polish the user's draft into crystal-clear, professional studio English.

${targetInstruction}

CRITICAL RULES:
1. MULTILINGUAL / ROMAN URDU TRANSLATION: If the draft is written in Roman Urdu / Hindi (e.g., "bhai file check kar lo", "stitch count kam kar do", "discount mil sakta hai") or broken shorthand notes, understand the intent and rewrite it directly into fluent, professional English.
2. PRESERVE TECHNICAL DETAILS: Never alter or remove technical digitizing terms and file extensions (DST, PES, EMB, EXP, JEF, VP3, OFM, HUS, XXX, ART, AI, EPS, SVG, CDR, PDF, PNG, JPG, JPEG, WEBP; stitch counts; measurements in inches/mm; turnaround hours/days; pricing/dollar amounts).
3. NO META COMMENTARY: Return ONLY the final polished message text. Do NOT add notes like "Here is your message:", "Sure, here you go:", or quotes.

Draft to polish:
${rawInput}`;

    let polishedText = '';
    let modelUsed = '';
    let aiError = null;

    // Multi-tier model cascade
    // Tier 1: gemini-2.5-flash via @google/genai SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt
      });
      polishedText = cleanModelOutput(res?.text || '');
      if (polishedText) modelUsed = 'gemini-2.5-flash';
    } catch (err1) {
      aiError = err1;
      console.warn('[AI Polish API] Tier 1 (gemini-2.5-flash SDK) failed:', err1.message);

      // Tier 2: gemini-3.8-flash via @google/genai SDK
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res2 = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: systemPrompt
        });
        polishedText = cleanModelOutput(res2?.text || '');
        if (polishedText) modelUsed = 'gemini-3.8-flash';
      } catch (err2) {
        aiError = err2;
        console.warn('[AI Polish API] Tier 2 (gemini-3.8-flash SDK) failed:', err2.message);

        // Tier 3: Direct REST API with gemini-2.5-flash
        try {
          polishedText = cleanModelOutput(await generateViaDirectRest('gemini-2.5-flash', systemPrompt, apiKey));
          if (polishedText) modelUsed = 'gemini-2.5-flash (REST)';
        } catch (err3) {
          aiError = err3;
          console.warn('[AI Polish API] Tier 3 (gemini-2.5-flash REST) failed:', err3.message);

          // Tier 4: Direct REST API with gemini-3.8-flash
          try {
            polishedText = cleanModelOutput(await generateViaDirectRest('gemini-3.8-flash', systemPrompt, apiKey));
            if (polishedText) modelUsed = 'gemini-3.8-flash (REST)';
          } catch (err4) {
            aiError = err4;
            console.warn('[AI Polish API] Tier 4 (gemini-3.8-flash REST) failed:', err4.message);

            // Tier 5: Direct REST API with gemini-2.5-pro
            try {
              polishedText = cleanModelOutput(await generateViaDirectRest('gemini-2.5-pro', systemPrompt, apiKey));
              if (polishedText) modelUsed = 'gemini-2.5-pro (REST)';
            } catch (err5) {
              aiError = err5;
              console.error('[AI Polish API] All Gemini tiers exhausted:', err5.message);
            }
          }
        }
      }
    }

    if (polishedText) {
      return NextResponse.json({
        success: true,
        isAiGenerated: true,
        modelUsed,
        target: safeTarget,
        tone: safeTone,
        originalText: rawInput,
        polishedText
      });
    }

    // If all models failed, provide an honest baseline with descriptive error
    const fallbackClean = rawInput
      .replace(/\s+/g, ' ')
      .replace(/(^\w|\.\s+\w)/gm, c => c.toUpperCase());

    return NextResponse.json({
      success: false,
      isAiGenerated: false,
      error: `Gemini service temporarily unavailable: ${aiError?.message || 'Quota limit or connection error'}.`,
      notice: 'Gemini request could not complete. Basic formatting applied.',
      originalText: rawInput,
      polishedText: fallbackClean
    }, { status: 200 });

  } catch (err) {
    console.error('[AI Polish API Root Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = withApiObservability(POST_impl);
