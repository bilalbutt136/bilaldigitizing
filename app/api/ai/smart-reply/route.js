import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getSystemInstruction = (customerName = 'Client') => `You are an expert sales assistant for B Digitizing Studio.
A client (${customerName || 'Client'}) just sent an inquiry. Write a friendly, professional, and helpful response.

### SERVICE HANDLING:
1. **Embroidery Digitizing:** Mention clean stitch density, fast 2-6 hour turnaround, and formats (DST, PES, EMB). Ask for logo size and placement (cap, left chest, jacket).
2. **Vector Art Tracing:** Mention vector redraws (AI, EPS, SVG, PDF) ready for screen printing/cutting.
3. **Physical Custom Patches:** Explain the simple process:
   - Provide logo, size, and quantity.
   - Choose patch type (Embroidered, PVC, Woven) and backing (Iron-on, Velcro, Adhesive).
   - We provide a free pre-production sample proof before final production.

### STYLE:
- Polite, welcoming, and concise (Fiverr Top-Rated style).
- Answer the customer's specific question directly.
- Output ONLY the ready-to-send draft message. No quotes or meta text.`;

/**
 * Deterministic local fallback matching transformation rules
 */
function localGenerateSpecificReply(latestMessage = '', customerName = '') {
  const nameGreeting = customerName && !customerName.toLowerCase().includes('client') && !customerName.toLowerCase().includes('guest') ? `Hi ${customerName},\n\n` : 'Hello!\n\n';
  const lower = (latestMessage || '').toLowerCase();

  if (lower.includes('patch') || lower.includes('pvc') || lower.includes('velcro') || lower.includes('iron on') || lower.includes('leather')) {
    return `${nameGreeting}Thank you for reaching out about our custom patches! Here is our simple 3-step process:\n\n1. Share your logo/artwork, required dimensions (width/height), and quantity.\n2. Choose your patch type (Embroidered, PVC, or Woven) and backing (Iron-on, Velcro hook & loop, or Adhesive).\n3. We provide a free pre-production sample proof for your approval before final production.\n\nPlease upload your design and let us know your size and quantity to get an instant quote!\n\nBest regards,\nB Digitizing Studio Team`;
  }

  if (lower.includes('vector') || lower.includes('trace') || lower.includes('svg') || lower.includes('eps') || lower.includes('ai file') || lower.includes('redraw')) {
    return `${nameGreeting}We specialize in converting low-resolution images, sketches, and logos into clean, high-resolution vector files (AI, EPS, SVG, PDF) ready for screen printing and vinyl cutting. Our standard turnaround is 2 to 4 hours. Please feel free to share your artwork and we will get right to work!\n\nBest regards,\nB Digitizing Studio Team`;
  }

  if (lower.includes('turnaround') || lower.includes('how long') || lower.includes('time') || lower.includes('rush') || lower.includes('urgent')) {
    return `${nameGreeting}Our standard production turnaround is 2 to 6 hours for embroidery digitizing and 2 to 4 hours for vector tracing. We also offer rush delivery upon request. Please send over your artwork and we will get started right away!\n\nBest regards,\nB Digitizing Studio Team`;
  }

  // Default Embroidery Digitizing direct answer
  return `${nameGreeting}Thank you for reaching out to B Digitizing Studio! We provide premium embroidery digitizing with clean stitch density and a fast 2-6 hour turnaround in all standard formats (DST, PES, EMB). Could you please share your logo design, target dimensions, and intended placement (cap, left chest, or jacket)? We look forward to assisting you!\n\nBest regards,\nB Digitizing Studio Team`;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMessages = body?.conversationHistory || body?.messages || [];
    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const customerName = body?.customerName || body?.clientName || 'Client';
    
    // Extract latest customer message if not explicitly passed
    let latestMessage = body?.latestMessage ? String(body.latestMessage).trim() : '';
    if (!latestMessage && messages.length > 0) {
      const reversed = [...messages].reverse();
      const lastClientMsg = reversed.find(m => m && (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin'));
      latestMessage = lastClientMsg ? String(lastClientMsg.text || '').trim() : String(messages[messages.length - 1]?.text || '').trim();
    }

    if (!latestMessage && !messages.length) {
      latestMessage = 'Hello, I have a question about your digitizing and patch services.';
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    ).trim();

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const models = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

      for (const model of models) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `Client inquiry: "${latestMessage}"`,
            config: {
              systemInstruction: getSystemInstruction(customerName),
              temperature: 0.3,
            },
          });

          let replyText = response.text?.trim() || '';

          if (replyText.startsWith('```') && replyText.endsWith('```')) {
            replyText = replyText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
          }
          if ((replyText.startsWith('"') && replyText.endsWith('"')) || (replyText.startsWith("'") && replyText.endsWith("'"))) {
            replyText = replyText.substring(1, replyText.length - 1).trim();
          }

          // Remove email subject headers if any generated
          replyText = replyText.replace(/^Subject:\s*.*?\n+/i, '').trim();

          if (replyText) {
            return NextResponse.json({
              replyText,
              smartReply: replyText,
              success: true,
              model
            }, { status: 200 });
          }
        } catch (err) {
          console.warn(`[Gemini Smart Reply] Model ${model} failed, trying next:`, err.message || err);
        }
      }
    }

    // Fallback rule-based generator if API key is missing or calls fail
    const fallbackReply = localGenerateSpecificReply(latestMessage, customerName);
    return NextResponse.json({
      replyText: fallbackReply,
      smartReply: fallbackReply,
      success: true,
      model: 'studio-lead-support-fallback'
    }, { status: 200 });

  } catch (error) {
    console.error('Smart Reply Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate reply' }, { status: 500 });
  }
}
