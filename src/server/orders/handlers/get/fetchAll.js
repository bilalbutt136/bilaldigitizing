import { NextResponse } from 'next/server';

export async function handleFetchAll(context) {
  const { searchParams, supabase, user, isAdmin, isWorker, workerData } = context;
      if (!user?.email) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }

      const clientEmailFilter = searchParams.get('clientEmail') || searchParams.get('email');
      const workerIdParam = searchParams.get('workerId');

      let targetEmail = null;
      let targetWorkerId = null;

      if (isAdmin) {
        // Only a verified administrator may request cross-account filters.
        targetEmail = clientEmailFilter ? clientEmailFilter.toLowerCase().trim() : null;
        targetWorkerId = workerIdParam || null;
      } else if (isWorker) {
        // Workers are scoped to the trusted worker identity resolved server-side.
        targetWorkerId = workerData?.id || user.id;
      } else {
        // Customers are scoped only from the verified Supabase session.
        // Caller supplied email, userId and orderIds are intentionally ignored.
        targetEmail = user.email.toLowerCase().trim();
      }

      const applyAuthorizationScope = (query) => {
        if (isAdmin) {
          if (targetWorkerId) return query.eq('worker_id', targetWorkerId);
          if (targetEmail) return query.ilike('client_email', targetEmail);
          return query;
        }

        if (isWorker) {
          return query.eq('worker_id', targetWorkerId);
        }

        const isValidUuid = typeof user.id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

        const ownership = [];
        if (isValidUuid) ownership.push('user_id.eq.' + user.id);
        ownership.push('client_email.ilike.' + targetEmail);
        return query.or(ownership.join(','));
      };

      let data = null;
      try {
        let query = supabase
          .from('orders')
          .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at)')
          .order('created_at', { ascending: false });

        query = applyAuthorizationScope(query);
        const res = await query;
        if (res.error) throw res.error;
        data = res.data;
      } catch (nestedErr) {
        console.warn('Nested orders query fallback notice:', nestedErr);

        let fallbackQuery = supabase
          .from('orders')
          .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, output_file_url, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at)')
          .order('created_at', { ascending: false });

        fallbackQuery = applyAuthorizationScope(fallbackQuery);
        const fallbackRes = await fallbackQuery;
        if (fallbackRes.error) throw fallbackRes.error;
        data = fallbackRes.data;
      }

      return NextResponse.json({ orders: data || [] }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
