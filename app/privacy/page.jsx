import React from 'react';
import { createAdminClient } from '../../src/lib/supabase/admin';

export const metadata = {
  title: 'Privacy Policy | Bilal Digitizing',
  description: 'Privacy Policy for Bilal Digitizing regarding data collection, payment processing, and user information.',
};

export default async function PrivacyPolicyPage() {
  const supabase = createAdminClient();
  let privacyContent = null;
  let lastUpdated = 'August 2026';

  try {
    const { data } = await supabase.from('home_page_settings').select('*').eq('key', 'privacy_policy_html').single();
    if (data && data.value) {
      privacyContent = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      const dateStr = new Date(data.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      lastUpdated = dateStr;
    }
  } catch (err) {
    console.error('Error fetching privacy policy', err);
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '4rem', paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div 
          style={{ 
            background: '#ffffff', 
            padding: '3rem', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            color: 'var(--navy-800)',
            lineHeight: 1.8,
            fontSize: '1.05rem'
          }}
        >
          {privacyContent ? (
            <div dangerouslySetInnerHTML={{ __html: privacyContent }} />
          ) : (
            <>
              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>1. Introduction</h2>
                <p style={{ marginBottom: '1rem' }}>
                  At Bilal Digitizing ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or interact with our platform. 
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  By accessing or using our website and services, you consent to the data practices described in this Privacy Policy.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>2. Information We Collect</h2>
                <p style={{ marginBottom: '1rem' }}>
                  We collect information that you provide directly to us when you register for an account, place an order, or communicate with our support team. This may include:
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Personal Identification Information:</strong> Name, email address, phone number, shipping and billing addresses.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Payment Information:</strong> We do not store full credit card details. All payment processing is securely handled by our third-party payment gateways (e.g., Stripe, PayPal).</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Order Information:</strong> Artwork, design files, project specifications, and order history.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Automatically Collected Data:</strong> IP addresses, browser types, device information, and browsing patterns through cookies and similar tracking technologies.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>3. How We Use Your Information</h2>
                <p style={{ marginBottom: '1rem' }}>
                  We use the collected information for various purposes, including:
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '0.5rem' }}>To process and fulfill your orders for digital digitizing/vector services and physical custom patches.</li>
                  <li style={{ marginBottom: '0.5rem' }}>To process transactions securely and prevent fraudulent activities.</li>
                  <li style={{ marginBottom: '0.5rem' }}>To communicate with you regarding your orders, account updates, and customer support inquiries.</li>
                  <li style={{ marginBottom: '0.5rem' }}>To improve our website functionality, service offerings, and user experience.</li>
                  <li style={{ marginBottom: '0.5rem' }}>To comply with legal obligations and enforce our Terms and Conditions.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>4. Data Security & Payment Gateway Compliance</h2>
                <p style={{ marginBottom: '1rem' }}>
                  We implement a variety of industry-standard security measures to maintain the safety of your personal information. All sensitive payment transactions are transmitted via Secure Socket Layer (SSL) technology and encrypted directly into our payment gateway providers' databases. 
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  We are compliant with Payment Card Industry Data Security Standards (PCI-DSS) requirements through our gateway partners. We never store or directly process your credit card numbers on our own servers.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>5. Third-Party Disclosures</h2>
                <p style={{ marginBottom: '1rem' }}>
                  We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties, except in the following circumstances:
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Trusted third parties who assist us in operating our website, conducting our business, processing payments (e.g., Stripe, PayPal), or servicing you (e.g., shipping carriers like DHL/FedEx), so long as those parties agree to keep this information confidential.</li>
                  <li style={{ marginBottom: '0.5rem' }}>When release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property, or safety.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>6. Cookies and Tracking Technologies</h2>
                <p style={{ marginBottom: '1rem' }}>
                  Our website utilizes "cookies" to enhance your experience, gather general visitor information, and track visits to our website. You may choose to disable cookies through your browser settings; however, doing so may affect the functionality of certain site features, including the ability to maintain a logged-in session or process checkout.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>7. Your Rights (GDPR & CCPA)</h2>
                <p style={{ marginBottom: '1rem' }}>
                  Depending on your location, you may have rights under regional data protection laws (such as GDPR in Europe or CCPA in California). These rights may include:
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '0.5rem' }}>The right to access the personal data we hold about you.</li>
                  <li style={{ marginBottom: '0.5rem' }}>The right to request the correction or deletion of your personal data.</li>
                  <li style={{ marginBottom: '0.5rem' }}>The right to opt-out of marketing communications.</li>
                </ul>
                <p style={{ marginBottom: '1rem' }}>
                  To exercise any of these rights, please contact our privacy team using the details provided below.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>8. Contact Information</h2>
                <p style={{ marginBottom: '1rem' }}>
                  If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact us at:
                </p>
                <ul style={{ paddingLeft: '1.5rem', listStyleType: 'none', marginLeft: '-1.5rem' }}>
                  <li style={{ marginBottom: '0.25rem' }}><strong>Email:</strong> orders@bdigitizing-pro.com</li>
                  <li style={{ marginBottom: '0.25rem' }}><strong>Phone:</strong> +1 (347) 915-4498</li>
                  <li style={{ marginBottom: '0.25rem' }}><strong>Support Hours:</strong> 24/7 Operations</li>
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
