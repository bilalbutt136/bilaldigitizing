const fs = require('fs');

let code = fs.readFileSync('src/services/supabaseService.js', 'utf8');

const replacements = {
  updateOrderStatusInSupabase: `export async function updateOrderStatusInSupabase(orderId, newStatus, extraData = {}) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', payload: { orderId, newStatus, extraData } })
    });
    return true;
  } catch { return false; }
}`,

  cancelOrderInSupabase: `export async function cancelOrderInSupabase(orderId) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancelOrder', payload: { orderId } })
    });
    return true;
  } catch { return false; }
}`,

  deleteOrderInSupabase: `export async function deleteOrderInSupabase(orderId) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteOrder', payload: { orderId } })
    });
    return true;
  } catch { return false; }
}`,

  addOrderMessageInSupabase: `export async function addOrderMessageInSupabase(orderId, text, senderName, senderRole = 'client', attachments = []) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'addMessage', 
        payload: { order_id: orderId, message: text, is_staff: senderRole === 'admin', sender_name: senderName }
      })
    });
    return { success: true };
  } catch { return { success: false }; }
}`,

  addRevisionInSupabase: `export async function addRevisionInSupabase(orderId, note, requestedBy = 'Client') {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'requestRevision', payload: { orderId, instructions: note, requestedBy } })
    });
    return { success: true };
  } catch { return { success: false }; }
}`,

  fetchConversations: `export async function fetchConversations() {
  try {
    const res = await fetch('/api/messages?action=fetchConversations');
    const data = await res.json();
    return data.conversations || [];
  } catch { return []; }
}`,
};

for (const [funcName, replacement] of Object.entries(replacements)) {
  const regex = new RegExp(`export async function ${funcName}\\([\\s\\S]*?^\\}\\s*`, 'm');
  if (regex.test(code)) {
    code = code.replace(regex, replacement + '\n\n');
  } else {
    const arrowRegex = new RegExp(`export const ${funcName} = async \\([\\s\\S]*?^\\};\\s*`, 'm');
    if (arrowRegex.test(code)) {
      code = code.replace(arrowRegex, replacement + '\n\n');
    } else {
      console.log('Could not find', funcName);
    }
  }
}

fs.writeFileSync('src/services/supabaseService.js', code);
console.log('Refactored remaining supabaseService.js functions');
