import { NextResponse } from 'next/server';
import { createClient } from '../../../../../src/lib/supabase/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'Cloudinary credentials missing.' }, { status: 500 });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'artwork';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    let fileUri;
    // Handle Blob/File
    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      fileUri = `data:${mimeType};base64,${base64Data}`;
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      fileUri = file; // Already a data URL
    } else {
      return NextResponse.json({ success: false, error: 'Invalid file format' }, { status: 400 });
    }

    // Upload to Cloudinary securely
    const uploadResult = await cloudinary.uploader.upload(fileUri, {
      folder: folder,
      type: 'authenticated',
      resource_type: 'auto'
    });

    // Generate signed delivery URL (does not expire)
    const signedUrl = cloudinary.url(uploadResult.public_id, {
      type: 'authenticated',
      secure: true,
      sign_url: true,
      resource_type: uploadResult.resource_type
    });

    return NextResponse.json({
      success: true,
      url: signedUrl,
      public_id: uploadResult.public_id
    });

  } catch (err) {
    console.error('Cloudinary Upload API Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
