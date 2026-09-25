import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';

export const dynamic = 'force-dynamic';

const SUPPORT_FROM = process.env.RESEND_SUPPORT_FROM || process.env.RESEND_FROM_ADDRESS || 'BDigitizing Support <support@bdigitizing.com>';
const ORDERS_FROM  = process.env.RESEND_FROM_ADDRESS || 'BDigitizing <support@bdigitizing.com>';

function buildResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

// ─── GET: list all campaigns stored in Supabase ───────────────────────────────
export async function GET(req) {
  try {
    const { isAdmin } = await getServerAuthUser(req);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ success: true, campaigns: data || [] });
  } catch (err) {
    console.error('[email-campaigns GET]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: create + send a campaign or test email ─────────────────────────────
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`email-campaign:${ip}`, 5, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Wait before sending again.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { isAdmin } = await getServerAuthUser(req);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      subject,
      htmlBody,
      recipientMode,   // 'test' | 'all_clients' | 'single'
      testEmail,
      singleEmail,
      campaignName,
      fromAlias,       // 'support' | 'orders'
      preview          // if true: dry-run, returns recipient list without sending
    } = body;

    if (!subject || !htmlBody) {
      return NextResponse.json({ error: 'subject and htmlBody are required' }, { status: 400 });
    }

    const fromAddress = fromAlias === 'orders' ? ORDERS_FROM : SUPPORT_FROM;
    const supabase   = createAdminClient();
    const resend     = buildResend();

    // ── Resolve recipient list ──────────────────────────────────────────────
    let recipients = [];

    if (recipientMode === 'test') {
      if (!testEmail) return NextResponse.json({ error: 'testEmail is required for test mode' }, { status: 400 });
      recipients = [testEmail.toLowerCase().trim()];
    } else if (recipientMode === 'single') {
      if (!singleEmail) return NextResponse.json({ error: 'singleEmail required' }, { status: 400 });
      recipients = [singleEmail.toLowerCase().trim()];
    } else {
      // all_clients — fetch opted-in client emails from Supabase
      const { data: clientRows, error: clientErr } = await supabase
        .from('clients')
        .select('email')
        .eq('email_opt_out', false)
        .not('email', 'is', null)
        .limit(2000);

      if (clientErr) throw clientErr;

      // De-duplicate
      const seen = new Set();
      for (const row of clientRows || []) {
        const e = (row.email || '').toLowerCase().trim();
        if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !seen.has(e)) {
          seen.add(e);
          recipients.push(e);
        }
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No eligible recipients found.' });
    }

    // ── Preview / dry-run ───────────────────────────────────────────────────
    if (preview) {
      return NextResponse.json({ success: true, recipientCount: recipients.length, recipients });
    }

    // ── Send via Resend (batch max 50 per call) ─────────────────────────────
    let sentCount = 0;
    let failCount = 0;
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      try {
        // Resend supports array of `to` addresses (BCC-style batch)
        const result = await resend.emails.send({
          from: fromAddress,
          to:   batch,
          subject,
          html:  htmlBody
        });
        if (result?.error) {
          console.warn('[email-campaigns] Batch error:', result.error.message);
          failCount += batch.length;
        } else {
          sentCount += batch.length;
        }
      } catch (batchErr) {
        console.warn('[email-campaigns] Batch send error:', batchErr.message);
        failCount += batch.length;
      }
    }

    // ── Persist campaign record ─────────────────────────────────────────────
    const { error: insertErr } = await supabase.from('email_campaigns').insert([{
      name:             campaignName || subject.slice(0, 80),
      subject,
      from_address:     fromAddress,
      recipient_mode:   recipientMode || 'all_clients',
      recipient_count:  recipients.length,
      sent_count:       sentCount,
      fail_count:       failCount,
      status:           failCount > 0 && sentCount === 0 ? 'failed' : failCount > 0 ? 'partial' : 'sent',
      created_at:       new Date().toISOString()
    }]);

    if (insertErr) console.warn('[email-campaigns] Insert record error:', insertErr.message);

    return NextResponse.json({
      success: true,
      sent:    sentCount,
      failed:  failCount,
      total:   recipients.length,
      message: `Campaign sent to ${sentCount} of ${recipients.length} recipients.`
    });
  } catch (err) {
    console.error('[email-campaigns POST]', err);
    return NextResponse.json({ error: err.message || 'Campaign send failed' }, { status: 500 });
  }
}
