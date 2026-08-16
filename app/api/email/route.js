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
    const { type, orderId, clientEmail, adminEmail } = body;

    const ALLOWED_TYPES = ['NEW_ORDER', 'ORDER_DELIVERED', 'ORDER_COMPLETED'];
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid email notification type.' }, { status: 400 });
    }

    if (type === 'ORDER_DELIVERED' && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Email will not be sent.');
      return NextResponse.json({ success: true, warning: 'Email configuration missing, email bypassed' }, { status: 200 });
    }

    const resend = new Resend(resendApiKey);
    
    const fromAddress = process.env.RESEND_FROM_ADDRESS || 'orders@bdigitizing.pro';
    const fallbackAdmin = process.env.MASTER_ADMIN_EMAIL || 'admin@bdigitizing.pro';
    
    const targetAdminEmail = adminEmail || fallbackAdmin;
    const targetClientEmail = clientEmail || user.email;
    
    if (type === 'NEW_ORDER') {
      await resend.emails.send({
        from: fromAddress,
        to: targetAdminEmail,
        subject: `🚨 New Order Received: ${orderId || 'Direct'}`,
        html: `
          <h2>New Order Placed</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Client:</strong> ${targetClientEmail}</p>
          <p>Log in to the admin dashboard to review the order details and assign it for digitizing.</p>
        `
      });
    } else if (type === 'ORDER_DELIVERED') {
      await resend.emails.send({
        from: fromAddress,
        to: targetClientEmail,
        subject: `📦 Your Order ${orderId || ''} is Ready!`,
        html: `
          <h2>Good news! Your digitized files are ready.</h2>
          <p>Order <strong>${orderId}</strong> has been completed by our digitizers.</p>
          <p>Please log in to your dashboard to review the files, download the assets, and accept the order.</p>
          <br/>
          <p>Thank you for choosing Bilal Digitizing.</p>
        `
      });
    } else if (type === 'ORDER_COMPLETED') {
      await resend.emails.send({
        from: fromAddress,
        to: targetAdminEmail,
        subject: `✅ Order ${orderId || ''} Accepted by Client`,
        html: `
          <h2>Order Accepted</h2>
          <p>The client (${targetClientEmail}) has reviewed and accepted the files for order <strong>${orderId}</strong>.</p>
          <p>The order is now marked as Completed.</p>
        `
      });
    }

    return NextResponse.json({ success: true, message: 'Email notification processed successfully.' });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email notification', details: error.message }, { status: 500 });
  }
}
