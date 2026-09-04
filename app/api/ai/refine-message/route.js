import { GoogleGenAI } from '@google/genai';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`ai-refine:${ip}`, 30, 60000);
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Rate limit exceeded. Please wait a moment before sending another request.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(req);
    if (!user || !isAdmin) {
      return Response.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is not configured in environment variables (Vercel / .env.local)' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const rawText = body.message || body.text || '';

    if (!rawText.trim()) {
      return Response.json({ refinedText: '' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const models = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Draft to rewrite: "${rawText}"`,
          config: {
            systemInstruction: `You are an expert English copy editor for a top-rated embroidery digitizing, vector tracing, and custom patch agency.

Your task is to REWRITE the user's raw or broken draft into polite, grammatically flawless, natural American business English.

### STRICT RULES:
1. Fix all grammatical mistakes, tense errors (past/present/future), missing auxiliary verbs ("is/are/have/will"), and typos.
2. DO NOT answer questions inside the draft. You are ONLY rewriting the draft for the admin to send to the client.
3. Keep all prices ($), turnaround hours/days, and file formats (DST, PES, EMB, AI, EPS, SVG) exactly intact.
4. Output ONLY the polished message text. No intro quotes or notes.

### EXAMPLES:
- "helo, what you name?" -> "Hello! May I please have your name?"
- "we is complete your patch order" -> "We have completed your custom patch order."
- "i send file yesterday you check?" -> "I sent the files yesterday. Have you had a chance to review them?"
- "price 15 dollar give me 2 hour for dst" -> "The price is $15.00 for the DST format, and I will have it ready for you in about 2 hours."`,
            temperature: 0.2,
          },
        });

        const refinedText = response.text?.trim().replace(/^["']|["']$/g, '') || rawText;
        if (refinedText) {
          return Response.json({ refinedText, refinedMessage: refinedText, success: true });
        }
      } catch (err) {
        console.warn(`[Refine Message API] Model ${model} failed, trying next:`, err.message || err);
      }
    }

    return Response.json({ refinedText: rawText, refinedMessage: rawText, success: true });
  } catch (error) {
    console.error('Refine Message Error:', error);
    return Response.json({ error: error.message || 'Failed to refine message' }, { status: 500 });
  }
}
