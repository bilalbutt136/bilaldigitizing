import React from 'react';
import { createAdminClient } from '../../src/lib/supabase/admin';

export const metadata = {
  title: 'Terms and Conditions | Bilal Digitizing',
  description: 'Terms and Conditions for embroidery digitizing, vector art conversion, and custom patch manufacturing services.',
};

export default async function TermsAndConditionsPage() {
  const supabase = createAdminClient();
  let termsContent = null;
  let lastUpdated = 'August 2026';

  try {
    const { data } = await supabase.from('home_page_settings').select('*').eq('key', 'terms_html').single();
    if (data && data.value) {
      termsContent = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      const dateStr = new Date(data.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      lastUpdated = dateStr;
    }
  } catch (err) {
    console.error('Error fetching terms and conditions', err);
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '4rem', paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Terms & Conditions
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
          {termsContent ? (
            <div dangerouslySetInnerHTML={{ __html: termsContent }} />
          ) : (
            <>
              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>1. Introduction</h2>
                <p style={{ marginBottom: '1rem' }}>
                  Welcome to Bilal Digitizing ("we," "our," or "us"). By accessing our website, purchasing our digital services (embroidery digitizing, vector art conversion), or physical products (custom patches), you agree to comply with and be bound by the following terms and conditions. These terms are required for legal compliance and payment gateway processing.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>2. Services & Delivery</h2>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>2.1 Digital Delivery (Digitizing & Vector Art)</h3>
                <p style={{ marginBottom: '1rem' }}>
                  All embroidery digitizing and vector art conversion files are delivered digitally via our platform or email. No physical goods are shipped for these services. Standard turnaround time is 12-24 hours. Delivery is considered complete once the digital file is uploaded to your account dashboard and marked as "Delivered."
                </p>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem' }}>2.2 Physical Delivery (Custom Patches)</h3>
                <p style={{ marginBottom: '1rem' }}>
                  Custom patches are physical goods manufactured upon order. Production typically takes 7-10 business days after digital proof approval. Shipping via international couriers (DHL/FedEx) takes an additional 3-5 business days. Delivery times are estimates and may be subject to carrier delays.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>3. Payments & Wallet System</h2>
                <p style={{ marginBottom: '1rem' }}>
                  Payments for services must be made upfront using supported payment gateways (Stripe, PayPal, etc.). We also operate a "Studio Wallet" system where clients can deposit funds in advance. Wallet funds are non-refundable for cash but can be used indefinitely for any platform services. All prices are stated in USD unless otherwise specified.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>4. Refund & Dispute Policy</h2>
                <p style={{ marginBottom: '1rem' }}>
                  Due to the custom nature of our digital and physical services, refunds are strictly governed by the following rules:
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Digital Services:</strong> Refunds are only issued if the delivered file fundamentally fails to meet the technical requirements (e.g., corrupt file, completely incorrect design) and our team is unable to resolve the issue through revisions. If the design sews out poorly despite our revisions, we will issue a full refund upon receipt of a photograph showing the defective sew-out.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Physical Patches:</strong> Refunds or reprints are provided if the final delivered patches differ significantly from the digitally approved pre-production sample. We do not offer refunds for delays caused by shipping carriers.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Disputes:</strong> We encourage clients to contact our 24/7 support before filing chargebacks. Unwarranted chargebacks may result in immediate suspension of the account.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>5. Revisions</h2>
                <p style={{ marginBottom: '1rem' }}>
                  We offer free minor revisions for all digital services. Minor revisions include slight density adjustments, color sequence changes, and scaling (up to 10%). Major revisions, such as complete artwork alterations or size increases beyond 20%, will be treated as a new order and billed accordingly. Revisions must be requested within 30 days of initial delivery.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>6. User Responsibilities & Copyright</h2>
                <p style={{ marginBottom: '1rem' }}>
                  By submitting artwork to Bilal Digitizing, you warrant that you own the copyright or possess the necessary licenses to reproduce the design. You agree to indemnify and hold harmless Bilal Digitizing against any claims, damages, or legal fees arising from copyright or trademark infringement related to your submitted artwork.
                </p>
              </section>

              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>7. Limitation of Liability</h2>
                <p style={{ marginBottom: '1rem' }}>
                  To the fullest extent permitted by law, Bilal Digitizing shall not be liable for any indirect, incidental, or consequential damages (including lost profits or damaged garments) arising from the use of our digital files or physical products. We highly recommend running a test sew-out on scrap fabric before embroidering on expensive production garments.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem' }}>8. Contact Information</h2>
                <p style={{ marginBottom: '1rem' }}>
                  If you have any questions or concerns regarding these Terms and Conditions, please contact us at:
                </p>
                <ul style={{ paddingLeft: '1.5rem', listStyleType: 'none', marginLeft: '-1.5rem' }}>
                  <li style={{ marginBottom: '0.25rem' }}><strong>Email:</strong> orders@bdigitizing-pro.com</li>
                  <li style={{ marginBottom: '0.25rem' }}><strong>Phone:</strong> +1 (800) 555-DIGI (3444)</li>
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
