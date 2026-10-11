import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';
import { resolveAdminNotificationConfig, EMAIL_REGEX } from '../../../src/lib/emailService';
import { withApiObservability } from '../../../src/lib/observability/apiObservability';

export const dynamic = 'force-dynamic';
const SERVICE_TYPES = new Set(['Embroidery Digitizing', 'Vector Art Tracing', 'Custom Patches', 'General Support']);

const safeText = (value, max) => String(value || '').trim().slice(0, max);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

export function validateContactInquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const name = safeText(body.name, 120);
  const email = safeText(body.email, 254).toLowerCase();
  const phone = safeText(body.phone, 48);
  const service = safeText(body.service, 80);
  const subject = safeText(body.subject, 150);
  const message = safeText(body.message, 5000);
  if (name.length < 2 || name.length > 120 || !EMAIL_REGEX.test(email) ||
      message.length < 10 || !SERVICE_TYPES.has(service)) return null;
  if (body.name?.length > 120 || body.email?.length > 254 ||
      body.subject?.length > 150 || body.message?.length > 5000 ||
      body.phone?.length > 48) return null;
  return { name, email, phone, service, subject, message };
}

async function POST_impl(request) {
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 12000) {
      return NextResponse.json({ success: false, error: 'Message is too long.' }, { status: 413 });
    }
    const rate = await checkDistributedRateLimit('public-contact:' + getClientIp(request), 6, 600000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: rate.unavailable ? 'Contact service temporarily unavailable.' : 'Too many inquiries. Please try again later.' },
        { status: rate.unavailable ? 503 : 429, headers: getRateLimitHeaders(rate) }
      );
    }
    const body = await request.json().catch(() => null);
    if (body?.website) {
      return NextResponse.json({ success: false, error: 'Unable to process this inquiry.' }, { status: 400 });
    }
    const inquiry = validateContactInquiry(body);
    if (!inquiry) {
      return NextResponse.json({ success: false, error: 'Please enter a valid name, email, service and message (at least 10 characters).' }, { status: 400 });
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[Contact] Email delivery provider is not configured.');
      return NextResponse.json({ success: false, error: 'Contact service is temporarily unavailable. Please use the email address on this page.' }, { status: 503 });
    }

    // Destination is resolved on the server from trusted studio settings,
    // never accepted from the public form payload.
    const { adminEmail } = await resolveAdminNotificationConfig();
    if (!adminEmail || !EMAIL_REGEX.test(adminEmail)) {
      return NextResponse.json({ success: false, error: 'Contact service is temporarily unavailable.' }, { status: 503 });
    }
    const html = [
      '<div style="max-width:640px;margin:auto;padding:24px;font-family:Arial,sans-serif;color:#0b1730">',
      '<h2 style="color:#1d4ed8">New BDigitizing Website Inquiry</h2>',
      '<p><strong>Name:</strong> ' + escapeHtml(inquiry.name) + '</p>',
      '<p><strong>Reply-to:</strong> ' + escapeHtml(inquiry.email) + '</p>',
      '<p><strong>Phone:</strong> ' + escapeHtml(inquiry.phone || 'Not supplied') + '</p>',
      '<p><strong>Service:</strong> ' + escapeHtml(inquiry.service) + '</p>',
      '<p><strong>Subject:</strong> ' + escapeHtml(inquiry.subject || 'General inquiry') + '</p>',
      '<h3>Message</h3>',
      '<p style="white-space:pre-wrap;overflow-wrap:anywhere">' + escapeHtml(inquiry.message) + '</p>',
      '</div>'
    ].join('');
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_ADDRESS || 'BDigitizing <support@bdigitizing.com>',
      to: adminEmail,
      replyTo: inquiry.email,
      subject: '[Website Inquiry] ' + inquiry.service + ' — ' + inquiry.name,
      html
    });
    if (error || !data?.id) {
      console.error('[Contact] Provider rejected dispatch:', error?.message || 'missing delivery ID');
      return NextResponse.json({ success: false, error: 'We could not send your message. Please email our support address directly.' }, { status: 502 });
    }
    return NextResponse.json({ success: true, message: 'Your inquiry has been sent.' }, { status: 200 });
  } catch (error) {
    console.error('[Contact] Dispatch failed:', error?.message);
    return NextResponse.json({ success: false, error: 'Contact service temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
export const POST = withApiObservability(POST_impl);
