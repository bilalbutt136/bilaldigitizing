const fs = require('fs');

const path = 'src/components/customer/OrderWizardModal.jsx';
let code = fs.readFileSync(path, 'utf8');

// 5. Update form rendering
const oldFormStart = `<form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>`;
const newFormStart = `{boltPaymentUrl && !isPaid ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800 }}>Complete Your Payment</h3>
                <span style={{ fontSize: '0.85rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>Awaiting Payment...</span>
              </div>
              <iframe 
                src={boltPaymentUrl} 
                style={{ width: '100%', height: '550px', border: 'none', borderRadius: '12px', background: '#fff' }}
                title="BoltPayouts Checkout"
                allow="payment"
              />
            </div>
          ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>`;

if (code.includes(oldFormStart)) {
  code = code.replace(oldFormStart, newFormStart);
  
  // also add closing brace for the ternary condition
  // Replace only the LAST occurrence of </form> before the end of the modal container
  // We can do this with a regex
  code = code.replace(/(<\/form>)\s*<\/div>\s*<\/div>\s*\)\;\s*\}\;/g, `</form>\n          )}
        </div>
      </div>
    );
};`);
} else {
  console.log("oldFormStart not found.");
}

// 6. Change "Submit Order" button
if (code.includes('Submit Order')) {
  code = code.replace(
    /Submit Order \(\$\{[^}]+\}\)/g,
    '{isProcessingPayment ? "Connecting securely to Payment..." : `Submit Order & Pay ($${pricingDetails.finalPrice.toFixed(2)})`}'
  );
}

fs.writeFileSync(path, code);
console.log('OrderWizardModal.jsx UI updated successfully!');
