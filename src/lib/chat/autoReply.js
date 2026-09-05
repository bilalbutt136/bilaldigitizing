import { GoogleGenAI } from '@google/genai';

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
  } catch {
    return null;
  }
}

export async function generateHelpDeskAutoReply(options, maybeClientName) {
  let clientName, targetEmail, latestText, attachmentUrl, history;
  if (typeof options === 'string') {
    latestText = options;
    clientName = maybeClientName || '';
  } else if (options && typeof options === 'object') {
    ({ clientName, targetEmail, latestText, attachmentUrl, history } = options);
  }
  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();

  const customerName = clientName || (targetEmail ? targetEmail.split('@')[0] : 'there');

  const getContextualFallback = (text) => {
    const lower = String(text || '').toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('rate') || lower.includes('quote')) {
      return `Hi ${customerName}! Standard left chest and cap digitizing starts from $15 to $25, and vector art conversion starts from $15. Upload your design and we can get your order set up right away!`;
    }
    if (lower.includes('time') || lower.includes('turnaround') || lower.includes('how long') || lower.includes('urgent') || lower.includes('rush') || lower.includes('fast')) {
      return `Hi ${customerName}! Our standard turnaround is 2 to 6 hours, with 2-hour super-rush available. We work 24/7 to deliver fast!`;
    }
    if (lower.includes('format') || lower.includes('dst') || lower.includes('pes') || lower.includes('emb') || lower.includes('file') || lower.includes('machine')) {
      return `Hi ${customerName}! We deliver all standard embroidery machine files (DST, PES, EMB, EXP, VP3, JEF) and vector formats (AI, EPS, SVG, PDF).`;
    }
    if (lower.includes('patch') || lower.includes('patches') || lower.includes('custom patch')) {
      return `Hi ${customerName}! We make custom embroidered, woven, PVC, and leather patches (minimum 50 pcs). Share your quantity and dimensions for a quick quote!`;
    }
    return `Hi ${customerName}! Welcome to 24/7 Live Support. We've received your request and our team is ready to assist. Would you like us to proceed with setting up your order?`;
  };

  if (!apiKey) {
    return getContextualFallback(latestText);
  }

  try {
    const formattedHistory = Array.isArray(history) && history.length > 0
      ? history
          .slice(-6)
          .map(m => {
            const role = (m.sender === 'admin' || m.sender === 'support') ? '24/7 Live Support (You)' : `Customer (${customerName})`;
            return `${role}: ${m.text || ''}`.trim();
          })
          .filter(Boolean)
          .join('\n')
      : `Customer (${customerName}): ${latestText}`;

    const systemInstruction = `You are the 24/7 Live Support Specialist at B Digitizing Studio (Expert Embroidery Digitizing, Vector Art Conversion & Custom Physical Patches).
A customer (${customerName}) has messaged 24/7 Live Support.

### RULES:
1. **ULTRA-CONCISE & HELPFUL:** Strictly 1 to 3 direct sentences. Never write long essays or robotic paragraphs.
2. **NO ROBOTIC FILLER OR FORMAL SIGN-OFFS:** Never include boilerplate sign-offs like "Best regards, B Digitizing Team" or repetitive corporate greetings. Start naturally with a friendly greeting ("Hi ${customerName}!") and provide the direct, clear answer.
3. **EXACT DOMAIN FACTS:**
   - Turnaround: 2-6 hours standard, 2-hour super rush available.
   - Formats: DST (standard Tajima/Barudan machine format), PES, EMB, EXP, VP3, JEF, plus vector files (AI, EPS, SVG, PDF).
   - Pricing: Left chest/cap digitizing from $15-$25, vector conversion from $15-$18. Physical custom patches from 50 pcs minimum. Free minor revisions included.
4. Encourage them to upload artwork or let them know their order can be set up immediately.`;

    const promptText = `Recent Chat Transcript:\n${formattedHistory}\n\nCustomer Latest Message: "${latestText}"\n\nProvide the 24/7 Live Support response:`;

    const contents = [];
    if (attachmentUrl) {
      const img = await fetchImageAsBase64(attachmentUrl);
      if (img) {
        contents.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
      }
    }
    contents.push({ text: promptText });

    const ai = new GoogleGenAI({ apiKey });
    const models = ['gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 180,
          },
        });

        const rawText = response.text?.trim() || '';
        if (rawText) {
          let cleanReply = rawText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
          try {
            const parsed = JSON.parse(cleanReply);
            if (parsed.replyText || parsed.reply) cleanReply = parsed.replyText || parsed.reply;
          } catch {}
          if (cleanReply) return cleanReply;
        }
      } catch (err) {
        console.warn(`[Auto-Pilot Model ${model}] notice:`, err.message || err);
      }
    }

    return getContextualFallback(latestText);
  } catch (err) {
    console.warn('[Auto-Pilot Exception]:', err);
    return getContextualFallback(latestText);
  }
}
