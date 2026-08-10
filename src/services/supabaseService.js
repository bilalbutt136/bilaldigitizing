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
  if (!fileObj) return null;

  try {
    const formData = new FormData();
    formData.append('file', fileObj);
    if (folderPath) {
      formData.append('folder', folderPath);
    }

    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Cloudinary secure upload error:', errorData);
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      console.warn('Cloudinary secure upload failed:', data.error);
      return null;
    }

    // The backend returns a permanently signed delivery URL for the authenticated asset
    console.log("Uploaded Secure File to Cloudinary. Public ID:", data.public_id);
    return data.url;
  } catch (err) {
    console.warn('Cloudinary upload exception:', err);
    return null;
  }
}

// Fetch all orders from Supabase DB
export async function fetchOrdersFromSupabase() {
  try {
    const res = await fetch('/api/orders?action=fetchAll');
    const data = await res.json();
    return data.orders || [];
  } catch { return []; }
}

// Create new Order in Supabase DB & Storage
export async function createOrderInSupabase(newOrder) {
  if (!isSupabaseConfigured) return null;

  try {
    let uploadedArtworkUrl = newOrder.artworkUrl || newOrder.image_url || newOrder.logo || newOrder.file_url || '';

    // Attach the authenticated user id (auth.users) for RLS ownership
    const sessionRes = await supabase.auth.getSession().catch(() => null);
    const currentUserId = sessionRes?.data?.session?.user?.id || null;

    // Upload artwork to Supabase Storage if dataURL or file
    if (uploadedArtworkUrl && uploadedArtworkUrl.startsWith('data:')) {
      const storageUrl = await uploadFileToCloudinary(
        uploadedArtworkUrl,
        'client-uploads',
        'artwork'
      );
      if (storageUrl) uploadedArtworkUrl = storageUrl;
    }

    const resolvedCategory = newOrder.serviceCategory || newOrder.serviceType || newOrder.type || newOrder.title || 'Embroidery Digitizing';
    const resolvedName = newOrder.clientName || 'Valued Client';
    const resolvedEmail = newOrder.clientEmail || 'client@bdigitizing.pro';
    const resolvedTitle = newOrder.title || `${resolvedCategory} Order`;
    const resolvedPrice = parseFloat(newOrder.price || newOrder.totalPrice || 15.00);

    const primaryDbRow = {
      id: newOrder.id,
      user_id: currentUserId,
      client_email: resolvedEmail,
      client_name: resolvedName,
      service_category: resolvedCategory,
      service_type: newOrder.serviceType || resolvedCategory,
      title: resolvedTitle,
      payment_status: newOrder.paymentStatus || 'unpaid',
      price: resolvedPrice,
      status: newOrder.status || 'pending',
      fabric_type: newOrder.fabricType || 'Cotton Pique Polo',
      placement_type: newOrder.placementType || 'Left Chest / Polo',
      notes: newOrder.notes || '',
      colors_count: newOrder.colorsCount || 4,
      estimated_stitches: newOrder.estimatedStitches || 12400,
      is_rush: Boolean(newOrder.isRush),
      dimensions: newOrder.dimensions || { unit: 'inches', width: null, height: null },
      requested_formats: newOrder.requestedFormats || ['dst'],
      artwork_url: uploadedArtworkUrl
    };

    console.log("Saving Order Payload to Supabase DB:", primaryDbRow);

    const { data, error } = await supabase.from('orders').insert([primaryDbRow]).select();
    if (error) {
      console.error('[Supabase Order Insert Error]:', error.message, error.details, error.hint, error);
      throw error;
    } else {
      console.log('[Supabase Order Insert Success]: Order saved successfully in DB!', data);
    }

    // Record artwork file entry in order_files table
    try {
      if (newOrder.rawFiles && newOrder.rawFiles.length > 0) {
        for (const rawFile of newOrder.rawFiles) {
          if (!rawFile) continue;
          
          const storageUrl = await uploadFileToCloudinary(
            rawFile,
            'client-uploads',
            `artwork/${newOrder.id}`
          );
          
          if (storageUrl) {
            const fileName = rawFile.name || `artwork_${Date.now()}.png`;
            const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : 'png';
            
            const fileRow = {
              order_id: newOrder.id,
              file_name: fileName,
              file_url: storageUrl,
              file_type: 'client_artwork',
              file_size: rawFile.size || 0,
              uploaded_by: newOrder.clientEmail || 'client',
              storage_path: `artwork/${newOrder.id}`
            };
            
            // Re-assign uploadedArtworkUrl to the first uploaded file just as a fallback
            if (!uploadedArtworkUrl) uploadedArtworkUrl = storageUrl;
            
            const { error: fileErr } = await supabase.from('order_files').insert([fileRow]);
            if (fileErr) {
              console.warn('[Supabase Order File Insert Error]:', fileErr.message);
            }
          }
        }
      } else {
        // Fallback for single data URL or empty
        const fileRow = {
          order_id: newOrder.id,
          file_name: newOrder.artworkFileName || `${newOrder.id}_artwork.png`,
          file_url: uploadedArtworkUrl || '',
          file_type: 'client_artwork',
          file_size: 0,
          uploaded_by: newOrder.clientEmail || 'client',
          storage_path: `artwork/${newOrder.id}`
        };
        const { error: fileErr } = await supabase.from('order_files').insert([fileRow]);
        if (fileErr) console.warn('[Supabase Order File Insert Error]:', fileErr.message);
      }
    } catch (fErr) {
      console.warn('[Supabase Order File Insert Exception]:', fErr);
    }

    return { success: true, artworkUrl: uploadedArtworkUrl };
  } catch (err) {
    console.error('[Supabase Create Order Exception]:', err);
    return { success: false, error: err.message };
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
      image: item.image || item.digitizedImage || item.digitized_image || item.afterImg || item.after_img || '',
      stitch_count: item.stitchCount !== undefined ? item.stitchCount : item.stitch_count,
      dimensions: item.dimensions || '',
      colors: item.colors || '',
      turnaround: item.turnaround || '',
      tags: item.tags || [],
      featured: item.featured || false,
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== undefined ? item.is_active : true
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
      ...item,
      before_img: item.beforeImg,
      after_img: item.afterImg,
      sort_order: item.sortOrder
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
// CATALOG (DB-driven; replaces mock catalog defaults)
// ============================================================

// Fetch the full public catalog from Supabase (services, pricing tiers,
// patch cards, store products, portfolio items, sew outs, hero slides, digitizers,
// and the cms_content key/value store). Returns null when not configured.
export async function fetchCatalogFromSupabase() {
  if (!isSupabaseConfigured) return null;

  try {
    const [services, pricingTiers, patchCards, storeProducts, portfolioItems, sewOuts, heroSlides, digitizers, cmsContent, dynamicPricingTiers, faqs, testimonials] =
      await Promise.all([
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('pricing_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('patch_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('store_products').select('*').order('sort_order', { ascending: true }),
        supabase.from('portfolio').select('*').order('sort_order', { ascending: true }),
        supabase.from('sew_outs').select('*').order('sort_order', { ascending: true }),
        supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }),
        supabase.from('digitizers').select('*').order('sort_order', { ascending: true }),
        supabase.from('site_config').select('key, value'),
        supabase.from('pricing_tiers').select('*').order('display_order', { ascending: true }),
        supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false })
      ]);

    const mapServices = (rows) => (rows || []).map(s => ({
      id: s.id,
      title: s.title,
      price: s.price,
      stitches: s.stitches,
      time: s.time,
      icon: s.icon,
      route: s.route,
      desc: s.description
    }));

    const mapCards = (rows) => (rows || []).map(c => ({
      id: c.id,
      category: c.category,
      title: c.title,
      rate: c.rate,
      unit: c.unit,
      badge: c.badge,
      popular: c.popular,
      highlight: c.highlight,
      features: c.features || []
    }));

    const configMap = {};
    (cmsContent.data || []).forEach(item => { configMap[item.key] = item.value; });

    return {
      servicesList: mapServices(services.data),
      pricingCards: mapCards(pricingTiers.data),
      dynamicPricingTiers: dynamicPricingTiers.data || [],
      patchCards: mapCards(patchCards.data),
      storeProducts: (storeProducts.data || []).map(p => ({
        id: p.id,
        category: p.category,
        title: p.title,
        price: p.price,
        unit: p.unit,
        minQuantity: p.min_quantity,
        badge: p.badge,
        status: p.status,
        image: p.image,
        description: p.description,
        sizes: p.sizes || [],
        colors: p.colors || [],
        features: p.features || []
      })),
      portfolioSamples: (portfolioItems.data || []).map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        stitchCount: p.stitch_count,
        colors: p.colors,
        originalImage: p.original_image,
        digitizedImage: p.digitized_image,
        beforeImg: p.before_img,
        afterImg: p.after_img,
        clientType: p.client_type,
        formats: p.formats,
        description: p.description
      })),
      sewOuts: (sewOuts.data || []).map(s => ({
        id: s.id,
        title: s.title,
        category: s.category,
        beforeImg: s.before_img,
        afterImg: s.after_img,
        stitchCount: s.stitch_count,
        formats: s.formats,
        features: s.features || []
      })),
      heroSlides: (heroSlides.data || []).map(h => ({
        id: h.id,
        serviceKey: h.service_key,
        badge: h.badge,
        title: h.title,
        highlight: h.highlight,
        description: h.description,
        rateLabel: h.rate_label,
        primaryCta: h.primary_cta,
        secondaryCta: h.secondary_cta,
        bannerImage: h.banner_image,
        trustPoints: h.trust_points || [],
        label: h.label,
        previewTitle: h.preview_title,
        previewBefore: h.preview_before,
        previewAfter: h.preview_after,
        previewTag: h.preview_tag,
        previewTagAfter: h.preview_tag_after
      })),
      digitizers: (digitizers.data || []).map(d => ({
        id: d.id,
        name: d.name,
        role: d.role,
        rating: d.rating,
        activeJobs: d.active_jobs,
        avatar: d.avatar
      })),
      faqs: (faqs.data || []).map(f => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category,
        sort_order: f.sort_order,
        is_active: f.is_active
      })),
      testimonials: (testimonials.data || []).map(t => ({
        id: t.id,
        client_name: t.client_name,
        company: t.company,
        review_text: t.review_text,
        rating: t.rating,
        avatar: t.avatar,
        is_active: t.is_active
      })),
      siteConfig: configMap,
      siteSettings: configMap.site_settings || null,
      heroGlobalSettings: configMap.hero_global_settings || null,
      pricing: configMap.pricing || null,
      serviceCms: configMap.service_cms || null
    };
  } catch (err) {
    console.warn('Supabase fetch catalog exception:', err);
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
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('store_products').insert([{
      id: product.id,
      category: product.category,
      title: product.title,
      price: product.price,
      unit: product.unit || '',
      min_quantity: product.minQuantity || 1,
      badge: product.badge || '',
      status: product.status || 'active',
      image: product.image || '',
      description: product.description || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      features: product.features || []
    }]).select();
    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error adding store product:', err);
    return null;
  }
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
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('tracking_events').insert([{
      event_name: eventData.eventName || 'PageView',
      user_role: eventData.userRole || 'Visitor',
      source: eventData.source || 'Visitor browser',
      traffic_source: eventData.trafficSource || 'Direct',
      value: eventData.value || '—',
      page_path: eventData.pagePath || '/'
    }]);
    if (error) {
      console.warn('Supabase tracking event insert error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase tracking event exception:', err);
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
  if (!isSupabaseConfigured) return [];
  try {
    const assets = [];

    // 1. Fetch from storage buckets (client-uploads, order-assets)
    try {
      const { data: uploadFiles } = await supabase.storage.from('client-uploads').list('', { limit: 100 });
      if (uploadFiles && uploadFiles.length > 0) {
        for (const file of uploadFiles) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          const { data: publicUrlData } = supabase.storage.from('client-uploads').getPublicUrl(file.name);
          assets.push({
            id: `upload-${file.id || file.name}`,
            name: file.name,
            category: 'Uploaded Asset',
            url: publicUrlData.publicUrl,
            size: file.metadata?.size ? `${(file.metadata.size / (1024 * 1024)).toFixed(2)} MB` : '1.0 MB',
            createdAt: file.created_at
          });
        }
      }
    } catch (e) {
      console.warn('Storage client-uploads list notice:', e.message);
    }

    // 2. Fetch live media from portfolio table
    try {
      const { data: portData } = await supabase.from('portfolio').select('id, title, category, original_image, digitized_image, created_at');
      if (portData) {
        portData.forEach(p => {
          if (p.original_image) {
            assets.push({
              id: `port-orig-${p.id}`,
              name: `${p.title || 'Artwork'} (Original)`,
              category: 'Portfolio Before',
              url: p.original_image,
              size: '1.2 MB',
              createdAt: p.created_at
            });
          }
          if (p.digitized_image) {
            assets.push({
              id: `port-digi-${p.id}`,
              name: `${p.title || 'Artwork'} (Digitized)`,
              category: 'Portfolio After',
              url: p.digitized_image,
              size: '1.5 MB',
              createdAt: p.created_at
            });
          }
        });
      }
    } catch (e) {
      console.warn('Portfolio media list notice:', e.message);
    }

    // 3. Fetch live media from sew_outs table
    try {
      const { data: sewData } = await supabase.from('sew_outs').select('id, title, category, before_img, after_img, created_at');
      if (sewData) {
        sewData.forEach(s => {
          if (s.before_img) {
            assets.push({
              id: `sew-before-${s.id}`,
              name: `${s.title || 'Sew-Out'} (Vector/Raster)`,
              category: 'Portfolio Before',
              url: s.before_img,
              size: '1.1 MB',
              createdAt: s.created_at
            });
          }
          if (s.after_img) {
            assets.push({
              id: `sew-after-${s.id}`,
              name: `${s.title || 'Sew-Out'} (Embroidery)`,
              category: 'Portfolio After',
              url: s.after_img,
              size: '1.4 MB',
              createdAt: s.created_at
            });
          }
        });
      }
    } catch (e) {
      console.warn('Sew-outs media list notice:', e.message);
    }

    return assets;
  } catch (err) {
    console.error('Supabase fetchMediaAssets exception:', err);
    return [];
  }
}

export async function uploadMediaAssetToSupabaseStorage(file, folder = 'media') {
  if (!isSupabaseConfigured || !file) return null;
  try {
    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('client-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('client-uploads')
      .getPublicUrl(filePath);

    return {
      name: file.name,
      url: publicUrlData.publicUrl,
      path: filePath,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    };
  } catch (err) {
    console.error('Supabase upload media asset exception:', err);
    return null;
  }
}

// CMS Helper
export async function getCmsContent(key) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('cms_content').select('value').eq('key', key).single();
    if (error) {
      console.warn('Failed to fetch CMS content for key:', key, error);
      return null;
    }
    return data?.value || null;
  } catch (err) {
    console.warn('Exception in getCmsContent:', err);
    return null;
  }
}
