import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { withApiObservability } from '../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
};

function cleanOrderId(value) {
  return String(value || '').trim().replace(/^#+/, '');
}

function cleanText(value, maxLength = 1600) {
  return String(value || '')
    .trim()
    .slice(0, maxLength);
}

function defaultDisplayName(name) {
  const cleaned = cleanText(name, 80);
  if (!cleaned) return 'Verified Customer';

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function isOwnedOrder(order, user) {
  if (!order || !user) return false;

  if (order.user_id && String(order.user_id) === String(user.id)) {
    return true;
  }

  const orderEmail = String(order.client_email || '').trim().toLowerCase();
  const userEmail = String(user.email || '').trim().toLowerCase();
  return Boolean(orderEmail && userEmail && orderEmail === userEmail);
}

async function findOrder(supabase, orderId) {
  const raw = String(orderId || '').trim();
  const clean = cleanOrderId(raw);
  if (!clean) return null;

  const selectFields = 'id, user_id, client_email, client_name, status, title, service_category, service_type';

  const first = await supabase
    .from('orders')
    .select(selectFields)
    .eq('id', clean)
    .maybeSingle();

  if (!first.error && first.data) return first.data;

  if (raw && raw !== clean) {
    const second = await supabase
      .from('orders')
      .select(selectFields)
      .eq('id', raw)
      .maybeSingle();

    if (!second.error && second.data) return second.data;
  }

  return null;
}

function revalidatePublishedReviews() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/api/catalog');
    revalidateTag('catalog');
    revalidateTag('homepage');
  } catch (error) {
    console.warn('[Reviews revalidate warning]:', error?.message || error);
  }
}

async function GET_impl(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const orderId = searchParams.get('orderId');

    if (scope === 'admin') {
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Admin privileges required.' }, { status: 403, headers: NO_STORE_HEADERS });
      }

      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const reviews = data || [];
      const counts = reviews.reduce((acc, review) => {
        const key = review.moderation_status || 'pending';
        acc.total += 1;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { total: 0, pending: 0, published: 0, hidden: 0 });

      return NextResponse.json({ success: true, reviews, counts }, { headers: NO_STORE_HEADERS });
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const order = await findOrder(supabase, orderId);
    if (!order || (!isAdmin && !isOwnedOrder(order, user))) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const { data: review, error } = await supabase
      .from('customer_reviews')
      .select('id, order_id, display_name, rating, review_text, moderation_status, is_published, submitted_at, published_at')
      .eq('order_id', String(order.id))
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, review: review || null }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Reviews API GET]', error);
    return NextResponse.json({ success: false, error: 'Unable to load feedback right now.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

async function POST_impl(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || isAdmin) {
      return NextResponse.json({ success: false, error: 'A signed-in customer account is required.' }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    const orderId = body?.orderId;
    const rating = Number(body?.rating);
    const reviewText = cleanText(body?.reviewText, 1600);

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order is required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Please choose a rating from 1 to 5 stars.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (reviewText.length < 3) {
      return NextResponse.json({ success: false, error: 'Please add a short comment about your delivery.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const supabase = createAdminClient();
    const order = await findOrder(supabase, orderId);

    if (!order || !isOwnedOrder(order, user)) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    if (String(order.status || '').toLowerCase() !== 'completed') {
      return NextResponse.json({ success: false, error: 'Feedback becomes available after the delivery is approved.' }, { status: 409, headers: NO_STORE_HEADERS });
    }

    const canonicalOrderId = String(order.id);
    const { data: existing, error: existingError } = await supabase
      .from('customer_reviews')
      .select('*')
      .eq('order_id', canonicalOrderId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        review: existing
      }, { headers: NO_STORE_HEADERS });
    }

    const customerName = cleanText(
      order.client_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
      120
    );
    const requestedDisplayName = cleanText(body?.displayName, 80);
    const displayName = requestedDisplayName || defaultDisplayName(customerName);

    const reviewRecord = {
      order_id: canonicalOrderId,
      customer_user_id: user.id,
      customer_email: String(user.email || '').trim().toLowerCase(),
      customer_name: customerName || null,
      display_name: displayName,
      order_title: cleanText(order.title, 180) || null,
      service_category: cleanText(order.service_category || order.service_type || 'Embroidery', 100),
      rating,
      review_text: reviewText,
      moderation_status: 'pending',
      is_published: false,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: review, error } = await supabase
      .from('customer_reviews')
      .insert(reviewRecord)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Reviews API POST]', error);
    return NextResponse.json({ success: false, error: 'Unable to save your feedback right now.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

async function PATCH_impl(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin privileges required.' }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    const reviewId = cleanText(body?.reviewId, 80);
    const action = String(body?.action || '').trim().toLowerCase();

    if (!reviewId || !['publish', 'hide'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Valid reviewId and action are required.' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const now = new Date().toISOString();
    const update = action === 'publish'
      ? {
          moderation_status: 'published',
          is_published: true,
          moderated_at: now,
          moderated_by: user.id,
          published_at: now,
          updated_at: now
        }
      : {
          moderation_status: 'hidden',
          is_published: false,
          moderated_at: now,
          moderated_by: user.id,
          published_at: null,
          updated_at: now
        };

    const supabase = createAdminClient();
    const { data: review, error } = await supabase
      .from('customer_reviews')
      .update(update)
      .eq('id', reviewId)
      .select('*')
      .single();

    if (error) throw error;

    revalidatePublishedReviews();

    return NextResponse.json({ success: true, review }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Reviews API PATCH]', error);
    return NextResponse.json({ success: false, error: 'Unable to update this review.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
export const PATCH = withApiObservability(PATCH_impl);
