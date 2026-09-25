import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';

export const dynamic = 'force-dynamic';

const DEFAULT_FROM = process.env.RESEND_FROM_ADDRESS || 'BDigitizing Support <support@bdigitizing.com>';
const RESEND_SANDBOX_OWNER = 'bilalsadiq612@gmail.com';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateCampaignHtml({
  subject = '',
  headline = '',
  message = '',
  offerCode = '',
  buttonText = '',
  buttonUrl = '',
  siteUrl = 'https://bdigitizing.com'
}) {
  const cleanHeadline = (headline || subject || 'Special Announcement from BDigitizing Studio').trim();
  const rawParagraphs = (message || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  const paragraphsHtml = rawParagraphs.length > 0
    ? rawParagraphs.map(p => `<p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(p)}</p>`).join('')
    : `<p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 1.7;">${escapeHtml(message || '')}</p>`;

  const offerHtml = offerCode && offerCode.trim() ? `
    <div style="background: #fff7ed; border: 2px dashed #ea580c; border-radius: 10px; padding: 18px 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; font-weight: 800; color: #c2410c; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
        EXCLUSIVE PROMOTION / COUPON
      </div>
      <div style="font-size: 24px; font-weight: 800; color: #ea580c; letter-spacing: 2px; font-family: monospace;">
        ${escapeHtml(offerCode.trim())}
      </div>
      <div style="font-size: 12px; color: #7c2d12; margin-top: 6px;">
        Mention this promo code or apply it when placing your order.
      </div>
    </div>
  ` : '';

  const targetButtonText = (buttonText || '').trim();
  const targetButtonUrl = (buttonUrl || '').trim() || siteUrl;

  const buttonHtml = targetButtonText ? `
    <div style="text-align: center; margin: 28px 0 14px 0;">
      <a href="${escapeHtml(targetButtonUrl)}" style="display: inline-block; background: #ea580c; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 15px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">
        ${escapeHtml(targetButtonText)}
      </a>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject || 'BDigitizing Studio')}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: #090d16; padding: 26px 30px; text-align: center; border-bottom: 3px solid #ea580c;">
              <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                BDIGITIZING <span style="color: #ea580c;">STUDIO</span>
              </h1>
              <div style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Commercial Embroidery Digitizing &amp; Vector Lab
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; color: #1e293b;">
              <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.35;">
                ${escapeHtml(cleanHeadline)}
              </h2>

              ${paragraphsHtml}
              ${offerHtml}
              ${buttonHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
              <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">BDigitizing Studio</div>
              <div>Support: <a href="mailto:support@bdigitizing.com" style="color: #ea580c; text-decoration: none;">support@bdigitizing.com</a> • <a href="${siteUrl}" style="color: #ea580c; text-decoration: none;">bdigitizing.com</a></div>
              <div style="margin-top: 12px; font-size: 11px; color: #94a3b8;">
                You received this email because you are a registered customer of BDigitizing Studio.
                <br>
                <a href="${siteUrl}/client-portal" style="color: #64748b; text-decoration: underline;">Manage account or preferences</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function dispatchSingleEmail({ from, to, subject, html }) {
  // Option 1: Direct SMTP (Namecheap Private Email / Custom SMTP) if configured
  const smtpPass = process.env.SMTP_PASS;
  if (smtpPass) {
    try {
      const smtpHost = process.env.SMTP_HOST || 'mail.privateemail.com';
      const smtpUser = process.env.SMTP_USER || 'support@bdigitizing.com';
      const smtpPort = Number(process.env.SMTP_PORT) || 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const info = await transporter.sendMail({
        from: from || `BDigitizing Support <${smtpUser}>`,
        to,
        subject,
        html
      });

      return { success: true, provider: 'smtp', id: info.messageId };
    } catch (smtpErr) {
      console.warn('[email-campaigns] SMTP dispatch failed, trying Resend fallback:', smtpErr.message);
    }
  }

  // Option 2: Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('Email sending service is not configured. Missing RESEND_API_KEY or SMTP_PASS.');
  }

  const resend = new Resend(resendApiKey);

  try {
    const res = await resend.emails.send({
      from,
      to,
      subject,
      html
    });

    if (res?.error) {
      throw new Error(res.error.message || 'Resend dispatch rejected');
    }
    return { success: true, provider: 'resend', id: res?.data?.id || res?.id };
  } catch (err) {
    const errMsg = err?.message || String(err);

    // If Resend rejected because bdigitizing.com is not verified yet, AND target is account owner:
    const isOwner = Array.isArray(to) ? to.includes(RESEND_SANDBOX_OWNER) : to === RESEND_SANDBOX_OWNER;
    if (errMsg.includes('not verified') && isOwner) {
      console.log('[email-campaigns] Falling back to onboarding@resend.dev for verified owner test...');
      const fallback = await resend.emails.send({
        from: 'BDigitizing <onboarding@resend.dev>',
        to: RESEND_SANDBOX_OWNER,
        subject: `[TEST] ${subject}`,
        html
      });

      if (!fallback?.error) {
        return {
          success: true,
          provider: 'resend-sandbox',
          id: fallback?.data?.id || fallback?.id,
          notice: 'Delivered to verified admin address via test sandbox.'
        };
      }
    }

    throw new Error(errMsg);
  }
}

// ─── GET: list all campaigns stored in Supabase ───────────────────────────────
export async function GET(req) {
  try {
    const { isAdmin } = await getServerAuthUser(req);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Check configuration health
    const hasSmtp = Boolean(process.env.SMTP_PASS);
    const hasResend = Boolean(process.env.RESEND_API_KEY);

    return NextResponse.json({
      success: true,
      campaigns: data || [],
      config: {
        hasSmtp,
        hasResend,
        fromAddress: DEFAULT_FROM,
        smtpHost: process.env.SMTP_HOST || 'mail.privateemail.com'
      }
    });
  } catch (err) {
    console.error('[email-campaigns GET]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: create and send campaign ──────────────────────────────────────────
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`email-campaign:${ip}`, 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before sending another campaign.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { isAdmin } = await getServerAuthUser(req);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      campaignName,
      subject,
      headline,
      message,
      offerCode,
      buttonText,
      buttonUrl,
      recipientMode,   // 'test' | 'single' | 'all_clients'
      testEmail,
      singleEmail,
      preview          // if true: dry-run, returns recipient count
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Email subject line is required.' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Email message content is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com';

    // Auto-generate clean HTML template from simple text inputs
    const html = generateCampaignHtml({
      subject,
      headline,
      message,
      offerCode,
      buttonText,
      buttonUrl,
      siteUrl
    });

    // ── Resolve Recipients ───────────────────────────────────────────────────
    let recipients = [];

    if (recipientMode === 'test') {
      const email = (testEmail || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid test email address.' }, { status: 400 });
      }
      recipients = [email];
    } else if (recipientMode === 'single') {
      const email = (singleEmail || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid recipient email address.' }, { status: 400 });
      }
      recipients = [email];
    } else {
      // all_clients: fetch active clients from database
      const { data: clientRows, error: clientErr } = await supabase
        .from('clients')
        .select('email')
        .eq('email_opt_out', false)
        .not('email', 'is', null)
        .limit(2000);

      if (clientErr) throw clientErr;

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

    // ── Dry-run preview mode ─────────────────────────────────────────────────
    if (preview) {
      return NextResponse.json({
        success: true,
        recipientCount: recipients.length,
        recipients: recipients.slice(0, 50),
        previewHtml: html
      });
    }

    // ── Execute Dispatch ─────────────────────────────────────────────────────
    let sentCount = 0;
    let failCount = 0;
    let firstErrorMessage = null;

    const fromAddress = DEFAULT_FROM;

    for (const recipient of recipients) {
      try {
        await dispatchSingleEmail({
          from: fromAddress,
          to: recipient,
          subject,
          html
        });
        sentCount++;
      } catch (sendErr) {
        failCount++;
        if (!firstErrorMessage) {
          firstErrorMessage = sendErr?.message || 'Failed to dispatch email';
        }
        console.warn(`[email-campaigns] Send failed for ${recipient}:`, sendErr.message);
      }
    }

    const campaignStatus = failCount === 0 ? 'sent' : sentCount > 0 ? 'partial' : 'failed';

    // ── Record Campaign in Database ──────────────────────────────────────────
    const { error: insertErr } = await supabase.from('email_campaigns').insert([{
      name: campaignName?.trim() || subject.slice(0, 80),
      subject: subject.trim(),
      from_address: fromAddress,
      recipient_mode: recipientMode || 'all_clients',
      recipient_count: recipients.length,
      sent_count: sentCount,
      fail_count: failCount,
      status: campaignStatus,
      error_message: firstErrorMessage || null,
      created_at: new Date().toISOString()
    }]);

    if (insertErr) {
      console.warn('[email-campaigns] Database record insert error:', insertErr.message);
    }

    if (campaignStatus === 'failed') {
      let userFriendlyHint = firstErrorMessage;
      if (firstErrorMessage && firstErrorMessage.includes('domain is not verified')) {
        userFriendlyHint = `Resend requires domain verification for support@bdigitizing.com. Go to resend.com/domains to verify bdigitizing.com, or configure Namecheap SMTP password in settings.`;
      }
      return NextResponse.json({
        success: false,
        error: userFriendlyHint,
        details: firstErrorMessage,
        total: recipients.length,
        failed: failCount
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failCount,
      total: recipients.length,
      message: `Campaign sent successfully to ${sentCount} recipient${sentCount !== 1 ? 's' : ''}.`
    });

  } catch (err) {
    console.error('[email-campaigns POST]', err);
    return NextResponse.json({ error: err.message || 'Campaign processing failed.' }, { status: 500 });
  }
}
