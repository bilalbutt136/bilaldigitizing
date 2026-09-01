import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Lead Support Specialist Smart Reply Generator for B Digitizing Studio
 */
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

    const conversationTranscript = messages.slice(-8).map(m => {
      const role = (m.sender === 'admin') ? 'Studio Admin' : `Client (${customerName})`;
      const att = m.attachment || m.attachment_name ? ` [Attached: ${m.attachment || m.attachment_name}]` : '';
      return `${role}: ${m.text || ''}${att}`;
    }).join('\n');

    const prompt = `You are the lead support specialist at B Digitizing Studio.
A client (${customerName}) just sent this inquiry:
"${latestMessage || conversationTranscript || 'Hello, I have a question about your services.'}"

Recent Conversation Context:
${conversationTranscript || 'No prior context.'}

Write a helpful, direct, and professional response that specifically answers what they asked.

### Domain Rules:
1. **If asking about Physical Patches Process:**
   - Explain the quick 3-step process:
     1) Share artwork/logo, dimensions (width/height), and quantity.
     2) Choose patch type (Embroidered, PVC, Leather, or Woven) and backing (Iron-on, Hook & Loop/Velcro, Adhesive, or Sew-on).
     3) We provide a free sew-out/digital proof before mass production.
   - Ask them to upload their design and specify their desired quantity and size to get an instant quote.

2. **If asking about Embroidery Digitizing:**
   - Mention turnaround time (usually 2-6 hours / 1 day), file formats (DST, PES, EMB, etc.), flat vs 3D puff embroidery, and ask for logo dimensions and placement (cap, left chest, jacket back).

3. **If asking about Vector Art Tracing:**
   - Mention converting low-res images/sketches into clean vector files (AI, EPS, SVG, PDF) ready for screen printing or engraving.

### Tone & Style:
- Warm, professional US English, concise, and straight to the point.
- NEVER return a generic "How can we assist you today?" if the client already asked a specific question. Answer their question first!
- Do not wrap the response in quotation marks or include intros like "Here is a response:".`;

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    ).trim();

    if (apiKey) {
      // Models to try in order of capability
      const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

      for (const model of models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const payload = {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000
            }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let replyText = rawOutput.trim();

            if (replyText.startsWith('```') && replyText.endsWith('```')) {
              replyText = replyText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
            }
            if ((replyText.startsWith('"') && replyText.endsWith('"')) || (replyText.startsWith("'") && replyText.endsWith("'"))) {
              replyText = replyText.substring(1, replyText.length - 1).trim();
            }

            if (replyText) {
              return NextResponse.json({
                replyText,
                smartReply: replyText,
                model
              });
            }
          } else {
            console.warn(`[Gemini Smart Reply] Model ${model} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`[Gemini Smart Reply] Error calling ${model}:`, err.message);
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
  const nameGreeting = customerName && !customerName.toLowerCase().includes('client') ? `Hi ${customerName}, ` : 'Hello! ';
  const lower = (latestMessage || '').toLowerCase();

  if (lower.includes('patch') || lower.includes('pvc') || lower.includes('velcro') || lower.includes('iron on') || lower.includes('leather')) {
    return `${nameGreeting}Thank you for inquiring about our custom patches! Here is our quick 3-step process:\n1. Share your artwork/logo, target dimensions (width/height), and quantity.\n2. Choose your patch type (Embroidered, PVC, Leather, or Woven) and backing (Iron-on, Hook & Loop/Velcro, Adhesive, or Sew-on).\n3. We provide a free sew-out/digital proof for your approval before production.\n\nPlease upload your design and let us know your required quantity and size, and we will send you an instant quote!`;
  }

  if (lower.includes('vector') || lower.includes('trace') || lower.includes('svg') || lower.includes('eps') || lower.includes('ai file')) {
    return `${nameGreeting}Thank you for reaching out! We specialize in converting low-resolution images, logos, and sketches into crisp, high-resolution vector files (AI, EPS, SVG, and print-ready PDF) suitable for screen printing, vinyl cutting, and engraving. Standard turnaround is 2 to 4 hours. Please feel free to upload your image and we will get right to work!`;
  }

  if (lower.includes('price') || lower.includes('cost') || lower.includes('quote') || lower.includes('how much')) {
    return `${nameGreeting}Our standard left-chest and cap digitizing ranges from $10 to $15 (flat or 3D puff), and vector conversion is $10 to $15 depending on detail complexity. Standard turnaround is 2 to 4 hours with all formats included (DST, PES, EMB, etc.). Please share your artwork and dimensions for an instant confirmation!`;
  }

  if (lower.includes('turnaround') || lower.includes('how long') || lower.includes('time') || lower.includes('rush') || lower.includes('urgent')) {
    return `${nameGreeting}Our standard production turnaround is 2 to 6 hours (within 1 business day). We also offer rush delivery in 1 to 2 hours upon request. Please send over your artwork and we will prioritize it immediately!`;
  }

  if (lower.includes('format') || lower.includes('dst') || lower.includes('pes') || lower.includes('emb')) {
    return `${nameGreeting}We deliver all major machine embroidery formats including DST, PES, EMB, EXP, JEF, VP3, along with a production PDF worksheet showing thread color sequence and stitch counts. Let us know your machine model or preferred format!`;
  }

  // Default Embroidery Digitizing direct answer
  return `${nameGreeting}Thank you for reaching out to B Digitizing Studio! For embroidery digitizing, our standard turnaround is 2 to 6 hours with all machine formats (DST, PES, EMB, etc.) and free revisions included. We support flat embroidery as well as 3D puff. Could you please share your logo artwork, dimensions, and placement (e.g., cap, left chest, or jacket back)? We look forward to assisting you!`;
}
