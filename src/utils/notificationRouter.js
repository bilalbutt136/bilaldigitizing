'use client';

import { stopNotificationSound, markNotificationSoundPlayed } from './audioNotification.js';

/**
 * Parses notification data and determines target order, chat, tab, and destination URL.
 */
export function parseNotificationTarget(notif, orders = []) {
  if (!notif) {
    return { 
      type: 'unknown', 
      orderId: null, 
      conversationId: null, 
      targetTab: 'orders',
      adminTab: 'orders',
      customerTab: 'orders',
      mobileTab: 'orders'
    };
  }

  let orderId = notif.order_id || notif.orderId || notif.metadata?.order_id || notif.metadata?.orderId || null;
  let conversationId = notif.conversation_id || notif.conversationId || notif.metadata?.conversation_id || notif.chatId || null;

  // 1. Try extracting orderId from notif.id (e.g. "ord-deliv-2264", "notif-ord-2264-admin", "ord-stat-2264-in_progress", "rev-2264-17283")
  if (!orderId && notif.id) {
    const idMatch = String(notif.id).match(/^(?:ord-deliv-|notif-ord-|ord-stat-|notif-paid-|notif-rev-|notif-comp-|notif-cancel-|ord-created-|rev-)(.+?)(?:-(?:admin|client|\d+))?$/i);
    if (idMatch && idMatch[1] && idMatch[1] !== 'undefined' && idMatch[1] !== 'null') {
      orderId = idMatch[1];
    }
  }

  // 2. Try extracting from link (e.g. "/client-portal?tab=orders&trackOrder=2264" or "?chatId=...")
  if (notif.link) {
    try {
      const urlObj = new URL(notif.link, 'https://dummy.local');
      if (!orderId) {
        orderId = urlObj.searchParams.get('trackOrder') || 
                  urlObj.searchParams.get('orderId') || 
                  urlObj.searchParams.get('order_id') || 
                  urlObj.searchParams.get('order');
      }
      if (!conversationId) {
        conversationId = urlObj.searchParams.get('chatId') || 
                         urlObj.searchParams.get('conversation_id') || 
                         urlObj.searchParams.get('conversationId') || 
                         urlObj.searchParams.get('convId');
      }
    } catch {}
  }

  const titleLower = String(notif.title || '').toLowerCase();
  const messageLower = String(notif.message || notif.body || '').toLowerCase();
  const typeLower = String(notif.type || notif.category || '').toLowerCase();

  // 3. Try extracting order ID from title/message regex (e.g. "Order #2264: SUBMITTED", "Order 2264", "Job #2264")
  if (!orderId) {
    const ordMatch = (notif.title || '').match(/(?:Order|Job)\s*#?([a-zA-Z0-9_-]+)/i) ||
                     (notif.message || '').match(/(?:Order|Job)\s*#?([a-zA-Z0-9_-]+)/i);
    if (ordMatch && ordMatch[1]) {
      orderId = ordMatch[1].trim();
    }
  }

  // 4. Try extracting from "New Order: IMG_5608 - Vector Art (Qty: 1)"
  if (!orderId) {
    const newOrdMatch = (notif.title || '').match(/(?:New Order:\s*)([^\s\-–(]+)/i);
    if (newOrdMatch && newOrdMatch[1]) {
      orderId = newOrdMatch[1].trim();
    }
  }

  // 5. Try matching against existing loaded orders array
  let matchedOrder = null;
  if (Array.isArray(orders) && orders.length > 0) {
    if (orderId) {
      const cleanId = String(orderId).trim().replace(/^#+/, '');
      matchedOrder = orders.find(o => {
        if (!o) return false;
        const oClean = String(o?.id || '').trim().replace(/^#+/, '');
        return oClean === cleanId || o?.id === orderId || o?.id === `#${cleanId}` || (o?.title && o.title.toLowerCase().includes(cleanId.toLowerCase()));
      });
    } else {
      matchedOrder = orders.find(o => {
        if (!o) return false;
        const ordId = String(o.id || '').replace(/^#+/, '');
        const ordTitle = String(o.title || '').toLowerCase();
        if (ordId && ordId.length > 1 && (titleLower.includes(ordId.toLowerCase()) || messageLower.includes(ordId.toLowerCase()))) return true;
        if (ordTitle && ordTitle.length > 3 && (titleLower.includes(ordTitle) || messageLower.includes(ordTitle))) return true;
        return false;
      });
      if (matchedOrder) {
        orderId = matchedOrder.id;
      }
    }
  }

  // 6. Detect type: 'order' | 'offer' | 'general'
  const isOffer = titleLower.includes('offer') || 
                  titleLower.includes('quote') || 
                  typeLower.includes('offer');

  const isOrder = Boolean(orderId) || 
                  titleLower.includes('order') || 
                  titleLower.includes('delivered') || 
                  titleLower.includes('revision') || 
                  titleLower.includes('modification') || 
                  titleLower.includes('submitted') || 
                  titleLower.includes('payment') || 
                  titleLower.includes('paid') || 
                  titleLower.includes('production') || 
                  titleLower.includes('digitiz') || 
                  titleLower.includes('vector') || 
                  titleLower.includes('patch');

  if (isOffer || isOrder || orderId) {
    return {
      type: isOffer ? 'offer' : 'order',
      orderId,
      conversationId: null,
      matchedOrder,
      targetTab: 'orders',
      adminTab: 'orders',
      customerTab: 'orders',
      mobileTab: 'orders'
    };
  }

  if (isOrder || orderId) {
    return {
      type: 'order',
      orderId,
      conversationId,
      matchedOrder,
      targetTab: 'orders',
      adminTab: 'orders',
      customerTab: 'orders',
      mobileTab: 'orders'
    };
  }

  return {
    type: 'general',
    orderId: null,
    conversationId: null,
    matchedOrder: null,
    targetTab: 'dashboard',
    adminTab: 'dashboard',
    customerTab: 'dashboard',
    mobileTab: 'home',
    customLink: notif.link || null
  };
}

/**
 * Universal click handler for notifications across all portals, mobile app, and top header.
 */
export function handleNotificationClick(notif, context = {}) {
  if (!notif) return;

  const {
    markNotificationAsRead,
    markGlobalNotificationAsRead,
    authUser,
    currentUser,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    orders = [],
    openOrderTrackerDrawer,
    setSelectedOrderForDrawer,
    setActiveAdminTab,
    setActiveCustomerTab,
    setMobileTab,
    mobileMode,
    navigate,
    protectedNavigate,
    currentView
  } = context;

  // 1. Immediately silence any active bell tune and register notification as opened/played
  try {
    stopNotificationSound();
    if (notif.id) markNotificationSoundPlayed(notif.id);
  } catch {}

  // 2. Mark as read
  if (notif.id) {
    if (typeof markNotificationAsRead === 'function') markNotificationAsRead(notif.id);
    if (typeof markGlobalNotificationAsRead === 'function') markGlobalNotificationAsRead(notif.id);
  }

  const user = authUser || currentUser;
  const isUserLoggedIn = isAuthenticated || Boolean(user?.email);
  const isAdmin = user?.role === 'admin' || currentView === 'admin';

  // 2. Parse target
  const target = parseNotificationTarget(notif, orders);

  // 3. Handle unauthenticated state
  if (!isUserLoggedIn) {
    if (typeof setIsAuthModalOpen === 'function') {
      if (typeof setAuthModalMode === 'function') setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
    return;
  }

  const isMobile = mobileMode === 'app';

  // 4. Standalone Mobile App Mode / Mobile Viewport
  if (isMobile) {
    if (target.type === 'chat' || target.type === 'inbox') {
      if (typeof setMobileTab === 'function') setMobileTab('inbox');
    } else if (target.type === 'order' || target.type === 'offer') {
      if (typeof setMobileTab === 'function') setMobileTab('orders');
      if (target.orderId) {
        if (typeof openOrderTrackerDrawer === 'function') {
          openOrderTrackerDrawer(target.matchedOrder || target.orderId);
        } else if (typeof setSelectedOrderForDrawer === 'function') {
          setSelectedOrderForDrawer(target.matchedOrder || { 
            id: String(target.orderId).startsWith('#') ? target.orderId : `#${target.orderId}`, 
            title: `Order #${String(target.orderId).replace(/^#+/, '')}`, 
            status: 'in_progress' 
          });
        }
      }
    } else {
      if (typeof setMobileTab === 'function') setMobileTab(target.mobileTab || 'home');
    }
    return;
  }

  // 5. Admin Desk Routing
  if (isAdmin) {
    if (target.type === 'order' || target.type === 'offer') {
      if (typeof setActiveAdminTab === 'function') setActiveAdminTab('orders');

      if (target.orderId) {
        if (typeof openOrderTrackerDrawer === 'function') {
          openOrderTrackerDrawer(target.matchedOrder || target.orderId);
        } else if (typeof setSelectedOrderForDrawer === 'function') {
          setSelectedOrderForDrawer(target.matchedOrder || { 
            id: String(target.orderId).startsWith('#') ? target.orderId : `#${target.orderId}`, 
            title: `Order #${String(target.orderId).replace(/^#+/, '')}`, 
            status: 'in_progress' 
          });
        }
      }

      const adminOrderUrl = `/admin-portal?tab=orders${target.orderId ? `&trackOrder=${encodeURIComponent(target.orderId)}` : ''}`;
      if (typeof protectedNavigate === 'function') protectedNavigate('admin');
      if (typeof navigate === 'function') navigate(adminOrderUrl);
    } else if (target.customLink) {
      if (typeof navigate === 'function') navigate(target.customLink);
      else if (typeof window !== 'undefined') window.location.href = target.customLink;
    } else {
      if (typeof setActiveAdminTab === 'function') setActiveAdminTab(target.adminTab || 'dashboard');
      if (typeof protectedNavigate === 'function') protectedNavigate('admin');
      if (typeof navigate === 'function') navigate('/admin-portal');
    }
    return;
  }

  // 6. Customer Portal Routing
  if (target.type === 'order' || target.type === 'offer') {
    if (typeof setActiveCustomerTab === 'function') setActiveCustomerTab('orders');

    if (target.orderId) {
      if (typeof openOrderTrackerDrawer === 'function') {
        openOrderTrackerDrawer(target.matchedOrder || target.orderId);
      } else if (typeof setSelectedOrderForDrawer === 'function') {
        setSelectedOrderForDrawer(target.matchedOrder || { 
          id: String(target.orderId).startsWith('#') ? target.orderId : `#${target.orderId}`, 
          title: `Order #${String(target.orderId).replace(/^#+/, '')}`, 
          status: 'in_progress' 
        });
      }
    }

    const custOrderUrl = `/client-portal?tab=orders${target.orderId ? `&trackOrder=${encodeURIComponent(target.orderId)}` : ''}`;
    if (typeof protectedNavigate === 'function') protectedNavigate('customer');
    if (typeof navigate === 'function') navigate(custOrderUrl);
  } else if (target.customLink) {
    if (typeof navigate === 'function') navigate(target.customLink);
    else if (typeof window !== 'undefined') window.location.href = target.customLink;
  } else {
    if (typeof setActiveCustomerTab === 'function') setActiveCustomerTab(target.customerTab || 'dashboard');
    if (typeof protectedNavigate === 'function') protectedNavigate('customer');
    if (typeof navigate === 'function') navigate('/client-portal');
  }
}

/**
 * Detects if a notification represents an "Order Placed" event.
 */
export function isOrderPlacedNotification(notif) {
  if (!notif) return false;
  const id = String(notif.id || '').toLowerCase();
  const title = String(notif.title || '').toLowerCase();

  if (id.startsWith('ord-created-') || id.includes('notif-ord-') || id.startsWith('notif-created-')) {
    return true;
  }
  if (
    title.includes('order placed') || 
    title.includes('order received') || 
    title.includes('order submitted') || 
    title.includes('placed successfully') || 
    title.includes('placed!')
  ) {
    return true;
  }
  return false;
}

/**
 * Detects if a notification represents a "Payment Confirmed" event.
 */
export function isOrderPaymentConfirmedNotification(notif) {
  if (!notif) return false;
  const id = String(notif.id || '').toLowerCase();
  const title = String(notif.title || '').toLowerCase();
  const message = String(notif.message || notif.body || '').toLowerCase();

  if (id.startsWith('ord-paid-') || id.includes('notif-paid-')) {
    return true;
  }
  if (
    title.includes('payment confirmed') || 
    title.includes('payment received') || 
    title.includes('offer paid') || 
    title.includes('in production!')
  ) {
    return true;
  }
  if (
    message.includes('payment confirmed') || 
    message.includes('payment has been received') || 
    message.includes('payment received')
  ) {
    return true;
  }
  return false;
}

/**
 * Detects if a notification represents an "Order Delivered / Files Ready" event.
 */
export function isOrderDeliveredNotification(notif) {
  if (!notif) return false;
  const id = String(notif.id || '').toLowerCase();
  const title = String(notif.title || '').toLowerCase();
  const message = String(notif.message || notif.body || '').toLowerCase();

  if (id.startsWith('ord-deliv-') || id.includes('notif-deliv-')) {
    return true;
  }
  if (
    title.includes('delivered') || 
    title.includes('files ready') || 
    title.includes('files are ready') || 
    title.includes('order files ready') || 
    title.includes('order delivered')
  ) {
    return true;
  }
  if (
    message.includes('files are ready for download') || 
    message.includes('files delivered') || 
    message.includes('ready for inspection and download')
  ) {
    return true;
  }
  return false;
}

/**
 * Filters and sanitizes notifications:
 * 1. Privacy Isolation: Guests see 0 notifications. Clients strictly see only notifications matching their email.
 * 2. Message Suppression: Excludes chat/message notifications (which have their own dedicated chat badge).
 * 3. Essential order lifecycle rule: For any single order, clean deduplicated notifications are shown:
 *    - Exactly 1 Order Placed notification
 *    - Exactly 1 Payment Confirmed notification
 *    - Exactly 1 Order Delivered notification (files ready for download)
 */
export function filterAndSanitizeNotifications(notifications, { currentUserEmail = '', isAdmin = false, orders = [] } = {}) {
  if (!Array.isArray(notifications) || notifications.length === 0) return [];

  const cleanUserEmail = (currentUserEmail || '').toLowerCase().trim();

  // If unauthenticated (no email and not admin), strictly return empty array
  if (!cleanUserEmail && !isAdmin) {
    return [];
  }

  const normalizeItem = (notif) => {
    const dateObj = resolveNotificationDate(notif, orders);
    const iso = dateObj ? dateObj.toISOString() : (notif.created_at || notif.timestamp || new Date().toISOString());
    return {
      ...notif,
      created_at: notif.created_at || iso,
      timestamp: notif.timestamp || iso || notif.created_at
    };
  };

  // Maps to enforce at most 1 Placed, 1 Paid, and 1 Delivered notification per order for customers
  const orderPlacedMap = new Map(); // orderId -> notification
  const orderPaidMap = new Map();   // orderId -> notification
  const orderDeliveredMap = new Map(); // orderId -> notification
  const otherNotifications = [];

  for (const rawNotif of notifications) {
    if (!rawNotif || !rawNotif.id) continue;
    const notif = normalizeItem(rawNotif);

    const notifType = String(notif.type || '').toLowerCase();
    const notifTitle = String(notif.title || '').toLowerCase();

    // 1. Exclude chat / direct messages
    if (notifType === 'chat' || notifType === 'message' || notifTitle.includes('new message')) {
      continue;
    }

    // 2. Strict Recipient & Privacy Isolation
    const notifRole = String(notif.recipient_role || notif.recipientRole || '').toLowerCase().trim();
    const notifEmail = String(notif.recipient_email || notif.recipientEmail || notif.client_email || '').toLowerCase().trim();

    if (isAdmin) {
      // Admin sees admin notifications and broadcasts
      const isForAdmin = notifRole === 'admin' || notifRole === 'all' || notifTitle.startsWith('🚨') || notifTitle.includes('new order:');
      if (!isForAdmin) continue;
    } else {
      // Customer: NEVER allow admin or worker notifications
      if (notifRole === 'admin' || notifRole === 'worker') {
        continue;
      }
      if (notifEmail) {
        if (notifEmail !== cleanUserEmail) {
          continue; // Strict privacy: belongs to another client
        }
      } else {
        // If no recipient email, ONLY allowed if explicitly broadcast to 'all'
        if (notifRole !== 'all') {
          continue;
        }
      }
    }

    // If admin, preserve all admin notifications
    if (isAdmin) {
      otherNotifications.push(notif);
      continue;
    }

    // 3. For Customers: Check if notification is tied to an order
    let orderId = notif.order_id || notif.orderId || null;
    if (!orderId) {
      const parsed = parseNotificationTarget(notif);
      orderId = parsed.orderId;
    }

    if (orderId) {
      const cleanOrderId = String(orderId).trim().replace(/^#+/, '');
      const isPlaced = isOrderPlacedNotification(notif);
      const isPaid = isOrderPaymentConfirmedNotification(notif);
      const isDelivered = isOrderDeliveredNotification(notif);

      if (isPlaced) {
        // Keep only 1 placed notification per order (prefer latest)
        if (!orderPlacedMap.has(cleanOrderId)) {
          orderPlacedMap.set(cleanOrderId, notif);
        }
      } else if (isPaid) {
        // Keep only 1 paid notification per order (prefer latest)
        if (!orderPaidMap.has(cleanOrderId)) {
          orderPaidMap.set(cleanOrderId, notif);
        }
      } else if (isDelivered) {
        // Keep only 1 delivered notification per order (cleanly deduplicated)
        if (!orderDeliveredMap.has(cleanOrderId)) {
          orderDeliveredMap.set(cleanOrderId, notif);
        }
      }
      // Intermediate status/internal updates are filtered out to prevent spam
    } else {
      // Non-order notification (e.g. system broadcast or custom offer received)
      otherNotifications.push(notif);
    }
  }

  const combined = [
    ...Array.from(orderPlacedMap.values()),
    ...Array.from(orderPaidMap.values()),
    ...Array.from(orderDeliveredMap.values()),
    ...otherNotifications
  ];

  // Sort descending by resolved exact date
  combined.sort((a, b) => {
    const timeA = (resolveNotificationDate(a, orders) || new Date(0)).getTime();
    const timeB = (resolveNotificationDate(b, orders) || new Date(0)).getTime();
    return timeB - timeA;
  });

  return combined;
}

/**
 * Resolves the real Date object for a notification from direct fields or linked order
 */
export function resolveNotificationDate(notif, orders = []) {
  if (!notif) return null;
  if (notif instanceof Date) return isNaN(notif.getTime()) ? null : notif;
  if (typeof notif === 'number') {
    const d = new Date(notif);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof notif === 'string') {
    const trimmed = notif.trim();
    if (/^\d{11,14}$/.test(trimmed)) {
      const d = new Date(parseInt(trimmed, 10));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Object lookup
  let raw = notif.created_at || notif.timestamp || notif.createdAt || notif.date || notif.time || notif.order_date || notif.updated_at;

  // If missing directly, check linked order in orders array
  if (!raw && orders && Array.isArray(orders) && orders.length > 0) {
    let orderId = notif.order_id || notif.orderId || null;
    if (!orderId && notif.id) {
      const match = String(notif.id).match(/^(?:ord-deliv-|notif-ord-|ord-stat-|notif-paid-|notif-rev-|notif-comp-|notif-cancel-|ord-created-|rev-)(.+?)(?:-(?:admin|client|\d+))?$/i);
      if (match && match[1]) orderId = match[1];
    }
    if (!orderId && notif.title) {
      const ordMatch = (notif.title || '').match(/(?:Order|Job)\s*#?([a-zA-Z0-9_-]+)/i);
      if (ordMatch && ordMatch[1]) orderId = ordMatch[1];
    }
    if (orderId) {
      const cleanTarget = String(orderId).trim().replace(/^#+/, '').toLowerCase();
      const matched = orders.find(o => {
        const oId = String(o.id || o.order_id || '').trim().replace(/^#+/, '').toLowerCase();
        return oId === cleanTarget || oId.endsWith(cleanTarget) || cleanTarget.endsWith(oId);
      });
      if (matched) {
        raw = matched.created_at || matched.createdAt || matched.timestamp || matched.order_date || matched.date;
      }
    }
  }

  // Fallback: check if notif.id contains unix timestamp (e.g. notif-1727244983000-abcd)
  if (!raw && notif.id) {
    const tsMatch = String(notif.id).match(/(\d{12,14})/);
    if (tsMatch && tsMatch[1]) {
      const parsedNum = parseInt(tsMatch[1], 10);
      const testDate = new Date(parsedNum);
      if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 2024 && testDate.getFullYear() <= 2030) {
        return testDate;
      }
    }
  }

  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === 'number') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^\d{11,14}$/.test(trimmed)) {
      const d = new Date(parseInt(trimmed, 10));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Formats notification exact time for UI pills (e.g. "Today, 10:15 AM", "Yesterday, 4:30 PM", "Sep 24, 3:15 PM")
 */
export function formatNotificationExactTime(notif, orders = []) {
  const dateObj = resolveNotificationDate(notif, orders);
  if (!dateObj) return 'Recent';

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();

  const timeStr = dateObj.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  const isToday = now.toDateString() === dateObj.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === dateObj.toDateString();

  if (isToday) {
    if (diffMs >= 0 && diffMs < 60000) {
      return `Just now (${timeStr})`;
    }
    return `Today, ${timeStr}`;
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  const isCurrentYear = now.getFullYear() === dateObj.getFullYear();
  const datePart = dateObj.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(isCurrentYear ? {} : { year: 'numeric' })
  });

  return `${datePart}, ${timeStr}`;
}

/**
 * Full exact localized date-time for tooltips (title attribute)
 */
export function getNotificationFullDateTime(notif, orders = []) {
  const dateObj = resolveNotificationDate(notif, orders);
  if (!dateObj) return '';
  return dateObj.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

