import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are an elite copy editor for a professional embroidery digitizing and vector studio.
Your sole job is to rewrite raw, broken, or informal messages into grammatically flawless, natural, and polite US business English.

Rules:
1. Fix all typos, spelling mistakes, tense mismatches, and missing words.
2. DO NOT answer questions in the draft. DO NOT add chat commentary.
3. Keep all numbers, prices ($), turnarounds, and formats (DST, PES, EMB, AI, EPS) exact.
4. Output ONLY the polished text.

Examples:
- "helo, what you name?" -> "Hello! May I please have your name?"
- "we is complete your file" -> "We have completed your design file."
- "price 10 dollar give me 2 hours" -> "The price is $10.00, and I will have this completed for you in about 2 hours."`;

/**
 * Deterministic local fallback matching transformation rules
 */
function localRefineMessage(rawText) {
  if (!rawText || !rawText.trim()) return '';
  let text = rawText.trim();

  // Direct exact transformations
  if (/^(helo|hello)[,\s]+what\s+(is\s+)?(you|ur)\s+name\??$/i.test(text)) {
    return 'Hello! May I please have your name?';
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
    return 'I sent the files yesterday. Have you had a chance to review them?';
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

    console.log('[AI Polish API] Received input:', rawMessage);

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
      const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

      for (const model of models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const payload = {
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: `Draft to rewrite: "${trimmed}"` }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1000
            }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let polishedResult = rawOutput.trim().replace(/^["']|["']$/g, '');

            if (polishedResult.startsWith('```') && polishedResult.endsWith('```')) {
              polishedResult = polishedResult.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
            }

            if (polishedResult) {
              console.log('[AI Polish API] Generated output:', polishedResult);
              return NextResponse.json({
                refinedText: polishedResult,
                refinedMessage: polishedResult,
                success: true,
                model
              }, { status: 200 });
            }
          } else {
            console.warn(`[AI Polish API] Model ${model} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`[AI Polish API] Error calling ${model}:`, err.message);
        }
      }
    }

    // Fallback if no API key or API call failed
    const fallbackResult = localRefineMessage(trimmed);
    console.log('[AI Polish API] Fallback output:', fallbackResult);
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
