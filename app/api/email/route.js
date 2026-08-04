import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, orderId, clientEmail, adminEmail, ...data } = body;

    // TODO: Initialize your email provider (e.g., Resend, SendGrid)
    // const resend = new Resend(process.env.RESEND_API_KEY);

    if (type === 'NEW_ORDER') {
      console.log(`[Email Service] Simulating New Order Email to Admin (${adminEmail}) for Order ${orderId}`);
      // await resend.emails.send({
      //   from: 'orders@bdigitizing.pro',
      //   to: adminEmail || process.env.ADMIN_EMAIL,
      //   subject: `New Order Received: ${orderId}`,
      //   html: `<p>You have a new order: <strong>${orderId}</strong></p><p>Client: ${clientEmail}</p>`
      // });
    } else if (type === 'ORDER_COMPLETED') {
      console.log(`[Email Service] Simulating Order Completed Email to Client (${clientEmail}) for Order ${orderId}`);
      // await resend.emails.send({
      //   from: 'support@bdigitizing.pro',
      //   to: clientEmail,
      //   subject: `Your Order ${orderId} is Ready!`,
      //   html: `<p>Your digitized files for order <strong>${orderId}</strong> are now ready for download in your dashboard.</p>`
      // });
    }

    return NextResponse.json({ success: true, message: 'Email notification processed (simulated).' });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email notification' }, { status: 500 });
  }
}
