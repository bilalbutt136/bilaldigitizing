import { NextResponse } from 'next/server.js';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin.js';

export const dynamic = 'force-dynamic';

/**
 * Resolves Gemini API Key dynamically from environment variables,
 * database site_config, or client-provided override.
 */
async function resolveGeminiApiKey(overrideKey = '') {
  if (overrideKey && typeof overrideKey === 'string' && overrideKey.trim()) {
    return overrideKey.trim();
  }

  // 1. Process environment variables
  const envKey = process.env.GEMINI_API_KEY || 
                 process.env.GOOGLE_AI_API_KEY || 
                 process.env.GOOGLE_API_KEY || 
                 process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  // 2. Database site_config table (Live settings persistence)
  if (hasServiceRole && supabaseAdmin) {
    try {
      const { data: directKeyRow } = await supabaseAdmin
        .from('site_config')
        .select('value')
        .eq('key', 'gemini_api_key')
        .maybeSingle();

      if (directKeyRow?.value && typeof directKeyRow.value === 'string' && directKeyRow.value.trim()) {
        return directKeyRow.value.trim();
      }

      const { data: settingsRow } = await supabaseAdmin
        .from('site_config')
        .select('value')
        .eq('key', 'site_settings')
        .maybeSingle();

      const settingKey = settingsRow?.value?.geminiApiKey || settingsRow?.value?.gemini_api_key;
      if (settingKey && typeof settingKey === 'string' && settingKey.trim()) {
        return settingKey.trim();
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      text, 
      tone = 'professional', 
      target = 'chat', // 'chat' | 'email_subject' | 'email_body'
      customKey = '' 
    } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Please enter a message to polish.' }, { status: 400 });
    }

    const rawInput = text.trim();
    const apiKey = await resolveGeminiApiKey(customKey);

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
    if (target === 'email_subject') {
      targetInstruction = `You are polishing an EMAIL SUBJECT LINE for a commercial embroidery digitizing and vector art studio.
- Return a single compelling, clear, professional subject line.
- Do NOT use all-caps spam words or exclamation abuse.
- Keep it under 65 characters if possible.
- Do NOT wrap in quotes.`;
    } else if (target === 'email_body') {
      targetInstruction = `You are polishing a CUSTOMER MARKETING OR TRANSACTIONAL EMAIL for "BDigitizing".
- Format with a polite greeting, clear well-spaced paragraphs, and a professional studio sign-off.
- Tone should be ${tone === 'promotional' ? 'engaging, energetic, and value-focused' : 'courteous, warm, and professional'}.
- Do NOT use HTML tags. Return clean normal text with blank lines between paragraphs.`;
    } else {
      targetInstruction = `You are polishing a LIVE CUSTOMER SUPPORT CHAT MESSAGE for "BDigitizing" (commercial embroidery digitizing, custom patch manufacturing, and vector art conversion studio).
- Tone: ${tone === 'friendly' ? 'Warm, helpful, courteous' : tone === 'concise' ? 'Direct, clear, concise' : 'Professional, polite, and reassuring studio English'}.
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
        target,
        tone,
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
