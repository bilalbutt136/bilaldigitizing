import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an elite Senior Customer Success Manager for an industry-leading embroidery digitizing and vector conversion studio (B Digitizing Studio).

Your task is to analyze the recent conversation history with a client and auto-generate a tailored, polite, crystal-clear, and professional response in native US business English.

### GUIDELINES:
1. Review the client's latest message, questions, or artwork submissions.
2. If the client asked for a quote/pricing: Warmly acknowledge and share our standard studio pricing ($10-$15 for standard left-chest/cap digitizing, $10-$15 for vector art tracing, or custom quote for jacket backs) or offer to inspect their artwork.
3. If the client inquired about turnaround time: Reassure them that standard turnaround is 2-4 hours (rush turnaround available in 1-2 hours).
4. If the client asked about machine formats: State that we provide all major formats (DST, PES, EMB, EXP, JEF, VP3, etc.) along with a production PDF worksheet / sew-out preview.
5. If the client submitted artwork or an order: Acknowledge receipt, confirm the details, and ask about specific target dimensions or garment placement (e.g., left chest, cap/hat, jacket back, 3D puff).
6. If the client requested revisions: Graciously accept and confirm adjustments will be made swiftly.
7. Tone: Warm, confident, helpful, courteous, and concise (Native US B2B standard).
8. Output Constraints: Return ONLY the exact message text ready to send. DO NOT add quotation marks, intros like "Here is a reply:", or meta commentary.`;

/**
 * Intelligent Rule-Based Smart Reply Engine (Fallback when no API Key is set)
 */
function localGenerateSmartReply(messages = [], serviceCategory = '', clientName = '') {
  const nameGreeting = clientName && !clientName.toLowerCase().includes('client') ? `Hi ${clientName}, ` : 'Hello! ';
  
  // Find the most recent non-admin message
  const lastClientMsg = [...messages].reverse().find(m => m && (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin'));
  const text = (lastClientMsg?.text || '').toLowerCase();
  const hasAttachment = Boolean(lastClientMsg?.attachment || lastClientMsg?.attachment_url);

  if (text.includes('price') || text.includes('cost') || text.includes('quote') || text.includes('how much')) {
    return `${nameGreeting}Thank you for reaching out! Our standard left-chest and cap digitizing ranges from $10 to $15, and vector tracing is $10 to $15 depending on detail complexity. Please feel free to attach your artwork, target dimensions, and preferred format (DST, PES, EMB, etc.), and we will be happy to assist you right away!`;
  }

  if (text.includes('turnaround') || text.includes('how long') || text.includes('how fast') || text.includes('time') || text.includes('urgent') || text.includes('rush')) {
    return `${nameGreeting}Our standard production turnaround is 2 to 4 hours. We also provide express 1 to 2 hour rush delivery if needed. Please send over your artwork and specifications, and we will get right to work on it!`;
  }

  if (text.includes('format') || text.includes('dst') || text.includes('pes') || text.includes('emb') || text.includes('vector') || text.includes('svg')) {
    return `${nameGreeting}We deliver all major machine embroidery formats (DST, PES, EMB, EXP, JEF, VP3, etc.) as well as production-ready vector files (AI, EPS, SVG, high-res PDF). Let us know your preferred machine or software format and we will include it!`;
  }

  if (text.includes('revision') || text.includes('change') || text.includes('edit') || text.includes('fix') || text.includes('adjust') || text.includes('stitch')) {
    return `${nameGreeting}Thank you for your feedback! We would be glad to make those adjustments for you. We are prioritizing your revision right now and will send over the updated files shortly.`;
  }

  if (hasAttachment || text.includes('attached') || text.includes('artwork') || text.includes('logo') || text.includes('image')) {
    return `${nameGreeting}Thank you for sending over your artwork! We have received your file and are reviewing the details. Could you please confirm your desired size (width/height) and garment placement (e.g., left chest, cap, jacket back, or 3D puff)? We will prepare your production file right away.`;
  }

  if (text.includes('thank') || text.includes('great') || text.includes('looks good') || text.includes('perfect')) {
    return `${nameGreeting}You are very welcome! It was a pleasure working on your design. Please let us know if you need any other embroidery digitizing or vector art services in the future. Have a great day!`;
  }

  // Default warm assistance reply
  return `${nameGreeting}Thank you for messaging B Digitizing Studio! How can we assist you with your embroidery digitizing, vector tracing, or custom patches today?`;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawMessages = body?.conversationHistory || body?.messages || [];
    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const serviceCategory = body?.serviceCategory || 'Embroidery Digitizing';
    const clientName = body?.clientName || '';

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ''
    ).trim();

    if (apiKey && messages.length > 0) {
      const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

      // Format last 8 messages for context
      const recentMessages = messages.slice(-8);
      const conversationTranscript = recentMessages.map(m => {
        const role = (m.sender === 'admin') ? 'Studio Admin / Support' : `Client (${m.sender_name || clientName || 'Customer'})`;
        const att = m.attachment || m.attachment_name ? ` [Attachment: ${m.attachment || m.attachment_name}]` : '';
        return `${role}: ${m.text || ''}${att}`;
      }).join('\n');

      const userPrompt = `Context:\nService Category: ${serviceCategory}\nClient Name: ${clientName || 'Valued Client'}\n\nRecent Conversation History:\n${conversationTranscript}\n\nPlease generate a polite, professional, and helpful response from the studio to the client:`;

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
                parts: [{ text: userPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
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
            let replyText = rawOutput.trim();

            if (replyText.startsWith('```') && replyText.endsWith('```')) {
              replyText = replyText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
            }
            if ((replyText.startsWith('"') && replyText.endsWith('"')) || (replyText.startsWith("'") && replyText.endsWith("'"))) {
              replyText = replyText.substring(1, replyText.length - 1).trim();
            }

            if (replyText) {
              return NextResponse.json({
                replyText: replyText,
                smartReply: replyText,
                model: model
              });
            }
          } else {
            console.warn(`[Smart Reply API] Model ${model} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`[Smart Reply API] Error calling ${model}:`, err.message);
        }
      }
    }

    // Fallback if no API key or API call failed
    const fallbackReply = localGenerateSmartReply(messages, serviceCategory, clientName);
    return NextResponse.json({
      replyText: fallbackReply,
      smartReply: fallbackReply,
      model: 'studio-smart-reply-fallback'
    });

  } catch (error) {
    console.error('[Smart Reply Route Error]:', error);
    return NextResponse.json(
      { error: 'Failed to generate smart reply: ' + error.message },
      { status: 500 }
    );
  }
}
