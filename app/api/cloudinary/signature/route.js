import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit';

const CLIENT_FOLDERS = new Set(['artwork', 'orders', 'store-orders', 'chat-attachments']);
const WORKER_FOLDERS = new Set(['worker-uploads']);
const ADMIN_FOLDERS = new Set([
  ...CLIENT_FOLDERS,
  ...WORKER_FOLDERS,
  'store-products',
  'notification-sounds',
  'branding/logo',
  'branding/favicon',
  'deliveries',
  'portfolio'
]);

function normalizeFolder(value) {
  return String(value || 'artwork')
    .replace(/[^a-zA-Z0-9_\-/]/g, '')
    .split('/')
    .filter(Boolean)
    .slice(0, 3)
    .join('/');
}

export async function GET(request) {
  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const rateLimit = await checkDistributedRateLimit(`cloudinary-signature:${user.id || getClientIp(request)}`, 60, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.unavailable ? 'Upload signing is temporarily unavailable.' : 'Too many upload signature requests.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = normalizeFolder(searchParams.get('folder'));
    const permitted = isAdmin ? ADMIN_FOLDERS : (isWorker ? new Set([...CLIENT_FOLDERS, ...WORKER_FOLDERS]) : CLIENT_FOLDERS);
    const folderRoot = folder.split('/')[0];

    if (!folder || (!permitted.has(folder) && !permitted.has(folderRoot))) {
      return NextResponse.json({ success: false, error: 'Upload folder is not permitted for this account.' }, { status: 403 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'Cloudinary credentials missing.' }, { status: 503 });
    }

    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      api_key: apiKey,
      cloud_name: cloudName
    });
  } catch (error) {
    console.error('[Cloudinary Signature Error]', error);
    return NextResponse.json({ success: false, error: 'Unable to create upload signature.' }, { status: 500 });
  }
}
