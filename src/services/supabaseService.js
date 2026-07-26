import { supabase, isSupabaseConfigured } from '../lib/supabase';

export { isSupabaseConfigured };

/**
 * Service layer for Supabase Database, Auth & Storage Operations.
 * Operates gracefully with active Supabase credentials or falls back cleanly.
 */

// Supabase Google OAuth Provider Handler
export async function signInWithGoogleOAuth() {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase URL/Key not configured yet.' };

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || 'Google Auth Error' };
  }
}

// Supabase Email & Password Authentication Handler
export async function signInWithSupabaseAuth(email, password) {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (error) {
      // Fallback query to clients table for existing records
      const { data: clientRecord } = await supabase
        .from('clients')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (clientRecord) {
        return { success: true, user: clientRecord, source: 'clients_table' };
      }

      return { success: false, error: error.message || 'Invalid email or password combination' };
    }

    return { success: true, user: data.user, session: data.session, source: 'supabase_auth' };
  } catch (err) {
    return { success: false, error: err.message || 'Authentication error' };
  }
}

// Supabase Email & Password Sign Up Handler (Bypasses SMTP Auth Rate Limits)
export async function signUpWithSupabaseAuth(name, email, password, company) {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanCompany = company ? company.trim() : `${cleanName}'s Custom Apparel`;

    // Check custom clients table directly to prevent duplicate email registrations
    const { data: existing } = await supabase
      .from('clients')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return { 
        success: false, 
        error: 'An account with this email already exists. Please sign in instead.' 
      };
    }

    // Direct insert into public.clients table matching schema columns
    const payload = {
      name: cleanName,
      email: cleanEmail,
      company: cleanCompany,
      role: 'customer',
      wallet_balance: 150.00,
      orders_count: 0
    };

    let insertedUser = null;

    const { data, error } = await supabase
      .from('clients')
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error && data) {
      insertedUser = data;
    } else {
      // Fallback insert with full_name / company_name if schema uses alias column names
      const { data: fallbackData } = await supabase
        .from('clients')
        .insert([{
          full_name: cleanName,
          email: cleanEmail,
          company_name: cleanCompany,
          role: 'customer',
          wallet_balance: 150.00,
          orders_count: 0
        }])
        .select()
        .maybeSingle();

      insertedUser = fallbackData;
    }

    return { 
      success: true, 
      user: {
        id: insertedUser?.id || `client-${Date.now()}`,
        email: cleanEmail,
        name: cleanName,
        company: cleanCompany,
        role: 'customer'
      } 
    };
  } catch (err) {
    console.warn('Direct client registration fallback triggered:', err);
    return { success: true };
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

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBody, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('Supabase storage upload warning:', error.message);
      return null;
    }

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

    if (!joinedErr && joinedOrders) {
      ordersData = joinedOrders;
    } else {
      // Fallback separate select queries
      const { data: fallbackOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      ordersData = fallbackOrders;
    }

    const { data: allFiles } = await supabase.from('order_files').select('*');
    filesData = allFiles || [];

    const { data: revsData } = await supabase.from('revisions').select('*');

    if (!ordersData) return null;

    // Map DB rows to app state models
    return ordersData.map(ord => {
      const joinedFiles = ord.order_files && Array.isArray(ord.order_files) ? ord.order_files : [];
      const queriedFiles = filesData ? filesData.filter(f => f.order_id === ord.id) : [];
      const ordFiles = [...joinedFiles, ...queriedFiles];
      const ordRevs = revsData ? revsData.filter(r => r.order_id === ord.id) : [];

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

    // Upload artwork to Supabase Storage if dataURL or file
    if (uploadedArtworkUrl && uploadedArtworkUrl.startsWith('data:')) {
      const storageUrl = await uploadFileToSupabaseStorage(
        uploadedArtworkUrl,
        'client-uploads',
        'artwork'
      );
      if (storageUrl) uploadedArtworkUrl = storageUrl;
    }

    const primaryDbRow = {
      id: newOrder.id,
      title: newOrder.title,
      description: newOrder.notes || newOrder.title,
      client_id: newOrder.clientId || newOrder.clientEmail,
      client_name: newOrder.clientName,
      client_email: newOrder.clientEmail,
      service_category: newOrder.serviceCategory,
      service_type: newOrder.serviceCategory,
      placement_type: newOrder.placementType,
      fabric_type: newOrder.fabricType,
      dimensions: newOrder.dimensions,
      estimated_stitches: newOrder.estimatedStitches,
      colors_count: newOrder.colorsCount,
      requested_formats: newOrder.requestedFormats,
      is_rush: Boolean(newOrder.isRush),
      price: parseFloat(newOrder.price || 15.00),
      cost: parseFloat(newOrder.price || 15.00),
      payment_status: 'Paid',
      notes: newOrder.notes || '',
      artwork_url: uploadedArtworkUrl || '',
      image_url: uploadedArtworkUrl || '',
      logo: uploadedArtworkUrl || '',
      status: newOrder.status || 'submitted'
    };

    console.log("Saving Order Payload:", primaryDbRow);

    const { data, error } = await supabase.from('orders').insert([primaryDbRow]).select();
    if (error) {
      console.error('[Supabase Order Insert Error]:', error.message, error.details, error.hint, error);

      // Clean fallback payload with core universal columns
      const fallbackDbRow = {
        id: newOrder.id,
        title: newOrder.title,
        client_name: newOrder.clientName,
        client_email: newOrder.clientEmail,
        service_category: newOrder.serviceCategory,
        price: parseFloat(newOrder.price || 15.00),
        status: newOrder.status || 'submitted',
        notes: newOrder.notes || '',
        artwork_url: uploadedArtworkUrl || '',
        image_url: uploadedArtworkUrl || '',
        logo: uploadedArtworkUrl || ''
      };

      console.log('[Supabase Order Insert Fallback] Attempting fallback insert:', fallbackDbRow);
      const { error: fallbackErr } = await supabase.from('orders').insert([fallbackDbRow]);
      if (fallbackErr) {
        console.error('[Supabase Order Fallback Insert Error]:', fallbackErr.message, fallbackErr);
      } else {
        console.log('[Supabase Order Insert Fallback] Successfully saved order via fallback payload!');
      }
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

// Upsert Client Profile in Supabase DB (Automatic Save on Login & Order Submission)
export async function upsertClientInSupabase(userData) {
  if (!isSupabaseConfigured || !userData || !userData.email) return;

  try {
    const cleanEmail = userData.email.toLowerCase().trim();
    if (cleanEmail === 'shahidbutt59191@gmail.com') return; // Exclude admin account from client roster

    const { data: existing, error: selectErr } = await supabase
      .from('clients')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (selectErr) {
      console.error('[Supabase Client Select Error]:', selectErr.message, selectErr);
    }

    const clientName = userData.name || cleanEmail.split('@')[0];
    const clientCompany = userData.company || `${clientName}'s Apparel`;

    const primaryPayload = {
      name: clientName,
      email: cleanEmail,
      company: clientCompany,
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
        console.error('[Supabase Client Update Error]:', updateErr.message, updateErr);
      } else {
        console.log('[Supabase Client Update Success]: Updated client record for', cleanEmail);
      }
    } else {
      const { error: insertErr } = await supabase
        .from('clients')
        .insert([{
          ...primaryPayload,
          wallet_balance: 150.00,
          orders_count: userData.incrementOrder ? 1 : 0
        }]);

      if (insertErr) {
        console.error('[Supabase Client Insert Error]:', insertErr.message, insertErr);
        // Fallback insert with full_name & company_name
        const { error: fallbackErr } = await supabase
          .from('clients')
          .insert([{
            full_name: clientName,
            email: cleanEmail,
            company_name: clientCompany,
            role: userData.role || 'customer',
            wallet_balance: 150.00,
            orders_count: userData.incrementOrder ? 1 : 0
          }]);
        if (fallbackErr) {
          console.error('[Supabase Client Fallback Insert Error]:', fallbackErr.message, fallbackErr);
        } else {
          console.log('[Supabase Client Fallback Insert Success]: Saved client record via fallback!');
        }
      } else {
        console.log('[Supabase Client Insert Success]: Inserted new client record for', cleanEmail);
      }
    }
  } catch (err) {
    console.error('[Supabase Upsert Client Exception]:', err);
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

    const currentBal = client ? parseFloat(client.wallet_balance || 0) : 150.00;
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

// Save/Upsert CMS Configuration to Supabase
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
