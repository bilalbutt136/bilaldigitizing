import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an elite Senior Customer Success Manager for an industry-leading embroidery digitizing and vector conversion studio.

Your task is to take raw, informal, or broken drafts written by the admin and rewrite them into flawless, polite, crystal-clear, and professional US business English.

### STRICT EDITING RULES:
1. Tone & Style:
   - Warm, confident, professional, and courteous (Native US B2B customer service standard).
   - Natural phrasing—never sound robotic, overly robotic/academic, or like a machine translation.
   - Use standard embroidery/vector terminology correctly (e.g., stitch count, underlay, pull compensation, 3D puff, sew-out, vector path, DST, PES, EMB, AI, EPS).

2. Correction Scope:
   - Fix all grammatical errors, tense mismatches, misspellings, and awkward sentence structures.
   - Expand shorthand naturally into complete, respectful client responses (e.g., "done check" -> "We have completed your design! Please take a look at the attached preview and let us know if you need any adjustments.").

3. Preservation:
   - Retain ALL exact numbers, pricing ($), dimensions, turn-around hours, and file format extensions mentioned in the draft.

4. Output Constraints:
   - Return ONLY the finalized, ready-to-send message text.
   - DO NOT include greetings like "Here is your refined message:" or any surrounding quotation marks.`;

/**
 * Intelligent Rule-Based Studio Message Polish Engine (Fallback when no API Key is set)
 */
function localRefineMessage(rawText) {
  if (!rawText || !rawText.trim()) return '';
  let text = rawText.trim();

  // Common quick shorthand and pattern expansions
  const lower = text.toLowerCase();
  
  if (/^(done check|done file check|done pls check|check file|file ready)$/i.test(text.trim())) {
    return 'We have completed your design! Please take a look at the attached preview and let us know if you need any adjustments.';
  }
  
  if (/^tell me format( dst pes)?/i.test(text)) {
    return 'Could you please specify your preferred machine embroidery file format (e.g., DST, PES, EMB, EXP, JEF) or vector format (AI, EPS, SVG, PDF)?';
  }

  // Basic whitespace normalization
  text = text.replace(/\s+/g, ' ');

  // Standard replacements
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
  const hasGreeting = /^(hi|hello|dear|good morning|good afternoon|good evening|hey|thank you|thanks|we have|please)\b/i.test(text);
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

            // Strip leading/trailing quotes or markdown codeblocks if model wrapped output
            if (polished.startsWith('```') && polished.endsWith('```')) {
              polished = polished.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
            }
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
