import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function mapDatabaseOrderToClientOrder(order) {
  if (!order) return null;
  let notesData = {};
  try {
    if (order.notes) {
      notesData = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
    }
  } catch {
    notesData.notes = order.notes;
  }

  const allFiles = order.order_files || order.orderFiles || [];
  const clientFiles = allFiles.filter(f => f && f.file_type === 'client_artwork').map(f => ({
    id: f.id,
    name: f.file_name,
    format: f.file_format || f.file_name?.split('.').pop() || 'png',
    url: f.public_url || f.file_url
  }));

  const _machineFiles = allFiles.filter(f => f && f.file_type === 'machine_file').map(f => ({
    id: f.id,
    name: f.file_name,
    format: f.file_format || f.file_name?.split('.').pop() || 'dst',
    url: f.public_url || f.file_url
  }));

  const parsedDeliveries = Array.isArray(notesData.deliveries) && notesData.deliveries.length > 0
    ? notesData.deliveries
    : (Array.isArray(order.deliveries) ? order.deliveries : []);

  const pStatus = String(order.payment_status || order.paymentStatus || '').toLowerCase().trim();
  const isPaidFlag = pStatus === 'paid' || pStatus === 'completed' || pStatus === 'wallet' || order.status === 'in_progress' || order.status === 'delivered' || order.status === 'completed';

  return {
    ...order,
    id: order.id,
    title: order.title,
    clientName: order.client_name || 'Client',
    clientEmail: order.client_email || '',
    price: order.price !== undefined ? parseFloat(order.price) : 15.00,
    status: order.status,
    paymentStatus: isPaidFlag ? 'paid' : (order.payment_status || 'pending'),
    isPaid: isPaidFlag,
    deliveries: parsedDeliveries,
    patchStyle: notesData.patchStyle,
    patchBacking: notesData.patchBacking,
    patchWidth: notesData.patchWidth,
    patchHeight: notesData.patchHeight,
    patchQuantity: notesData.patchQuantity,
    patchItems: notesData.patchItems || [],
    placementItems: notesData.placementItems || [],
    uploadedFiles: clientFiles.length > 0 ? clientFiles : (notesData.uploadedFiles || []),
    deliveryNotes: notesData.deliveryNotes || '',
    deliveryDate: notesData.deliveryDate || null,
    notes: notesData.notes || ''
  };
}

async function runTests() {
  console.log('========================================================');
  console.log('   STARTING END-TO-END ORDER FLOW FORENSIC TESTS        ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  const testOrderId = `test-audit-${Date.now()}`;
  const testClientEmail = 'test.customer.audit@example.com';
  const testClientName = 'Audit Test Customer';

  try {
    // ----------------------------------------------------
    // Scenario 14: Customer specifications preservation
    // ----------------------------------------------------
    console.log('--- TEST 1: Order Creation with Detailed Specifications ---');
    const initialNotes = {
      notes: 'Please stitch very tightly on fleece fabric',
      patchStyle: 'Embroidered Patch',
      patchBacking: 'Velcro Hook & Loop',
      patchBorderStyle: 'Merrowed Border',
      patchWidth: 3.5,
      patchHeight: 2.5,
      patchQuantity: 100,
      patchItems: [{ style: 'Embroidered', quantity: 100 }],
      placementItems: [{ placement: 'Left Chest', garmentType: 'Fleece Jacket' }],
      uploadedFiles: [{ name: 'customer_artwork.png', url: 'https://example.com/artwork.png' }]
    };

    const initialOrderRow = {
      id: testOrderId,
      title: 'Embroidered Patch Project',
      client_name: testClientName,
      client_email: testClientEmail,
      service_category: 'custom_patches',
      service_type: 'patches',
      fabric_type: 'Fleece',
      price: 150.00,
      cost: 150.00,
      status: 'in_progress',
      payment_status: 'paid',
      notes: JSON.stringify(initialNotes),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertErr } = await supabase.from('orders').insert([initialOrderRow]);
    assert(!insertErr, 'Order created in Supabase without error', insertErr?.message);

    // ----------------------------------------------------
    // Scenario 4, 5, 13 & 14: Admin Delivers Order (Delivery #1)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Admin Marks Order as Delivered (Delivery #1) ---');

    // Simulate what app/api/orders/route.js updateStatus does
    const candidateIds = [testOrderId, testOrderId.replace(/^#+/, ''), `#${testOrderId}`];

    // Check: Does selecting without 'deliveries' column succeed?
    const { data: fetchedTarget, error: queryErr } = await supabase
      .from('orders')
      .select('id, title, client_name, client_email, service_category, service_type, price, status, payment_status, notes, output_file_url, worker_file_url, user_id, created_at, updated_at')
      .in('id', candidateIds)
      .maybeSingle();

    assert(!queryErr && fetchedTarget !== null, 'Query without deliveries column succeeds without 42703 crash', queryErr?.message);

    // Merge notes non-destructively
    let existingNotes = {};
    try {
      existingNotes = JSON.parse(fetchedTarget.notes);
    } catch {}

    const delivery1Files = [
      { name: 'Embroidered_Patch_v1.dst', format: 'dst', url: 'https://res.cloudinary.com/demo/raw/upload/patch_v1.dst' },
      { name: 'Embroidered_Patch_v1.pdf', format: 'pdf', url: 'https://res.cloudinary.com/demo/image/upload/patch_v1.pdf' }
    ];

    const delivery1Item = {
      id: `delivery_${Date.now()}`,
      deliveryNumber: 1,
      title: 'Initial Delivery',
      deliveryDate: new Date().toISOString(),
      deliveryMessage: 'Initial production stitch files and PDF worksheet ready.',
      deliveredBy: 'Master Digitizer Desk',
      files: delivery1Files
    };

    const mergedNotes1 = {
      ...existingNotes,
      deliveries: [delivery1Item],
      deliveryNotes: delivery1Item.deliveryMessage,
      deliveryDate: delivery1Item.deliveryDate
    };

    const { error: deliv1Err } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        notes: JSON.stringify(mergedNotes1),
        output_file_url: delivery1Files[0].url,
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrderId);

    assert(!deliv1Err, 'Delivery #1 updated successfully', deliv1Err?.message);

    // Verify preservation of specifications
    const { data: orderAfterDeliv1 } = await supabase
      .from('orders')
      .select('*')
      .eq('id', testOrderId)
      .single();

    const parsedNotes1 = JSON.parse(orderAfterDeliv1.notes);
    assert(parsedNotes1.patchWidth === 3.5 && parsedNotes1.patchHeight === 2.5, 'Patch dimensions preserved after delivery');
    assert(parsedNotes1.patchBacking === 'Velcro Hook & Loop', 'Patch backing preserved after delivery');
    assert(parsedNotes1.placementItems?.length === 1, 'Placement items preserved after delivery');
    assert(parsedNotes1.uploadedFiles?.length === 1, 'Client artwork file references preserved after delivery');
    assert(parsedNotes1.deliveries?.length === 1, 'Delivery #1 recorded in deliveries array');

    // ----------------------------------------------------
    // Scenario 1, 2, 3: Customer opens order, sees Delivered status & files
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Customer Hydration & Mapping ---');
    const mappedClientOrder = mapDatabaseOrderToClientOrder(orderAfterDeliv1);

    assert(mappedClientOrder.status === 'delivered', 'Mapped order status is delivered');
    assert(mappedClientOrder.isPaid === true, 'Mapped order payment status is paid');
    assert(Array.isArray(mappedClientOrder.deliveries) && mappedClientOrder.deliveries.length === 1, 'Mapped order contains deliveries array');
    assert(mappedClientOrder.deliveries[0].deliveryNumber === 1, 'Delivery #1 has deliveryNumber = 1');
    assert(mappedClientOrder.deliveries[0].files.length === 2, 'Delivery #1 contains 2 downloadable files');

    // ----------------------------------------------------
    // Scenario 9: Late/repeated Stripe webhook cannot revert Delivered -> In Progress
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Stripe Webhook Status Protection ---');
    // Simulate what the Stripe webhook executes:
    const { data: stripeCurrentOrd } = await supabase
      .from('orders')
      .select('id, status, payment_status, paid_at')
      .in('id', candidateIds)
      .maybeSingle();

    const targetStatusStripe = (stripeCurrentOrd?.status === 'delivered' || stripeCurrentOrd?.status === 'completed')
      ? stripeCurrentOrd.status
      : 'in_progress';

    const { error: stripeUpdateErr } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: targetStatusStripe,
        paid_at: stripeCurrentOrd?.paid_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', candidateIds);

    assert(!stripeUpdateErr, 'Stripe webhook update executed without error');

    const { data: orderAfterStripe } = await supabase
      .from('orders')
      .select('status, payment_status')
      .eq('id', testOrderId)
      .single();

    assert(orderAfterStripe.status === 'delivered', 'Order status REMAINS "delivered" after late Stripe webhook', `Status is ${orderAfterStripe.status}`);

    // ----------------------------------------------------
    // Scenario 10: Notification recipient resolution
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Delivery Notification Recipient Resolution ---');
    let resolvedClientEmail = (orderAfterDeliv1.client_email || '').toLowerCase().trim();
    assert(resolvedClientEmail === testClientEmail, 'Delivery notification recipient email correctly resolved', `Resolved email: "${resolvedClientEmail}"`);

    const notifRecord = {
      id: `ord-deliv-${testOrderId}`,
      recipient_role: 'client',
      recipient_email: resolvedClientEmail,
      title: '📦 Order Files Ready: Embroidered Patch Project',
      message: 'Your production stitch files and preview documents are ready for inspection and download!',
      type: 'success',
      link: `/client-portal?tab=orders&trackOrder=${testOrderId}`,
      order_id: testOrderId,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: notifErr } = await supabase.from('notifications').upsert([notifRecord], { onConflict: 'id' });
    assert(!notifErr, 'Notification inserted with correct recipient email', notifErr?.message);

    // ----------------------------------------------------
    // Scenario 12: Customer requests revision with # prefix ID
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Revision Request with ID Normalization ---');
    const inputRevisionId = `#${testOrderId}`;
    const cleanRevId = inputRevisionId.replace(/^#+/, '');
    const revCandidateIds = [inputRevisionId, cleanRevId, `#${cleanRevId}`];

    const { data: revTargetOrder } = await supabase
      .from('orders')
      .select('id, client_email, client_name, title, status')
      .in('id', revCandidateIds)
      .maybeSingle();

    assert(revTargetOrder !== null, 'Order resolved from ID with hash prefix (#)');

    const revPayload = {
      order_id: revTargetOrder.id,
      note: 'Please change the thread color on the outer border to Navy Blue',
      notes: 'Please change the thread color on the outer border to Navy Blue',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { error: revInsertErr } = await supabase.from('revisions').insert([revPayload]);
    assert(!revInsertErr, 'Revision row inserted in revisions table', revInsertErr?.message);

    await supabase.from('orders').update({
      status: 'revision',
      updated_at: new Date().toISOString()
    }).in('id', revCandidateIds);

    const { data: orderAfterRev } = await supabase.from('orders').select('status').eq('id', testOrderId).single();
    assert(orderAfterRev.status === 'revision', 'Order status transitioned to "revision"');

    // ----------------------------------------------------
    // Scenario 13: Delivery #2 (Versioning & History Preservation)
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Delivery #2 / Versioning ---');
    const { data: orderBeforeDeliv2 } = await supabase.from('orders').select('notes').eq('id', testOrderId).single();
    const existingNotes2 = JSON.parse(orderBeforeDeliv2.notes);
    const existingDeliveries = Array.isArray(existingNotes2.deliveries) ? existingNotes2.deliveries : [];

    const maxExistingNum = existingDeliveries.reduce((max, d) => Math.max(max, parseInt(d.deliveryNumber || 0, 10)), 0);
    const newDeliveryNumber = Math.max(existingDeliveries.length + 1, maxExistingNum + 1);

    const delivery2Files = [
      { name: 'Embroidered_Patch_v2_Navy.dst', format: 'dst', url: 'https://res.cloudinary.com/demo/raw/upload/patch_v2.dst' },
      { name: 'Embroidered_Patch_v2_Navy.pdf', format: 'pdf', url: 'https://res.cloudinary.com/demo/image/upload/patch_v2.pdf' }
    ];

    const delivery2Item = {
      id: `delivery_${Date.now()}`,
      deliveryNumber: newDeliveryNumber,
      title: `Delivery #${newDeliveryNumber}`,
      deliveryDate: new Date().toISOString(),
      deliveryMessage: 'Updated border to Navy Blue as requested.',
      deliveredBy: 'Master Digitizer Desk',
      files: delivery2Files
    };

    const updatedDeliveries = [delivery2Item, ...existingDeliveries];

    const mergedNotes2 = {
      ...existingNotes2,
      deliveries: updatedDeliveries,
      deliveryNotes: delivery2Item.deliveryMessage,
      deliveryDate: delivery2Item.deliveryDate
    };

    await supabase.from('orders').update({
      status: 'delivered',
      notes: JSON.stringify(mergedNotes2),
      output_file_url: delivery2Files[0].url,
      updated_at: new Date().toISOString()
    }).eq('id', testOrderId);

    const { data: orderAfterDeliv2 } = await supabase.from('orders').select('*').eq('id', testOrderId).single();
    const mappedOrder2 = mapDatabaseOrderToClientOrder(orderAfterDeliv2);

    assert(mappedOrder2.status === 'delivered', 'Order status is "delivered" after Delivery #2');
    assert(mappedOrder2.deliveries.length === 2, 'Order has exactly 2 deliveries recorded in history');
    assert(mappedOrder2.deliveries[0].deliveryNumber === 2, 'Latest delivery has deliveryNumber = 2');
    assert(mappedOrder2.deliveries[1].deliveryNumber === 1, 'Previous delivery preserved with deliveryNumber = 1');
    assert(mappedOrder2.patchWidth === 3.5, 'Original customer specifications still 100% intact after Delivery #2');

    // ----------------------------------------------------
    // Scenario 6, 7, 8: Clean ID & Direct URL lookup
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Direct URL / ID Lookup Robustness ---');
    const { data: directLookupByPlain } = await supabase.from('orders').select('id, status').eq('id', testOrderId).maybeSingle();
    assert(directLookupByPlain?.status === 'delivered', 'Lookup by plain ID loads correct delivered status');

    const cleanPlainId = testOrderId.replace(/^#+/, '');
    const { data: directLookupByClean } = await supabase.from('orders').select('id, status').in('id', [cleanPlainId, `#${cleanPlainId}`]).maybeSingle();
    assert(directLookupByClean?.status === 'delivered', 'Lookup with/without # loads correct delivered status');

    console.log('\n========================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

  } finally {
    // Clean up test data
    console.log('\nCleaning up test artifacts...');
    await supabase.from('notifications').delete().eq('order_id', testOrderId);
    await supabase.from('revisions').delete().eq('order_id', testOrderId);
    await supabase.from('orders').delete().eq('id', testOrderId);
    console.log('Test cleanup complete.');
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
