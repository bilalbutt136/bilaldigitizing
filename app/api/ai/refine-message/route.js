import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are an expert English copy editor and customer support lead for a professional embroidery digitizing and vector studio.

Your task is to REWRITE the user's raw message into grammatically flawless, natural, and polite US business English.

### MANDATORY RULES:
1. Fix all typos, spelling errors, broken verb tenses, and missing auxiliary verbs (e.g., "is/are/do/have/will").
2. Rephrase broken sentence structures into smooth, fluent client-ready statements or questions.
3. Keep all specific numbers, prices ($), turnaround times, and file format extensions (DST, PES, EMB, AI, EPS, SVG) intact.
4. DO NOT reply to the message. DO NOT answer questions in the draft. You are ONLY rewriting the draft for the admin to send to their client.
5. Return ONLY the finalized polished message text. No quotes, no intro ("Here is the refined text:"), and no explanations.

### EXAMPLES OF TRANSFORMATIONS:
- "helo, what you name?" -> "Hello! May I please have your name?"
- "i send file yesterday you check?" -> "I sent the files yesterday. Have you had a chance to review them?"
- "we is complete your patch order" -> "We have completed your custom patch order."
- "give me 2 hour i digitize this" -> "Please give me about 2 hours, and I will digitize this for you."
- "price 15 dollar for dst format" -> "The price is $15.00 for the DST embroidery format."`;

/**
 * Deterministic local fallback matching few-shot transformation rules
 */
function localRefineMessage(rawText) {
  if (!rawText || !rawText.trim()) return '';
  let text = rawText.trim();

  // Direct exact/pattern transformations
  if (/^(helo|hello)[,\s]+what\s+(is\s+)?(you|ur)\s+name\??$/i.test(text)) {
    return 'Hello! May I please have your name?';
  }

  if (/^i send file yesterday you check\??/i.test(text)) {
    return 'I sent the files yesterday. Have you had a chance to review them?';
  }

  if (/^we (is|are) complete your (patch )?order/i.test(text)) {
    return 'We have completed your custom patch order.';
  }

  if (/^give me 2 hour i digitize this/i.test(text)) {
    return 'Please give me about 2 hours, and I will digitize this for you.';
  }

  if (/^price 15 dollar for dst format/i.test(text)) {
    return 'The price is $15.00 for the DST embroidery format.';
  }

  if (/^(done check|done file check|done pls check|check file|file ready)$/i.test(text)) {
    return 'We have completed your design! Please take a look at the attached preview and let us know if you need any adjustments.';
  }
  
  if (/^tell me format( dst pes)?/i.test(text)) {
    return 'Could you please specify your preferred machine embroidery file format (e.g., DST, PES, EMB, EXP, JEF) or vector format (AI, EPS, SVG, PDF)?';
  }

  // Common replacements for grammar and typos
  const replacements = [
    [/\bhelo\b/gi, 'Hello'],
    [/\bhw r u\b/gi, 'How are you?'],
    [/\bwhat you name\b/gi, 'what is your name'],
    [/\bwhat ur name\b/gi, 'what is your name'],
    [/\bi send you yesterday file\b/gi, 'I sent you the file yesterday'],
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
    [/\bsvg\b/gi, 'SVG'],
    [/\b3d puff\b/gi, '3D Puff']
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
    const message = body?.message ? String(body.message).trim() : '';

    if (!message) {
      return NextResponse.json({ refinedText: '', refinedMessage: '' });
    }

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
                parts: [{ text: `Raw draft to rewrite: "${message}"` }]
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
            let polished = rawOutput.trim().replace(/^["']|["']$/g, '');

            if (polished.startsWith('```') && polished.endsWith('```')) {
              polished = polished.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
            }

            if (polished) {
              return NextResponse.json({
                refinedText: polished,
                refinedMessage: polished,
                originalMessage: message,
                model
              });
            }
          } else {
            console.warn(`[Gemini AI Polish] Model ${model} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`[Gemini AI Polish] Error calling ${model}:`, err.message);
        }
      }
    }

    // Fallback if no API key or API call failed
    const fallbackRefined = localRefineMessage(message);
    return NextResponse.json({
      refinedText: fallbackRefined,
      refinedMessage: fallbackRefined,
      originalMessage: message,
      model: 'studio-refiner-fallback'
    });

  } catch (error) {
    console.error('AI Polish error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refine message' }, { status: 500 });
  }
}
