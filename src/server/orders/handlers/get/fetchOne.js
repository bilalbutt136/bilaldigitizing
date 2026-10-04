import { NextResponse } from 'next/server';

export async function handleFetchOne(context) {
  const { searchParams, orderId, supabase, user, isAdmin, isWorker, workerData } = context;
      if (!user && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const rawOrderId = String(orderId || searchParams.get('id') || '').trim();
      if (!rawOrderId) return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });

      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);

      // Fetch the full order row
      let orderRow = null;
      const { data: byIn } = await supabase
        .from('orders')
        .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at')
        .in('id', candidateIds)
        .maybeSingle();

      if (byIn) {
        orderRow = byIn;
      } else if (cleanOrdId.length >= 3) {
        const { data: byIlike } = await supabase
          .from('orders')
          .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at')
          .ilike('id', `%${cleanOrdId}%`)
          .maybeSingle();
        if (byIlike) orderRow = byIlike;
      }

      if (!orderRow) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Authorization guard
      if (!isAdmin) {
        const isClientOwner = (orderRow.client_email?.toLowerCase().trim() === user?.email?.toLowerCase().trim()) || (orderRow.user_id && orderRow.user_id === user?.id);
        const isAssignedWorker = isWorker && (orderRow.worker_id === user?.id || orderRow.worker_id === workerData?.id);
        if (!isClientOwner && !isAssignedWorker) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      // Fetch related order_files
      let orderFilesList = [];
      try {
        const { data: filesData } = await supabase
          .from('order_files')
          .select('id, file_name, file_format, file_type, public_url, file_url, file_path, uploaded_by, created_at')
          .in('order_id', Array.from(new Set([orderRow.id, ...candidateIds])));
        if (Array.isArray(filesData)) orderFilesList = filesData;
      } catch (fErr) {
        console.warn('order_files query notice:', fErr?.message);
      }

      // Fetch related revisions
      let revisionsList = [];
      try {
        const { data: revData, error: revErr } = await supabase
          .from('revisions')
          .select('id, order_id, instructions, details, note, notes, status, created_at, updated_at')
          .in('order_id', Array.from(new Set([orderRow.id, ...candidateIds])))
          .order('created_at', { ascending: false });
        if (!revErr && Array.isArray(revData)) {
          revisionsList = revData.map(r => ({
            ...r,
            instructions: r.instructions || r.details || r.note || r.notes || '',
            note: r.note || r.notes || r.instructions || r.details || ''
          }));
        }
      } catch (rErr) {
        console.warn('revisions query notice:', rErr?.message);
      }

      // Parse notes JSON safely and hydrate deliveries and specifications
      let parsedNotes = {};
      try {
        if (orderRow.notes) {
          parsedNotes = typeof orderRow.notes === 'string' ? JSON.parse(orderRow.notes) : orderRow.notes;
        }
      } catch {
        parsedNotes = { notes: orderRow.notes || '' };
      }

      const hydratedOrder = {
        ...orderRow,
        customerNotes: parsedNotes.notes || parsedNotes.instructions || '',
        patchStyle: parsedNotes.patchStyle || null,
        patchBacking: parsedNotes.patchBacking || null,
        patchBorderStyle: parsedNotes.patchBorderStyle || null,
        patchWidth: parsedNotes.patchWidth || null,
        patchHeight: parsedNotes.patchHeight || null,
        patchQuantity: parsedNotes.patchQuantity || null,
        patchItems: Array.isArray(parsedNotes.patchItems) ? parsedNotes.patchItems : [],
        placementItems: Array.isArray(parsedNotes.placementItems) ? parsedNotes.placementItems : [],
        clientUploadedFiles: Array.isArray(parsedNotes.uploadedFiles) ? parsedNotes.uploadedFiles : [],
        deliveries: Array.isArray(parsedNotes.deliveries) ? parsedNotes.deliveries : [],
        uploadedMachineFiles: Array.isArray(parsedNotes.uploadedMachineFiles) ? parsedNotes.uploadedMachineFiles : [],
        deliveryNotes: parsedNotes.deliveryNotes || '',
        deliveryDate: parsedNotes.deliveryDate || null,
        cancellation: parsedNotes.cancellation || (Array.isArray(parsedNotes.cancellations) ? parsedNotes.cancellations[0] : null) || null,
        cancellations: Array.isArray(parsedNotes.cancellations) ? parsedNotes.cancellations : (parsedNotes.cancellation ? [parsedNotes.cancellation] : []),
        order_files: orderFilesList,
        orderFiles: orderFilesList,
        revisions: revisionsList
      };

      return NextResponse.json({
        order: hydratedOrder,
        orderFiles: orderFilesList,
        revisions: revisionsList,
        messages: []
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
