import { GoogleGenAI, Type } from '@google/genai';

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
    const channelType = body.channelType || body.channel || (body.isSupport ? 'helpdesk' : 'digitizer');
    const isHelpDesk = channelType === 'helpdesk' || channelType === 'support' || channelType === 'help-desk';

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

    const systemInstruction = isHelpDesk
      ? `You are the friendly 24/7 Help Desk Specialist at B Digitizing Studio.
A client (${customerName || 'Client'}) reached out to 24/7 Live Support.

### 24/7 HELP DESK RULES:
1. **ROLE & TONE:** Warm, ultra-helpful, professional customer support (Fiverr Top-Rated style).
2. **HELP DESK TOPICS:**
   - Turnaround: 2 to 6 hours for standard digitizing / vector conversions.
   - Pricing guidelines: Simple logo digitizing from $15-$25, Vector conversions $15-$18, Custom physical patches quoted based on quantity and backing.
   - Formats accepted: All image/vector files (JPG, PNG, PDF, AI, EPS, SVG) and machine formats (DST, PES, EMB, EXP, VP3, JEF).
   - Free minor revisions included on all orders.
3. **NO REPETITIVE GREETINGS:** Start with "Hi ${customerName || 'there'}!" or jump directly to answering their question.
4. **SUPER CONCISE (2 to 3 sentences max):** Answer clearly without long generic essays.
5. **CUSTOM OFFERS:** If the customer asks to order or get an offer link, set 'shouldCreateOffer' to true with realistic title and price; otherwise false.`
      : `You are a Senior Technical Digitizer & Project Lead at B Digitizing Studio (Embroidery Digitizing, Vector Art, Custom Physical Patches).
Analyze the chat history and provide a technical, client-ready response.

### STUDIO DIGITIZER RULES:
1. **TECHNICAL SPECIFICATIONS:** Focus on stitch density, small text lettering, machine formats (Tajima DST, Brother PES), underlay, and pull compensation.
2. **CUSTOM OFFER GENERATION:**
   - If the customer asks for an offer/link ("send offer", "ready to order", "how to pay") or if specs (size/placement) are clear:
     Set 'shouldCreateOffer' to true with realistic title, price ($15-$35 for digitizing/vector, $50+ for patches), deliveryDays: 1, and description.
   - If requirements are incomplete, set 'shouldCreateOffer' to false and ask only for the 1 missing technical spec (e.g. required width in inches, or cap vs left chest).
3. **NO REPETITIVE GREETINGS & MEMORY:** Never ask for details already provided in the chat.
4. **SUPER CONCISE (2 to 3 sentences max):** Crisp, confident, native US support tone.`;

    const promptText = `Channel: ${isHelpDesk ? '24/7 Help Desk' : 'Studio Digitizer'}\nRecent Chat Transcript:\n${formattedHistory}\n\nClient Name: ${customerName || 'Client'}${serviceCategory ? `\nService Category: ${serviceCategory}` : ''}\n\nDraft the next response and decide if a custom offer should be attached:`;

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
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                replyText: { type: Type.STRING },
                shouldCreateOffer: { type: Type.BOOLEAN },
                offerDetails: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    deliveryDays: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    service_type: { type: Type.STRING }
                  },
                  required: ['title', 'price', 'deliveryDays', 'description']
                }
              },
              required: ['replyText', 'shouldCreateOffer']
            },
            temperature: 0.2,
            maxOutputTokens: 350,
          },
        });

        const rawText = response.text?.trim() || '';
        let parsedData = {};
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          const cleaned = rawText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
          parsedData = JSON.parse(cleaned);
        }

        if (parsedData && (parsedData.replyText || parsedData.shouldCreateOffer)) {
          return Response.json({
            replyText: parsedData.replyText || '',
            smartReply: parsedData.replyText || '',
            shouldCreateOffer: Boolean(parsedData.shouldCreateOffer),
            offerDetails: parsedData.offerDetails || null,
            success: true
          });
        }
      } catch (err) {
        console.warn(`[Generate Reply API] Model ${model} failed with structured JSON, trying next:`, err.message || err);
      }
    }

    // Fallback direct concise reply if models fail
    const fallbackText = `Got it, ${customerName}! We can take care of this for you right away. Would you like me to set up the custom order now?`;
    return Response.json({
      replyText: fallbackText,
      smartReply: fallbackText,
      shouldCreateOffer: false,
      offerDetails: null,
      success: true
    });
  } catch (error) {
    console.error('AI Offer Error:', error);
    return Response.json({
      replyText: 'I can create that custom offer for you right away.',
      shouldCreateOffer: false,
      offerDetails: null,
      error: error.message
    }, { status: 500 });
  }
}


