import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  // Only allow proxying from our Supabase storage
  if (!url.includes('.supabase.co/storage/')) {
    return NextResponse.json({ error: 'invalid url' }, { status: 403 });
  }

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
  }

  const blob = await response.blob();
  return new NextResponse(blob, {
    headers: {
      'Content-Type': blob.type || 'image/jpeg',
      'Content-Disposition': `attachment; filename="${req.nextUrl.searchParams.get('name') || 'photo.jpg'}"`,
    },
  });
}
