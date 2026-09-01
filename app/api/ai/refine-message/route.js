import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a Master English Proofreader and Senior Client Support Director for an elite embroidery digitizing and vector design agency.

Your sole duty is to transform the user's raw draft into grammatically flawless, natural, native-level US English.

### MANDATORY GRAMMAR & TENSE CORRECTION PROTOCOLS:
1. **Full Tense & Verb Conjugation Alignment:**
   - Detect intended timeline (past, present continuous, future) and correct all broken tenses immediately.
   - Fix irregular verbs, missing auxiliary verbs ("is/are/have/will"), and broken subject-verb agreements.
   - Examples:
     * "I send file yesterday" -> "I sent the file yesterday."
     * "We are complete order" -> "We have completed your order." / "We will complete your order."
     * "I am digitize this" -> "I will digitize this for you."
     * "helo, what you name?" -> "Hello! May I please have your name?"

2. **Sentence Flow & Preposition Fixes:**
   - Fix wrong prepositions ("in machine", "at tomorrow", "on email" -> "for the machine", "by tomorrow", "via email").
   - Turn broken fragments into smooth, professional business sentences.

3. **Domain Vocabulary Integrity:**
   - Correctly integrate terms: Stitch count, DST, PES, EMB, AI, EPS, Vector art, Underlay, Pull compensation, 3D puff, Merrowed border.
   - Preserve exact figures, measurements, prices ($), and timelines.

4. **Output Constraints:**
   - Return ONLY the finalized, grammatically perfect message.
   - DO NOT provide explanations, corrections breakdown, or greeting quotes.`;

/**
 * Intelligent Rule-Based Studio Message Polish Engine (Fallback when no API Key is set)
 */
function localRefineMessage(rawText) {
  if (!rawText || !rawText.trim()) return '';
  let text = rawText.trim();

  // Common quick shorthand and typo pattern expansions
  if (/^(done check|done file check|done pls check|check file|file ready)$/i.test(text.trim())) {
    return 'We have completed your design! Please take a look at the attached preview and let us know if you need any adjustments.';
  }
  
  if (/^tell me format( dst pes)?/i.test(text)) {
    return 'Could you please specify your preferred machine embroidery file format (e.g., DST, PES, EMB, EXP, JEF) or vector format (AI, EPS, SVG, PDF)?';
  }

  if (/^(helo|hello)[,\s]+what\s+(is\s+)?(you|ur)\s+name\??$/i.test(text)) {
    return 'Hello! May I please have your name?';
  }

  // Tense & broken verb correction replacements
  const replacements = [
    [/\bhelo\b/gi, 'Hello'],
    [/\bhw r u\b/gi, 'How are you?'],
    [/\bwhat you name\b/gi, 'what is your name'],
    [/\bwhat ur name\b/gi, 'what is your name'],
    [/\bi send you yesterday file\b/gi, 'I sent you the file yesterday'],
    [/\bi send file yesterday\b/gi, 'I sent the file yesterday'],
    [/\bwe are complete your order\b/gi, 'We have completed your order'],
    [/\bwe are complete order\b/gi, 'We have completed your order'],
    [/\bi am digitize this\b/gi, 'I will digitize this for you'],
    [/\bhe say give me discount\b/gi, 'He asked if we could provide a discount'],
    [/\bprice 15 dollar give me 2 hour\b/gi, 'The price is $15, and we can deliver the completed files within 2 hours'],
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

  // Basic whitespace normalization
  text = text.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of sentences
  text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  // Ensure ending punctuation
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }

  // Prepend polite greeting if missing
  const hasGreeting = /^(hi|hello|dear|good morning|good afternoon|good evening|hey|thank you|thanks|we have|please|i sent|we will|may i)\b/i.test(text);
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
                parts: [{ text: `Draft to proofread and correct:\n${message}` }]
              }
            ],
            generationConfig: {
              temperature: 0.15,
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
                refinedText: polished,
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
      refinedText: fallbackRefined,
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
