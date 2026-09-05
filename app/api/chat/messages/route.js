import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { extractGuestId } from '../../../../src/utils/sessionHelper';

export const dynamic = 'force-dynamic';

const isSupportConversation = (id) => {
  if (!id) return false;
  const lower = String(id).toLowerCase().trim();
  return lower === 'general-support' || lower === 'support-guest' || lower === 'help-support' || lower.startsWith('support-');
};

const isValidEmail = (e) => {
  if (!e) return false;
  const str = String(e).toLowerCase().trim();
  if (str === 'client@studio.com' || str.includes('guest@bdigitizing.pro')) return false;
  return str.includes('@') && str.includes('.');
};

export async function GET(req) {
  try {
    const supabase = createAdminClient();
    const { user, isAdmin } = await getServerAuthUser(req);
    const { searchParams } = new URL(req.url);

    const convId = searchParams.get('conversation_id') || searchParams.get('chatId') || '';
    const guestIdParam = searchParams.get('guest_id') || extractGuestId(convId);
    const emailParam = searchParams.get('clientEmail') || searchParams.get('email') || '';

    const cleanEmail = isValidEmail(emailParam) ? emailParam.toLowerCase().trim() : (user?.email && isValidEmail(user.email) ? user.email.toLowerCase().trim() : null);

    if (!convId && !guestIdParam && !cleanEmail) {
      return NextResponse.json({ success: true, messages: [] });
    }

    // Security check: non-admins cannot query someone else's email thread
    if (!isAdmin && cleanEmail && user?.email && user.email.toLowerCase().trim() !== cleanEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized to view this thread.' }, { status: 403 });
    }

    const targetConvIds = new Set();
    if (convId) {
      targetConvIds.add(convId);
      targetConvIds.add(convId.toLowerCase());
    }

    if (guestIdParam) {
      targetConvIds.add(`support-${guestIdParam}`);
      targetConvIds.add(`inbox-${guestIdParam}`);
      targetConvIds.add(guestIdParam);
    }

    if (cleanEmail) {
      targetConvIds.add(`support-${cleanEmail}`);
      targetConvIds.add(`inbox-${cleanEmail}`);
      targetConvIds.add(`direct-${cleanEmail}`);
      targetConvIds.add(`chat-${cleanEmail}`);
    }

    // Build database query
    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });

    const orConditions = [];
    if (targetConvIds.size > 0) {
      const idList = Array.from(targetConvIds).map(id => `conversation_id.eq.${id}`).join(',');
      orConditions.push(idList);
    }
    if (guestIdParam) {
      orConditions.push(`guest_id.eq.${guestIdParam}`);
    }
    if (cleanEmail) {
      orConditions.push(`client_email.ilike.${cleanEmail}`);
    }

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','));
    }

    const { data: rawMessages, error } = await query;
    if (error) {
      console.warn('[Chat Messages GET error]:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Fetch custom offers for authoritative hydration
    let customOffersMap = new Map();
    try {
      const { data: offers } = await supabase.from('custom_offers').select('*');
      if (Array.isArray(offers)) {
        offers.forEach(o => { if (o?.id) customOffersMap.set(o.id, o); });
      }
    } catch {}

    const formattedMessages = (rawMessages || [])
      .filter(m => !m.deleted_at)
      .map(m => {
        let offerData = m.offer_data || m.offerData || null;
        if (typeof offerData === 'string') {
          try { offerData = JSON.parse(offerData); } catch { offerData = null; }
        }
        let offerId = m.offer_id || m.offerId || offerData?.id || null;
        if (offerId && customOffersMap.has(offerId)) {
          offerData = { ...(offerData || {}), ...customOffersMap.get(offerId) };
        }

        let attachUrl = m.attachment_url || null;
        let attachName = m.attachment_name || null;
        let attachSize = m.attachment_size || null;
        let attachType = m.attachment_type || null;

        if (m.attachment && typeof m.attachment === 'string' && !offerData) {
          const trimmed = m.attachment.trim();
          if (trimmed.startsWith('{')) {
            try {
              const p = JSON.parse(trimmed);
              attachUrl = p.url || p.file_url || attachUrl;
              attachName = p.name || p.file_name || attachName;
              attachSize = p.size || p.file_size || attachSize;
              attachType = p.type || p.mime_type || attachType;
            } catch {}
          } else if (trimmed.startsWith('http')) {
            attachUrl = trimmed;
            if (!attachName) attachName = decodeURIComponent(trimmed.split('/').pop()?.split('?')[0] || 'file');
          } else if (!attachName) {
            attachName = trimmed;
          }
        }

        return {
          id: m.id,
          conversation_id: m.conversation_id,
          thread_id: m.thread_id || m.conversation_id,
          guest_id: m.guest_id || null,
          type: m.type || (offerId || offerData ? 'custom_offer' : 'text'),
          metadata: m.metadata || {},
          client_email: m.client_email || null,
          sender: m.sender,
          senderName: m.sender === 'admin' ? 'Support' : (m.sender_name || 'Client'),
          sender_name: m.sender_name,
          text: offerData ? `📋 Custom Offer: ${offerData.title} ($${parseFloat(offerData.final_price || offerData.price || 0).toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(offerData)}]` : (m.text || ''),
          attachment: offerData ? JSON.stringify(offerData) : m.attachment,
          attachment_url: attachUrl,
          attachment_name: attachName,
          attachment_size: attachSize,
          attachment_type: offerData ? 'custom_offer' : attachType,
          reply_to: m.reply_to || null,
          offer_id: offerId,
          offer_data: offerData,
          status: m.status || 'sent',
          is_read: m.is_read === true || m.is_read === 'true',
          timestamp: m.timestamp || m.created_at
        };
      });

    return NextResponse.json({ success: true, messages: formattedMessages });
  } catch (err) {
    console.error('[GET /api/chat/messages]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
