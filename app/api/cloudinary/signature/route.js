import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'artwork';
    const timestamp = Math.round((new Date()).getTime() / 1000);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'Cloudinary credentials missing.' }, { status: 500 });
    }

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder
      },
      apiSecret
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      api_key: apiKey,
      cloud_name: cloudName
    });
  } catch (error) {
    console.error('[Cloudinary Signature Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
