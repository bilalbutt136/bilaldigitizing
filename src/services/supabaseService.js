import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { getSiteUrl } from '../utils/siteUrl';

export { isSupabaseConfigured };

/**
 * Service layer for Supabase Database, Auth & Storage Operations.
 */

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
      return { success: false, error: authErr.message || 'Account registration failed.' };
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


// Helper to upload files to Supabase Storage Bucket
export async function uploadFileToSupabaseStorage(fileObj, bucketName = 'client-uploads', folderPath = 'artwork') {
  if (!isSupabaseConfigured || !fileObj) return null;

  try {
    let fileBody = fileObj;
    let fileName = fileObj.name || `file_${Date.now()}`;

    // If file is base64 Data URL, convert to Blob
    if (typeof fileObj === 'string' && fileObj.startsWith('data:')) {
      const arr = fileObj.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      fileBody = new Blob([u8arr], { type: mime });
    }

    const filePath = `${folderPath}/${Date.now()}_${fileName.replace(/\s+/g, '_')}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBody, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('Supabase storage upload warning:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || null;
    console.log("Uploaded File URL:", publicUrl);
    return publicUrl;
  } catch (err) {
    console.warn('Supabase storage upload exception:', err);
    return null;
  }
}

// Fetch all orders from Supabase DB
export async function fetchOrdersFromSupabase() {
  if (!isSupabaseConfigured) return null;

  try {
    let ordersData = null;
    let filesData = null;

    // Relational select query joining orders and order_files
    const { data: joinedOrders, error: joinedErr } = await supabase
      .from('orders')
      .select('*, order_files(*)')
      .order('created_at', { ascending: false });

    if (joinedErr) {
      console.warn('Supabase fetch orders error:', joinedErr.message);
      return null;
    }
    ordersData = joinedOrders;

    const { data: allFiles } = await supabase.from('order_files').select('*');
    filesData = allFiles || [];

    const { data: revsData } = await supabase.from('revisions').select('*');
    const { data: msgsData } = await supabase.from('order_messages').select('*');

    if (!ordersData) return null;

    // Map DB rows to app state models
    return ordersData.map(ord => {
      const joinedFiles = ord.order_files && Array.isArray(ord.order_files) ? ord.order_files : [];
      const queriedFiles = filesData ? filesData.filter(f => f.order_id === ord.id) : [];
      const ordFiles = [...joinedFiles, ...queriedFiles];
      const ordRevs = revsData ? revsData.filter(r => r.order_id === ord.id) : [];
      const ordMsgs = (msgsData || [])
        .filter(m => m.order_id === ord.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(m => ({
          id: m.id,
          sender: m.sender,
          senderRole: m.sender_role,
          text: m.text,
          attachments: m.attachments || [],
          timestamp: m.created_at
        }));

      const machineFiles = ordFiles
        .filter(f => f.file_type === 'finished_machine_file')
        .map(f => ({ name: f.file_name, format: f.file_format, url: f.file_url || f.public_url }));

      const clientArtwork = ordFiles.find(f => f.file_type === 'client_artwork');
      const resolvedArtworkUrl = ord.artwork_url || ord.image_url || ord.logo || clientArtwork?.file_url || clientArtwork?.public_url || clientArtwork?.file_path || '';

      return {
        id: ord.id,
        title: ord.title || ord.description,
        clientName: ord.client_name,
        clientEmail: ord.client_email,
        serviceCategory: ord.service_category || ord.service_type,
        placementType: ord.placement_type,
        fabricType: ord.fabric_type,
        dimensions: ord.dimensions || { width: 3.5, height: 3.0, unit: 'inches' },
        estimatedStitches: ord.estimated_stitches,
        colorsCount: ord.colors_count,
        requestedFormats: ord.requested_formats || ['dst', 'pes', 'emb', 'pdf'],
        isRush: ord.is_rush,
        price: parseFloat(ord.price || ord.cost || 15.00),
        paymentStatus: ord.payment_status || 'Paid',
        notes: ord.notes || ord.description,
        artworkUrl: resolvedArtworkUrl,
        image_url: resolvedArtworkUrl,
        logo: resolvedArtworkUrl,
        file_url: resolvedArtworkUrl,
        file_path: clientArtwork?.file_path || resolvedArtworkUrl,
        status: ord.status,
        outputFileUrl: ord.output_file_url,
        createdAt: ord.created_at,
        uploadedMachineFiles: machineFiles,
        revisions: ordRevs.map(r => ({ id: r.id, requestedBy: r.requested_by, note: r.note || r.notes, createdAt: r.created_at })),
        messages: ordMsgs,
        history: [
          { timestamp: ord.created_at, label: `Order Created in Supabase DB` }
        ]
      };
    });
  } catch (err) {
    console.warn('Supabase fetch orders exception:', err);
    return null;
  }
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
      const storageUrl = await uploadFileToSupabaseStorage(
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
      title: resolvedTitle,
      description: newOrder.notes || resolvedTitle,
      client_id: newOrder.clientId || resolvedEmail,
      client_name: resolvedName,
      client_email: resolvedEmail,
      service_category: resolvedCategory,
      service_type: resolvedCategory,
      placement_type: newOrder.placementType || 'Left Chest / Polo',
      fabric_type: newOrder.fabricType || 'Cotton Pique Polo',
      dimensions: newOrder.dimensions || { width: 3.5, height: 3.0, unit: 'inches' },
      estimated_stitches: newOrder.estimatedStitches || 12400,
      colors_count: newOrder.colorsCount || 4,
      requested_formats: newOrder.requestedFormats || ['dst', 'pes', 'emb', 'pdf'],
      is_rush: Boolean(newOrder.isRush),
      price: resolvedPrice,
      cost: resolvedPrice,
      payment_status: 'Paid',
      notes: newOrder.notes || '',
      artwork_url: uploadedArtworkUrl || '',
      image_url: uploadedArtworkUrl || '',
      logo: uploadedArtworkUrl || '',
      status: newOrder.status || 'submitted'
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
      const fileRow = {
        order_id: newOrder.id,
        file_name: newOrder.artworkFileName || `${newOrder.id}_artwork.png`,
        file_format: 'png',
        file_type: 'client_artwork',
        bucket_name: 'client-uploads',
        file_path: `artwork/${newOrder.id}`,
        file_url: uploadedArtworkUrl || '',
        public_url: uploadedArtworkUrl || '',
        uploaded_by: newOrder.clientName || 'client'
      };
      const { error: fileErr } = await supabase.from('order_files').insert([fileRow]);
      if (fileErr) {
        console.warn('[Supabase Order File Insert Error]:', fileErr.message);
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
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const updateObj = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (extraData.outputFileUrl) {
      updateObj.output_file_url = extraData.outputFileUrl;
    }

    console.log(`[Supabase Update Status] Executing database update on public.orders for id ${orderId}:`, updateObj);

    const { data, error } = await supabase
      .from('orders')
      .update(updateObj)
      .eq('id', orderId)
      .select();

    if (error) {
      console.error(`[Supabase Update Status Error] Failed to update order ${orderId}:`, error.message, error);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase Update Status Success] Order ${orderId} status updated to '${newStatus}' in DB:`, data);

    // If new finished machine files were uploaded
    if (extraData.uploadedMachineFiles && Array.isArray(extraData.uploadedMachineFiles)) {
      for (const f of extraData.uploadedMachineFiles) {
        let filePublicUrl = f.url;

        // Upload to finished-packages bucket if base64
        if (f.url && f.url.startsWith('data:')) {
          const storageUrl = await uploadFileToSupabaseStorage(
            f.url,
            'finished-packages',
            `orders/${orderId}`
          );
          if (storageUrl) filePublicUrl = storageUrl;
        }

        await supabase.from('order_files').insert([{
          order_id: orderId,
          file_name: f.name,
          file_format: f.format || f.name.split('.').pop().toLowerCase(),
          file_type: 'finished_machine_file',
          bucket_name: 'finished-packages',
          file_path: `orders/${orderId}/${f.name}`,
          file_url: filePublicUrl,
          public_url: filePublicUrl,
          uploaded_by: 'Admin'
        }]);
      }
    }

    return { success: true, data };
  } catch (err) {
    console.error('Supabase update order status exception:', err);
    return { success: false, error: err.message };
  }
}

// Add Revision Request in Supabase DB
export async function addRevisionInSupabase(orderId, note, requestedBy = 'Client') {
  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('revisions').insert([{
      order_id: orderId,
      requested_by: requestedBy,
      note: note,
      notes: note,
      status: 'pending'
    }]);
  } catch (err) {
    console.warn('Supabase add revision exception:', err);
  }
}

export async function cancelOrderInSupabase(orderId) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteOrderInSupabase(orderId) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Upsert Client Profile in Supabase DB (Automatic Save on Login & Order Submission)
export async function upsertClientInSupabase(userData) {
  if (!isSupabaseConfigured || !userData || !userData.email) return { success: false, error: 'Supabase or user email missing.' };

  try {
    const cleanEmail = userData.email.toLowerCase().trim();

    const { data: existing, error: selectErr } = await supabase
      .from('clients')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (selectErr) {
      console.warn('[Supabase Client Select Warning]:', selectErr.message);
    }

    const clientName = userData.name || cleanEmail.split('@')[0];
    const clientCompany = userData.company || `${clientName}'s Apparel`;

    const primaryPayload = {
      user_id: userData.id,
      name: clientName,
      full_name: clientName,
      email: cleanEmail,
      company: clientCompany,
      company_name: clientCompany,
      role: userData.role || 'customer'
    };

    if (existing) {
      const { error: updateErr } = await supabase
        .from('clients')
        .update({
          ...primaryPayload,
          orders_count: (existing.orders_count || 0) + (userData.incrementOrder ? 1 : 0)
        })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('[Supabase Client Update Error]:', updateErr.message);
        return { success: false, error: updateErr.message };
      }
      return { success: true };
    } else {
      const { error: insertErr } = await supabase
        .from('clients')
        .insert([{
          ...primaryPayload,
          wallet_balance: 0,
          orders_count: userData.incrementOrder ? 1 : 0
        }]);

      if (insertErr) {
        console.error('[Supabase Client Insert Error]:', insertErr.message);
        // Fallback insert with alternative payload structure
        const { error: fallbackErr } = await supabase
          .from('clients')
          .insert([{
            user_id: userData.id,
            full_name: clientName,
            email: cleanEmail,
            company_name: clientCompany,
            role: userData.role || 'customer',
            wallet_balance: 0,
            orders_count: userData.incrementOrder ? 1 : 0
          }]);
        if (fallbackErr) {
          console.error('[Supabase Client Fallback Insert Error]:', fallbackErr.message);
          return { success: false, error: fallbackErr.message };
        }
        return { success: true };
      }
      return { success: true };
    }
  } catch (err) {
    console.error('[Supabase Upsert Client Exception]:', err);
    return { success: false, error: err?.message };
  }
}

// Fetch all registered clients from Supabase DB
export async function fetchClientsFromSupabase() {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch clients error:', error.message);
      return null;
    }

    return data.map(c => ({
      id: c.id,
      name: c.full_name || c.name || c.email?.split('@')[0] || 'Client User',
      email: c.email,
      company: c.company_name || c.company || `${c.name || 'Client'}'s Apparel`,
      walletBalance: parseFloat(c.wallet_balance || 0),
      ordersCount: c.orders_count || 0,
      createdAt: c.created_at
    }));
  } catch (err) {
    console.warn('Supabase fetch clients exception:', err);
    return null;
  }
}

// Deposit Funds & Transaction Handler in Supabase
export async function depositFundsInSupabase(clientEmail, depositAmount, paymentMethod = 'Credit Card') {
  if (!isSupabaseConfigured || !clientEmail) return null;

  try {
    const cleanEmail = clientEmail.toLowerCase().trim();
    const amount = parseFloat(depositAmount);

    // 1. Fetch current client record
    const { data: client } = await supabase
      .from('clients')
      .select('id, wallet_balance')
      .eq('email', cleanEmail)
      .maybeSingle();

    const currentBal = client ? parseFloat(client.wallet_balance || 0) : 0;
    const updatedBal = currentBal + amount;

    if (client) {
      await supabase
        .from('clients')
        .update({ wallet_balance: updatedBal })
        .eq('id', client.id);
    }

    // 2. Log transaction in transactions table
    await supabase.from('transactions').insert([{
      client_email: cleanEmail,
      type: 'deposit',
      amount: amount,
      payment_method: paymentMethod,
      description: `Studio Wallet Deposit Top-up (+ $${amount.toFixed(2)})`
    }]);

    return updatedBal;
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

    const { data: client } = await supabase
      .from('clients')
      .select('id, wallet_balance')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (client) {
      const currentBal = parseFloat(client.wallet_balance || 0);
      const updatedBal = Math.max(0, currentBal - amount);

      await supabase
        .from('clients')
        .update({ wallet_balance: updatedBal })
        .eq('id', client.id);

      // Log transaction
      await supabase.from('transactions').insert([{
        client_email: cleanEmail,
        type: 'order_payment',
        amount: amount,
        payment_method: 'Studio Wallet Credit',
        description: `Order Brief Payment for ${orderId} (- $${amount.toFixed(2)})`
      }]);

      return updatedBal;
    }
    return null;
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
  if (!isSupabaseConfigured || !tableName || !dataArray || !dataArray.length) return false;

  try {
    // Add updated_at to each item
    const payload = dataArray.map(item => ({
      ...item,
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn(`Supabase upsert ${tableName} warning:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Supabase upsert ${tableName} exception:`, err);
    return false;
  }
}

// ============================================================
// CATALOG (DB-driven; replaces mock catalog defaults)
// ============================================================

// Fetch the full public catalog from Supabase (services, pricing cards,
// patch cards, store products, portfolio, sew outs, hero slides, digitizers,
// and the site_config key/value store). Returns null when not configured.
export async function fetchCatalogFromSupabase() {
  if (!isSupabaseConfigured) return null;

  try {
    const [services, pricingCards, patchCards, storeProducts, portfolio, sewOuts, heroSlides, digitizers, siteConfig] =
      await Promise.all([
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('pricing_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('patch_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('store_products').select('*').order('sort_order', { ascending: true }),
        supabase.from('portfolio').select('*').order('sort_order', { ascending: true }),
        supabase.from('sew_outs').select('*').order('sort_order', { ascending: true }),
        supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }),
        supabase.from('digitizers').select('*').order('sort_order', { ascending: true }),
        supabase.from('site_config').select('key, value')
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
    (siteConfig.data || []).forEach(item => { configMap[item.key] = item.value; });

    return {
      servicesList: mapServices(services.data),
      pricingCards: mapCards(pricingCards.data),
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
      portfolioSamples: (portfolio.data || []).map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        stitchCount: p.stitch_count,
        colors: p.colors,
        originalImage: p.original_image,
        digitizedImage: p.digitized_image,
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
        trustPoints: h.trust_points || []
      })),
      digitizers: (digitizers.data || []).map(d => ({
        id: d.id,
        name: d.name,
        role: d.role,
        rating: d.rating,
        activeJobs: d.active_jobs,
        avatar: d.avatar
      })),
      siteConfig: configMap,
      siteSettings: configMap.site_settings || null,
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
      sender: m.sender,
      senderRole: m.sender_role,
      text: m.text,
      attachments: m.attachments || [],
      timestamp: m.created_at
    }));
  } catch (err) {
    console.warn('Supabase fetch order messages exception:', err);
    return [];
  }
}

export async function addOrderMessageInSupabase(orderId, text, senderName, senderRole = 'client', attachments = []) {
  if (!isSupabaseConfigured || !orderId) return null;

  try {
    const { data, error } = await supabase
      .from('order_messages')
      .insert([{
        order_id: orderId,
        sender: senderName || (senderRole === 'admin' ? 'Master Admin' : 'Client'),
        sender_role: senderRole,
        text: text || '',
        attachments: attachments || []
      }])
      .select()
      .single();

    if (error) {
      console.warn('Supabase add order message error:', error.message);
      return null;
    }

    return {
      id: data.id,
      sender: data.sender,
      senderRole: data.sender_role,
      text: data.text,
      attachments: data.attachments || [],
      timestamp: data.created_at
    };
  } catch (err) {
    console.warn('Supabase add order message exception:', err);
    return null;
  }
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

export async function deductWalletViaApi(amount, paymentMethod = 'Studio Wallet Credit') {
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
      body: JSON.stringify({ action: 'deduct', amount, paymentMethod })
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


export async function fetchConversations() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data: convs, error: convErr } = await supabase.from('conversations').select('*');
    if (convErr) throw convErr;
    const { data: msgs, error: msgErr } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (msgErr) throw msgErr;
    return convs.map(c => ({
      ...c,
      messages: msgs.filter(m => m.conversation_id === c.id)
    }));
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return [];
  }
}

export async function addChatMessage(conversationId, message) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('messages').insert([{
      id: message.id,
      conversation_id: conversationId,
      sender: message.sender,
      sender_name: message.senderName || '',
      text: message.text || '',
      attachment: message.attachment || '',
      timestamp: message.timestamp || new Date().toISOString()
    }]).select();
    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error adding message:', err);
    return null;
  }
}
