import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relPath) => fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

describe('Live Chat Floating Widget & Realtime Support System', () => {

  test('1. LiveChatWidget contains required floating launcher button matching visual spec', () => {
    const file = read('src/components/common/LiveChatWidget.jsx');

    // Floating position and styling
    assert.match(file, /fixed bottom-6 right-6 z-\[999\]/);
    assert.match(file, /linear-gradient\(135deg, #6366f1 0%, #7c3aed 50%, #4f46e5 100%\)/);

    // Online indicator dot at top-right with pulse animation
    assert.match(file, /background:\s*'#22c55e'/);
    assert.match(file, /border:\s*'2\.5px solid #ffffff'/);
    assert.match(file, /animation:\s*'ping 2s cubic-bezier\(0, 0, 0\.2, 1\) infinite'/);

    // Chat bubble SVG icon
    assert.match(file, /<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/);

    // Unread count badge
    assert.match(file, /unreadCount > 0/);
    assert.match(file, /unreadCount > 99 \? '99\+' : unreadCount/);
  });

  test('2. LiveChatWidget provides full authenticated live support and guest conversion', () => {
    const file = read('src/components/common/LiveChatWidget.jsx');

    // Authenticated path renders CustomerSupportChat with real Supabase chat
    assert.match(file, /import CustomerSupportChat from '\.\.\/customer\/CustomerSupportChat'/);
    assert.match(file, /<CustomerSupportChat/);
    assert.match(file, /onClose=\{handleClose\}/);
    assert.match(file, /onSwitchChannel=/);

    // Guest path provides instant sign-in and quick inquiry
    assert.match(file, /BDigitizing Live Support/);
    assert.match(file, /Online/);
    assert.match(file, /Typically replies in minutes/);
    assert.match(file, /fetch\('\/api\/contact'/);
    assert.match(file, /handleOpenAuth/);
    assert.match(file, /setIsAuthModalOpen\(true\)/);

    // Prompt chips for fast inquiry
    assert.match(file, /Need quote for embroidery file \(\.DST\/\.PES\)/);
    assert.match(file, /Vector art conversion turnaround time/);
    assert.match(file, /Custom patches pricing & minimum 50 pcs/);

    // WhatsApp direct reachout
    assert.match(file, /https:\/\/wa\.me\//);
    assert.match(file, /Prefer WhatsApp\? Chat on WhatsApp/);
  });

  test('3. Realtime Supabase synchronization for live chat messages and unread counts', () => {
    const file = read('src/components/common/LiveChatWidget.jsx');

    assert.match(file, /subscribeToChatMessages/);
    assert.match(file, /subscribeToConversations/);
    assert.match(file, /fetchChatUnreadCounts/);
    assert.match(file, /bdigi_new_chat_message/);
    assert.match(file, /bdigi_open_live_chat/);
  });

  test('4. ClientLayoutShell mounts LiveChatWidget on public routes and isolates app mode', () => {
    const shell = read('src/components/layout/ClientLayoutShell.jsx');

    assert.match(shell, /import\('\.\.\/common\/LiveChatWidget'\)\.then\(mod => mod\.LiveChatWidget\)/);
    assert.match(shell, /\{!isAppMode && !isCompactShell && <LiveChatWidget \/>\}/);
    assert.match(shell, /\{!isAppMode && <WhatsAppMessagePopup \/>\}/);
  });

  test('5. CustomerSupportChat supports onClose callback and container reset styling', () => {
    const chat = read('src/components/customer/CustomerSupportChat.jsx');

    assert.match(chat, /onClose = null/);
    assert.match(chat, /typeof onClose === 'function'/);
    assert.match(chat, /live-chat-floating-container \.customer-chat-root/);
  });
});
