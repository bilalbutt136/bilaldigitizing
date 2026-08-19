import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export async function POST(req) {
  try {
    const { user, isAdmin } = await getServerAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      type, 
      orderId, 
      clientEmail, 
      adminEmail,
      clientName,
      serviceName,
      amount,
      messageText,
      senderName,
      recipientEmail,
      revisionNotes
    } = body;

    const ALLOWED_TYPES = ['NEW_ORDER', 'ORDER_DELIVERED', 'ORDER_COMPLETED', 'ORDER_REVISION', 'NEW_MESSAGE', 'ORDER_UPDATE'];
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid email notification type.' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Email notification bypassed.');
      return NextResponse.json({ success: true, warning: 'Email configuration missing, email bypassed' }, { status: 200 });
    }

    const resend = new Resend(resendApiKey);
    
    // Resend configuration with graceful fallback
    const configuredFrom = process.env.RESEND_FROM_ADDRESS || 'Bilal Digitizing <onboarding@resend.dev>';
    const fallbackAdmin = process.env.MASTER_ADMIN_EMAIL || 'shahidbutt59191@gmail.com';
    
    const targetAdminEmail = (adminEmail || fallbackAdmin).toLowerCase().trim();
    const targetClientEmail = (clientEmail || user.email || '').toLowerCase().trim();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';

    // Helper to send email with automatic domain fallback if unverified
    const sendMail = async ({ to, subject, html }) => {
      try {
        return await resend.emails.send({
          from: configuredFrom,
          to,
          subject,
          html
        });
      } catch (err) {
        console.warn('First email attempt failed, retrying with fallback domain:', err?.message);
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

    // 1. NEW ORDER CREATED
    if (type === 'NEW_ORDER') {
      // Email A: Alert to Admin
      await sendMail({
        to: targetAdminEmail,
        subject: `🚨 New Order Received: ${orderId || 'Direct Order'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 12px;">
            <h2 style="color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">🚨 New Order Received</h2>
            <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
            <p><strong>Client:</strong> ${clientName || 'Valued Client'} (${targetClientEmail})</p>
            <p><strong>Service:</strong> ${serviceName || 'Embroidery Digitizing / Vector'}</p>
            ${amount ? `<p><strong>Amount:</strong> $${amount}</p>` : ''}
            <br/>
            <a href="${siteUrl}/admin-portal" style="background: #ea580c; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Admin Portal</a>
          </div>
        `
      }).catch(e => console.warn('Admin new order email err:', e?.message));

      // Email B: Confirmation to Client
      if (targetClientEmail) {
        await sendMail({
          to: targetClientEmail,
          subject: `🌟 Order Confirmation: ${orderId || 'Your Order'} — Bilal Digitizing`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">🌟 Order Confirmation</h2>
              <p>Hi <strong>${clientName || 'there'}</strong>,</p>
              <p>Thank you for your order! Our master digitizers have received your project and are currently pathing your design with zero-thread-break precision.</p>
              <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
              <p><strong>Status:</strong> In Production / Digitizing</p>
              <br/>
              <a href="${siteUrl}/client-portal" style="background: #ea580c; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Order in Client Portal</a>
              <br/><br/>
              <p style="color: #64748b; font-size: 0.85rem;">Need revisions or machine format adjustments? You can message our team anytime directly inside the portal.</p>
            </div>
          `
        }).catch(e => console.warn('Client order confirmation email err:', e?.message));
      }
    } 
    
    // 2. ORDER DELIVERED (Files Ready for Client)
    else if (type === 'ORDER_DELIVERED') {
      if (targetClientEmail) {
        await sendMail({
          to: targetClientEmail,
          subject: `📦 Your Digitized Files for Order ${orderId || ''} are Ready!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 10px;">📦 Your Files are Ready!</h2>
              <p>Good news! Our quality control team has approved and packaged your machine files for <strong>Order ${orderId}</strong>.</p>
              <p>You can now log in to download your production files (.DST, .PES, .EMB, .AI, .SVG) and inspect the digital sew-out preview.</p>
              <br/>
              <a href="${siteUrl}/client-portal" style="background: #10b981; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download & Review Files</a>
            </div>
          `
        }).catch(e => console.warn('Order delivered email err:', e?.message));
      }
    } 

    // 3. ORDER COMPLETED
    else if (type === 'ORDER_COMPLETED') {
      await sendMail({
        to: targetAdminEmail,
        subject: `✅ Order ${orderId || ''} Accepted by Client`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 10px;">✅ Order Accepted & Completed</h2>
            <p>The client (${targetClientEmail}) has accepted the deliverable files for <strong>Order ${orderId}</strong>.</p>
            <p>The order is now marked as Completed.</p>
          </div>
        `
      }).catch(e => console.warn('Order completed email err:', e?.message));
    }

    // 4. REVISION REQUESTED
    else if (type === 'ORDER_REVISION') {
      await sendMail({
        to: targetAdminEmail,
        subject: `🔄 Revision Requested: Order ${orderId || ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">🔄 Revision Request</h2>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Client:</strong> ${targetClientEmail}</p>
            ${revisionNotes ? `<p><strong>Notes:</strong> ${revisionNotes}</p>` : ''}
            <br/>
            <a href="${siteUrl}/admin-portal" style="background: #f59e0b; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Revision in Admin Portal</a>
          </div>
        `
      }).catch(e => console.warn('Order revision email err:', e?.message));
    }

    // 5. NEW CHAT MESSAGE NOTIFICATION
    else if (type === 'NEW_MESSAGE') {
      const targetRecipient = (recipientEmail || (isAdmin ? targetClientEmail : targetAdminEmail)).toLowerCase().trim();
      if (targetRecipient) {
        await sendMail({
          to: targetRecipient,
          subject: `💬 New Message regarding ${orderId ? `Order ${orderId}` : 'Studio Project'} from ${senderName || 'Studio'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">💬 New Studio Message</h2>
              <p>You have a new message from <strong>${senderName || 'Support'}</strong>:</p>
              <div style="background: #f8fafc; padding: 12px; border-left: 4px solid #3b82f6; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0; color: #334155;">"${messageText || 'Sent a message or asset attachment'}"</p>
              </div>
              <br/>
              <a href="${siteUrl}/${isAdmin ? 'admin-portal' : 'client-portal'}" style="background: #3b82f6; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Conversation</a>
            </div>
          `
        }).catch(e => console.warn('Chat message email err:', e?.message));
      }
    }

    return NextResponse.json({ success: true, message: 'Email notification processed successfully.' });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email notification', details: error.message }, { status: 500 });
  }
}
