const fs = require('fs');

const path = 'src/components/customer/OrderWizardModal.jsx';
let code = fs.readFileSync(path, 'utf8');

const oldSubmitRegex = /const handleSubmit = \(e\) => \{[\s\S]*?alert\([^\n]+\n\s*\};/g;

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
      paymentStatus: 'pending' // Enforce pending payment status
    };
    
    setIsProcessingPayment(true);

    try {
      let createdOrder = null;
      if (createOrder) {
        createdOrder = await createOrder(orderData);
      }
      
      const orderId = createdOrder?.id || \`ORDER_\${Date.now()}\`;
      setPendingOrderId(orderId);

      // Hit BoltPayouts API
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

if (code.match(oldSubmitRegex)) {
  code = code.replace(oldSubmitRegex, newSubmit);
  fs.writeFileSync(path, code);
  console.log("Replaced handleSubmit perfectly.");
} else {
  console.log("Still could not find it. Here's a snippet to debug:");
  const idx = code.indexOf("const handleSubmit = (e)");
  console.log(code.substring(idx, idx + 500));
}
