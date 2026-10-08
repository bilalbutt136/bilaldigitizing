import { Resend } from 'resend';
import { createAdminClient } from './supabase/admin.js';
import { checkAndSetEmailDedup } from './emailService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY is not configured.');
    return null;
  }
  return new Resend(apiKey);
};

const getFromAddress = () => {
  return process.env.RESEND_FROM_ADDRESS || 'BDigitizing Support <support@bdigitizing.com>';
};

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com';
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
        configuredFrom !== 'BDigitizing <onboarding@resend.dev>' &&
        (err?.message?.includes('domain') || err?.message?.includes('from'))
      ) {
        try {
          console.warn('[sendMailWithRetry] Retrying with verified Resend onboarding address fallback...');
          const fallbackResult = await resend.emails.send({
            from: 'BDigitizing <onboarding@resend.dev>',
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
            BDigitizing <span style="color: ${badgeColor};">STUDIO</span>
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
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">BDigitizing Studio — Embroidery Digitizing & Vector Laboratory</p>
          <p style="margin: 0 0 6px 0;">24/7 Production Support • High-Density Stitch Accuracy • Rapid Client Desk</p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">You received this automated notification because your email is registered on BDigitizing.</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

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
  adminEmail: explicitAdmin,
  adminEmails: explicitAdminEmails
}) {
  const cleanOrderId = String(orderId || '').replace(/^#+/, '').trim().toLowerCase();
  if (cleanOrderId && cleanOrderId !== 'direct' && checkAndSetEmailDedup(`NEW_ORDER:${cleanOrderId}`)) {
    console.log(`[sendOrderNotification] Suppressed duplicate order notification for #${cleanOrderId}`);
    return {
      success: true,
      duplicateSuppressed: true,
      adminSuccess: true,
      clientSuccess: true,
      message: `Duplicate order notification for #${cleanOrderId} suppressed.`
    };
  }

  const siteUrl = getSiteUrl();
  const formattedPrice = typeof amount === 'number' ? `$${amount.toFixed(2)}` : (String(amount).startsWith('$') ? amount : `$${amount}`);

  let adminRecipients = [];
  if (Array.isArray(explicitAdminEmails) && explicitAdminEmails.length > 0) {
    adminRecipients = explicitAdminEmails.filter(e => typeof e === 'string' && EMAIL_REGEX.test(e.trim())).map(e => e.trim().toLowerCase());
  } else if (typeof explicitAdmin === 'string' && explicitAdmin.trim()) {
    const parts = explicitAdmin.split(/[\s,]+/).filter(e => EMAIL_REGEX.test(e.trim())).map(e => e.trim().toLowerCase());
    if (parts.length > 0) adminRecipients = parts;
  }

  let orderAlertsEnabled = true;

  try {
    const supabase = createAdminClient();
    const { data: rows } = await supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['admin_notification_email', 'admin_notification_emails', 'notification_settings']);

    if (Array.isArray(rows)) {
      rows.forEach((r) => {
        if (r.key === 'admin_notification_emails' && r.value) {
          try {
            const parsed = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
            if (Array.isArray(parsed)) {
              parsed.forEach(e => {
                if (typeof e === 'string' && EMAIL_REGEX.test(e.trim())) {
                  adminRecipients.push(e.trim().toLowerCase());
                }
              });
            } else if (typeof r.value === 'string') {
              r.value.split(/[\s,]+/).forEach(e => {
                if (EMAIL_REGEX.test(e.trim())) adminRecipients.push(e.trim().toLowerCase());
              });
            }
          } catch {}
        }
        if (r.key === 'admin_notification_email' && r.value) {
          const clean = String(r.value).trim().replace(/^["']|["']$/g, '');
          if (EMAIL_REGEX.test(clean)) adminRecipients.push(clean.toLowerCase());
        }
        if (r.key === 'notification_settings' && r.value) {
          try {
            const parsed = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
            if (parsed?.adminEmail && EMAIL_REGEX.test(parsed.adminEmail)) {
              adminRecipients.push(parsed.adminEmail.trim().toLowerCase());
            }
            if (Array.isArray(parsed?.adminEmails)) {
              parsed.adminEmails.forEach(e => {
                if (typeof e === 'string' && EMAIL_REGEX.test(e.trim())) {
                  adminRecipients.push(e.trim().toLowerCase());
                }
              });
            }
            if (parsed?.orderAlerts !== undefined) orderAlertsEnabled = Boolean(parsed.orderAlerts);
          } catch {}
        }
      });
    }
  } catch {}

  const defaultAdmin = (process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'support@bdigitizing.com').toLowerCase().trim();
  adminRecipients = Array.from(new Set(adminRecipients));
  if (adminRecipients.length === 0) {
    adminRecipients = [defaultAdmin];
  }

  let adminSuccess = true;
  let clientSuccess = true;
  let adminResendId = '';
  let clientResendId = '';
  let errors = [];

  if ((targetRole === 'admin' || targetRole === 'both') && orderAlertsEnabled && adminRecipients.length > 0) {
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

    for (const recipient of adminRecipients) {
      const dispatch = await sendMailWithRetry({ to: recipient, subject: adminSubject, html: adminHtml });
      if (dispatch.success) {
        if (!adminResendId) adminResendId = dispatch.id || '';
        await logNotificationToDb({
          eventType: 'new_order_admin',
          recipientEmail: recipient,
          recipientName: 'Studio Admin',
          subject: adminSubject,
          status: 'sent',
          resendId: dispatch.id,
          payload: { orderId, clientEmail, amount: formattedPrice }
        });
      } else {
        adminSuccess = false;
        errors.push(`Admin email error (${recipient}): ${dispatch.error}`);
        await logNotificationToDb({
          eventType: 'new_order_admin',
          recipientEmail: recipient,
          recipientName: 'Studio Admin',
          subject: adminSubject,
          status: 'failed',
          errorMessage: dispatch.error,
          payload: { orderId, clientEmail, amount: formattedPrice }
        });
      }
    }
  }

  const cleanClientEmail = (clientEmail || '').trim().toLowerCase();
  const isClientAlsoAdmin = adminRecipients.includes(cleanClientEmail);
  if ((targetRole === 'client' || targetRole === 'both') && cleanClientEmail && EMAIL_REGEX.test(cleanClientEmail) && !isClientAlsoAdmin) {
    const clientSubject = `🌟 Order Confirmation #${orderId} — BDigitizing`;
    const clientUrl = `${siteUrl}/client-portal?tab=orders&trackOrder=${encodeURIComponent(orderId)}`;

    const clientHtmlContent = `
      <p style="margin-top: 0; font-size: 15px;">Hi <strong>${clientName}</strong>,</p>
      <p style="color: #475569; font-size: 14.5px;">
        Thank you for ordering with <strong>BDigitizing Studio</strong>! Our master digitizers are reviewing your artwork and preparing production pathing with zero thread breaks.
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
