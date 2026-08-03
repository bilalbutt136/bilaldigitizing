const fs = require('fs');

const path = 'src/components/customer/OrderWizardModal.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add updateOrderStatus and showToast to useAppState destructuring
if (!code.includes('updateOrderStatus')) {
  code = code.replace(
    'createOrder,',
    'createOrder,\n    updateOrderStatus,\n    showToast,'
  );
}

// 2. Add state variables inside OrderWizardModal component
if (!code.includes('isProcessingPayment')) {
  code = code.replace(
    'const [selectedPackageTier, setSelectedPackageTier] = useState',
    `const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [boltPaymentUrl, setBoltPaymentUrl] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState('');
  const [selectedPackageTier, setSelectedPackageTier] = useState`
  );
}

// 3. Add polling useEffect
if (!code.includes('/api/boltpayouts/status')) {
  const useEffectBlock = `
  React.useEffect(() => {
    let intervalId;
    if (invoiceId && !isPaid && pendingOrderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(\`/api/boltpayouts/status?invoiceId=\${invoiceId}\`);
          const data = await res.json();
          if (data.success && (data.status === 'paid' || data.status === 'completed')) {
            setIsPaid(true);
            if (updateOrderStatus) {
              await updateOrderStatus(pendingOrderId, 'submitted', { payment_status: 'paid' });
            }
            if (showToast) {
               showToast('Payment successful! Your order has been placed.', 'success');
            } else {
               alert('Payment successful! Your order has been placed.');
            }
            setIsOrderWizardOpen(false);
            setBoltPaymentUrl('');
            setInvoiceId('');
            setIsProcessingPayment(false);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [invoiceId, isPaid, pendingOrderId, updateOrderStatus, setIsOrderWizardOpen, showToast]);
`;
  code = code.replace('React.useEffect(() => {', useEffectBlock + '\n  React.useEffect(() => {');
}

// 4. Update handleSubmit
const oldSubmit = `const handleSubmit = (e) => {
    e.preventDefault();
    const orderTitle = title.trim() || \`\${pricingDetails.serviceTitle} Order\`;
    const orderData = {
      title: orderTitle,
      type,
      serviceCategory: pricingDetails?.serviceTitle || type || 'Embroidery Digitizing',
      price: parseFloat(pricingDetails?.finalPrice || 15.00),
      selectedPackageTier,
      placementItems,
      fabricType,
      requestedFormats,
      isRush,
      patchStyle,
      patchBacking,
      patchBorderStyle,
      patchWidth,
      patchHeight,
      patchQuantity,
      notes: notes.trim(),
      totalPrice: pricingDetails?.finalPrice || 15.00,
      uploadedFiles: selectedAssets.map(a => a.name)
    };
    if (createOrder) {
      createOrder(orderData);
    }
    setIsOrderWizardOpen(false);
    alert(\`Order "\${orderTitle}" placed successfully! Total: $\${pricingDetails.finalPrice.toFixed(2)}\`);
  };`;

const newSubmit = `const handleSubmit = async (e) => {
    e.preventDefault();
    const orderTitle = title.trim() || \`\${pricingDetails?.serviceTitle || 'Service'} Order\`;
    const finalPrice = pricingDetails?.finalPrice || 15.00;
    
    const orderData = {
      title: orderTitle,
      type,
      serviceCategory: pricingDetails?.serviceTitle || type || 'Embroidery Digitizing',
      price: parseFloat(finalPrice),
      selectedPackageTier,
      placementItems,
      fabricType,
      requestedFormats,
      isRush,
      patchStyle,
      patchBacking,
      patchBorderStyle,
      patchWidth,
      patchHeight,
      patchQuantity,
      notes: notes.trim(),
      totalPrice: finalPrice,
      uploadedFiles: selectedAssets.map(a => a.name),
      paymentStatus: 'pending'
    };
    
    setIsProcessingPayment(true);

    try {
      let createdOrder = null;
      if (createOrder) {
        createdOrder = await createOrder(orderData);
      }
      
      const orderId = createdOrder?.id || \`ORDER_\${Date.now()}\`;
      setPendingOrderId(orderId);

      const res = await fetch('/api/boltpayouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          method: 'card'
        })
      });
      const data = await res.json();
      
      if (data.success && data.paymentUrl) {
        setBoltPaymentUrl(data.paymentUrl);
        setInvoiceId(data.invoice?.id);
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
       console.error("Payment setup error:", err);
       alert("Error setting up payment: " + err.message);
       setIsProcessingPayment(false);
    }
  };`;

if (code.includes(oldSubmit)) {
  code = code.replace(oldSubmit, newSubmit);
} else {
  console.log("Could not find old handleSubmit to replace");
}

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
    /Submit Order \(\\\$\{[^}]+\}\)/g,
    '{isProcessingPayment ? "Connecting securely to Payment..." : `Submit Order & Pay ($${pricingDetails.finalPrice.toFixed(2)})`}'
  );
}

fs.writeFileSync(path, code);
console.log('OrderWizardModal.jsx updated successfully!');
