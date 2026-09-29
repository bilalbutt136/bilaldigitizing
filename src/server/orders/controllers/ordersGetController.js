import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';
import { getServerAuthUser } from '../../../lib/supabase/serverAuth';
import { handleFetchAll } from '../handlers/get/fetchAll.js';
import { handleFetchPending } from '../handlers/get/fetchPending.js';
import { handleFetchOne } from '../handlers/get/fetchOne.js';

const GET_HANDLERS = {
  fetchAll: handleFetchAll,
  fetchPending: handleFetchPending,
  fetchOne: handleFetchOne,
  fetchDetails: handleFetchOne
};

export async function handleOrdersGet(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const handler = GET_HANDLERS[action];
    if (!handler) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    const orderId = searchParams.get('orderId');
    const supabase = createAdminClient();
    const { user, isAdmin, isWorker, workerData } = await getServerAuthUser(request);
    return handler({ request, searchParams, orderId, supabase, user, isAdmin, isWorker, workerData });
  } catch (error) {
    console.error('[Orders API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
