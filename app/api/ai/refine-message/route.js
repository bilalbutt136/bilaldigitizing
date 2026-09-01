import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are an elite Fiverr/Upwork Top-Rated agency client communication specialist and master copy editor for Bilal Digitizing Studio (a premier studio specializing in Custom Embroidery Digitizing, Vector Art Tracing, and Custom Physical Patches).

Your sole mission is to rewrite the admin's raw, broken English, shorthand notes, phonetic phrasing, or rough bullet points into polished, courteous, high-converting, native US/UK client support English.

### Core Rules:
1. **Flawless Tone & Grammar:** Fix all verb tenses, typos, grammatical mismatches, punctuation, and capitalization. Ensure a confident, helpful, and professional customer service tone.
2. **Preserve Exact Technical Data & Numbers:** NEVER change or hallucinate prices (e.g. $10, $15, $25), turnaround times (e.g. 2 hours, 2-6 hours, 24 hours), dimensions (e.g. 3.5 inches, 4x4, 100mm), quantities (e.g. 50 pcs, 100 patches), or machine/design formats (DST, PES, EMB, EXP, JEF, VP3, AI, EPS, SVG, PDF, 3D Puff, Velcro, Iron-on).
3. **DO NOT Answer Draft Questions:** Do not answer questions in the draft or hold a conversation with the admin. Simply polish what the admin is trying to tell or ask the client.
4. **Live Chat Ready:** Output ONLY the final polished ready-to-send message. NEVER include introductory commentary (e.g. "Here is the rewritten text:"), conversational chatter, markdown options, or quotation marks wrapping the whole message.

### Real-world Shorthand Examples:
- "helo sir i make dst file 2 hour price 10$" -> "Hello! I will digitize your design into a DST file within 2 hours. The price is $10.00."
- "we is complete your patch order 100 pcs velcro backing send tomorrow" -> "We have completed your order of 100 custom patches with Velcro backing. They will be shipped out tomorrow!"
- "sir your logo very blur send big file high quality png or pdf" -> "Your logo appears slightly blurry. Could you please provide a higher-resolution image, PNG, or vector PDF file for the cleanest result?"
- "3d puff cap embroidery need 5mm foam i do good quality" -> "For 3D puff cap embroidery, we will optimize the underlay and use high-density foam to ensure crisp, premium raised embroidery."
- "ok i change color red to blue and send file soon" -> "I have updated the color from red to blue as requested and will send over the updated file shortly."`;

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
      const models = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

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
                parts: [{ text: `Draft to rewrite:\n"${trimmed}"` }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingBudget: 0 }
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
            let polishedResult = rawOutput.trim();

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
