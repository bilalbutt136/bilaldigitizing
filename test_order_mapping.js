import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testOrder() {
  const dummyPayload = {
    action: 'createOrder',
    payload: {
      primaryDbRow: {
        id: 'TEST-ORDER-123',
        title: 'Agent Test Order',
        clientName: 'Testing Agent',
        clientEmail: 'agent@test.com',
        serviceCategory: 'Digitizing',
        type: 'embroidery',
        fabricType: 'Cotton',
        requestedFormats: ['dst', 'pes'],
        isRush: true,
        price: 15.00,
        notes: 'This is a test order created by the AI agent to verify the DB mapping.',
        patchStyle: null,
        placementItems: [{ id: 1, type: 'left_chest' }]
      },
      orderFiles: [
        {
          order_id: 'TEST-ORDER-123',
          file_name: 'test_logo.png',
          file_format: 'png',
          file_type: 'client_artwork',
          bucket_name: 'cloudinary',
          file_path: 'test_path_123',
          public_url: 'https://test.com/logo.png',
          file_url: 'https://test.com/logo.png'
        }
      ]
    }
  };

  try {
    const res = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dummyPayload)
    });

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testOrder();
