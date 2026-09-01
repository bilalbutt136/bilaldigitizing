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

    // Build complete formatted chat memory transcript (last 8 messages)
    const formattedHistory = messages.length > 0
      ? messages
          .slice(-8)
          .map(msg => {
            const role = (msg.sender === 'admin' || msg.sender === 'support') ? 'Admin (You)' : `Customer (${customerName})`;
            const attInfo = msg.attachment_name || msg.attachment ? ` [Attached: ${msg.attachment_name || 'File'}]` : '';
            const offerInfo = msg.offer_data?.title ? ` [Custom Offer Sent: ${msg.offer_data.title} ($${msg.offer_data.price})]` : '';
            return `${role}: ${msg.text || ''}${attInfo}${offerInfo}`.trim();
          })
          .filter(Boolean)
          .join('\n')
      : `Customer (${customerName}): ${latestMessage || 'Hello, I need assistance with my design.'}`;

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

    // Also check if any recent message had an attached image url
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

    const systemInstruction = `You are a Senior Project Manager and Sales Lead at B Digitizing Studio (Embroidery Digitizing, Vector Art, Custom Physical Patches).

### CONVERSATION MEMORY & STRICT ANTI-REPETITION RULES:
1. **TRACK KNOWN DETAILS (STRICT):**
   - Carefully review the entire chat transcript.
   - If the customer ALREADY stated their required size/dimensions (e.g., 3.5 inches, 4x4), file format (e.g., DST, PES), quantity (e.g., 50 pcs), garment type/placement (e.g., cap, left chest, jacket back), backing type (e.g., iron-on, velcro), or colors in earlier messages, NEVER ask for that information again!
   - Acknowledge what they provided (e.g., "Got it, 3.5 inches on left chest.").

2. **NATURAL PROGRESSION (NO LOOPS):**
   - Once requirements are clear, move directly to the next logical step: offer a quote/turnaround time or confirm order readiness (e.g., "I can have this digitized in DST format for $15 within 2-4 hours. Would you like me to set up the custom offer?").
   - If only ONE specific detail is missing, ask ONLY for that single missing piece.

3. **IMAGE & ARTWORK AWARENESS:**
   - If an image/sketch/logo is attached, evaluate its stitch/vector/patch feasibility (e.g., detail complexity, color separations, small text).

4. **BREVITY & TONE:**
   - 2 to 3 sentences maximum.
   - Crisp, confident, native US client support tone (Fiverr Top-Rated style).
   - NO repeated greetings, no robotic introductions like "Welcome to B Digitizing".
   - Do NOT wrap output in quotation marks or markdown code blocks.`;

    const promptText = `Recent Chat Transcript:\n${formattedHistory}\n\nClient Name: ${customerName || 'Client'}${serviceCategory ? `\nService Category: ${serviceCategory}` : ''}\n\nDraft the next direct, smart, memory-aware response for the Admin to send:`;

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

    contents.push({ text: promptText });

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
            maxOutputTokens: 200, // Enforce brevity (2-3 sentences)
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
    const fallbackText = `Got it, ${customerName}! We can definitely take care of this for you right away. Would you like me to set up the custom order now?`;
    return Response.json({ replyText: fallbackText, smartReply: fallbackText, success: true });
  } catch (error) {
    console.error('Smart reply memory error:', error);
    return Response.json({ error: error.message || 'Failed to generate reply' }, { status: 500 });
  }
}


