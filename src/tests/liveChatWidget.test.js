import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relPath) => fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

describe('Live Chat Floating Widget & Realtime Support System', () => {

  test('1. LiveChatWidget has a clean, accessible launcher dedicated to chat', () => {
    const file = read('src/components/common/LiveChatWidget.jsx');

    assert.match(file, /live-chat-floating-btn-wrap/);
    assert.match(file, /z-index:\s*9999999/);
    assert.match(file, /className="live-chat-launcher"/);
    assert.match(file, /width:\s*56px/);
    assert.match(file, /height:\s*56px/);
    assert.match(file, /background:\s*linear-gradient\(135deg,\s*#1d4ed8/);
    assert.doesNotMatch(file, /live-chat-online-dot/);
    assert.match(file, /aria-label="Open support chat"/);
    assert.match(file, /<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/);
    assert.match(file, /unreadCount > 0/);
    assert.match(file, /unreadCount > 99 \? '99\+' : unreadCount/);
    assert.doesNotMatch(file, /animation:\s*'ping 2s/);
  });

  test('2. LiveChatWidget preserves authenticated support and a streamlined guest inquiry', () => {
    const file = read('src/components/common/LiveChatWidget.jsx');

    assert.match(file, /import\('\.\.\/customer\/CustomerSupportChat'\)/);
    assert.match(file, /<CustomerSupportChat/);
    assert.match(file, /onClose=\{handleClose\}/);
    assert.match(file, /onSwitchChannel=/);
    assert.match(file, /BDigitizing Support/);
    assert.match(file, /Get a quote/);
    assert.match(file, /Turnaround time/);
    assert.match(file, /Need quote for embroidery file \(\.DST\/\.PES\)/);
    assert.match(file, /fetch\('\/api\/chat\/guest'/);
    assert.doesNotMatch(file, /fetch\('\/api\/contact'/);
    assert.match(file, /handleOpenAuth/);
    assert.match(file, /setIsAuthModalOpen\(true\)/);
    assert.match(file, /type="email"/);
    assert.match(file, /aria-label="Your message"/);
    assert.doesNotMatch(file, /Prefer WhatsApp\? Chat on WhatsApp/);
    assert.match(file, /live-chat-composer/);
    assert.match(file, /live-chat-guest-message-row/);
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
    assert.match(shell, /<LiveChatWidget \/>/);
    assert.match(shell, /\{!isAppMode && <WhatsAppMessagePopup \/>\}/);
  });

  test('5. CustomerSupportChat supports onClose callback and container reset styling', () => {
    const chat = read('src/components/customer/CustomerSupportChat.jsx');

    assert.match(chat, /onClose = null/);
    assert.match(chat, /typeof onClose === 'function'/);
    assert.match(chat, /live-chat-floating-container \.customer-chat-root/);
  });

  test('6. Compact mobile panel, solid background and launcher hiding while chat open', () => {
    const file = read('src/components/common/LiveChatWidget.jsx');

    assert.match(file, /background-color:\s*#ffffff !important/);
    assert.match(file, /live-chat-guest/);
    assert.match(file, /opacity:\s*1 !important/);
    assert.match(file, /height: min\(510px, calc\(100dvh - 114px\)\)/);
    assert.match(file, /live-chat-floating-btn-wrap/);
    assert.match(file, /isOpen \? ' is-hidden' : ''/);
    assert.match(file, /isOpen \? \{ display: 'none', pointerEvents: 'none' \} : undefined/);
    assert.match(file, /e\.key === 'Escape'/);
    assert.match(file, /containerRef\.current/);
  });

});
