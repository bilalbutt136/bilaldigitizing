import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a professional customer support assistant for an embroidery digitizing and vector art studio (B Digitizing Studio). 
Your job is to rewrite the admin's draft message into clean, polite, clear, and professional English suitable for client communication.
Rules:
- Keep the original meaning and core details (pricing, turnaround time, file formats like DST/PES/EMB, stitch count, revisions).
- Make it courteous, welcoming, and concise.
- Preserve order numbers or links if present.
- Output ONLY the polished message text. Do not add conversational intro/outro, disclaimers, or quotes.`;

/**
 * Intelligent Rule-Based Studio Message Polish Engine (Fallback when no API Key is set)
 */
function localRefineMessage(rawText) {
  if (!rawText || !rawText.trim()) return '';
  let text = rawText.trim();

  // Basic cleanup
  text = text.replace(/\s+/g, ' ');

  // Common quick shorthand replacements
  const replacements = [
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
    [/\bive\b/gi, "I've"],
    [/\bill\b/gi, "I'll"],
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
    [/\b3d puff\b/gi, '3D Puff'],
    [/\bqc\b/gi, 'Quality Control']
  ];

  replacements.forEach(([pattern, repl]) => {
    text = text.replace(pattern, repl);
  });

  // Capitalize first letter of sentences
  text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  // Ensure ending punctuation
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }

  // Prepend polite greeting if missing
  const hasGreeting = /^(hi|hello|dear|good morning|good afternoon|good evening|hey|thank you|thanks)\b/i.test(text);
  if (!hasGreeting) {
    text = `Hello! ${text}`;
  }

  return text;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = body?.message ? String(body.message).trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    ).trim();

    if (apiKey) {
      const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

      for (const model of models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const payload = {
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: `Draft to polish:\n${message}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1000
            }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let polished = rawOutput.trim();

            // Strip leading/trailing quotes if the model wrapped the response
            if ((polished.startsWith('"') && polished.endsWith('"')) || (polished.startsWith("'") && polished.endsWith("'"))) {
              polished = polished.substring(1, polished.length - 1).trim();
            }

            if (polished) {
              return NextResponse.json({
                refinedMessage: polished,
                originalMessage: message,
                model: model
              });
            }
          } else {
            console.warn(`[Gemini API Refiner] Model ${model} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`[Gemini API Refiner] Error calling ${model}:`, err.message);
        }
      }
    }

    // Fallback if no API key or API call failed
    const fallbackRefined = localRefineMessage(message);
    return NextResponse.json({
      refinedMessage: fallbackRefined,
      originalMessage: message,
      model: 'studio-refiner-fallback'
    });

  } catch (error) {
    console.error('[AI Refine Message Route Error]:', error);
    return NextResponse.json(
      { error: 'Failed to refine message: ' + error.message },
      { status: 500 }
    );
  }
}
