import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory typing state tracker with auto-cleanup
// Key: `${conversationId}:${senderRole}` -> timestamp
const typingState = new Map();

// Periodic cleanup of stale typing heartbeats older than 4 seconds
function cleanupStale() {
  const now = Date.now();
  for (const [key, timestamp] of typingState.entries()) {
    if (now - timestamp > 4000) {
      typingState.delete(key);
    }
  }
}

export async function GET(request) {
  cleanupStale();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId') || searchParams.get('conversation_id');
  const forRole = searchParams.get('forRole') || 'admin'; // 'admin' wants to know if 'client' is typing, and vice versa

  if (!conversationId) {
    return NextResponse.json({ isTyping: false });
  }

  const otherRole = forRole === 'admin' ? 'client' : 'admin';
  const key = `${conversationId}:${otherRole}`;
  const timestamp = typingState.get(key);

  const isTyping = Boolean(timestamp && (Date.now() - timestamp < 3500));

  return NextResponse.json({
    isTyping,
    role: otherRole,
    conversationId
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId, senderRole = 'client', isTyping = true } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const key = `${conversationId}:${senderRole}`;

    if (isTyping) {
      typingState.set(key, Date.now());
    } else {
      typingState.delete(key);
    }

    return NextResponse.json({ success: true, isTyping });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
