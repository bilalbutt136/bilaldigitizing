import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';
import { getServerAuthUser } from '../../../lib/supabase/serverAuth';
import { handleCreateOrder } from '../handlers/post/createOrder.js';
import { handleUpdateStatus } from '../handlers/post/updateStatus.js';
import { handleRequestRevision } from '../handlers/post/requestRevision.js';
import { handleRequestCancellation } from '../handlers/post/requestCancellation.js';
import { handleApproveCancellation } from '../handlers/post/approveCancellation.js';
import { handleRejectCancellation } from '../handlers/post/rejectCancellation.js';
import { handleCancelOrder } from '../handlers/post/cancelOrder.js';
import { handleDeleteOrder } from '../handlers/post/deleteOrder.js';
import { handleAssignWorker } from '../handlers/post/assignWorker.js';
import { handleWorkerBidAndAccept } from '../handlers/post/workerBidAndAccept.js';
import { handleWorkerSubmitUpload } from '../handlers/post/workerSubmitUpload.js';
import { handleAdminReviewWorker } from '../handlers/post/adminReviewWorker.js';

const POST_HANDLERS = {
  createOrder: handleCreateOrder,
  updateStatus: handleUpdateStatus,
  requestRevision: handleRequestRevision,
  requestCancellation: handleRequestCancellation,
  approveCancellation: handleApproveCancellation,
  rejectCancellation: handleRejectCancellation,
  cancelOrder: handleCancelOrder,
  deleteOrder: handleDeleteOrder,
  assignWorker: handleAssignWorker,
  workerBidAndAccept: handleWorkerBidAndAccept,
  workerSubmitUpload: handleWorkerSubmitUpload,
  adminReviewWorker: handleAdminReviewWorker
};

export async function handleOrdersPost(request) {
  try {
    const data = await request.json();
    const { action, payload } = data;
    const handler = POST_HANDLERS[action];
    if (!handler) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    const supabase = createAdminClient();
    const { user, isAdmin } = await getServerAuthUser(request);
    return handler({ request, payload, supabase, user, isAdmin });
  } catch (error) {
    console.error('[Orders API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
