import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function POST(request) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const {
      conversation_id: rawConvId,
      order_id = null,
      sender_id = 'guest',
      sender_email = '',
      sender_name = 'Customer',
      sender_role = 'client',
      content = '',
      attachments = [],
      reply_to = null,
      metadata = {},
      recipient_email = '',
      recipient_name = ''
    } = payload;

    const cleanContent = (content || '').trim();
    if (!cleanContent && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachment is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { user, isAdmin } = await getServerAuthUser(request);

    const actualSenderEmail = user?.email || sender_email || 'guest@bdigitizing-pro.com';
    const actualSenderId = user?.id || sender_id || actualSenderEmail;
    const actualSenderRole = isAdmin ? 'admin' : (sender_role === 'admin' ? 'client' : sender_role);
    const actualSenderName = isAdmin 
      ? '24/7 Support Desk' 
      : (user?.user_metadata?.full_name || sender_name || actualSenderEmail.split('@')[0]);

    let resolvedConversationId = rawConvId;

    // ─────────────────────────────────────────────────────────────
    // 1. CREATE OR RESOLVE CONVERSATION THREAD
    // ─────────────────────────────────────────────────────────────
    if (!resolvedConversationId || resolvedConversationId === 'new' || resolvedConversationId.startsWith('new-')) {
      const convTitle = order_id ? `Order #${order_id.replace(/^#+/, '')}` : (cleanContent.substring(0, 40) || 'Support Chat');
      const convType = order_id ? 'order' : 'support';

      const { data: newConv, error: convCreateErr } = await supabase
        .from('conversations')
        .insert([{
          title: convTitle,
          type: convType,
          order_id: order_id || null,
          metadata: {
            client_name: actualSenderName,
            client_email: actualSenderEmail,
            ...metadata
          }
        }])
        .select()
        .single();

      if (convCreateErr) throw convCreateErr;
      resolvedConversationId = newConv.id;

      // Add Sender as Participant
      await supabase.from('conversation_participants').upsert([{
        conversation_id: resolvedConversationId,
        user_id: actualSenderId,
        user_email: actualSenderEmail,
        user_name: actualSenderName,
        role: actualSenderRole,
        unread_count: 0
      }], { onConflict: 'conversation_id,user_id' });

      // Add Admin Support Participant
      const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'support@bdigitizing-pro.com';
      if (actualSenderRole !== 'admin') {
        await supabase.from('conversation_participants').upsert([{
          conversation_id: resolvedConversationId,
          user_id: 'admin-master',
          user_email: adminEmail,
          user_name: 'Studio Support',
          role: 'admin',
          unread_count: 1
        }], { onConflict: 'conversation_id,user_id' });
      }
    } else {
      // Ensure sender is registered as participant in existing conversation
      await supabase.from('conversation_participants').upsert([{
        conversation_id: resolvedConversationId,
        user_id: actualSenderId,
        user_email: actualSenderEmail,
        user_name: actualSenderName,
        role: actualSenderRole,
        last_read_at: new Date().toISOString()
      }], { onConflict: 'conversation_id,user_id' });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. INSERT MESSAGE
    // ─────────────────────────────────────────────────────────────
    const messageRow = {
      conversation_id: resolvedConversationId,
      sender_id: actualSenderId,
      sender_email: actualSenderEmail,
      sender_name: actualSenderName,
      sender_role: actualSenderRole,
      content: cleanContent,
      attachments: Array.isArray(attachments) ? attachments : [],
      reply_to: reply_to || null,
      metadata: metadata || {},
      is_read: false,
      created_at: new Date().toISOString()
    };

    const { data: insertedMsg, error: insertErr } = await supabase
      .from('messages')
      .insert([messageRow])
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      message: insertedMsg,
      conversation_id: resolvedConversationId
    }, { headers: NO_CACHE_HEADERS });

  } catch (err) {
    console.error('[API /api/chat/send Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}
