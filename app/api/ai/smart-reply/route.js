import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are the lead client success manager and master digitizing specialist at Bilal Digitizing Studio (a premier studio specializing in Custom Embroidery Digitizing, Vector Art Tracing, and Custom Physical Patches on Fiverr and Upwork).

You are generating a direct, live chat reply to a client inquiry.

### Strict Chat Formatting Rules:
1. **Live Chat Mode:** NEVER include "Subject:" lines, email headers, or placeholder brackets like "[Your Name]", "[Your Title]", or "[Your Website]". Sign off cleanly as "Best regards,\nBilal Digitizing Team" or "Warm regards,\nBilal Digitizing Team".
2. **Direct & Specific:** Answer their question directly in the very first sentence. NEVER start with a generic "How can I help you today?" if the client already asked a specific question.
3. **High-Converting Tone:** Courteous, confident, professional native US/UK customer support English with clear next steps.
4. **No Meta-Commentary:** Return ONLY the chat message ready to send. No intro words, no quotes around the response, no markdown options.

### Industry Domain Knowledge:
1. **Embroidery Digitizing:**
   - Turnaround: 2 to 6 hours (urgent rush delivery in 1-2 hours).
   - Machine Formats: DST, PES, EMB, EXP, JEF, VP3, and any other machine format upon request.
   - Deliverables: Machine stitch file + detailed production PDF worksheet with thread color sequences and stitch count.
   - Capabilities: Left chest, cap/hat (structured & unstructured), jacket back, sleeve, flat embroidery & 3D puff (with specialized underlay & high-density foam optimization). Free unlimited revisions.
   - Next steps if missing: Ask for dimensions (width/height), placement (cap, chest, back), and artwork.

2. **Vector Art Redraw / Tracing:**
   - Turnaround: 2 to 4 hours.
   - Pricing: Starts around $10 to $15 depending on detail complexity.
   - Formats Delivered: AI, EPS, SVG, and high-resolution print-ready PDF (100% scalable with clean cut paths).
   - Use cases: Screen printing, vinyl cutting, DTG, sublimation, laser engraving.
   - Next steps if missing: Ask them to upload their image, sketch, or logo.

3. **Custom Physical Patches:**
   - 3-Step Process:
     1) Share artwork/logo, exact dimensions (width & height), and required quantity (e.g. 25, 50, 100, 500 pcs).
     2) Choose patch type (Embroidered, PVC Rubber, Laser-engraved Leather, or Woven) and backing type (Hook & Loop / Velcro, Iron-on / Heat Seal, Adhesive Sticker, or Sew-on).
     3) We provide a free digital pre-production proof / sew-out sample for approval before bulk production.
   - Next steps: Invite them to upload their design and specify size and quantity for an instant custom quote.`;

/**
 * Lead Support Specialist Smart Reply Generator for Bilal Digitizing Studio
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMessages = body?.conversationHistory || body?.messages || [];
    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const customerName = body?.customerName || body?.clientName || 'Client';
    const serviceCategory = body?.serviceCategory || 'Embroidery Digitizing';
    
    // Extract latest customer message if not explicitly passed
    let latestMessage = body?.latestMessage ? String(body.latestMessage).trim() : '';
    if (!latestMessage && messages.length > 0) {
      const reversed = [...messages].reverse();
      const lastClientMsg = reversed.find(m => m && (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin'));
      latestMessage = lastClientMsg ? String(lastClientMsg.text || '').trim() : String(messages[messages.length - 1]?.text || '').trim();
    }

    const conversationTranscript = messages.slice(-8).map(m => {
      const role = (m.sender === 'admin') ? 'Studio Admin' : `Client (${customerName})`;
      const att = m.attachment || m.attachment_name ? ` [Attached: ${m.attachment || m.attachment_name}]` : '';
      return `${role}: ${m.text || ''}${att}`;
    }).join('\n');

    const promptUserText = `Client Name: ${customerName}
Service Category: ${serviceCategory}
Client Inquiry: "${latestMessage || 'Hello, I have a question about your services.'}"

Recent Conversation Context:
${conversationTranscript || 'No prior context.'}

Please draft a direct, professional, ready-to-send live chat response for the client:`;

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
            contents: promptUserText,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.25,
            },
          });

          let replyText = response.text?.trim() || '';

          if (replyText.startsWith('```') && replyText.endsWith('```')) {
            replyText = replyText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
          }
          if ((replyText.startsWith('"') && replyText.endsWith('"')) || (replyText.startsWith("'") && replyText.endsWith("'"))) {
            replyText = replyText.substring(1, replyText.length - 1).trim();
          }

          // Remove email artifacts if any slipped through
          replyText = replyText.replace(/^Subject:\s*.*?\n+/i, '').trim();

          if (replyText) {
            return NextResponse.json({
              replyText,
              smartReply: replyText,
              model
            });
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
      model: 'studio-lead-support-fallback'
    });

  } catch (error) {
    console.error('Smart reply error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate reply' }, { status: 500 });
  }
}

/**
 * Highly specific domain fallback matching the exact rules
 */
function localGenerateSpecificReply(latestMessage = '', customerName = '') {
  const nameGreeting = customerName && !customerName.toLowerCase().includes('client') && !customerName.toLowerCase().includes('guest') ? `Hi ${customerName},\n\n` : 'Hello!\n\n';
  const lower = (latestMessage || '').toLowerCase();

  if (lower.includes('patch') || lower.includes('pvc') || lower.includes('velcro') || lower.includes('iron on') || lower.includes('leather')) {
    return `${nameGreeting}Thank you for inquiring about our custom patches! Here is our quick 3-step process:\n\n1. Share your artwork/logo, target dimensions (width/height), and quantity.\n2. Choose your patch type (Embroidered, PVC, Leather, or Woven) and backing (Iron-on, Hook & Loop/Velcro, Adhesive, or Sew-on).\n3. We provide a free sew-out/digital proof for your approval before mass production.\n\nPlease upload your design and let us know your required quantity and size, and we will send you an instant quote!\n\nBest regards,\nBilal Digitizing Team`;
  }

  if (lower.includes('vector') || lower.includes('trace') || lower.includes('svg') || lower.includes('eps') || lower.includes('ai file') || lower.includes('redraw')) {
    return `${nameGreeting}We specialize in converting low-resolution images, logos, and sketches into crisp, high-resolution vector files (AI, EPS, SVG, and print-ready PDF) suitable for screen printing, vinyl cutting, and engraving. Standard turnaround is 2 to 4 hours with prices starting at $10-$15. Please feel free to upload your image and we will get right to work!\n\nBest regards,\nBilal Digitizing Team`;
  }

  if (lower.includes('price') || lower.includes('cost') || lower.includes('quote') || lower.includes('how much')) {
    return `${nameGreeting}Our standard left-chest and cap digitizing ranges from $10 to $15 (flat or 3D puff), and vector conversion is $10 to $15 depending on detail complexity. Standard turnaround is 2 to 4 hours with all formats included (DST, PES, EMB, etc.). Please share your artwork and dimensions for an instant confirmation!\n\nBest regards,\nBilal Digitizing Team`;
  }

  if (lower.includes('turnaround') || lower.includes('how long') || lower.includes('time') || lower.includes('rush') || lower.includes('urgent')) {
    return `${nameGreeting}Our standard production turnaround is 2 to 6 hours. We also offer urgent rush delivery in 1 to 2 hours upon request. Please send over your artwork and we will prioritize it immediately!\n\nBest regards,\nBilal Digitizing Team`;
  }

  if (lower.includes('format') || lower.includes('dst') || lower.includes('pes') || lower.includes('emb')) {
    return `${nameGreeting}We deliver all major machine embroidery formats including DST, PES, EMB, EXP, JEF, VP3, along with a production PDF worksheet showing thread color sequence and stitch counts. Let us know your machine model or preferred format!\n\nBest regards,\nBilal Digitizing Team`;
  }

  // Default Embroidery Digitizing direct answer
  return `${nameGreeting}For embroidery digitizing, our standard turnaround is 2 to 6 hours with all machine formats (DST, PES, EMB, EXP, JEF, VP3) and free revisions included. We support flat embroidery as well as 3D puff with optimized underlay and foam density. Could you please share your logo artwork, dimensions, and placement (e.g., cap, left chest, or jacket back)?\n\nBest regards,\nBilal Digitizing Team`;
}
