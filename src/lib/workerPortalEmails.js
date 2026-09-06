import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[WorkerPortalEmails] RESEND_API_KEY is not set. Email will be logged only.');
    return null;
  }
  return new Resend(apiKey);
};

const getFromAddress = () => {
  return process.env.WORKER_PORTAL_FROM_EMAIL || process.env.RESEND_FROM_ADDRESS || 'Digitizing Task Portal <onboarding@resend.dev>';
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * EMAIL 1: Sent to worker immediately upon registration application
 */
export async function sendWorkerApplicationReceivedEmail({ to, name }) {
  if (!to || !EMAIL_REGEX.test(to.trim())) {
    console.warn('[sendWorkerApplicationReceivedEmail] Invalid recipient email:', to);
    return { success: false, error: 'Invalid recipient email' };
  }

  const resend = getResendClient();
  const recipientName = (name || '').trim() || 'Digitizer';
  const from = getFromAddress();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Application Received - Digitizing Task Portal</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #131b2e; border: 1px solid #243049; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 28px; text-align: center; border-bottom: 2px solid #f97316;">
          <div style="display: inline-block; background: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.35); padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #fb923c; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">
            Task Portal Workstation
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
            Digitizing Task Portal
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8;">
            Commercial Digitizing & Vector Art Production
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 28px;">
          <div style="display: inline-block; background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
            Application Under Review
          </div>

          <h2 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
            Hello ${recipientName},
          </h2>

          <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
            Thank you for applying to join our digitizing workforce. Your registration and portfolio samples have been successfully received and are currently under review by our lead production team.
          </p>

          <div style="background-color: #0b1120; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #f97316; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
              What happens next?
            </div>
            <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.7;">
              <li>Our team evaluates your sample stitch files for quality, pull compensation, and density.</li>
              <li>Quality reviews are typically completed within <strong>24 to 48 hours</strong>.</li>
              <li>You will receive an activation email as soon as your account is approved.</li>
            </ul>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 8px 0;">
            Please note: You will not be able to access the task dashboard until your application has been approved by an administrator.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #090e1a; padding: 20px 28px; border-top: 1px solid #1e293b; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            This is an automated system notification from Digitizing Task Portal. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resend) {
    console.log('[WorkerPortalEmails] (Dev Log) Application received email simulation for:', to);
    return { success: true, simulated: true };
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: 'Application Received - Digitizing Task Portal',
      html
    });
    console.log('[WorkerPortalEmails] Application email dispatched to:', to, result?.data?.id || '');
    return { success: true, data: result.data };
  } catch (err) {
    console.warn('[WorkerPortalEmails] Failed to send application email with primary from, retrying with fallback:', err?.message);
    try {
      const fallbackResult = await resend.emails.send({
        from: 'Digitizing Task Portal <onboarding@resend.dev>',
        to,
        subject: 'Application Received - Digitizing Task Portal',
        html
      });
      return { success: true, data: fallbackResult.data };
    } catch (fallbackErr) {
      console.error('[WorkerPortalEmails] Resend application email error:', fallbackErr?.message);
      return { success: false, error: fallbackErr?.message };
    }
  }
}

/**
 * EMAIL 2: Sent to worker immediately when Admin clicks "Approve"
 */
export async function sendWorkerAccountApprovedEmail({ to, name, loginUrl }) {
  if (!to || !EMAIL_REGEX.test(to.trim())) {
    console.warn('[sendWorkerAccountApprovedEmail] Invalid recipient email:', to);
    return { success: false, error: 'Invalid recipient email' };
  }

  const resend = getResendClient();
  const recipientName = (name || '').trim() || 'Digitizer';
  const targetLoginUrl = loginUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app'}/portal/login`;
  const from = getFromAddress();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Account Approved - Digitizing Task Portal</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #131b2e; border: 1px solid #243049; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 28px; text-align: center; border-bottom: 2px solid #22c55e;">
          <div style="display: inline-block; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.35); padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #4ade80; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">
            Account Activated
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
            Digitizing Task Portal
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8;">
            Workstation Access Approved
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
            Congratulations, ${recipientName}!
          </h2>

          <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 0 0 18px 0;">
            Your digitizer application has been reviewed and <strong style="color: #4ade80;">approved</strong>! Your account is now active, and you have full access to the Digitizing Task Portal.
          </p>

          <div style="background-color: #0b1120; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
              You can now:
            </div>
            <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
              <li>Log in to view orders assigned directly to you.</li>
              <li>Submit quotes in Pakistani Rupee (PKR) for custom tasks.</li>
              <li>Upload completed production stitch files (DST, PES, EMB).</li>
              <li>Track approved earnings and download official payout receipts.</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="${targetLoginUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);">
              Log In to Task Portal
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">
            Direct link: <a href="${targetLoginUrl}" style="color: #60a5fa; word-break: break-all;">${targetLoginUrl}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #090e1a; padding: 20px 28px; border-top: 1px solid #1e293b; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            Digitizing Task Portal • Confidential Production Workstation
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resend) {
    console.log('[WorkerPortalEmails] (Dev Log) Account approved email simulation for:', to);
    return { success: true, simulated: true };
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: 'Account Approved - Digitizing Task Portal',
      html
    });
    console.log('[WorkerPortalEmails] Approval email dispatched to:', to, result?.data?.id || '');
    return { success: true, data: result.data };
  } catch (err) {
    console.warn('[WorkerPortalEmails] Failed to send approval email with primary from, retrying with fallback:', err?.message);
    try {
      const fallbackResult = await resend.emails.send({
        from: 'Digitizing Task Portal <onboarding@resend.dev>',
        to,
        subject: 'Account Approved - Digitizing Task Portal',
        html
      });
      return { success: true, data: fallbackResult.data };
    } catch (fallbackErr) {
      console.error('[WorkerPortalEmails] Resend approval email error:', fallbackErr?.message);
      return { success: false, error: fallbackErr?.message };
    }
  }
}
