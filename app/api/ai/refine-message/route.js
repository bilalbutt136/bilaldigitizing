import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are an elite Fiverr Top-Rated Seller & Customer Success Specialist for an embroidery digitizing, vector art, and custom patch studio.

The user will provide rough, broken English, shorthand notes, or informal phrases. Your job is to REWRITE it into warm, polite, confident, and grammatically flawless American business English.

### RULES:
1. Correct all broken tenses, missing words ("is/are/have/will"), and typos.
2. Maintain all business data: retain exact prices ($), delivery times (hours/days), stitch counts, sizes, and file extensions (DST, PES, EMB, AI, EPS, SVG).
3. If the input is very short (e.g., "done check file", "price 10 give 2 hour"), expand it naturally into a complete, professional sentence.
4. Output ONLY the polished message text ready to send to the client. No intro, no explanations, no wrapping quotation marks.

### EXAMPLES:
- "helo what you name?" -> "Hello! Thank you for reaching out. May I please know your name?"
- "i send file yesterday check it" -> "I sent over your files yesterday. Have you had a chance to review them?"
- "price 15 dollar give me 2 hour for dst format" -> "The price for the DST format will be $15.00, and I will have it ready for you in about 2 hours."
- "we make patch iron on velcro both available" -> "We can produce custom physical patches with either iron-on or Velcro (hook & loop) backing based on your preference."`;

/**
 * Deterministic local fallback matching transformation rules
 */
function localRefineMessage(rawText) {
  if (!rawText || !rawText.trim()) return '';
  let text = rawText.trim();

  // Direct exact transformations
  if (/^(helo|hello)[,\s]+what\s+(is\s+)?(you|ur)\s+name\??$/i.test(text)) {
    return 'Hello! Thank you for reaching out. May I please know your name?';
  }

  if (/^we (is|are) complete your (file|patch order|order)/i.test(text)) {
    return 'We have completed your design file.';
  }

  if (/^price 10 dollar give me 2 hours?/i.test(text)) {
    return 'The price is $10.00, and I will have this completed for you in about 2 hours.';
  }

  if (/^give me 2 hour i digitize this/i.test(text)) {
    return 'Please give me about 2 hours, and I will digitize this for you.';
  }

  if (/^i send file yesterday you check\??/i.test(text)) {
    return 'I sent over your files yesterday. Have you had a chance to review them?';
  }

  const replacements = [
    [/\bhelo\b/gi, 'Hello'],
    [/\bhw r u\b/gi, 'How are you?'],
    [/\bwhat you name\b/gi, 'what is your name'],
    [/\bwhat ur name\b/gi, 'what is your name'],
    [/\bi send file yesterday\b/gi, 'I sent the file yesterday'],
    [/\bwe is complete\b/gi, 'we have completed'],
    [/\bwe are complete\b/gi, 'we have completed'],
    [/\bi am digitize\b/gi, 'I will digitize'],
    [/\bu\b/gi, 'you'],
    [/\bur\b/gi, 'your'],
    [/\br\b/gi, 'are'],
    [/\bplz\b|\bpls\b/gi, 'please'],
    [/\bthx\b|\btnx\b|\bty\b/gi, 'thank you'],
    [/\basap\b/gi, 'as soon as possible'],
    [/\bwont\b/gi, "won't"],
    [/\bcant\b/gi, "can't"],
    [/\bdont\b/gi, "don't"],
    [/\bthats\b/gi, "that's"],
    [/\bive\b/gi, "I have"],
    [/\bill\b/gi, "I will"],
    [/\bim\b/gi, "I am"],
    [/\bdst\b/gi, 'DST'],
    [/\bpes\b/gi, 'PES'],
    [/\bemb\b/gi, 'EMB'],
    [/\bexp\b/gi, 'EXP'],
    [/\bjef\b/gi, 'JEF'],
    [/\bpdf\b/gi, 'PDF'],
    [/\bai\b/gi, 'AI'],
    [/\beps\b/gi, 'EPS'],
    [/\bsvg\b/gi, 'SVG']
  ];

  replacements.forEach(([pattern, repl]) => {
    text = text.replace(pattern, repl);
  });

  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  if (!/[.!?]$/.test(text)) {
    text += '.';
  }

  const hasGreeting = /^(hi|hello|dear|good morning|good afternoon|good evening|hey|thank you|thanks|we have|please|i sent|we will|may i)\b/i.test(text);
  if (!hasGreeting) {
    text = `Hello! ${text}`;
  }

  return text;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMessage = body?.message || body?.text || '';

    if (!rawMessage || !String(rawMessage).trim()) {
      return NextResponse.json({ refinedText: '', refinedMessage: '', success: true }, { status: 200 });
    }

    const trimmed = String(rawMessage).trim();
    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    ).trim();

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const models = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

      for (const model of models) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `Draft to rewrite: "${trimmed}"`,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.2,
            },
          });

          let polishedResult = response.text?.trim() || '';

          if (polishedResult.startsWith('```') && polishedResult.endsWith('```')) {
            polishedResult = polishedResult.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
          }
          if ((polishedResult.startsWith('"') && polishedResult.endsWith('"')) || (polishedResult.startsWith("'") && polishedResult.endsWith("'"))) {
            polishedResult = polishedResult.substring(1, polishedResult.length - 1).trim();
          }

          if (polishedResult) {
            return NextResponse.json({
              refinedText: polishedResult,
              refinedMessage: polishedResult,
              success: true,
              model
            }, { status: 200 });
          }
        } catch (err) {
          console.warn(`[AI Polish API] Model ${model} failed, trying next:`, err.message || err);
        }
      }
    }

    // Fallback if no API key or API call failed
    const fallbackResult = localRefineMessage(trimmed);
    return NextResponse.json({
      refinedText: fallbackResult,
      refinedMessage: fallbackResult,
      success: true,
      model: 'studio-refiner-fallback'
    }, { status: 200 });

  } catch (error) {
    console.error('[AI Polish API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refine message' }, { status: 500 });
  }
}
