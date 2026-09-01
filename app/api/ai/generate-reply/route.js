import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is not configured in .env.local' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const latestMessage = body.latestMessage || body.message || (Array.isArray(body.conversationHistory) ? body.conversationHistory[body.conversationHistory.length - 1]?.text : '') || (Array.isArray(body.messages) ? body.messages[body.messages.length - 1]?.text : '') || '';
    const customerName = body.customerName || body.clientName || 'Client';

    const ai = new GoogleGenAI({ apiKey });
    const models = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Client inquiry: "${latestMessage}"`,
          config: {
            systemInstruction: `You are the lead client support specialist at B Digitizing Studio.
A client (${customerName}) asked: "${latestMessage}"

Write a friendly, professional response directly answering their question.

### Domain Rules:
1. Physical Patches: Explain 3-step process (artwork/dimensions/quantity -> patch backing choice like iron-on/velcro -> free sew-out sample proof before production).
2. Embroidery Digitizing: Mention turnaround (2-6 hours), file formats (DST, PES, EMB), stitch quality, and request placement details.
3. Vector Art Tracing: Mention redraws (AI, EPS, SVG) ready for screen printing.

Output ONLY the ready-to-send draft message. No quotes or introductory preamble.`,
            temperature: 0.3,
          },
        });

        const replyText = response.text?.trim().replace(/^["']|["']$/g, '') || '';
        if (replyText) {
          return Response.json({ replyText, smartReply: replyText, success: true });
        }
      } catch (err) {
        console.warn(`[Generate Reply API] Model ${model} failed, trying next:`, err.message || err);
      }
    }

    return Response.json({ error: 'Failed to generate reply from AI' }, { status: 500 });
  } catch (error) {
    console.error('Generate Reply Error:', error);
    return Response.json({ error: error.message || 'Failed to generate reply' }, { status: 500 });
  }
}

