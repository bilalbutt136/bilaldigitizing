import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, orderId, clientEmail, adminEmail, ...data } = body;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Email will not be sent.');
      return NextResponse.json({ success: false, error: 'Email configuration missing' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const fromAddress = 'Bilal Digitizing <onboarding@resend.dev>'; // Using Resend testing domain
    const fallbackAdmin = process.env.MASTER_ADMIN_EMAIL || 'admin@bdigitizing.pro';

    if (type === 'NEW_ORDER') {
      console.log(`[Email Service] Sending New Order Email to Admin (${fallbackAdmin}) for Order ${orderId}`);
      await resend.emails.send({
        from: fromAddress,
        to: adminEmail || fallbackAdmin,
        subject: `🚨 New Order Received: ${orderId}`,
        html: `
          <h2>New Order Placed</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Client:</strong> ${clientEmail}</p>
          <p>Log in to the admin dashboard to review the order details and assign it for digitizing.</p>
        `
      });
    } else if (type === 'ORDER_DELIVERED') {
      console.log(`[Email Service] Sending Order Delivered Email to Client (${clientEmail}) for Order ${orderId}`);
      await resend.emails.send({
        from: fromAddress,
        to: clientEmail,
        subject: `📦 Your Order ${orderId} is Ready!`,
        html: `
          <h2>Good news! Your digitized files are ready.</h2>
          <p>Order <strong>${orderId}</strong> has been completed by our digitizers.</p>
          <p>Please log in to your dashboard to review the files, download the assets, and accept the order.</p>
          <br/>
          <p>Thank you for choosing Bilal Digitizing.</p>
        `
      });
    } else if (type === 'ORDER_COMPLETED') {
      console.log(`[Email Service] Sending Order Completed Email to Admin (${fallbackAdmin}) for Order ${orderId}`);
      await resend.emails.send({
        from: fromAddress,
        to: fallbackAdmin,
        subject: `✅ Order ${orderId} Accepted by Client`,
        html: `
          <h2>Order Accepted</h2>
          <p>The client (${clientEmail}) has reviewed and accepted the files for order <strong>${orderId}</strong>.</p>
          <p>The order is now marked as Completed.</p>
        `
      });
    }

    return NextResponse.json({ success: true, message: 'Email notification processed successfully.' });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email notification' }, { status: 500 });
  }
}
