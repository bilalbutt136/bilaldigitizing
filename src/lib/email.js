import { Resend } from 'resend';
import { createAdminClient } from './supabase/admin.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHAT_DEBOUNCE_MS = 2 * 60 * 1000; // 2 minutes debounce per recipient/conversation
const chatNotificationTracker = new Map();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of chatNotificationTracker.entries()) {
      if (now - timestamp > CHAT_DEBOUNCE_MS * 2) {
        chatNotificationTracker.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY is not configured.');
    return null;
  }
  return new Resend(apiKey);
};

const getFromAddress = () => {
  return process.env.RESEND_FROM_ADDRESS || 'Bilal Digitizing <onboarding@resend.dev>';
};

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
};

async function logNotificationToDb({
  eventType,
  recipientEmail,
  recipientName,
  senderName,
  subject,
  status,
  resendId,
  errorMessage,
  payload
}) {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from('email_notification_logs').insert([
      {
        event_type: eventType,
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        sender_name: senderName || null,
        subject: subject || null,
        status,
        resend_id: resendId || null,
        error_message: errorMessage || null,
        payload: payload || {},
        created_at: now,
        updated_at: now
      }
    ]);

    if (error && error.code !== 'PGRST205') {
      console.warn('[logNotificationToDb] email_notification_logs insert warning:', error.message);
    }

    if (status === 'sent' || status === 'rate_limited') {
      try {
        await supabase.from('notifications').insert([
          {
            id: `notif-email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            recipient_email: recipientEmail,
            recipient_role: eventType.includes('admin') ? 'admin' : 'client',
            title: subject || `Notification: ${eventType}`,
            message: payload?.messageSnippet || payload?.instructions || `System notification dispatched to ${recipientEmail}`,
            type: status === 'sent' ? 'info' : 'warning',
            order_id: payload?.orderId || null,
            read: false,
            created_at: now,
            updated_at: now
          }
        ]);
      } catch {}
    }
  } catch (err) {
    console.warn('[logNotificationToDb] Audit log error notice:', err?.message);
  }
}

async function sendMailWithRetry({
  to,
  subject,
  html,
  maxRetries = 2,
  initialDelayMs = 400
}) {
  if (!to || !EMAIL_REGEX.test(to.trim())) {
    return { success: false, error: `Invalid recipient email address: "${to}"` };
  }

  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY environment variable is not defined.' };
  }

  const configuredFrom = getFromAddress();
  const cleanTo = to.trim().toLowerCase();

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const { data, error } = await resend.emails.send({
        from: configuredFrom,
        to: cleanTo,
        subject,
        html
      });

      if (error) {
        throw new Error(error.message || 'Resend dispatch rejected');
      }

      return { success: true, id: data?.id };
    } catch (err) {
      lastError = err;
      attempt++;

      if (
        configuredFrom !== 'Bilal Digitizing <onboarding@resend.dev>' &&
        (err?.message?.includes('domain') || err?.message?.includes('from'))
      ) {
        try {
          console.warn('[sendMailWithRetry] Retrying with verified Resend onboarding address fallback...');
          const fallbackResult = await resend.emails.send({
            from: 'Bilal Digitizing <onboarding@resend.dev>',
            to: cleanTo,
            subject,
            html
          });
          if (fallbackResult.data?.id) {
            return { success: true, id: fallbackResult.data.id };
          }
        } catch (fbErr) {
          lastError = fbErr;
        }
      }

      if (attempt <= maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  return { success: false, error: lastError?.message || 'Email dispatch failed after retries' };
}

const renderEmailShell = ({
  badge,
  badgeColor = '#ea580c',
  title,
  subtitle,
  children,
  ctaText,
  ctaUrl
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 600px; margin: 32px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);">
        
        <!-- HEADER -->
        <div style="background: #090d16; padding: 26px 24px; text-align: center; border-bottom: 3px solid ${badgeColor};">
          <div style="color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; font-family: 'Segoe UI', Arial, sans-serif;">
            BILAL <span style="color: ${badgeColor};">DIGITIZING</span>
          </div>
          <div style="display: inline-block; background: rgba(255, 255, 255, 0.12); color: #f8fafc; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; padding: 5px 12px; border-radius: 9999px; margin-top: 10px;">
            ${badge}
          </div>
          <h1 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 12px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.3;">
            ${title}
          </h1>
          ${subtitle ? `<p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">${subtitle}</p>` : ''}
        </div>

        <!-- MAIN BODY CONTENT -->
        <div style="padding: 30px 26px; font-size: 14.5px; line-height: 1.6; color: #334155;">
          ${children}

          ${ctaText && ctaUrl ? `
            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="${ctaUrl}" style="background-color: ${badgeColor}; color: #ffffff; padding: 13px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; letter-spacing: 0.2px; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.25);">
                ${ctaText}
              </a>
            </div>
          ` : ''}
        </div>

        <!-- FOOTER -->
        <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">Bilal Digitizing Studio — Embroidery Digitizing & Vector Laboratory</p>
          <p style="margin: 0 0 6px 0;">24/7 Production Support • High-Density Stitch Accuracy • Rapid Client Desk</p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">You received this automated notification because your email is registered on bilaldigitizing.vercel.app.</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

export async function sendChatMessageNotification({
  recipientEmail,
  recipientName = 'Valued User',
  senderName,
  messageSnippet,
  conversationId,
  orderId,
  attachmentName,
  attachmentUrl,
  isClientRecipient = false
}) {
  if (!recipientEmail || !EMAIL_REGEX.test(recipientEmail.trim())) {
    return { success: false, status: 'failed', error: `Invalid recipient email: ${recipientEmail}` };
  }

  const debounceKey = `chat:${conversationId}:${recipientEmail.toLowerCase().trim()}`;
  const now = Date.now();
  const lastSent = chatNotificationTracker.get(debounceKey);

  if (lastSent && now - lastSent < CHAT_DEBOUNCE_MS) {
    console.log(`[sendChatMessageNotification] Debounced notification for ${recipientEmail} (sent ${Math.round((now - lastSent) / 1000)}s ago).`);
    return {
      success: true,
      status: 'rate_limited',
      targetEmail: recipientEmail,
      error: 'Notification suppressed by rapid-fire debounce window (2 minutes).'
    };
  }

  try {
    const supabase = createAdminClient();
    const { data: config } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'notification_settings')
      .maybeSingle();

    if (config?.value) {
      const parsed = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
      if (parsed?.messageAlerts === false && !isClientRecipient) {
        await logNotificationToDb({
          eventType: 'new_message',
          recipientEmail,
          senderName,
          status: 'bypassed',
          errorMessage: 'Message alerts disabled in admin settings.'
        });
        return { success: true, status: 'bypassed', targetEmail: recipientEmail };
      }
    }
  } catch (err) {
    console.warn('[sendChatMessageNotification] Config check notice:', err?.message);
  }

  const siteUrl = getSiteUrl();
  const chatUrl = isClientRecipient
    ? `${siteUrl}/client-portal?tab=chat&conversationId=${encodeURIComponent(conversationId)}`
    : `${siteUrl}/admin-portal?tab=chat&conversationId=${encodeURIComponent(conversationId)}`;

  const subject = orderId
    ? `💬 New Message on Order #${orderId} from ${senderName} — Bilal Digitizing`
    : `💬 New Studio Message from ${senderName} — Bilal Digitizing`;

  const safeSnippet = messageSnippet && messageSnippet.trim()
    ? messageSnippet.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : '(Sent an attachment or inquiry)';

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px;">
      Hello <strong>${recipientName}</strong>,
    </p>
    <p style="color: #475569; font-size: 14.5px;">
      You have received a new response in your active studio conversation from <strong>${senderName}</strong>:
    </p>

    <!-- Message Bubble -->
    <div style="background-color: #f8fafc; border-left: 4px solid #ea580c; border-radius: 6px; padding: 16px 20px; margin: 20px 0; box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);">
      <p style="margin: 0; font-size: 15px; color: #0f172a; line-height: 1.55; white-space: pre-wrap; font-style: italic;">
        "${safeSnippet}"
      </p>
      ${attachmentName ? `
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #64748b;">
          📎 <strong>Attachment:</strong> ${attachmentName}
          ${attachmentUrl ? `(<a href="${attachmentUrl}" target="_blank" style="color: #ea580c; text-decoration: none;">Download</a>)` : ''}
        </div>
      ` : ''}
    </div>

    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #64748b;">
      <span style="font-weight: 700; color: #334155;">Channel:</span> ${orderId ? `Order #${orderId}` : 'Direct Customer Desk'} • 
      <span style="font-weight: 700; color: #334155;">Time:</span> ${new Date().toUTCString()}
    </div>
  `;

  const html = renderEmailShell({
    badge: 'NEW MESSAGE ALERT',
    badgeColor: '#ea580c',
    title: `New Message from ${senderName}`,
    subtitle: orderId ? `Pertaining to Order #${orderId}` : 'Studio Live Inbox',
    children: contentHtml,
    ctaText: 'Open & Reply in Studio Inbox',
    ctaUrl: chatUrl
  });

  const dispatch = await sendMailWithRetry({ to: recipientEmail, subject, html });

  if (dispatch.success) {
    chatNotificationTracker.set(debounceKey, now);
    await logNotificationToDb({
      eventType: 'new_message',
      recipientEmail,
      recipientName,
      senderName,
      subject,
      status: 'sent',
      resendId: dispatch.id,
      payload: { messageSnippet: safeSnippet, conversationId, orderId }
    });
    return { success: true, status: 'sent', resendId: dispatch.id, targetEmail: recipientEmail };
  } else {
    await logNotificationToDb({
      eventType: 'new_message',
      recipientEmail,
      recipientName,
      senderName,
      subject,
      status: 'failed',
      errorMessage: dispatch.error,
      payload: { messageSnippet: safeSnippet, conversationId, orderId }
    });
    return { success: false, status: 'failed', error: dispatch.error, targetEmail: recipientEmail };
  }
}

export async function sendOrderNotification({
  orderId,
  clientEmail,
  clientName = 'Valued Client',
  serviceName = 'Embroidery Digitizing / Vector Art',
  amount = '15.00',
  dimensions = 'Standard (3.5" × 3.0")',
  placement = 'Left Chest / Cap',
  instructions = 'Standard production specifications',
  targetRole = 'both',
  adminEmail: explicitAdmin
}) {
  const siteUrl = getSiteUrl();
  const formattedPrice = typeof amount === 'number' ? `$${amount.toFixed(2)}` : (String(amount).startsWith('$') ? amount : `$${amount}`);

  let adminRecipient = explicitAdmin || process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'orders@bdigitizing-pro.com';
  let orderAlertsEnabled = true;

  try {
    const supabase = createAdminClient();
    const { data: rows } = await supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['admin_notification_email', 'notification_settings']);

    if (Array.isArray(rows)) {
      rows.forEach((r) => {
        if (r.key === 'admin_notification_email' && r.value) {
          const clean = String(r.value).trim().replace(/^["']|["']$/g, '');
          if (EMAIL_REGEX.test(clean)) adminRecipient = clean;
        }
        if (r.key === 'notification_settings' && r.value) {
          try {
            const parsed = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
            if (parsed?.adminEmail && EMAIL_REGEX.test(parsed.adminEmail)) {
              adminRecipient = parsed.adminEmail;
            }
            if (parsed?.orderAlerts !== undefined) orderAlertsEnabled = Boolean(parsed.orderAlerts);
          } catch {}
        }
      });
    }
  } catch {}

  let adminSuccess = true;
  let clientSuccess = true;
  let adminResendId = '';
  let clientResendId = '';
  let errors = [];

  if ((targetRole === 'admin' || targetRole === 'both') && orderAlertsEnabled && adminRecipient) {
    const adminSubject = `🚨 New Order #${orderId}: ${serviceName} (${formattedPrice})`;
    const adminUrl = `${siteUrl}/admin-portal?tab=orders&trackOrder=${encodeURIComponent(orderId)}`;

    const adminHtmlContent = `
      <p style="margin-top: 0; font-size: 15px;">A new order has been submitted and registered in the production database:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13.5px;">
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #475569; width: 35%;">Order ID</td>
          <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">#${orderId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Customer</td>
          <td style="padding: 10px 14px; color: #0f172a;">${clientName} (<a href="mailto:${clientEmail}" style="color: #ea580c; text-decoration: none;">${clientEmail}</a>)</td>
        </tr>
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Service</td>
          <td style="padding: 10px 14px; font-weight: 600; color: #0f172a;">${serviceName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Placements / Size</td>
          <td style="padding: 10px 14px; color: #0f172a;">${placement} • ${dimensions}</td>
        </tr>
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Total Paid</td>
          <td style="padding: 10px 14px; font-weight: 800; color: #16a34a; font-size: 15px;">${formattedPrice}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: 700; color: #475569; vertical-align: top;">Instructions</td>
          <td style="padding: 10px 14px; color: #334155; font-style: italic;">"${instructions}"</td>
        </tr>
      </table>
    `;

    const adminHtml = renderEmailShell({
      badge: 'NEW ORDER RECEIVED',
      badgeColor: '#ea580c',
      title: `Order #${orderId} Submitted`,
      subtitle: `${serviceName} • ${formattedPrice}`,
      children: adminHtmlContent,
      ctaText: 'Open Order in Admin Portal',
      ctaUrl: adminUrl
    });

    const dispatch = await sendMailWithRetry({ to: adminRecipient, subject: adminSubject, html: adminHtml });
    if (dispatch.success) {
      adminResendId = dispatch.id || '';
      await logNotificationToDb({
        eventType: 'new_order_admin',
        recipientEmail: adminRecipient,
        recipientName: 'Studio Admin',
        subject: adminSubject,
        status: 'sent',
        resendId: dispatch.id,
        payload: { orderId, clientEmail, amount: formattedPrice }
      });
    } else {
      adminSuccess = false;
      errors.push(`Admin email error: ${dispatch.error}`);
      await logNotificationToDb({
        eventType: 'new_order_admin',
        recipientEmail: adminRecipient,
        recipientName: 'Studio Admin',
        subject: adminSubject,
        status: 'failed',
        errorMessage: dispatch.error,
        payload: { orderId, clientEmail, amount: formattedPrice }
      });
    }
  }

  if ((targetRole === 'client' || targetRole === 'both') && clientEmail && EMAIL_REGEX.test(clientEmail.trim())) {
    const clientSubject = `🌟 Order Confirmation #${orderId} — Bilal Digitizing`;
    const clientUrl = `${siteUrl}/client-portal?tab=orders&trackOrder=${encodeURIComponent(orderId)}`;

    const clientHtmlContent = `
      <p style="margin-top: 0; font-size: 15px;">Hi <strong>${clientName}</strong>,</p>
      <p style="color: #475569; font-size: 14.5px;">
        Thank you for ordering with <strong>Bilal Digitizing Studio</strong>! Our master digitizers are reviewing your artwork and preparing production pathing with zero thread breaks.
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <div style="font-size: 13.5px; margin-bottom: 8px;"><strong>Order ID:</strong> #${orderId}</div>
        <div style="font-size: 13.5px; margin-bottom: 8px;"><strong>Service:</strong> ${serviceName}</div>
        <div style="font-size: 13.5px; margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #ea580c; font-weight: 700;">In Production</span></div>
        <div style="font-size: 13.5px;"><strong>Total:</strong> <span style="color: #16a34a; font-weight: 700;">${formattedPrice}</span></div>
      </div>

      <p style="font-size: 13.5px; color: #64748b;">
        ⏱ <strong>Turnaround Guarantee:</strong> Your machine files (.DST, .PES, .EMB, .PDF worksheet) will be delivered within 12-24 hours. You can track live progress anytime in your Client Portal.
      </p>
    `;

    const clientHtml = renderEmailShell({
      badge: 'ORDER CONFIRMED',
      badgeColor: '#16a34a',
      title: 'Your Order is in Production!',
      subtitle: `Order #${orderId} • Expected 12-24h turnaround`,
      children: clientHtmlContent,
      ctaText: 'Track Order & Files in Portal',
      ctaUrl: clientUrl
    });

    const dispatch = await sendMailWithRetry({ to: clientEmail, subject: clientSubject, html: clientHtml });
    if (dispatch.success) {
      clientResendId = dispatch.id || '';
      await logNotificationToDb({
        eventType: 'new_order_client',
        recipientEmail: clientEmail,
        recipientName: clientName,
        subject: clientSubject,
        status: 'sent',
        resendId: dispatch.id,
        payload: { orderId, amount: formattedPrice }
      });
    } else {
      clientSuccess = false;
      errors.push(`Client email error: ${dispatch.error}`);
      await logNotificationToDb({
        eventType: 'new_order_client',
        recipientEmail: clientEmail,
        recipientName: clientName,
        subject: clientSubject,
        status: 'failed',
        errorMessage: dispatch.error,
        payload: { orderId, amount: formattedPrice }
      });
    }
  }

  const overallSuccess = adminSuccess && clientSuccess;
  return {
    success: overallSuccess,
    status: overallSuccess ? 'sent' : (adminSuccess || clientSuccess ? 'sent' : 'failed'),
    resendId: adminResendId || clientResendId,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}
