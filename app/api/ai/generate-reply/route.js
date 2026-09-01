import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

async function fetchImageAsBase64(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'B-Digitizing-Vision/1.0' } });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/png';
    const cleanMime = contentType.split(';')[0].trim().toLowerCase();
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
    const mimeType = validMimes.includes(cleanMime) ? cleanMime : 'image/png';
    const base64Data = buffer.toString('base64');
    return { data: base64Data, mimeType };
  } catch (err) {
    console.warn('[Gemini Vision] Could not fetch image attachment:', err.message);
    return null;
  }
}

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
      return Response.json({ error: 'GEMINI_API_KEY is not configured in environment variables (Vercel / .env.local)' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const rawMessages = body.conversationHistory || body.messages || [];
    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    
    // Extract latest customer message
    let latestMessage = body.latestMessage || body.message || '';
    if (!latestMessage && messages.length > 0) {
      const reversed = [...messages].reverse();
      const lastClientMsg = reversed.find(m => m && (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin'));
      latestMessage = lastClientMsg ? String(lastClientMsg.text || '').trim() : String(messages[messages.length - 1]?.text || '').trim();
    }

    const customerName = body.customerName || body.clientName || 'Client';
    const serviceCategory = body.serviceCategory || '';

    // Extract image attachment (imageBase64 or imageUrl)
    let imageBase64 = body.imageBase64 || null;
    let mimeType = body.mimeType || 'image/png';
    const imageUrl = body.imageUrl || body.attachment_url || null;

    if (!imageBase64 && imageUrl) {
      const fetched = await fetchImageAsBase64(imageUrl);
      if (fetched) {
        imageBase64 = fetched.data;
        mimeType = fetched.mimeType;
      }
    }

    // Also check if latest message had an attached image url
    if (!imageBase64 && messages.length > 0) {
      const reversed = [...messages].reverse();
      const lastWithImg = reversed.find(m => m && (m.attachment_url || (typeof m.attachment === 'string' && m.attachment.startsWith('http'))));
      if (lastWithImg) {
        const candidateUrl = lastWithImg.attachment_url || lastWithImg.attachment;
        const fetched = await fetchImageAsBase64(candidateUrl);
        if (fetched) {
          imageBase64 = fetched.data;
          mimeType = fetched.mimeType;
        }
      }
    }

    const systemInstruction = `You are a fast, highly converting sales lead at B Digitizing Studio (Embroidery Digitizing, Vector Art, Custom Physical Patches).

### STRICT RULES:
1. **NO REPETITIVE GREETINGS:** NEVER start with "Welcome to B Digitizing" or long robotic intros. If a greeting is needed, a brief "Hi ${customerName || 'there'}!" or direct answer is enough.
2. **SUPER CONCISE (2 to 4 sentences max):** Answer directly. Do not write long essays, numbered lectures, or generic bullet points.
3. **IMAGE AWARENESS:** If an image is provided, analyze the design (complexity, fine details, tiny lettering, color count) and comment specifically on it regarding digitizing/vector/patch feasibility.
4. **CLEAR CALL TO ACTION:** Ask only for the 1 or 2 missing details (e.g., required size/width, placement like cap vs left-chest, or patch quantity).
5. **TONE:** Friendly, professional, American business casual (Fiverr Top-Rated style). No quotes around the response.`;

    const contents = [];

    // If an image is attached, include image part for Gemini Vision
    if (imageBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
    }

    contents.push({
      text: `Client Name: ${customerName || 'Client'}${serviceCategory ? `\nService: ${serviceCategory}` : ''}\nClient Message: "${latestMessage || 'Please check this design'}"`,
    });

    const ai = new GoogleGenAI({ apiKey });
    const models = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 250, // Enforce brevity (2-4 sentences)
          },
        });

        let replyText = response.text?.trim().replace(/^["']|["']$/g, '') || '';
        // Remove email subject artifacts if any slipped through
        replyText = replyText.replace(/^Subject:\s*.*?\n+/i, '').trim();

        if (replyText) {
          return Response.json({ replyText, smartReply: replyText, success: true });
        }
      } catch (err) {
        console.warn(`[Generate Reply API] Model ${model} failed, trying next:`, err.message || err);
      }
    }

    // Fallback direct concise reply if models fail
    const fallbackText = `Hi ${customerName}! We can definitely help you with this. Could you please share the required dimensions (width/height) and placement (cap, left chest, or jacket) so we can get started right away?`;
    return Response.json({ replyText: fallbackText, smartReply: fallbackText, success: true });
  } catch (error) {
    console.error('Generate Reply Error:', error);
    return Response.json({ error: error.message || 'Failed to generate reply' }, { status: 500 });
  }
}

