'use client';

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

  // 6. Detect type: 'message' | 'order' | 'offer' | 'general'
  const isMessage = typeLower === 'message' || 
                    titleLower.includes('message') || 
                    titleLower.includes('support inquiry') || 
                    titleLower.includes('live chat') ||
                    messageLower.includes('sent you a message');

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

  if (isMessage || isOffer) {
    const finalChatId = conversationId || (orderId ? `order-${orderId}` : null);
    return {
      type: isOffer ? 'offer' : 'message',
      orderId,
      conversationId: finalChatId,
      matchedOrder,
      targetTab: 'inbox',
      adminTab: 'chat',
      customerTab: 'inbox',
      mobileTab: 'inbox'
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

  // 1. Mark as read
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

  // 4. Standalone 5-Tab Mobile App Mode
  if (mobileMode === 'app') {
    if (target.type === 'message' || target.type === 'offer') {
      if (typeof setMobileTab === 'function') setMobileTab('inbox');
      if (target.conversationId && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_open_order_chat', { 
          detail: { conversationId: target.conversationId, orderId: target.orderId } 
        }));
      }
    } else if (target.type === 'order') {
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
    if (target.type === 'message' || target.type === 'offer') {
      if (typeof setActiveAdminTab === 'function') setActiveAdminTab('chat');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_switch_admin_tab', { detail: { tab: 'chat', conversationId: target.conversationId, orderId: target.orderId } }));
        window.dispatchEvent(new CustomEvent('bdigi_open_order_chat', { detail: { conversationId: target.conversationId, orderId: target.orderId } }));
      }
      
      const adminChatUrl = `/admin-portal?tab=chat${target.conversationId ? `&chatId=${encodeURIComponent(target.conversationId)}` : ''}`;
      if (typeof protectedNavigate === 'function') protectedNavigate('admin');
      if (typeof navigate === 'function') navigate(adminChatUrl);
    } else if (target.type === 'order') {
      if (typeof setActiveAdminTab === 'function') setActiveAdminTab('orders');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_switch_admin_tab', { detail: { tab: 'orders', orderId: target.orderId } }));
      }

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
  if (target.type === 'message' || target.type === 'offer') {
    if (typeof setActiveCustomerTab === 'function') setActiveCustomerTab('inbox');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_switch_tab', { detail: { tab: 'inbox', conversationId: target.conversationId, orderId: target.orderId } }));
      window.dispatchEvent(new CustomEvent('bdigi_open_order_chat', { detail: { conversationId: target.conversationId, orderId: target.orderId } }));
    }

    const custChatUrl = `/client-portal?tab=inbox${target.conversationId ? `&chatId=${encodeURIComponent(target.conversationId)}` : ''}`;
    if (typeof protectedNavigate === 'function') protectedNavigate('customer');
    if (typeof navigate === 'function') navigate(custChatUrl);
  } else if (target.type === 'order') {
    if (typeof setActiveCustomerTab === 'function') setActiveCustomerTab('orders');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_switch_tab', { detail: { tab: 'orders', orderId: target.orderId } }));
    }

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
