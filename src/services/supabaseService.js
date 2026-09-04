import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { getSiteUrl } from '../utils/siteUrl';

export { isSupabaseConfigured };

/**
 * Service layer for Supabase Database, Auth & Storage Operations.
 */

export async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
  } catch {}
  return headers;
}

// ============================================================
// ORDER LIFECYCLE STATE MACHINE
// ============================================================
export { ORDER_STATUSES, validateStatusTransition } from '../utils/orderLifecycle.js';

export async function signInWithGoogleIdToken(idToken) {
  if (!isSupabaseConfigured) return { success: false, error: 'Database not configured.' };
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    console.error('Google ID Token auth error:', err);
    return { success: false, error: err?.message || 'Google Authentication error.' };
  }
}

export async function promptGoogleIdentitySignIn(redirectTo = '/client-portal') {
  return signInWithGoogleOAuth(redirectTo);
}

export async function signInWithGoogleOAuth(redirectTo = '/client-portal') {
  if (!isSupabaseConfigured) return { success: false, error: 'Database not configured.' };
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const targetUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    console.error('Google OAuth error:', err);
    return { success: false, error: err?.message || 'Google OAuth error.' };
  }
}

export async function signInWithAppleIdToken(idToken) {
  if (!isSupabaseConfigured) return { success: false, error: 'Database not configured.' };
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    console.error('Apple ID Token auth error:', err);
    return { success: false, error: err?.message || 'Apple Authentication error.' };
  }
}

export async function signInWithAppleOAuth(redirectTo = '/client-portal') {
  if (!isSupabaseConfigured) return { success: false, error: 'Database not configured.' };
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const targetUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: targetUrl
      }
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    console.error('Apple OAuth error:', err);
    return { success: false, error: err?.message || 'Apple OAuth error.' };
  }
}

export async function signInWithSupabaseAuth(email, password) {
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (error) {
      return { success: false, error: error.message || 'Invalid email or password combination.' };
    }

    return { success: true, user: data.user, session: data.session, source: 'supabase_auth' };
  } catch (err) {
    return { success: false, error: err?.message || 'Authentication error.' };
  }
}

export async function signUpWithSupabaseAuth(name, email, password, company) {
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanCompany = company ? company.trim() : `${cleanName}'s Custom Apparel`;

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
          company: cleanCompany,
          company_name: cleanCompany
        }
      }
    });

    if (authErr) {
      let msg = authErr.message;
      if (msg === '{}' || !msg) {
        msg = 'Registration failed. Please check if email confirmations are enabled or if your email is valid.';
      }
      return { success: false, error: msg };
    }

    const createdUser = authData?.user;

    // Detect duplicate email
    if (createdUser && Array.isArray(createdUser.identities) && createdUser.identities.length === 0) {
      return { 
        success: false, 
        error: 'An account with this email address already exists. Please sign in instead.' 
      };
    }

    return { 
      success: true, 
      user: createdUser,
      session: authData?.session
    };
  } catch (err) {
    return { success: false, error: err?.message || 'Registration exception occurred.' };
  }
}

// Supabase Reset Password for Email Handler
export async function sendPasswordResetEmail(email) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    const redirectToUrl = `${getSiteUrl()}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectToUrl
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err?.message || 'Password reset request error.' };
  }
}

// Supabase Update Password Handler (called after user clicks recovery link)
export async function updateUserPassword(newPassword) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err?.message || 'Update password error.' };
  }
}



// Fetch all orders from Supabase DB
export async function fetchOrdersFromSupabase(customEmail = null, customOrderIds = null) {
  try {
    const headers = await getAuthHeaders();
    let url = '/api/orders?action=fetchAll';
    const params = new URLSearchParams();

    let resolvedEmail = customEmail;
    if (!resolvedEmail && typeof window !== 'undefined') {
      try {
        const authSaved = JSON.parse(localStorage.getItem('bdigi_auth_user') || 'null');
        const clientSaved = JSON.parse(localStorage.getItem('bdigi_client_user') || 'null');
        resolvedEmail = authSaved?.email || clientSaved?.email || localStorage.getItem('bdigi_user_email') || null;
      } catch {}
    }
    if (resolvedEmail) params.append('email', resolvedEmail);

    let resolvedOrderIds = customOrderIds;
    if (!resolvedOrderIds && typeof window !== 'undefined') {
      try {
        const localIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
        if (Array.isArray(localIds) && localIds.length > 0) {
          resolvedOrderIds = localIds.join(',');
        }
      } catch {}
    }
    if (resolvedOrderIds) params.append('orderIds', resolvedOrderIds);

    const qs = params.toString();
    if (qs) url += `&${qs}`;

    const res = await fetch(url, { headers });
    const data = await res.json();
    const orders = data.orders || [];
    
    // Map snake_case database columns back to camelCase frontend properties
    return orders.map(order => {
      let notesData = {};
      try {
        if (order.notes) {
          notesData = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
        }
      } catch (e) {
        notesData.notes = order.notes;
      }
      
      const allFiles = order.order_files || [];
      const clientFiles = allFiles.filter(f => f.file_type === 'client_artwork').map(f => ({
        id: f.id,
        name: f.file_name,
        format: f.file_format || f.file_name?.split('.').pop() || 'png',
        url: f.public_url || f.file_url,
        public_url: f.public_url || f.file_url,
        public_id: f.file_path,
        uploadedAt: f.created_at
      }));
      
      const machineFiles = allFiles.filter(f => f.file_type === 'machine_file').map(f => ({
        id: f.id,
        name: f.file_name,
        format: f.file_format || f.file_name?.split('.').pop() || 'dst',
        url: f.public_url || f.file_url,
        public_url: f.public_url || f.file_url,
        public_id: f.file_path,
        uploadedAt: f.created_at
      }));

      const rawOrderMessages = order.order_messages || [];
      const mappedOrderMessages = rawOrderMessages.map(m => ({
        id: m.id,
        sender: m.is_staff ? 'admin' : (m.sender_role === 'admin' ? 'admin' : 'client'),
        senderName: m.sender_name || (m.is_staff ? 'Master Digitizer' : (order.client_name || 'Client')),
        senderRole: m.is_staff ? 'admin' : (m.sender_role || 'client'),
        text: m.message || m.text || '',
        attachment: m.attachment || m.attachments?.[0]?.name || null,
        attachmentUrl: m.attachment_url || m.attachments?.[0]?.url || null,
        timestamp: m.created_at || m.timestamp || new Date().toISOString()
      }));

      // Extract primary artwork URL with comprehensive fallback chain
      const primaryArtworkUrl = 
        (order.artwork_url && typeof order.artwork_url === 'string' && order.artwork_url.trim()) || 
        (order.image_url && typeof order.image_url === 'string' && order.image_url.trim()) || 
        (order.logo && typeof order.logo === 'string' && order.logo.trim()) || 
        clientFiles[0]?.url || 
        notesData.placementItems?.[0]?.files?.[0]?.url || 
        notesData.patchItems?.[0]?.files?.[0]?.url || 
        null;

      const pStatusLower = String(order.payment_status || order.paymentStatus || '').toLowerCase().trim();
      const oStatusLower = String(order.status || '').toLowerCase().trim();
      const isPaidComputed = pStatusLower === 'paid' || 
                             pStatusLower === 'completed' || 
                             pStatusLower === 'settled' || 
                             pStatusLower === 'verified' || 
                             pStatusLower === 'wallet' ||
                             Boolean(order.paid_at) ||
                             ['in_progress', 'digitizing', 'assigned', 'qc', 'delivered', 'completed'].includes(oStatusLower);

      const rawPrice = parseFloat(order.price ?? order.total_price ?? order.totalPrice ?? order.cost ?? order.amount ?? 0);
      const categoryStr = String(order.service_category || order.service_type || order.type || '').toLowerCase();
      const defaultCategoryPrice = categoryStr.includes('vector') ? 12.00 : categoryStr.includes('patch') ? 25.00 : 15.00;
      const normalizedPrice = !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : defaultCategoryPrice;

      return {
        ...order,
        price: normalizedPrice,
        totalPrice: normalizedPrice,
        createdAt: order.created_at || order.createdAt || order.timestamp || order.order_date || new Date().toISOString(),
        created_at: order.created_at || order.createdAt || order.timestamp || order.order_date || new Date().toISOString(),
        turnaroundHours: Number(order.turnaround_hours || order.turnaroundHours) || (order.is_rush || order.isRush ? 4 : (order.service_category === 'patch' || order.serviceCategory === 'patch' ? 168 : 12)),
        clientName: order.client_name,
        clientEmail: order.client_email,
        serviceCategory: order.service_category,
        paymentStatus: isPaidComputed ? 'paid' : (order.payment_status || order.paymentStatus || 'pending'),
        payment_status: isPaidComputed ? 'paid' : (order.payment_status || order.paymentStatus || 'pending'),
        isPaid: isPaidComputed,
        artworkUrl: primaryArtworkUrl,
        image_url: primaryArtworkUrl,
        logo: primaryArtworkUrl,
        uploadedFiles: clientFiles.length > 0 ? clientFiles : (notesData.uploadedFiles || []),
        uploadedMachineFiles: machineFiles,
        messages: mappedOrderMessages,
        type: order.service_type || order.service_category,
        fabricType: order.fabric_type,
        requestedFormats: order.requested_formats,
        isRush: order.is_rush,
        patchStyle: notesData.patchStyle,
        patchBacking: notesData.patchBacking,
        patchBorderStyle: notesData.patchBorderStyle,
        patchWidth: notesData.patchWidth,
        patchHeight: notesData.patchHeight,
        patchQuantity: notesData.patchQuantity,
        patchItems: notesData.patchItems || [],
        placementItems: notesData.placementItems || [],
        deliveryNotes: notesData.deliveryNotes || notesData.deliveryMessage || order.delivery_notes || '',
        deliveryMessage: notesData.deliveryNotes || notesData.deliveryMessage || order.delivery_notes || '',
        deliveryDate: notesData.deliveryDate || order.delivery_date || null,
        revisions: notesData.revisions || order.revisions || [],
        notes: notesData.notes || (typeof order.notes === 'string' && !order.notes.startsWith('{') ? order.notes : '')
      };
    });
  } catch { return []; }
}

// Create new Order in Supabase DB & Storage
export async function createOrderInSupabase(newOrder) {
  try {
    const rawFiles = newOrder.uploadedFiles || [];
    const orderFiles = rawFiles
      .filter(file => file && (file.url || file.public_url || file.file_url))
      .map(file => ({
        order_id: newOrder.id,
        file_name: file.original_filename || file.name || 'artwork_file',
        file_format: file.format || file.name?.split('.').pop() || 'png',
        file_type: 'client_artwork',
        bucket_name: 'client-uploads',
        file_path: file.public_id || file.url || file.public_url,
        public_url: file.url || file.public_url || file.file_url,
        file_url: file.url || file.public_url || file.file_url,
        uploaded_by: 'client'
      }));

    const headers = await getAuthHeaders();
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'createOrder', payload: { primaryDbRow: newOrder, orderFiles } })
    });
    const data = await res.json();
    return { success: res.ok, data: data.order };
  } catch (err) {
    return { success: false, data: null };
  }
}

// Update Order Status & Attach Machine Files in Supabase DB
export async function updateOrderStatusInSupabase(orderId, newStatus, extraData = {}) {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'updateStatus', payload: { orderId, newStatus, extraData } })
    });
    return true;
  } catch { return false; }
}

// Add Revision Request in Supabase DB
export async function addRevisionInSupabase(orderId, note, requestedBy = 'Client') {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'requestRevision', payload: { orderId, instructions: note, requestedBy } })
    });
    return { success: true };
  } catch { return { success: false }; }
}

export async function cancelOrderInSupabase(orderId) {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'cancelOrder', payload: { orderId } })
    });
    return true;
  } catch { return false; }
}

export async function deleteOrderInSupabase(orderId) {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'deleteOrder', payload: { orderId } })
    });
    return true;
  } catch { return false; }
}

// Upsert Client Profile in Supabase DB (Automatic Save on Login & Order Submission)
export async function upsertClientInSupabase(userData) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsert', payload: userData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

// Fetch all registered clients from Supabase DB
export async function fetchClientsFromSupabase() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/clients?action=fetchAll', { headers });
    const data = await res.json();
    return data.clients || [];
  } catch { return []; }
}

// Deposit Funds & Transaction Handler in Supabase
export async function depositFundsInSupabase(clientEmail, depositAmount, paymentMethod = 'Credit Card') {
  if (!isSupabaseConfigured || !clientEmail) return null;

  try {
    const cleanEmail = clientEmail.toLowerCase().trim();
    const amount = parseFloat(depositAmount);

    const { data: newBalance, error } = await supabase.rpc('deposit_funds', {
      p_client_email: cleanEmail,
      p_amount: amount,
      p_payment_method: paymentMethod
    });

    if (error) {
      console.error('Supabase deposit funds error:', error.message);
      return null;
    }
    return newBalance;
  } catch (err) {
    console.warn('Supabase deposit funds exception:', err);
    return null;
  }
}

// Deduct Wallet Balance in Supabase DB on Order Submission
export async function deductWalletInSupabase(clientEmail, orderAmount, orderId) {
  if (!isSupabaseConfigured || !clientEmail) return null;

  try {
    const cleanEmail = clientEmail.toLowerCase().trim();
    const amount = parseFloat(orderAmount);

    const { data: newBalance, error } = await supabase.rpc('deduct_wallet_balance', {
      p_client_email: cleanEmail,
      p_amount: amount,
      p_order_id: orderId
    });

    if (error) {
      console.error('Supabase deduct wallet error:', error.message);
      return null;
    }
    return newBalance;
  } catch (err) {
    console.warn('Supabase deduct wallet exception:', err);
    return null;
  }
}

// Fetch CMS Configuration from Supabase (Pricing, Services & Site Settings)
export async function fetchCmsConfigFromSupabase() {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('key, value');

    if (error || !data) {
      console.warn('Supabase fetch site_config notice:', error?.message);
      return null;
    }

    const configMap = {};
    data.forEach(item => {
      configMap[item.key] = item.value;
    });

    return configMap;
  } catch (err) {
    console.warn('Supabase fetch site_config exception:', err);
    return null;
  }
}

// Save/Upsert CMS Configuration to Supabase (only for key-value settings)
export async function saveCmsConfigToSupabase(key, value) {
  if (!key) return false;

  try {
    let authHeaders = { 'Content-Type': 'application/json' };
    try {
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authHeaders['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }
      }
    } catch {}

    const res = await fetch('/api/admin/homepage', {
      method: 'POST',
      headers: authHeaders,
      credentials: 'include',
      body: JSON.stringify({ settings: [{ key, value }] })
    });

    if (res.ok) return true;

    // Direct fallback if API route returned non-200
    if (supabase) {
      const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await Promise.allSettled([
        supabase.from('site_config').upsert({ key, value: valStr, updated_at: new Date().toISOString() }, { onConflict: 'key' }),
        supabase.from('home_page_settings').upsert({ key, value: valStr, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`saveCmsConfigToSupabase [${key}] exception:`, err);
    if (supabase) {
      try {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await supabase.from('site_config').upsert({ key, value: valStr, updated_at: new Date().toISOString() }, { onConflict: 'key' }, { onConflict: 'key' });
        return true;
      } catch (dbErr) {
        console.error('Direct supabase fallback error:', dbErr);
      }
    }
    return false;
  }
}


// Upsert array of catalog items to a dedicated table via /api/catalog
export async function upsertCatalogDataToSupabase(tableName, dataArray) {
  if (!tableName || !Array.isArray(dataArray)) return false;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertMany', tableName, payload: dataArray })
    });
    return res.ok;
  } catch (err) {
    console.warn(`Supabase sync ${tableName} exception:`, err);
    return false;
  }
}

export const saveHeroServiceViaApi = async (serviceData, allSlides = null) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers,
      body: JSON.stringify({ serviceData, allSlides })
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error('saveHeroServiceViaApi error:', err);
    return { success: false, error: err.message };
  }
};

export const upsertHeroContent = async (data) => {
  try {
    const dbPayload = data.map(h => ({
      id: h.id,
      title: h.title || 'Default Title',
      subtitle: h.subtitle || h.description || h.highlight || 'Default Subtitle',
      badge: h.badge,
      rating: h.rating || h.rate_label || '5.0',
      reviews: h.reviews || '0',
      primary_btn_text: h.primary_btn_text || h.primary_cta || 'Order Now',
      primary_btn_action: h.primary_btn_action || '/order',
      secondary_btn_text: h.secondary_btn_text || h.secondary_cta || 'Learn More',
      secondary_btn_action: h.secondary_btn_action || '/services',
      image: h.image || h.bannerImage || h.banner_image || '',
      sort_order: h.sort_order || 0,
      is_active: h.is_active !== undefined ? h.is_active : true
    }));
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertMany', tableName: 'hero_slides', payload: dbPayload })
    });
    return res.ok;
  } catch { return false; }
};
export const upsertPricingTiers = (data) => upsertCatalogDataToSupabase('pricing_cards', data);
export const savePortfolioItemViaApi = async (item) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'upsert',
        tableName: 'portfolio',
        payload: {
          id: item.id || `port-${Date.now()}`,
          title: item.title || 'Custom Studio Artwork',
          category: item.category || 'Embroidery',
          description: item.description || '',
          original_image: item.original_image || item.originalImage || item.beforeImg || '',
          digitized_image: item.digitized_image || item.digitizedImage || item.afterImg || item.image_url || '',
          stitch_count: item.stitch_count !== undefined ? String(item.stitch_count) : (item.stitchCount || ''),
          colors: item.colors || 'Standard',
          formats: Array.isArray(item.formats) ? item.formats.join(', ') : (item.formats || 'DST, PES, EMB'),
          client_type: item.client_type || item.clientType || 'Commercial Client',
          sort_order: Number(item.sort_order) || 0,
          is_active: item.is_active !== false,
          updated_at: new Date().toISOString()
        }
      })
    });
    return await res.json();
  } catch (err) {
    console.error('savePortfolioItemViaApi error:', err);
    return { success: false, error: err.message };
  }
};

export const deletePortfolioItemViaApi = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'delete',
        tableName: 'portfolio',
        payload: { id }
      })
    });
    return await res.json();
  } catch (err) {
    console.error('deletePortfolioItemViaApi error:', err);
    return { success: false, error: err.message };
  }
};

export const upsertPortfolioItems = async (data) => {
  try {
    const dbPayload = data.map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      category: item.category || 'Embroidery',
      original_image: item.originalImage || item.original_image || item.beforeImg || item.before_img || '',
      digitized_image: item.digitizedImage || item.digitized_image || item.afterImg || item.after_img || item.image || '',
      stitch_count: item.stitchCount !== undefined ? String(item.stitchCount) : (item.stitch_count || '0'),
      colors: item.colors || 'Standard',
      description: item.description || '',
      sort_order: item.sortOrder !== undefined ? Number(item.sortOrder) : (item.sort_order || 0),
      is_active: item.is_active !== undefined ? item.is_active : true,
      formats: item.formats || 'DST, EMB',
      client_type: item.clientType || item.client_type || 'regular'
    }));
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertMany', tableName: 'portfolio', payload: dbPayload })
    });
    return res.ok;
  } catch { return false; }
};
export const upsertPatchCards = (data) => upsertCatalogDataToSupabase('patch_cards', data);
export const upsertFaqs = async (data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertMany', tableName: 'faqs', payload: data })
    });
    return res.ok;
  } catch { return false; }
};
export const upsertSewOuts = async (data) => {
  try {
    const dbPayload = data.map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      category: item.category || 'general',
      before_img: item.beforeImg || item.before_img || '',
      after_img: item.afterImg || item.after_img || '',
      stitch_count: item.stitchCount !== undefined ? String(item.stitchCount) : (item.stitch_count || '0'),
      formats: item.formats || 'DST, EMB',
      features: item.features || {},
      sort_order: item.sortOrder !== undefined ? Number(item.sortOrder) : (item.sort_order || 0),
      is_active: item.is_active !== undefined ? item.is_active : true
    }));
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertMany', tableName: 'sew_outs', payload: dbPayload })
    });
    return res.ok;
  } catch { return false; }
};

export const upsertTestimonials = async (data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertMany', tableName: 'testimonials', payload: data })
    });
    return res.ok;
  } catch { return false; }
};

export const upsertDigitizers = async (data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertMany', tableName: 'digitizers', payload: data })
    });
    return res.ok;
  } catch { return false; }
};

export async function upsertPricingTier(tierData) {
  try {
    let service_type = (tierData.service_type || 'embroidery').toLowerCase().replace('-', '_');
    if (service_type.startsWith('vec')) {
      service_type = 'vector_art';
    } else if (service_type.startsWith('patch')) {
      service_type = 'patches';
    } else {
      service_type = 'embroidery';
    }

    const payload = {
      ...tierData,
      service_type,
      price: Number(tierData.price) || 0,
      original_price: tierData.original_price ? Number(tierData.original_price) : null,
      display_order: Number(tierData.display_order) || 0,
      is_popular: Boolean(tierData.is_popular),
      features: Array.isArray(tierData.features) ? tierData.features.filter(f => f && f.trim()) : [],
      updated_at: new Date().toISOString()
    };
    if (!payload.id || (typeof payload.id === 'string' && (payload.id === 'new' || payload.id.startsWith('new-')))) {
      delete payload.id;
    }

    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsert', tableName: 'pricing_tiers', payload })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('upsertPricingTier API error:', errJson);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('upsertPricingTier exception:', err);
    return false;
  }
}


export async function deletePricingTier(tierId) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'delete', tableName: 'pricing_tiers', payload: { id: tierId } })
    });
    return res.ok;
  } catch (err) {
    console.warn('deletePricingTier exception:', err);
    return false;
  }
}

// ============================================================
// HOME PAGE CMS (DB-driven)
// ============================================================

export async function fetchHomePageContentFromSupabase() {
  try {
    const res = await fetch('/api/admin/homepage');
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.warn('Supabase fetch home page CMS exception:', err);
    return {
      settings: {},
      trustStats: [],
      trustFeatures: [],
      workflowSteps: [],
      pricingStaticCards: [],
      pricingTiers: []
    };
  }
}

export async function updateHomePageSettingsInSupabase(payloadArray) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/homepage', {
      method: 'POST',
      headers,
      body: JSON.stringify({ settings: payloadArray })
    });
    const data = await res.json();
    return { success: res.ok && !data.error, data: data.data };
  } catch (err) {
    console.warn('updateHomePageSettingsInSupabase error:', err);
    return { success: false, error: err.message };
  }
}



// ============================================================
// CATALOG (DB-driven; replaces mock catalog defaults)
// ============================================================

// Fetch the full public catalog from Supabase (services, pricing tiers,
// patch cards, store products, portfolio items, sew outs, hero slides, digitizers,
// and the cms_content key/value store). Returns null when not configured.
export async function fetchCatalogFromSupabase() {
  try {
    const res = await fetch(`/api/catalog?action=fetchAll&_t=${Date.now()}`, {
      cache: 'no-store'
    });
    const data = await res.json();
    
    // Parse site_config array into a map with robust JSON parsing
    const siteConfig = data.site_config || [];
    const configMap = {};
    siteConfig.forEach(item => {
      if (item && item.key) {
        if (typeof item.value === 'string') {
          try {
            configMap[item.key] = JSON.parse(item.value);
          } catch (e) {
            configMap[item.key] = item.value;
          }
        } else {
          configMap[item.key] = item.value;
        }
      }
    });

    // Extract site_settings composite or direct config rows
    const rawSettings = typeof configMap['site_settings'] === 'object' ? configMap['site_settings'] : {};
    const parsedAnnouncement = typeof configMap['announcement'] === 'object' 
      ? configMap['announcement'] 
      : (typeof rawSettings?.announcement === 'object' ? rawSettings.announcement : null);

    const parsedPromotionalBanner = typeof configMap['promotionalBanner'] === 'object' 
      ? configMap['promotionalBanner'] 
      : (typeof rawSettings?.promotionalBanner === 'object' ? rawSettings.promotionalBanner : null);

    const parsedPromoCodes = Array.isArray(configMap['promoCodes']) 
      ? configMap['promoCodes'] 
      : (Array.isArray(rawSettings?.promoCodes) ? rawSettings.promoCodes : null);

    const parsedPromotions = Array.isArray(configMap['promotions'])
      ? configMap['promotions']
      : (Array.isArray(rawSettings?.promotions) ? rawSettings.promotions : null);

    return {
      // Original snake_case/raw keys
      services: data.services || [],
      pricing_tiers: data.pricing_tiers || [],
      patch_cards: data.patch_cards || [],
      store_products: data.store_products || [],
      portfolio: data.portfolio || [],
      sew_outs: data.sew_outs || [],
      hero_slides: data.hero_slides || [],
      digitizers: data.digitizers || [],
      pricing_cards: data.pricing_cards || [],
      site_config: siteConfig,
      faqs: data.faqs || [],
      testimonials: data.testimonials || [],
      
      // CamelCase aliases and config parsings required by StateContext.jsx
      servicesList: data.services || [],
      dynamicPricingTiers: data.pricing_tiers || [],
      patchCards: data.patch_cards || [],
      storeProducts: data.store_products || [],
      portfolioSamples: data.portfolio || [],
      sewOuts: data.sew_outs || [],
      heroSlides: (configMap['hero_slides'] && Array.isArray(configMap['hero_slides']) && configMap['hero_slides'].length > 0)
        ? configMap['hero_slides']
        : (data.hero_slides || []),
      pricingCards: data.pricing_cards || [],
      heroGlobalSettings: configMap['hero_global_settings'] || null,
      heroServiceText: configMap['hero_service_text'] || null,
      siteSettings: (() => {
        const safePromotions = parsedPromotions || [];
        const currentActivePromo = safePromotions.find(p => p.status === 'active');

        const dynamicAnnouncement = currentActivePromo ? {
          enabled: parsedAnnouncement?.enabled !== false,
          badge: (currentActivePromo.name || 'SALE').toUpperCase(),
          text: `Get ${currentActivePromo.discountPercent}% OFF on All Custom Embroidery Digitizing & Vector Art Orders!`,
          linkText: `Claim ${currentActivePromo.discountPercent}% Off`,
          linkUrl: parsedAnnouncement?.linkUrl || '/order',
          promoCode: currentActivePromo.promoCode || `SAVE${currentActivePromo.discountPercent}`,
          theme: (parsedAnnouncement?.theme === 'emerald' ? 'orange' : parsedAnnouncement?.theme) || 'orange',
          bgColor: (parsedAnnouncement?.bgColor && !parsedAnnouncement.bgColor.includes('065f46'))
            ? parsedAnnouncement.bgColor 
            : 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
          textColor: '#ffffff',
          showCodeBadge: true,
          showCountdown: true,
          countdownHours: 24,
          discountValue: currentActivePromo.discountPercent
        } : (parsedAnnouncement ? {
          ...parsedAnnouncement,
          theme: (parsedAnnouncement.theme === 'emerald' ? 'orange' : parsedAnnouncement.theme) || 'orange',
          bgColor: (parsedAnnouncement.bgColor && !parsedAnnouncement.bgColor.includes('065f46'))
            ? parsedAnnouncement.bgColor 
            : 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)'
        } : {
          enabled: false,
          badge: '',
          text: '',
          promoCode: '',
          linkText: '',
          linkUrl: '/order'
        });

        return {
          ...rawSettings,
          promotions: safePromotions,
          announcement: dynamicAnnouncement,
          promotionalBanner: {
            enabled: false,
            title: '',
            description: '',
            promoCode: '',
            ctaText: 'Claim Offer',
            ctaLink: '/order'
          },
          promoCodes: parsedPromoCodes || []
        };
      })(),
      pricing: configMap['pricing'] || null,
      serviceCms: {
        trust_features: configMap['trust_features'] || [],
        why_choose_us_steps: configMap['why_choose_us_steps'] || [],
        vector_format_options: configMap['vector_format_options'] || [],
        portfolio_categories: configMap['portfolio_categories'] || [],
        order_wizard_formats: configMap['order_wizard_formats'] || []
      }
    };
  } catch (err) {
    return null;
  }
}

// ============================================================
// ORDER MESSAGES (chat threads)
// ============================================================

export async function fetchOrderMessagesFromSupabase(orderId) {
  if (!isSupabaseConfigured || !orderId) return [];

  try {
    const { data, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch order messages error:', error.message);
      return [];
    }

    return (data || []).map(m => ({
      id: m.id,
      sender: m.sender_name || m.sender_email,
      senderName: m.sender_name || m.sender_email,
      senderEmail: m.sender_email,
      senderRole: m.sender_role || 'client',
      text: m.content || '',
      message: m.content || '',
      attachment: Array.isArray(m.attachments) && m.attachments.length > 0 ? m.attachments[0] : null,
      attachments: Array.isArray(m.attachments) ? m.attachments : [],
      timestamp: m.created_at
    }));
  } catch (err) {
    console.warn('Supabase fetch order messages exception:', err);
    return [];
  }
}

export async function addOrderMessageInSupabase(orderId, text, senderName, senderRole = 'client', attachments = []) {
  const msgPayload = {
    id: `msg-${Date.now()}`,
    conversation_id: `order-${orderId}`,
    order_id: orderId,
    sender: senderRole === 'admin' ? 'admin' : 'client',
    sender_name: senderName,
    text,
    attachment: attachments?.[0]?.name || null,
    timestamp: new Date().toISOString()
  };

  // Instant broadcast over WebSocket channel
  broadcastLiveMessage(msgPayload);

  try {
    const headers = await getAuthHeaders();
    await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        action: 'addMessage', 
        payload: { order_id: orderId, message: text, is_staff: senderRole === 'admin', sender_name: senderName }
      })
    });
    return { success: true };
  } catch { return { success: false }; }
}

// ============================================================
// ADMIN SESSION (server-verified via /api/admin/session)
// ============================================================

export async function verifyAdminSession(email) {
  if (!email) return { success: false, isAdmin: false };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    return { success: Boolean(json?.success), isAdmin: Boolean(json?.isAdmin), admin: json?.admin || null };
  } catch (err) {
    console.warn('Admin session verification exception:', err);
    return { success: false, isAdmin: false };
  }
}

export async function fetchAdminUsers(email) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/users', {
      method: 'GET',
      headers
    });
    const json = await res.json();
    return json?.admins || [];
  } catch (err) {
    console.warn('Fetch admin users exception:', err);
    return [];
  }
}

export async function addAdminUserInSupabase(name, email, password = null, callerEmail = null) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, email, password, callerEmail })
    });
    const json = await res.json();
    if (!json?.success) {
      return { success: false, error: json?.error || 'Failed to add admin.' };
    }
    return { success: true, admin: json.admin };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to add admin.' };
  }
}

export async function resetAdminPasswordInSupabase(email, newPassword, callerEmail = null) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ email, newPassword, callerEmail })
    });
    const json = await res.json();
    if (!json?.success) {
      return { success: false, error: json?.error || 'Failed to reset password.' };
    }
    return { success: true, message: json.message };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to reset password.' };
  }
}

export async function removeAdminUserInSupabase(email, callerEmail) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers
    });
    const json = await res.json();
    if (!json?.success) {
      return { success: false, error: json?.error || 'Failed to remove admin.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to remove admin.' };
  }
}

// ============================================================
// WALLET (server-side ledger via /api/wallet)
// ============================================================

export async function depositWalletViaApi(amount, paymentMethod = 'Card / Manual') {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'deposit', amount, paymentMethod })
    });
    const json = await res.json();
    if (!json?.success) return { success: false, error: json?.error || 'Deposit failed.' };
    return { success: true, balance: json.balance };
  } catch (err) {
    return { success: false, error: err.message || 'Deposit failed.' };
  }
}

export async function deductWalletViaApi(amount, paymentMethod = 'Studio Wallet Credit', orderId = null) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'deduct', amount, paymentMethod, orderId })
    });
    const json = await res.json();
    if (!json?.success) return { success: false, error: json?.error || 'Payment failed.' };
    return { success: true, balance: json.balance };
  } catch (err) {
    return { success: false, error: err.message || 'Payment failed.' };
  }
}

// ============================================================
// SESSION / EMAIL VERIFICATION HELPERS
// ============================================================

// Resolve the current authenticated session into a user record.
export async function getCurrentSupabaseUser() {
  if (!isSupabaseConfigured) return null;
  try {
    const sessionRes = await supabase.auth.getSession().catch(() => null);
    if (!sessionRes?.data?.session?.user) return null;
    return sessionRes.data.session.user;
  } catch {
    return null;
  }
}

// Read the authenticated user's wallet balance from the clients table.
export async function fetchWalletBalanceFromSupabase(email) {
  if (!isSupabaseConfigured || !email) return 0;
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('wallet_balance')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !data) return 0;
    return parseFloat(data.wallet_balance || 0);
  } catch {
    return 0;
  }
}


export async function addStoreProduct(product) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsert', tableName: 'store_products', payload: product })
    });
    return res.ok ? product : null;
  } catch { return null; }
}

export async function createConversation(dbConv) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'upsertConversation', payload: dbConv })
    });
    const data = await res.json();
    return data.conversation;
  } catch { return null; }
}

export async function fetchConversations(email, channel = '') {
  try {
    const headers = await getAuthHeaders();
    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    let query = cleanEmail ? `&clientEmail=${encodeURIComponent(cleanEmail)}` : '';
    if (channel) query += `&channel=${encodeURIComponent(channel)}`;
    const res = await fetch(`/api/messages?action=fetchConversations${query}`, {
      headers,
      cache: 'no-store'
    });
    const data = await res.json();
    return data.conversations || [];
  } catch { return []; }
}

export async function fetchChatMessages(chatId, email) {
  try {
    if (!chatId) return [];
    const headers = await getAuthHeaders();
    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    const query = cleanEmail ? `&clientEmail=${encodeURIComponent(cleanEmail)}` : '';
    const res = await fetch(`/api/messages?action=fetchMessages&chatId=${encodeURIComponent(chatId)}${query}`, {
      headers,
      cache: 'no-store'
    });
    const data = await res.json();
    return data.messages || [];
  } catch { return []; }
}

export function broadcastOfferStatusChange(offerId, status, offerObj = null) {
  if (!offerId) return;
  if (typeof window !== 'undefined') {
    const detail = { offerId, status, offer: offerObj };
    window.dispatchEvent(new CustomEvent('bdigi_offer_status_change', { detail }));
    try {
      const bc = new BroadcastChannel('bdigi_chat_sync');
      bc.postMessage({ type: 'offer_status_change', ...detail });
      bc.close();
    } catch {}
  }

  try {
    const channel = getSharedChatChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'offer_status_change',
        payload: { offerId, status, offer: offerObj }
      });
    }
  } catch {}
}

export async function createCustomOffer(offerPayload) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'createOffer', payload: offerPayload })
    });
    const data = await res.json();
    if (data.message) {
      broadcastLiveMessage(data.message);
    }
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function createOfferCheckoutSession(offerId, options = {}) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/boltpayouts/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'custom_offer',
        offerId,
        amount: options.amount,
        method: options.method || 'card',
        clientEmail: options.clientEmail,
        conversationId: options.conversationId,
        title: options.title,
        description: options.title
      })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function acceptCustomOffer(offerId, fallbackOffer = null) {
  try {
    broadcastOfferStatusChange(offerId, 'accepted');
    const headers = await getAuthHeaders();
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'acceptOffer', payload: { offerId, offer: fallbackOffer } })
    });
    const data = await res.json();
    if (data.message) {
      broadcastLiveMessage(data.message);
    }
    if (data.offer) {
      broadcastOfferStatusChange(offerId, data.offer.status || 'accepted', data.offer);
    }
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function declineCustomOffer(offerId, fallbackOffer = null) {
  try {
    broadcastOfferStatusChange(offerId, 'declined');
    const headers = await getAuthHeaders();
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'declineOffer', payload: { offerId, offer: fallbackOffer } })
    });
    const data = await res.json();
    if (data.message) {
      broadcastLiveMessage(data.message);
    }
    if (data.offer) {
      broadcastOfferStatusChange(offerId, data.offer.status || 'declined', data.offer);
    }
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function cancelCustomOffer(offerId, fallbackOffer = null) {
  try {
    broadcastOfferStatusChange(offerId, 'cancelled');
    const headers = await getAuthHeaders();
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'cancelOffer', payload: { offerId, offer: fallbackOffer } })
    });
    const data = await res.json();
    if (data.message) {
      broadcastLiveMessage(data.message);
    }
    if (data.offer) {
      broadcastOfferStatusChange(offerId, data.offer.status || 'cancelled', data.offer);
    }
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function payCustomOffer(offerId, orderId = null) {
  try {
    broadcastOfferStatusChange(offerId, 'paid');
    const headers = await getAuthHeaders();
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'payOffer', payload: { offerId, orderId } })
    });
    const data = await res.json();
    if (data.message) {
      broadcastLiveMessage(data.message);
    }
    if (data.offer) {
      broadcastOfferStatusChange(offerId, 'paid', data.offer);
    }
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function softDeleteChatMessage(messageId) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'deleteMessage', payload: { messageId } })
    });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchCustomOffer(offerId) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/offers?action=getOffer&offerId=${encodeURIComponent(offerId)}`, {
      headers,
      cache: 'no-store'
    });
    const data = await res.json();
    return data.offer || null;
  } catch {
    return null;
  }
}

export async function addChatMessage(chatIdOrObj, messageObj = null) {
  let targetChatId = '';
  let payload = {};

  if (typeof chatIdOrObj === 'object' && chatIdOrObj !== null && !messageObj) {
    // Called with single object: addChatMessage({ conversation_id: '...', text: '...' })
    payload = { ...chatIdOrObj };
    targetChatId = String(payload.conversation_id || payload.thread_id || payload.chatId || '');
  } else {
    // Called with (chatId, messageObj): addChatMessage('inbox-...', { text: '...' })
    targetChatId = typeof chatIdOrObj === 'string' ? chatIdOrObj : String(chatIdOrObj?.conversation_id || '');
    payload = { ...(messageObj || {}) };
  }

  const fullMsg = {
    ...payload,
    conversation_id: targetChatId,
    thread_id: targetChatId,
    type: payload.type || (payload.offer_id || payload.offer_data ? 'custom_offer' : 'text'),
    metadata: payload.metadata || {},
    timestamp: payload.timestamp || new Date().toISOString()
  };

  // Instant broadcast across all active browser windows
  broadcastLiveMessage(fullMsg);

  try {
    const headers = await getAuthHeaders();
    await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'insertMessage', payload: fullMsg })
    });
    return true;
  } catch { return false; }
}

export function getAdminThreadUnreadCount(conv, activeChatId = null) {
  if (!conv) return 0;
  if (activeChatId && (conv.id === activeChatId || (conv.clientEmail && activeChatId.includes(conv.clientEmail)))) return 0;

  const msgs = Array.isArray(conv.messages) ? conv.messages : [];
  if (msgs.length > 0) {
    const clientUnreadMsgs = msgs.filter(m => 
      (m.sender === 'client' || m.sender === 'customer' || (m.sender && m.sender !== 'admin' && m.sender !== 'support')) && 
      m.is_read !== true && 
      m.is_read !== 'true'
    );
    return clientUnreadMsgs.length;
  }

  return Number(conv.adminUnreadCount ?? conv.admin_unread_count ?? conv.unreadCount ?? conv.unread_count ?? 0);
}

export async function markConversationAsRead(chatId, role = 'admin', clientEmail = '') {
  try {
    if (!chatId) return false;
    const cleanEmail = clientEmail ? String(clientEmail).toLowerCase().trim() : '';

    if (typeof window !== 'undefined') {
      const nowTs = String(Date.now());
      if (role === 'admin') {
        localStorage.setItem('bdigi_read_admin_' + chatId, nowTs);
        if (cleanEmail) localStorage.setItem('bdigi_read_admin_chat-' + cleanEmail, nowTs);
      }
      window.dispatchEvent(new CustomEvent('bdigi_read_update', { detail: { conversation_id: chatId, role, clientEmail: cleanEmail } }));
      try {
        const bc = new BroadcastChannel('bdigi_chat_sync');
        bc.postMessage({ type: 'read_update', conversation_id: chatId, role, clientEmail: cleanEmail });
        bc.close();
      } catch {}
    }

    const channel = getSharedChatChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'conversation_update',
        payload: { 
          id: chatId, 
          unread_count: 0,
          admin_unread_count: role === 'admin' ? 0 : undefined,
          client_unread_count: role === 'client' ? 0 : undefined
        }
      });
    }

    const headers = await getAuthHeaders();
    await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        action: 'markAsRead', 
        payload: { 
          conversation_id: chatId,
          role,
          clientEmail: cleanEmail
        } 
      })
    });

    return true;
  } catch { return false; }
}

/**
 * Global Shared Supabase Realtime Hub for Live Messages & Conversations
 * Combines ultra-low-latency WebSocket Broadcast with PostgreSQL mutations replication.
 */
let globalChatChannel = null;
const messageListeners = new Set();
const conversationListeners = new Set();
const typingListeners = new Set();
const notificationListeners = new Set();
const orderListeners = new Set();

export function getSharedChatChannel() {
  if (!isSupabaseConfigured || !supabase) return null;
  if (!globalChatChannel) {
    globalChatChannel = supabase.channel('bdigitizing-live-hub-v2', {
      config: {
        broadcast: { self: true }
      }
    });

    // 1. Instant WebSocket broadcast listeners
    globalChatChannel.on('broadcast', { event: 'new_message' }, (event) => {
      if (event.payload) {
        messageListeners.forEach(listener => {
          try { listener({ eventType: 'INSERT', new: event.payload, record: event.payload }); } catch (err) {}
        });
      }
    });

    globalChatChannel.on('broadcast', { event: 'conversation_update' }, (event) => {
      if (event.payload) {
        conversationListeners.forEach(listener => {
          try { listener({ eventType: 'UPDATE', new: event.payload, record: event.payload }); } catch (err) {}
        });
      }
    });

    globalChatChannel.on('broadcast', { event: 'typing' }, (event) => {
      if (event.payload) {
        typingListeners.forEach(listener => {
          try { listener(event.payload); } catch (err) {}
        });
      }
    });

    globalChatChannel.on('broadcast', { event: 'new_notification' }, (event) => {
      if (event.payload) {
        notificationListeners.forEach(listener => {
          try { listener({ eventType: 'INSERT', new: event.payload, record: event.payload }); } catch (err) {}
        });
      }
    });

    // 2. Postgres replication listeners
    globalChatChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        messageListeners.forEach(listener => {
          try { listener(payload); } catch (err) {}
        });
      }
    );

    globalChatChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations' },
      (payload) => {
        conversationListeners.forEach(listener => {
          try { listener(payload); } catch (err) {}
        });
      }
    );

    globalChatChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      (payload) => {
        notificationListeners.forEach(listener => {
          try { listener(payload); } catch (err) {}
        });
      }
    );

    globalChatChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        orderListeners.forEach(listener => {
          try { listener(payload); } catch (err) {}
        });
      }
    );

    globalChatChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'custom_offers' },
      (payload) => {
        const record = payload.new || payload.record;
        if (record?.id) {
          broadcastOfferStatusChange(record.id, record.status, record);
        }
      }
    );

    globalChatChannel.on('broadcast', { event: 'offer_status_change' }, (event) => {
      if (event.payload && event.payload.offerId && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_offer_status_change', { detail: event.payload }));
      }
    });

    globalChatChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Channel connected
      }
    });
  }
  return globalChatChannel;
}

export function broadcastLiveMessage(messagePayload) {
  if (!messagePayload) return;

  // 1. Instantly trigger all active listeners in the current tab/window
  messageListeners.forEach(listener => {
    try { listener({ eventType: 'INSERT', new: messagePayload, record: messagePayload }); } catch (err) {}
  });

  // 2. Broadcast across WebSocket channel to all other tabs/devices
  try {
    const channel = getSharedChatChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: messagePayload
      });
    }
  } catch (err) {
    console.warn('Broadcast live message notice:', err);
  }
}

export function broadcastLiveNotification(notificationPayload) {
  if (!notificationPayload) return;

  notificationListeners.forEach(listener => {
    try { listener({ eventType: 'INSERT', new: notificationPayload, record: notificationPayload }); } catch (err) {}
  });

  try {
    const channel = getSharedChatChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: notificationPayload
      });
    }
  } catch (err) {
    console.warn('Broadcast live notification notice:', err);
  }
}

export function broadcastTypingStatus(conversationId, senderName, senderRole, isTyping = true) {
  try {
    const channel = getSharedChatChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversationId,
          senderName,
          senderRole,
          isTyping,
          timestamp: Date.now()
        }
      });
    }
  } catch (err) {
    console.warn('Broadcast typing status notice:', err);
  }
}

export function subscribeToTypingStatus(onTypingChange) {
  if (onTypingChange) typingListeners.add(onTypingChange);
  getSharedChatChannel();
  return () => {
    if (onTypingChange) typingListeners.delete(onTypingChange);
  };
}

export function subscribeToLiveMessages(onMessageChange, onConversationChange) {
  if (onMessageChange) messageListeners.add(onMessageChange);
  if (onConversationChange) conversationListeners.add(onConversationChange);

  getSharedChatChannel();

  return () => {
    if (onMessageChange) messageListeners.delete(onMessageChange);
    if (onConversationChange) conversationListeners.delete(onConversationChange);
  };
}

export function subscribeToNotificationListeners(onNotificationChange) {
  if (onNotificationChange) notificationListeners.add(onNotificationChange);
  getSharedChatChannel();
  return () => {
    if (onNotificationChange) notificationListeners.delete(onNotificationChange);
  };
}

export function subscribeToOrders(onOrderChange) {
  if (onOrderChange) orderListeners.add(onOrderChange);
  getSharedChatChannel();
  return () => {
    if (onOrderChange) orderListeners.delete(onOrderChange);
  };
}

export async function fetchNotificationsFromSupabase(userEmail = '') {
  try {
    const headers = await getAuthHeaders();
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    const url = `/api/messages?action=fetchNotifications${cleanEmail ? `&email=${encodeURIComponent(cleanEmail)}` : ''}`;
    const res = await fetch(url, {
      headers,
      cache: 'no-store'
    });
    const data = await res.json();
    return data.notifications || [];
  } catch { return []; }
}

/**
 * Subscribe to live notifications from the shared Supabase Realtime channel.
 * Calls onNewNotification(payload) on both INSERT and UPDATE events.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToNotifications({ onNewNotification, onNotificationUpdate, userEmail, isAdmin = false } = {}) {
  const handler = (payload) => {
    if (!payload) return;
    const notif = payload.new || payload.record || payload;
    if (!notif) return;

    // Verify recipient permissions strictly
    if (isAdmin) {
      if (notif.recipient_role !== 'admin' && notif.recipient_role !== 'all' && notif.recipient_role) {
        return;
      }
    } else {
      const recipientEmail = (notif.recipient_email || notif.client_email || notif.clientEmail || '').toLowerCase().trim();
      const thisEmail = (userEmail || '').toLowerCase().trim();
      
      // If notification is explicitly for admin only, do not show to client
      if (notif.recipient_role === 'admin') return;

      // If notification has a specific recipient email, it MUST match this client's email
      if (recipientEmail && thisEmail && recipientEmail !== thisEmail) return;

      // If notification is role-specific to client, require email match if email is present
      if (notif.recipient_role === 'client' && recipientEmail && recipientEmail !== thisEmail) return;
    }

    if (payload.eventType === 'UPDATE') {
      if (typeof onNotificationUpdate === 'function') {
        onNotificationUpdate(notif);
      } else if (typeof onNewNotification === 'function') {
        onNewNotification(notif);
      }
    } else if (typeof onNewNotification === 'function') {
      onNewNotification(notif);
    }
  };

  notificationListeners.add(handler);
  getSharedChatChannel();

  return () => {
    notificationListeners.delete(handler);
  };
}

export async function createNotificationInSupabase(notif) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'createNotification', payload: notif })
    });
    const data = await res.json();
    const result = data.notification || notif;
    broadcastLiveNotification(result);
    return result;
  } catch {
    broadcastLiveNotification(notif);
    return notif;
  }
}

export async function markNotificationAsReadInSupabase(id) {
  try {
    if (!id) return false;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_notif_read_update', { detail: { id, read: true } }));
      try {
        const bc = new BroadcastChannel('bdigi_notifs_sync');
        bc.postMessage({ type: 'mark_read', id });
        bc.close();
      } catch {}
    }

    const headers = await getAuthHeaders();
    await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'markNotificationRead', payload: { id } })
    });
    return true;
  } catch { return false; }
}

export async function markAllNotificationsAsReadInSupabase() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_notif_read_update', { detail: { all: true, read: true } }));
      try {
        const bc = new BroadcastChannel('bdigi_notifs_sync');
        bc.postMessage({ type: 'mark_all_read' });
        bc.close();
      } catch {}
    }

    const headers = await getAuthHeaders();
    await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'markAllNotificationsRead', payload: {} })
    });
    return true;
  } catch { return false; }
}

// ============================================================
// META PIXEL / TRACKING LOGS
// ============================================================

export async function logTrackingEventToSupabase(eventData) {
  try {
    await fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logEvent', payload: eventData })
    });
  } catch (e) {
    console.warn('Could not log tracking event', e);
  }
}

export async function fetchTrackingEventsFromSupabase() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('tracking_events')
      .select('*')
      .order('event_time', { ascending: false })
      .limit(100);
      
    if (error) {
      console.warn('Supabase fetch tracking events error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch tracking events exception:', err);
    return [];
  }
}

// ============================================================
// MEDIA ASSETS / STORAGE BUCKET MANAGEMENT
// ============================================================

export async function fetchMediaAssetsFromSupabase() {
  try {
    const portRes = await fetch('/api/catalog?action=fetchAll');
    const data = await portRes.json();
    return { portfolio: data.portfolio || [], sew_outs: data.sew_outs || [] };
  } catch {
    return { portfolio: [], sew_outs: [] };
  }
}

// Helper to upload files directly to Cloudinary / Supabase Storage and return full details (url, public_id, size)
export async function uploadFileToCloudinaryFull(fileObj, bucketName = 'client-uploads', folderPath = 'artwork', onProgress) {
  if (!fileObj) return null;

  // 1. Dispatch global start event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('upload:start', { detail: { fileName: fileObj.name } }));
  }

  // Attempt 1: Direct Cloudinary Upload via Signed Request with auto resource type
  try {
    const sigRes = await fetch(`/api/cloudinary/signature?folder=${encodeURIComponent(folderPath)}`);
    if (sigRes.ok) {
      const sigData = await sigRes.json();
      if (sigData.success && sigData.signature && sigData.cloud_name) {
        const formData = new FormData();
        formData.append('file', fileObj);
        formData.append('folder', folderPath);
        formData.append('api_key', sigData.api_key);
        formData.append('timestamp', sigData.timestamp);
        formData.append('signature', sigData.signature);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/auto/upload`;
        
        const data = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', cloudinaryUrl, true);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('upload:progress', { 
                  detail: { progress: percent, fileName: fileObj.name } 
                }));
              }
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.responseText));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
          xhr.send(formData);
        });

        if (data && (data.secure_url || data.url)) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('upload:end', { detail: { fileName: fileObj.name, success: true } }));
          }
          return {
            name: fileObj.name,
            url: data.secure_url || data.url,
            public_id: data.public_id || data.secure_url,
            size: `${(fileObj.size / (1024 * 1024)).toFixed(2)} MB`,
            format: fileObj.name?.split('.').pop() || 'png'
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Cloudinary Direct Upload Notice] Direct upload notice:', err.message);
  }

  // Attempt 2: Server-side Supabase Storage Fallback via /api/cloudinary/upload
  try {
    const serverFormData = new FormData();
    serverFormData.append('file', fileObj);
    serverFormData.append('folder', folderPath);
    serverFormData.append('bucket', bucketName || 'client-uploads');

    const authHeaders = await getAuthHeaders().catch(() => ({}));
    const headers = {};
    if (authHeaders.Authorization) {
      headers.Authorization = authHeaders.Authorization;
    }

    const serverRes = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: serverFormData
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.success && (serverData.url || serverData.secure_url)) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('upload:end', { detail: { fileName: fileObj.name, success: true } }));
        }
        return {
          name: fileObj.name,
          url: serverData.url || serverData.secure_url,
          public_id: serverData.public_id || serverData.url,
          size: `${(fileObj.size / (1024 * 1024)).toFixed(2)} MB`,
          format: fileObj.name?.split('.').pop() || 'png'
        };
      }
    }
  } catch (storageErr) {
    console.warn('[Storage Fallback Notice] Server storage upload notice:', storageErr.message);
  }

  // Attempt 3: Client Data URL Fallback so the logo/file is NEVER lost
  try {
    const base64Url = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileObj);
    });

    if (base64Url) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('upload:end', { detail: { fileName: fileObj.name, success: true } }));
      }
      return {
        name: fileObj.name,
        url: base64Url,
        public_id: `local_${Date.now()}`,
        size: `${(fileObj.size / (1024 * 1024)).toFixed(2)} MB`,
        format: fileObj.name?.split('.').pop() || 'png'
      };
    }
  } catch (base64Err) {
    console.error('[Upload Fallback Error]', base64Err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('upload:end', { detail: { fileName: fileObj.name, success: false } }));
  }
  return null;
}

// CMS Helper
export async function getCmsContent(key) {
  try {
    const res = await fetch(`/api/cms?action=fetchContent&key=${key}`);
    const data = await res.json();
    return data.content || null;
  } catch { return null; }
}

export async function saveCmsContent(key, content) {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, content })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

