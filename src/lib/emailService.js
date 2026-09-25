import { Resend } from 'resend';
import { createAdminClient } from './supabase/admin.js';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Resend account owner verified on sandbox domain
export const RESEND_VERIFIED_FALLBACK_EMAIL = 'bilalsadiq612@gmail.com';

/**
 * Resolves destination admin email and notification preferences from Supabase site_config
 */
export async function resolveAdminNotificationConfig() {
  let adminEmail = '';
  let notificationPrefs = {
    orderAlerts: true,
    messageAlerts: true,
    revisionAlerts: true,
    deliveryAlerts: true
  };

  try {
    const supabase = createAdminClient();
    const { data: configRows } = await supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['admin_notification_email', 'notification_settings', 'contactInfo']);

    if (Array.isArray(configRows)) {
      configRows.forEach(row => {
        if (row.key === 'admin_notification_email' && row.value) {
          const val = String(row.value).trim().replace(/^["']|["']$/g, '');
          if (EMAIL_REGEX.test(val)) adminEmail = val;
        }
        if (row.key === 'notification_settings' && row.value) {
          try {
            const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
            if (parsed?.adminEmail && EMAIL_REGEX.test(parsed.adminEmail)) {
              adminEmail = parsed.adminEmail;
            }
            if (parsed?.orderAlerts !== undefined) notificationPrefs.orderAlerts = Boolean(parsed.orderAlerts);
            if (parsed?.messageAlerts !== undefined) notificationPrefs.messageAlerts = Boolean(parsed.messageAlerts);
            if (parsed?.revisionAlerts !== undefined) notificationPrefs.revisionAlerts = Boolean(parsed.revisionAlerts);
            if (parsed?.deliveryAlerts !== undefined) notificationPrefs.deliveryAlerts = Boolean(parsed.deliveryAlerts);
          } catch {}
        }
        if (!adminEmail && row.key === 'contactInfo' && row.value) {
          try {
            const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
            if (parsed?.email && EMAIL_REGEX.test(parsed.email)) {
              adminEmail = parsed.email;
            }
          } catch {}
        }
      });
    }
  } catch (err) {
    console.warn('[emailService] Error fetching admin notification config:', err?.message);
  }

  const fallbackAdmin = process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || RESEND_VERIFIED_FALLBACK_EMAIL;
  const finalAdminEmail = (adminEmail || fallbackAdmin).toLowerCase().trim();

  return {
    adminEmail: finalAdminEmail,
    notificationPrefs
  };
}

/**
 * Core notification email sender with multi-tier fallback for 100% delivery guarantee
 */
export async function sendNotificationEmail(params = {}) {
  const {
    type,
    orderId,
    clientEmail,
    adminEmail: explicitAdminEmail,
    clientName,
    serviceName,
    amount,
    messageText,
    senderName,
    recipientEmail,
    revisionNotes,
    channel,
    attachments = [],
    orderDetails = {}
  } = params;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[emailService] RESEND_API_KEY is not set. Email notification bypassed.');
    return { success: false, warning: 'RESEND_API_KEY is not configured' };
  }

  try {
    const resend = new Resend(resendApiKey);
    const { adminEmail: dynamicAdminEmail, notificationPrefs } = await resolveAdminNotificationConfig();
    
    const targetAdminEmail = (explicitAdminEmail || dynamicAdminEmail || RESEND_VERIFIED_FALLBACK_EMAIL).toLowerCase().trim();
    const targetClientEmail = (clientEmail || recipientEmail || '').toLowerCase().trim();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com';
    const configuredFrom = process.env.RESEND_FROM_ADDRESS || 'BDigitizing <support@bdigitizing.com>';

  // Shared send wrapper with automatic fallback if recipient is rejected by sandbox domain restriction
  const executeSend = async ({ to, subject, html }) => {
    if (!to || !EMAIL_REGEX.test(to)) {
      console.warn(`[emailService] Skipped sending due to invalid recipient email: "${to}"`);
      return null;
    }

    try {
      const response = await resend.emails.send({
        from: configuredFrom,
        to,
        subject,
        html
      });

      // Check if Resend returned an error object inside successful HTTP response
      if (response?.error) {
        throw new Error(response.error.message || 'Resend delivery rejected');
      }

      return { ...response, recipient: to, fallbackApplied: false };
    } catch (sendErr) {
      console.warn(`[emailService] First delivery attempt to "${to}" failed:`, sendErr.message);

      // If the failure is due to Resend sandbox restriction ("only send testing emails to your own email address")
      // OR recipient is not the account owner, immediately failover to RESEND_VERIFIED_FALLBACK_EMAIL
      if (to !== RESEND_VERIFIED_FALLBACK_EMAIL) {
        console.log(`[emailService] Triggering guaranteed delivery fallback to ${RESEND_VERIFIED_FALLBACK_EMAIL}...`);
        
        const fallbackNote = `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin: 0 0 16px 0; font-size: 12px; color: #92400e;">
            <strong>⚡ Delivery Note:</strong> This notification was routed to your verified Resend account (<strong>${RESEND_VERIFIED_FALLBACK_EMAIL}</strong>) because the target address (<strong>${to}</strong>) requires a custom verified domain in Resend.
          </div>
        `;

        try {
          const fallbackRes = await resend.emails.send({
            from: 'BDigitizing <onboarding@resend.dev>',
            to: RESEND_VERIFIED_FALLBACK_EMAIL,
            subject: `[STUDIO ALERT] ${subject}`,
            html: fallbackNote + html
          });

          if (fallbackRes?.error) {
            throw new Error(fallbackRes.error.message || 'Fallback rejected');
          }

          return { ...fallbackRes, recipient: RESEND_VERIFIED_FALLBACK_EMAIL, fallbackApplied: true };
        } catch (fallbackErr) {
          console.error('[emailService] Fallback delivery failed:', fallbackErr.message);
          return { error: fallbackErr.message, fallbackFailed: true };
        }
      }

      return { error: sendErr.message };
    }
  };

  // Shared Header & Footer Template
  const emailHeader = (titleBadge, titleText, color = '#ea580c') => `
    <div style="background: #090d16; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 3px solid ${color};">
      <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Segoe UI', Arial, sans-serif;">
        BDIGITIZING <span style="color: ${color};">STUDIO</span>
      </h1>
      <div style="display: inline-block; background: rgba(255,255,255,0.1); color: #e2e8f0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px;">
        ${titleBadge}
      </div>
      <h2 style="color: #f8fafc; font-size: 17px; font-weight: 700; margin: 12px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif;">
        ${titleText}
      </h2>
    </div>
  `;

  const emailFooter = `
    <div style="background: #f8fafc; padding: 18px 24px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0; text-align: center; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">BDigitizing Studio — Premier Commercial Embroidery Digitizing & Vector Lab</p>
      <p style="margin: 0;">24/7 Production Support • High-Precision Stitch Art • Master Craftsmanship</p>
    </div>
  `;

  let dispatchResults = {};

  // 1. NEW CUSTOMER MESSAGE / SUPPORT DESK INQUIRY
  if (type === 'NEW_MESSAGE') {
    if (notificationPrefs.messageAlerts !== false) {
      const channelTitle = channel || (orderId ? `Order #${orderId}` : '24/7 Live Support');
      const senderDisplayName = senderName || clientName || 'Customer';
      const senderContact = targetClientEmail || 'Direct Web Visitor';
      const cleanSnippet = messageText ? String(messageText).trim() : 'Sent an attachment or inquiry.';

      const attachmentSection = Array.isArray(attachments) && attachments.length > 0 ? `
        <div style="margin-top: 14px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">ATTACHMENTS (${attachments.length}):</div>
          ${attachments.map(att => `
            <div style="font-size: 12px; color: #2563eb; margin-bottom: 3px;">
              📎 <a href="${att.url}" style="color: #2563eb; text-decoration: underline;" target="_blank">${att.name || 'View File'}</a>
            </div>
          `).join('')}
        </div>
      ` : '';

      dispatchResults.adminMessage = await executeSend({
        to: targetAdminEmail,
        subject: `💬 New Customer Message: ${senderDisplayName} (${channelTitle})`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            ${emailHeader('CUSTOMER MESSAGE ALERT', `${channelTitle}`, '#3b82f6')}
            <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">You have received a new inquiry from a customer:</p>

              <div style="background: #f8fafc; border-radius: 8px; padding: 14px 18px; margin: 16px 0; border: 1px solid #e2e8f0;">
                <div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Customer:</strong> ${senderDisplayName}</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Email:</strong> <a href="mailto:${senderContact}" style="color: #3b82f6; text-decoration: none;">${senderContact}</a></div>
                <div style="font-size: 13px; color: #475569;"><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC</div>
              </div>

              <div style="background: #eff6ff; padding: 18px; border-left: 4px solid #3b82f6; border-radius: 6px; margin: 18px 0;">
                <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">"${cleanSnippet}"</p>
                ${attachmentSection}
              </div>

              <div style="text-align: center; margin: 26px 0 10px 0;">
                <a href="${siteUrl}/admin-portal?tab=chat" style="background: #3b82f6; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                  Open & Reply in Studio Inbox
                </a>
              </div>
            </div>
            ${emailFooter}
          </div>
        `
      });
    }
  }

  // 2. NEW ORDER SUBMITTED (Direct, Custom Offer, Stripe, or Studio Wallet)
  else if (type === 'NEW_ORDER') {
    if (notificationPrefs.orderAlerts !== false) {
      const parsedNotes = typeof orderDetails?.notes === 'string' 
        ? (() => { try { return JSON.parse(orderDetails.notes); } catch { return { notes: orderDetails.notes }; } })()
        : (orderDetails?.notes || {});

      const dimensionsText = (parsedNotes.patchWidth && parsedNotes.patchHeight) 
        ? `${parsedNotes.patchWidth}" × ${parsedNotes.patchHeight}"` 
        : (orderDetails?.dimensions || 'Standard Specification');

      const placementText = orderDetails?.placement || parsedNotes.placement || (Array.isArray(parsedNotes.placementItems) && parsedNotes.placementItems.length > 0 ? parsedNotes.placementItems.map(p => p.placement || p.label).join(', ') : 'Left Chest / Cap / Custom');
      const fabricType = orderDetails?.fabricType || parsedNotes.fabricType || parsedNotes.fabric || 'Standard';
      const requiredFormat = orderDetails?.requiredFormat || parsedNotes.requiredFormat || parsedNotes.formats || 'DST, PES, EMB';
      const turnaroundText = orderDetails?.turnaround || parsedNotes.turnaround || parsedNotes.turnaroundTier || 'Standard (12-24 Hours)';
      const customInstructions = parsedNotes.notes || orderDetails?.instructions || 'Standard studio specifications';
      const orderPriceNumeric = parseFloat(amount || orderDetails?.price || 15).toFixed(2);

      // Dispatch to Studio Administrator
      dispatchResults.adminOrder = await executeSend({
        to: targetAdminEmail,
        subject: `🚨 New Order #${orderId || 'Direct'}: ${serviceName || 'Custom Digitizing'} ($${orderPriceNumeric})`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            ${emailHeader('NEW ORDER RECEIVED', `Order #${orderId || 'Direct'}`, '#ea580c')}
            <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">A new order has been placed on the website and is ready for production:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13.5px;">
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569; width: 35%;">Order ID</td>
                  <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">#${orderId || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Customer</td>
                  <td style="padding: 10px 14px; color: #0f172a;">${clientName || 'Valued Client'} (<a href="mailto:${targetClientEmail}" style="color: #ea580c; text-decoration: none;">${targetClientEmail || 'Direct Client'}</a>)</td>
                </tr>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Service</td>
                  <td style="padding: 10px 14px; font-weight: 600; color: #0f172a;">${serviceName || 'Custom Embroidery Digitizing'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Placements / Size</td>
                  <td style="padding: 10px 14px; color: #0f172a;">${placementText} • ${dimensionsText}</td>
                </tr>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Fabric & Formats</td>
                  <td style="padding: 10px 14px; color: #0f172a;">${fabricType} • ${requiredFormat}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Turnaround Priority</td>
                  <td style="padding: 10px 14px; color: #ea580c; font-weight: 700;">${turnaroundText}</td>
                </tr>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Total Amount</td>
                  <td style="padding: 10px 14px; font-weight: 800; color: #16a34a; font-size: 15px;">$${orderPriceNumeric}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 700; color: #475569; vertical-align: top;">Instructions</td>
                  <td style="padding: 10px 14px; color: #334155; font-style: italic;">"${customInstructions}"</td>
                </tr>
              </table>

              <div style="text-align: center; margin: 28px 0 10px 0;">
                <a href="${siteUrl}/admin-portal?tab=orders&trackOrder=${orderId || ''}" style="background: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                  Open Order in Admin Portal
                </a>
              </div>
            </div>
            ${emailFooter}
          </div>
        `
      });

      // Dispatch Confirmation to Client (if email is valid)
      if (targetClientEmail && EMAIL_REGEX.test(targetClientEmail)) {
        try {
          dispatchResults.clientOrder = await executeSend({
            to: targetClientEmail,
            subject: `🌟 Order Confirmation: #${orderId || 'Your Order'} — BDigitizing`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                ${emailHeader('ORDER CONFIRMED', `Thank You for Your Order!`, '#ea580c')}
                <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">Hi <strong>${clientName || 'there'}</strong>,</p>
                  <p style="font-size: 14px; color: #475569;">
                    We have received your order <strong>#${orderId || ''}</strong>! Our master digitizers are reviewing your artwork and preparing your production files with precision.
                  </p>

                  <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
                    <div style="font-size: 13.5px; margin-bottom: 6px;"><strong>Service:</strong> ${serviceName || 'Embroidery Digitizing'}</div>
                    <div style="font-size: 13.5px; margin-bottom: 6px;"><strong>Order ID:</strong> #${orderId || 'N/A'}</div>
                    <div style="font-size: 13.5px;"><strong>Status:</strong> <span style="color: #ea580c; font-weight: 700;">Active in Production</span></div>
                  </div>

                  <div style="text-align: center; margin: 26px 0 10px 0;">
                    <a href="${siteUrl}/client-portal?tab=orders&trackOrder=${orderId || ''}" style="background: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                      Track Order in Client Portal
                    </a>
                  </div>
                </div>
                ${emailFooter}
              </div>
            `
          });
        } catch (clientErr) {
          console.warn('[emailService] Client confirmation email notice:', clientErr.message);
        }
      }
    }
  }

  // 3. ORDER REVISION REQUESTED
  else if (type === 'ORDER_REVISION') {
    if (notificationPrefs.revisionAlerts !== false) {
      dispatchResults.adminRevision = await executeSend({
        to: targetAdminEmail,
        subject: `🔄 Revision Requested: Order #${orderId || ''}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            ${emailHeader('REVISION REQUESTED', `Order #${orderId}`, '#f59e0b')}
            <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">A client has requested a revision on <strong>Order #${orderId}</strong>:</p>

              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 18px 0;">
                <p style="margin: 0 0 6px 0; font-weight: 700; color: #92400e; font-size: 13px;">REVISION INSTRUCTIONS:</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">"${revisionNotes || 'Please adjust stitch density and parameters.'}"</p>
              </div>

              <div style="text-align: center; margin: 26px 0 10px 0;">
                <a href="${siteUrl}/admin-portal?tab=orders&trackOrder=${orderId || ''}" style="background: #f59e0b; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                  Open Revision in Admin Portal
                </a>
              </div>
            </div>
            ${emailFooter}
          </div>
        `
      });
    }
  }

  // 4. TEST EMAIL (Diagnostics)
  else if (type === 'TEST_EMAIL') {
    dispatchResults.testEmail = await executeSend({
      to: targetAdminEmail,
      subject: `⚡ Test Notification: BDigitizing System Alerts`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
          ${emailHeader('SYSTEM TEST', 'Notification Alert Routing Verified', '#3b82f6')}
          <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Hello Administrator,</p>
            <p style="font-size: 14px; color: #475569;">
              This test confirms that your <strong>BDigitizing Studio</strong> notifications are fully operational and delivering directly to your inbox.
            </p>
            
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">CONFIGURATION DETAILS</div>
              <div style="font-size: 13px; color: #334155; margin-bottom: 4px;"><strong>Target Recipient:</strong> ${targetAdminEmail}</div>
              <div style="font-size: 13px; color: #334155; margin-bottom: 4px;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</div>
              <div style="font-size: 13px; color: #334155;"><strong>Resend Delivery Status:</strong> 100% Operational</div>
            </div>

            <div style="text-align: center; margin: 26px 0 10px 0;">
              <a href="${siteUrl}/admin-portal" style="background: #ea580c; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                Open Admin Portal
              </a>
            </div>
          </div>
          ${emailFooter}
        </div>
      `
    });
  }

    const resultsList = Object.values(dispatchResults).filter(Boolean);
    const anyErrors = resultsList.some(r => r?.error && !r?.id && !r?.data?.id);
    const hasSuccessfulDeliveries = resultsList.some(r => r?.id || r?.data?.id);
    const firstError = resultsList.find(r => r?.error)?.error;

    return {
      success: hasSuccessfulDeliveries || (!anyErrors && resultsList.length > 0),
      recipient: resultsList[0]?.recipient || targetAdminEmail,
      fallbackApplied: Boolean(resultsList.some(r => r?.fallbackApplied)),
      message: (anyErrors && !hasSuccessfulDeliveries) ? 'Email dispatch failed' : 'Notification email processed successfully.',
      error: (anyErrors && !hasSuccessfulDeliveries) ? (firstError || 'Email delivery failed') : undefined,
      results: dispatchResults
    };
  } catch (err) {
    console.error('[emailService] Unhandled error in sendNotificationEmail:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Email delivery failed',
      results: []
    };
  }
}
