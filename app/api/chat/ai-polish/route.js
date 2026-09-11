import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, tone = 'professional', context = '' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Please enter a message to polish.' }, { status: 400 });
    }

    const rawInput = text.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn('[AI Polish API] Missing GEMINI_API_KEY environment variable.');
      // Graceful fallback capitalization and basic cleanup if no API key
      const fallbackClean = rawInput
        .replace(/\s+/g, ' ')
        .replace(/(^\w|\.\s+\w)/gm, c => c.toUpperCase());
      return NextResponse.json({
        success: true,
        polishedText: fallbackClean,
        notice: 'AI key not configured; formatted using standard grammar baseline.'
      });
    }

    const systemPrompt = `You are a professional customer communication assistant for "Bilal Digitizing" (an international commercial embroidery digitizing, custom patch manufacturing, and vector art conversion studio).
Your task is to rewrite, refine, and polish the user's draft message to make it polite, courteous, fluent, and crystal-clear.

CRITICAL INSTRUCTIONS:
1. Fix all typos, spelling mistakes, and grammatical errors.
2. Tone: Courteous, professional, warm, and helpful studio English.
3. Preserve all technical digitizing details exactly as intended (e.g. file extensions like DST, PES, EMB, EXP, JEF, AI, EPS, SVG, PDF; stitch counts; width/height measurements in inches/mm; turnaround times; price figures).
4. Do NOT add unnecessary fluff, long introductory pleasantries, or placeholders.
5. Return ONLY the final polished message text. Do NOT wrap in quotes, do NOT add introductory notes, commentary, or explanations.

Draft message to polish:
${rawInput}`;

    const ai = new GoogleGenAI({ apiKey });

    let polishedText = '';

    // Primary: gemini-2.5-flash
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt
      });
      polishedText = (response?.text || '').trim();
    } catch (primaryErr) {
      console.warn('[AI Polish API] gemini-2.5-flash warning:', primaryErr.message);
      // Fallback: gemini-1.5-flash
      try {
        const response2 = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: systemPrompt
        });
        polishedText = (response2?.text || '').trim();
      } catch (fallbackErr) {
        console.error('[AI Polish API] All Gemini models failed:', fallbackErr.message);
        // Clean fallback
        polishedText = rawInput
          .replace(/\s+/g, ' ')
          .replace(/(^\w|\.\s+\w)/gm, c => c.toUpperCase());
      }
    }

    // Strip any quotes that the model might wrap around the response
    polishedText = polishedText.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({
      success: true,
      originalText: rawInput,
      polishedText: polishedText || rawInput
    });
  } catch (err) {
    console.error('[AI Polish API Root Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
