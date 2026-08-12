import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { getSiteUrl } from '../utils/siteUrl';

export { isSupabaseConfigured };

/**
 * Service layer for Supabase Database, Auth & Storage Operations.
 */

// ============================================================
// ORDER LIFECYCLE STATE MACHINE
// ============================================================

export const ORDER_STATUSES = {
  AWAITING_PAYMENT: 'awaiting_payment',
  SUBMITTED: 'submitted',
  IN_PROGRESS: 'in_progress',
  DIGITIZING: 'digitizing',
  ASSIGNED: 'assigned',
  QC: 'qc',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  REVISION: 'revision',
  CANCELLED: 'cancelled'
};

// Valid status transitions: { currentStatus: [allowedNextStatuses] }
const VALID_TRANSITIONS = {
  [ORDER_STATUSES.AWAITING_PAYMENT]: [ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SUBMITTED]: [ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.IN_PROGRESS]: [ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.QC, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DIGITIZING]: [ORDER_STATUSES.QC, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.ASSIGNED]: [ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.QC, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.QC]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.REVISION],
  [ORDER_STATUSES.REVISION]: [ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DIGITIZING, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.COMPLETED]: [], // Terminal state
  [ORDER_STATUSES.CANCELLED]: []  // Terminal state
};

export function validateStatusTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) {
    // Unknown current status — allow the transition (backward compat)
    console.warn(`[Order Lifecycle] Unknown current status '${currentStatus}', allowing transition to '${newStatus}'.`);
    return true;
  }
  if (allowed.length === 0) {
    console.warn(`[Order Lifecycle] Cannot transition from terminal status '${currentStatus}'.`);
    return false;
  }
  if (!allowed.includes(newStatus)) {
    console.warn(`[Order Lifecycle] Invalid transition: '${currentStatus}' → '${newStatus}'. Allowed: [${allowed.join(', ')}]`);
    return false;
  }
  return true;
}

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


// Helper to upload files to Cloudinary securely via backend
export async function uploadFileToCloudinary(fileObj, bucketName = 'client-uploads', folderPath = 'artwork') {
  return uploadFileToSupabaseStorage(fileObj, bucketName, folderPath);
}

// Upload file natively to Supabase Storage via backend route
export async function uploadFileToSupabaseStorage(fileObj, bucketName = 'portfolio-images', folderPath = 'showcase') {
  if (!fileObj) return null;
  try {
    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('bucket', bucketName);
    formData.append('folder', folderPath);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      console.warn('Supabase storage upload error:', await res.text());
      return null;
    }

    const data = await res.json();
    if (!data.success) {
      console.warn('Supabase storage upload failed:', data.error);
      return null;
    }

    return data.url;
  } catch (err) {
    console.warn('Supabase storage exception:', err);
    return null;
  }
}

// Fetch all orders from Supabase DB
export async function fetchOrdersFromSupabase() {
  try {
    const res = await fetch('/api/orders?action=fetchAll');
    const data = await res.json();
    const orders = data.orders || [];
    
    // Map snake_case database columns back to camelCase frontend properties
    return orders.map(order => {
      let notesData = {};
      try {
        if (order.notes) {
          notesData = JSON.parse(order.notes);
        }
      } catch (e) {
        notesData.notes = order.notes;
      }
      
      const allFiles = order.order_files || [];
      const clientFiles = allFiles.filter(f => f.file_type === 'client_artwork').map(f => ({
        id: f.id,
        name: f.file_name,
        format: f.file_format,
        url: f.public_url || f.file_url,
        public_id: f.file_path,
        uploadedAt: f.created_at
      }));
      
      const machineFiles = allFiles.filter(f => f.file_type === 'machine_file').map(f => ({
        id: f.id,
        name: f.file_name,
        format: f.file_format,
        url: f.public_url || f.file_url,
        public_id: f.file_path,
        uploadedAt: f.created_at
      }));

      return {
        ...order,
        clientName: order.client_name,
        clientEmail: order.client_email,
        serviceCategory: order.service_category,
        uploadedFiles: clientFiles,
        uploadedMachineFiles: machineFiles,
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
        notes: notesData.notes || ''
      };
    });
  } catch { return []; }
}

// Create new Order in Supabase DB & Storage
export async function createOrderInSupabase(newOrder) {
  try {
    const rawFiles = newOrder.uploadedFiles || [];
    const orderFiles = rawFiles.map(file => ({
      order_id: newOrder.id,
      file_name: file.original_filename || file.name || 'unnamed_file',
      file_format: file.format || 'unknown',
      file_type: 'client_artwork',
      bucket_name: 'cloudinary',
      file_path: file.public_id || file.url || 'unknown',
      public_url: file.url,
      file_url: file.url
    }));

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', payload: { orderId, newStatus, extraData } })
    });
    return true;
  } catch { return false; }
}

// Add Revision Request in Supabase DB
export async function addRevisionInSupabase(orderId, note, requestedBy = 'Client') {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'requestRevision', payload: { orderId, instructions: note, requestedBy } })
    });
    return { success: true };
  } catch { return { success: false }; }
}

export async function cancelOrderInSupabase(orderId) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancelOrder', payload: { orderId } })
    });
    return true;
  } catch { return false; }
}

export async function deleteOrderInSupabase(orderId) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteOrder', payload: { orderId } })
    });
    return true;
  } catch { return false; }
}

// Upsert Client Profile in Supabase DB (Automatic Save on Login & Order Submission)
export async function upsertClientInSupabase(userData) {
  try {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch('/api/clients?action=fetchAll');
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
  if (!isSupabaseConfigured || !key) return false;

  try {
    const { error } = await supabase
      .from('site_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.warn(`Supabase upsert site_config [${key}] warning:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Supabase upsert site_config [${key}] exception:`, err);
    return false;
  }
}

// Upsert array of catalog items to a dedicated table
export async function upsertCatalogDataToSupabase(tableName, dataArray) {
  if (!isSupabaseConfigured || !tableName || !Array.isArray(dataArray)) return false;

  try {
    // 1. Identify valid existing IDs to KEEP
    const validExistingIds = dataArray
      .filter(item => item.id && !(typeof item.id === 'string' && item.id.includes('-')))
      .map(item => item.id);

    // 2. Delete rows that are no longer in our list
    if (validExistingIds.length > 0) {
      const { error: delError } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'in', `(${validExistingIds.join(',')})`);
      if (delError) console.warn(`Supabase delete ${tableName} warning:`, delError.message);
    } else {
      // If we have no existing IDs to keep, delete all rows
      const { error: delError } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'is', null);
      if (delError) console.warn(`Supabase delete all ${tableName} warning:`, delError.message);
    }

    // If there's nothing to insert/update, we're done
    if (dataArray.length === 0) {
      return true;
    }

    // 3. Prepare payload for upsert
    const payload = dataArray.map(item => {
      const newItem = {
        ...item,
        updated_at: new Date().toISOString()
      };
      // Remove temporary frontend IDs so Supabase can auto-generate the real ID
      if (typeof newItem.id === 'string' && newItem.id.includes('-')) {
        delete newItem.id;
      }
      return newItem;
    });
    
    // 4. Upsert the data
    const { error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn(`Supabase upsert ${tableName} warning:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Supabase sync ${tableName} exception:`, err);
    return false;
  }
}

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
    const res = await fetch('/api/admin/cms/hero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    });
    return res.ok;
  } catch { return false; }
};
export const upsertPricingTiers = (data) => upsertCatalogDataToSupabase('pricing_cards', data);
export const upsertPortfolioItems = async (data) => {
  try {
    const dbPayload = data.map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      category: item.category || 'general',
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
    const res = await fetch('/api/admin/cms/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    });
    return res.ok;
  } catch { return false; }
};
export const upsertPatchCards = (data) => upsertCatalogDataToSupabase('patch_cards', data);
export const upsertFaqs = async (data) => {
  try {
    const res = await fetch('/api/admin/cms/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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
    const res = await fetch('/api/admin/cms/sewouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    });
    return res.ok;
  } catch { return false; }
};

export const upsertTestimonials = async (data) => {
  try {
    const res = await fetch('/api/admin/cms/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
};

export const upsertDigitizers = async (data) => {
  try {
    const res = await fetch('/api/admin/cms/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
};

export async function upsertPricingTier(tierData) {
  try {
    const payload = { ...tierData, updated_at: new Date().toISOString() };
    if (!payload.id) delete payload.id;
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', tableName: 'pricing_tiers', payload })
    });
    return res.ok;
  } catch (err) {
    console.warn('upsertPricingTier exception:', err);
    return false;
  }
}

export async function deletePricingTier(tierId) {
  try {
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch('/api/admin/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateSettings', payload: payloadArray })
    });
    const json = await res.json();
    return { success: json.success || false };
  } catch (err) {
    console.warn('Update home page settings exception:', err);
    return { success: false, error: err.message };
  }
}

export async function upsertHomePageTableRow(table, data) {
  try {
    const res = await fetch('/api/admin/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsertTableRow', payload: { table, data } })
    });
    const json = await res.json();
    return { success: json.success || false };
  } catch (err) {
    console.warn('Upsert home page table row exception:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteHomePageTableRow(table, id) {
  try {
    const res = await fetch('/api/admin/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteTableRow', payload: { table, id } })
    });
    const json = await res.json();
    return { success: json.success || false };
  } catch (err) {
    console.warn('Delete home page table row exception:', err);
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
    const res = await fetch('/api/catalog?action=fetchAll');
    const data = await res.json();
    
    // Parse site_config array into a map
    const siteConfig = data.site_config || [];
    const configMap = {};
    siteConfig.forEach(item => {
      configMap[item.key] = item.value;
    });

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
      heroSlides: data.hero_slides || [],
      pricingCards: data.pricing_cards || [],
      heroGlobalSettings: configMap['hero_global_settings'] || null,
      heroServiceText: configMap['hero_service_text'] || null,
      siteSettings: configMap['site_settings'] || null,
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
}

// ============================================================
// ADMIN SESSION (server-verified via /api/admin/session)
// ============================================================

export async function verifyAdminSession(email) {
  if (!email) return { success: false, isAdmin: false };

  try {
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch('/api/admin/users', {
      method: 'GET',
      headers: { 'x-admin-email': email || '' }
    });
    const json = await res.json();
    return json?.admins || [];
  } catch (err) {
    console.warn('Fetch admin users exception:', err);
    return [];
  }
}

export async function addAdminUserInSupabase(name, email, callerEmail) {
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, callerEmail })
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

export async function removeAdminUserInSupabase(email, callerEmail) {
  try {
    const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { 'x-admin-email': callerEmail || '' }
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
    const sessionRes = await supabase.auth.getSession().catch(() => null);
    const token = sessionRes?.data?.session?.access_token;
    if (!token) return { success: false, error: 'Not authenticated.' };

    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
    const sessionRes = await supabase.auth.getSession().catch(() => null);
    const token = sessionRes?.data?.session?.access_token;
    if (!token) return { success: false, error: 'Not authenticated.' };

    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', tableName: 'store_products', payload: product })
    });
    return res.ok ? product : null;
  } catch { return null; }
}

export async function createConversation(dbConv) {
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsertConversation', payload: dbConv })
    });
    const data = await res.json();
    return data.conversation;
  } catch { return null; }
}

export async function fetchConversations() {
  try {
    const res = await fetch('/api/messages?action=fetchConversations');
    const data = await res.json();
    return data.conversations || [];
  } catch { return []; }
}

export async function addChatMessage(chatId, messageObj) {
  try {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'insertMessage', payload: messageObj })
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

// Helper to upload files directly to Cloudinary and return full details (url, public_id, size)
export async function uploadFileToCloudinaryFull(fileObj, bucketName = 'client-uploads', folderPath = 'artwork', onProgress) {
  if (!fileObj) return null;

  try {
    // 1. Dispatch global start event
    window.dispatchEvent(new CustomEvent('upload:start', { detail: { fileName: fileObj.name } }));

    // 2. Get upload signature from our fast Next.js backend
    const sigRes = await fetch(`/api/cloudinary/signature?folder=${encodeURIComponent(folderPath)}`);
    if (!sigRes.ok) {
      console.error('[Cloudinary Signature Error] Failed to fetch signature. Ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set correctly.');
      throw new Error('Failed to fetch signature');
    }
    const sigData = await sigRes.json();
    
    if (!sigData.success) {
      console.error('[Cloudinary Signature Error] Signature API returned failure:', sigData.error);
      throw new Error(sigData.error || 'Failed to sign upload');
    }

    // 3. Prepare FormData for direct Cloudinary upload
    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('folder', folderPath);
    formData.append('api_key', sigData.api_key);
    formData.append('timestamp', sigData.timestamp);
    formData.append('signature', sigData.signature);

    // 4. Upload directly to Cloudinary using XHR to track progress
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`;
    
    const data = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', cloudinaryUrl, true);

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          if (onProgress) onProgress(percentComplete);
          
          window.dispatchEvent(new CustomEvent('upload:progress', { 
            detail: { progress: percentComplete, fileName: fileObj.name } 
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });

    // 5. Dispatch global end event
    window.dispatchEvent(new CustomEvent('upload:end', { detail: { fileName: fileObj.name, success: true } }));

    return {
      name: fileObj.name,
      url: data.secure_url,
      public_id: data.public_id,
      size: `${(fileObj.size / (1024 * 1024)).toFixed(2)} MB`
    };
  } catch (err) {
    console.error(`[Cloudinary Direct Upload Error] The upload process for "${fileObj.name}" failed. Details:`, err.message || err);
    console.error('Please verify your internet connection, Cloudinary environment variables, and ensure the Cloudinary service is accessible.');
    window.dispatchEvent(new CustomEvent('upload:end', { detail: { fileName: fileObj.name, success: false } }));
    return null;
  }
}

// CMS Helper
export async function getCmsContent(key) {
  try {
    const res = await fetch(`/api/cms?action=fetchContent&key=${key}`);
    const data = await res.json();
    return data.content || null;
  } catch { return null; }
}

