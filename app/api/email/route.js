import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`email-dispatch:${ip}`, 15, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many email requests. Please try again shortly.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(req);
    const body = await req.json().catch(() => ({}));
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
      orderDetails
    } = body;

    const ALLOWED_TYPES = [
      'NEW_ORDER', 
      'ORDER_DELIVERED', 
      'ORDER_COMPLETED', 
      'ORDER_REVISION', 
      'NEW_MESSAGE', 
      'ORDER_UPDATE',
      'TEST_EMAIL'
    ];

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid email notification type.' }, { status: 400 });
    }

    if (type === 'TEST_EMAIL' && !isAdmin && !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required for test email.' }, { status: 403 });
    }

    // Require either active user session OR valid orderId / clientEmail / recipientEmail
    if (!user && !orderId && !clientEmail && !recipientEmail && type !== 'TEST_EMAIL') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication or valid order payload required.' }, { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Email notification bypassed.');
      return NextResponse.json({ success: true, warning: 'Email configuration missing, email bypassed' }, { status: 200 });
    }

    const resend = new Resend(resendApiKey);

    // Fetch live dynamic admin notification email & settings from Supabase site_config
    let dynamicAdminEmail = '';
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
            if (EMAIL_REGEX.test(val)) dynamicAdminEmail = val;
          }
          if (row.key === 'notification_settings' && row.value) {
            try {
              const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
              if (parsed?.adminEmail && EMAIL_REGEX.test(parsed.adminEmail)) {
                dynamicAdminEmail = parsed.adminEmail;
              }
              if (parsed?.orderAlerts !== undefined) notificationPrefs.orderAlerts = Boolean(parsed.orderAlerts);
              if (parsed?.messageAlerts !== undefined) notificationPrefs.messageAlerts = Boolean(parsed.messageAlerts);
              if (parsed?.revisionAlerts !== undefined) notificationPrefs.revisionAlerts = Boolean(parsed.revisionAlerts);
              if (parsed?.deliveryAlerts !== undefined) notificationPrefs.deliveryAlerts = Boolean(parsed.deliveryAlerts);
            } catch {}
          }
          if (!dynamicAdminEmail && row.key === 'contactInfo' && row.value) {
            try {
              const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
              if (parsed?.email && EMAIL_REGEX.test(parsed.email)) {
                dynamicAdminEmail = parsed.email;
              }
            } catch {}
          }
        });
      }
    } catch (dbErr) {
      console.warn('[Email Route] Dynamic site_config lookup notice:', dbErr.message);
    }

    // Resolution priority: explicit request adminEmail -> dynamic DB setting -> env MASTER_ADMIN_EMAIL -> hard fallback
    const fallbackAdmin = process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'shahidbutt59191@gmail.com';
    const targetAdminEmail = (explicitAdminEmail || dynamicAdminEmail || fallbackAdmin).toLowerCase().trim();
    const targetClientEmail = (clientEmail || user?.email || recipientEmail || '').toLowerCase().trim();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
    const configuredFrom = process.env.RESEND_FROM_ADDRESS || 'Bilal Digitizing <onboarding@resend.dev>';

    // Validate email format
    if (targetAdminEmail && !EMAIL_REGEX.test(targetAdminEmail)) {
      return NextResponse.json({ success: false, error: `Invalid admin email address format: ${targetAdminEmail}` }, { status: 400 });
    }

    // Helper to send email with automatic domain fallback
    const sendMail = async ({ to, subject, html }) => {
      if (!to || !EMAIL_REGEX.test(to)) {
        console.warn(`[sendMail] Skipped sending due to invalid recipient email: "${to}"`);
        return null;
      }
      try {
        return await resend.emails.send({
          from: configuredFrom,
          to,
          subject,
          html
        });
      } catch (err) {
        console.warn('First email attempt failed, retrying with fallback Resend domain:', err?.message);
        if (configuredFrom !== 'Bilal Digitizing <onboarding@resend.dev>') {
          return await resend.emails.send({
            from: 'Bilal Digitizing <onboarding@resend.dev>',
            to,
            subject,
            html
          });
        }
        throw err;
      }
    };

    // Shared Header/Footer Templates
    const emailHeader = (titleBadge, titleText, color = '#ea580c') => `
      <div style="background: #090d16; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 3px solid ${color};">
        <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Segoe UI', Arial, sans-serif;">
          BILAL <span style="color: ${color};">DIGITIZING</span>
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
        <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">Bilal Digitizing Studio — Premier Embroidery Digitizing & Vector Lab</p>
        <p style="margin: 0;">24/7 Production Support • High-Precision Stitch Art • Direct In-App Client Desk</p>
      </div>
    `;

    // 1. TEST EMAIL (Admin diagnostics)
    if (type === 'TEST_EMAIL') {
      const result = await sendMail({
        to: targetAdminEmail,
        subject: `⚡ Test Notification: Bilal Digitizing System Alerts`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            ${emailHeader('SYSTEM TEST', 'Notification Alert Routing Verified', '#3b82f6')}
            <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">Hello Administrator,</p>
              <p style="font-size: 14px; color: #475569;">
                This test email confirms that your <strong>Bilal Digitizing Studio</strong> notification routing is fully operational and delivering to this inbox.
              </p>
              
              <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">CONFIGURATION DETAILS</div>
                <div style="font-size: 13px; color: #334155; margin-bottom: 4px;"><strong>Target Recipient:</strong> ${targetAdminEmail}</div>
                <div style="font-size: 13px; color: #334155; margin-bottom: 4px;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</div>
                <div style="font-size: 13px; color: #334155;"><strong>Resend API Status:</strong> Active & Connected</div>
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

      return NextResponse.json({ 
        success: true, 
        message: `Test email successfully dispatched to ${targetAdminEmail}`,
        recipient: targetAdminEmail,
        result
      });
    }

    // 2. NEW ORDER CREATED
    if (type === 'NEW_ORDER') {
      if (notificationPrefs.orderAlerts !== false) {
        // Email A: Alert to Admin
        const parsedNotes = typeof orderDetails?.notes === 'string' 
          ? (() => { try { return JSON.parse(orderDetails.notes); } catch { return { notes: orderDetails.notes }; } })()
          : (orderDetails?.notes || {});

        const dimensionsText = (parsedNotes.patchWidth && parsedNotes.patchHeight) 
          ? `${parsedNotes.patchWidth}" × ${parsedNotes.patchHeight}"` 
          : (orderDetails?.dimensions || 'Standard');

        const placementText = orderDetails?.placement || parsedNotes.placement || (Array.isArray(parsedNotes.placementItems) && parsedNotes.placementItems.length > 0 ? parsedNotes.placementItems.map(p => p.placement || p.label).join(', ') : 'Not Specified');
        const customInstructions = parsedNotes.notes || orderDetails?.instructions || 'Standard studio specifications';

        await sendMail({
          to: targetAdminEmail,
          subject: `🚨 New Order #${orderId || 'Direct'}: ${serviceName || 'Custom Digitizing'} ($${amount || '15.00'})`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              ${emailHeader('NEW ORDER RECEIVED', `Order #${orderId || 'Direct'}`, '#ea580c')}
              <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0;">A new order has been submitted and registered in production:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13.5px;">
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #475569; width: 35%;">Order ID</td>
                    <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">#${orderId || 'N/A'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Customer</td>
                    <td style="padding: 10px 14px; color: #0f172a;">${clientName || 'Valued Client'} (<a href="mailto:${targetClientEmail}" style="color: #ea580c; text-decoration: none;">${targetClientEmail}</a>)</td>
                  </tr>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Service</td>
                    <td style="padding: 10px 14px; font-weight: 600; color: #0f172a;">${serviceName || 'Embroidery Digitizing / Vector'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Placements / Size</td>
                    <td style="padding: 10px 14px; color: #0f172a;">${placementText} • ${dimensionsText}</td>
                  </tr>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Total Amount</td>
                    <td style="padding: 10px 14px; font-weight: 800; color: #16a34a; font-size: 15px;">$${parseFloat(amount || 15).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; font-weight: 700; color: #475569; vertical-align: top;">Notes / Instructions</td>
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
        }).catch(e => console.warn('Admin new order email err:', e?.message));
      }

      // Email B: Confirmation to Client
      if (targetClientEmail) {
        await sendMail({
          to: targetClientEmail,
          subject: `🌟 Order Confirmation: #${orderId || 'Your Order'} — Bilal Digitizing`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              ${emailHeader('ORDER CONFIRMED', `Thank You for Your Order!`, '#ea580c')}
              <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0;">Hi <strong>${clientName || 'there'}</strong>,</p>
                <p style="font-size: 14px; color: #475569;">
                  We have received your order <strong>#${orderId || ''}</strong>! Our master digitizers are now reviewing your artwork and pathing your design with zero-thread-break precision.
                </p>

                <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <div style="font-size: 13.5px; margin-bottom: 6px;"><strong>Service:</strong> ${serviceName || 'Embroidery Digitizing'}</div>
                  <div style="font-size: 13.5px; margin-bottom: 6px;"><strong>Order ID:</strong> #${orderId || 'N/A'}</div>
                  <div style="font-size: 13.5px; margin-bottom: 6px;"><strong>Status:</strong> <span style="color: #ea580c; font-weight: 700;">In Production / Active</span></div>
                  ${amount ? `<div style="font-size: 13.5px;"><strong>Total:</strong> $${parseFloat(amount).toFixed(2)}</div>` : ''}
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
        }).catch(e => console.warn('Client order confirmation email err:', e?.message));
      }
    } 
    
    // 3. NEW CHAT / CONTACT INQUIRY MESSAGE
    else if (type === 'NEW_MESSAGE') {
      if (notificationPrefs.messageAlerts !== false) {
        const isClientSender = !isAdmin && (senderName !== 'Master Admin' && senderName !== 'Studio Support' && senderName !== '24/7 Live Support');
        const targetRecipient = isClientSender ? targetAdminEmail : (recipientEmail || targetClientEmail);

        if (targetRecipient) {
          const channelTitle = channel || (orderId ? `Order #${orderId}` : '24/7 Live Help Desk');
          await sendMail({
            to: targetRecipient,
            subject: `💬 New Customer Message: ${senderName || 'Customer'} (${channelTitle})`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                ${emailHeader('NEW MESSAGE ALERT', `${channelTitle}`, '#3b82f6')}
                <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">You have received a new customer inquiry:</p>

                  <div style="background: #f8fafc; border-radius: 8px; padding: 14px 18px; margin: 16px 0; border: 1px solid #e2e8f0;">
                    <div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Sender:</strong> ${senderName || 'Customer'}</div>
                    <div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Email:</strong> <a href="mailto:${targetClientEmail}" style="color: #3b82f6;">${targetClientEmail || 'Direct In-App User'}</a></div>
                    <div style="font-size: 13px; color: #475569;"><strong>Time:</strong> ${new Date().toUTCString()}</div>
                  </div>

                  <div style="background: #eff6ff; padding: 16px; border-left: 4px solid #3b82f6; border-radius: 6px; margin: 18px 0;">
                    <p style="margin: 0; color: #1e293b; font-size: 14.5px; line-height: 1.5; white-space: pre-wrap;">"${messageText || 'Sent an attachment or inquiry.'}"</p>
                  </div>

                  <div style="text-align: center; margin: 26px 0 10px 0;">
                    <a href="${siteUrl}/${isClientSender ? 'admin-portal?tab=chat' : 'client-portal'}" style="background: #3b82f6; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                      Reply in Studio Inbox
                    </a>
                  </div>
                </div>
                ${emailFooter}
              </div>
            `
          }).catch(e => console.warn('Chat message email err:', e?.message));
        }
      }
    }

    // 4. ORDER REVISION REQUESTED
    else if (type === 'ORDER_REVISION') {
      if (notificationPrefs.revisionAlerts !== false) {
        await sendMail({
          to: targetAdminEmail,
          subject: `🔄 Revision Requested: Order #${orderId || ''}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              ${emailHeader('REVISION REQUESTED', `Order #${orderId}`, '#f59e0b')}
              <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0;">A client has requested a revision on <strong>Order #${orderId}</strong>:</p>

                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 18px 0;">
                  <p style="margin: 0 0 6px 0; font-weight: 700; color: #92400e; font-size: 13px;">CLIENT REVISION INSTRUCTIONS:</p>
                  <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">"${revisionNotes || 'Please adjust file parameters.'}"</p>
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
        }).catch(e => console.warn('Order revision email err:', e?.message));
      }
    }

    // 5. ORDER DELIVERED (Files Ready for Client)
    else if (type === 'ORDER_DELIVERED') {
      if (targetClientEmail) {
        await sendMail({
          to: targetClientEmail,
          subject: `📦 Production Files Ready: Order #${orderId || ''} — Bilal Digitizing`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              ${emailHeader('FILES READY', `Your Production Files are Complete`, '#10b981')}
              <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0;">Hi <strong>${clientName || 'there'}</strong>,</p>
                <p style="font-size: 14px; color: #475569;">
                  Great news! Our quality control team has approved and uploaded your deliverable machine files for <strong>Order #${orderId}</strong>.
                </p>

                <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin: 18px 0; border: 1px solid #a7f3d0;">
                  <div style="font-weight: 700; color: #065f46; font-size: 13.5px; margin-bottom: 6px;">AVAILABLE DOWNLOADS:</div>
                  <div style="font-size: 13px; color: #047857;">• Embroidery Formats: .DST, .PES, .EMB, .EXP, .VP3</div>
                  <div style="font-size: 13px; color: #047857;">• Vector Formats: .AI, .EPS, .SVG, .PDF</div>
                  <div style="font-size: 13px; color: #047857;">• Digital Sew-out Worksheet & Stitch Proof</div>
                </div>

                <div style="text-align: center; margin: 26px 0 10px 0;">
                  <a href="${siteUrl}/client-portal?tab=orders&trackOrder=${orderId || ''}" style="background: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                    Download Deliverable Files
                  </a>
                </div>
              </div>
              ${emailFooter}
            </div>
          `
        }).catch(e => console.warn('Order delivered email err:', e?.message));
      }
    }

    // 6. ORDER COMPLETED
    else if (type === 'ORDER_COMPLETED') {
      await sendMail({
        to: targetAdminEmail,
        subject: `✅ Order #${orderId || ''} Accepted & Completed by Client`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            ${emailHeader('ORDER COMPLETED', `Order #${orderId}`, '#10b981')}
            <div style="padding: 24px 28px; color: #1e293b; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">The client (<strong>${targetClientEmail}</strong>) has approved deliverables for <strong>Order #${orderId}</strong>.</p>
              <p style="font-size: 14px; color: #475569;">The order has transitioned to completed status.</p>
            </div>
            ${emailFooter}
          </div>
        `
      }).catch(e => console.warn('Order completed email err:', e?.message));
    }

    return NextResponse.json({ success: true, message: 'Email notification processed successfully.' });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email notification', details: error.message }, { status: 500 });
  }
}
