/**
 * Complete Visitor Telemetry & Attribution Engine
 * Captures comprehensive technical, attribution, device, and session details
 * for Meta Pixel, analytics, and studio activity logging.
 */

// Generate a deterministic or random UUID v4
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// SHA-256 Hasher for Meta Advanced Matching (email, phone, etc.)
export async function sha256(str) {
  if (!str) return '';
  const clean = String(str).trim().toLowerCase();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const buffer = new TextEncoder().encode(clean);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {}
  }
  return clean;
}

/**
 * Detects device category based on user agent and screen traits
 */
export const detectDeviceType = () => {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent || '';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'Mobile';
  }
  if (window.innerWidth <= 768) {
    return 'Mobile';
  }
  if (window.innerWidth <= 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return 'Tablet';
  }
  return 'Desktop';
};

/**
 * Detects operating system
 */
export const detectOS = () => {
  if (typeof window === 'undefined') return 'Unknown OS';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/CrOS/i.test(ua)) return 'Chrome OS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
};

/**
 * Detects browser brand and approximate version
 */
export const detectBrowser = () => {
  if (typeof window === 'undefined') return 'Unknown Browser';
  const ua = navigator.userAgent || '';
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Google Chrome';
  if (/Safari/i.test(ua) && !/Chrome\//i.test(ua)) return 'Apple Safari';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  return 'Modern Browser';
};

/**
 * Parses referrer URL into a human-readable channel & domain
 */
export const parseReferrerInfo = (rawReferrer = '', currentHostname = '') => {
  const ref = (rawReferrer || '').trim();
  if (!ref) {
    return {
      channel: 'Direct',
      trafficChannel: 'Direct',
      domain: 'Direct',
      trafficSource: 'Direct',
      searchEngine: null,
      socialNetwork: null,
      raw: ''
    };
  }

  try {
    const parsed = new URL(ref);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const currentHost = (currentHostname || (typeof window !== 'undefined' ? window.location.hostname : '')).toLowerCase().replace(/^www\./, '');

    if (currentHost && (host === currentHost || host.endsWith(`.${currentHost}`))) {
      return {
        channel: 'Direct / Internal',
        trafficChannel: 'Direct / Internal',
        domain: host,
        trafficSource: host,
        searchEngine: null,
        socialNetwork: null,
        raw: ref
      };
    }

    // Search Engines
    let searchEngine = null;
    if (host.includes('google.')) searchEngine = 'Google';
    else if (host.includes('bing.com')) searchEngine = 'Bing';
    else if (host.includes('yahoo.com')) searchEngine = 'Yahoo';
    else if (host.includes('duckduckgo.com')) searchEngine = 'DuckDuckGo';
    else if (host.includes('baidu.com')) searchEngine = 'Baidu';
    else if (host.includes('yandex.')) searchEngine = 'Yandex';

    if (searchEngine) {
      return {
        channel: 'Organic Search',
        trafficChannel: 'Organic Search',
        domain: parsed.hostname,
        trafficSource: parsed.hostname,
        searchEngine,
        socialNetwork: null,
        raw: ref
      };
    }

    // Social Platforms
    let socialNetwork = null;
    if (host.includes('facebook.com') || host.includes('fb.me') || host.includes('m.facebook.com') || host.includes('l.facebook.com')) {
      socialNetwork = 'Facebook';
    } else if (host.includes('instagram.com')) {
      socialNetwork = 'Instagram';
    } else if (host.includes('tiktok.com')) {
      socialNetwork = 'TikTok';
    } else if (host.includes('linkedin.com')) {
      socialNetwork = 'LinkedIn';
    } else if (host.includes('pinterest.com')) {
      socialNetwork = 'Pinterest';
    } else if (host.includes('twitter.com') || host.includes('t.co') || host.includes('x.com')) {
      socialNetwork = 'Twitter / X';
    } else if (host.includes('youtube.com') || host.includes('youtu.be')) {
      socialNetwork = 'YouTube';
    } else if (host.includes('reddit.com')) {
      socialNetwork = 'Reddit';
    } else if (host.includes('whatsapp.com')) {
      socialNetwork = 'WhatsApp';
    }

    if (socialNetwork) {
      return {
        channel: 'Social Media',
        trafficChannel: 'Social Media',
        domain: host,
        trafficSource: host,
        searchEngine: null,
        socialNetwork,
        raw: ref
      };
    }

    return {
      channel: 'Referral',
      trafficChannel: 'Referral',
      domain: host,
      trafficSource: host,
      searchEngine: null,
      socialNetwork: null,
      raw: ref
    };
  } catch {
    return {
      channel: 'Referral',
      trafficChannel: 'Referral',
      domain: ref,
      trafficSource: ref,
      searchEngine: null,
      socialNetwork: null,
      raw: ref
    };
  }
};

/**
 * Extracts campaign UTM tags and ad click identifiers from URL query
 */
export const extractMarketingParams = (searchQuery = null) => {
  try {
    let queryStr = searchQuery;
    if (queryStr === null && typeof window !== 'undefined') {
      queryStr = window.location.search;
    }
    if (!queryStr) {
      return {
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        fbclid: null,
        gclid: null,
        ttclid: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmTerm: null,
        utmContent: null
      };
    }

    const sp = new URLSearchParams(queryStr);
    const params = {};

    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ttclid'];
    utmKeys.forEach(key => {
      const val = sp.get(key);
      params[key] = val ? val.trim() : null;
    });

    params.utmSource = params.utm_source;
    params.utmMedium = params.utm_medium;
    params.utmCampaign = params.utm_campaign;
    params.utmTerm = params.utm_term;
    params.utmContent = params.utm_content;

    return params;
  } catch {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      fbclid: null,
      gclid: null,
      ttclid: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null
    };
  }
};

/**
 * Manages unique persistent visitor and session identifiers
 */
export const getSessionAndVisitorState = () => {
  if (typeof window === 'undefined') {
    return {
      visitorId: 'anon',
      sessionId: 'sess_init',
      visitCount: 1,
      isReturning: false,
      firstSeen: new Date().toISOString(),
      landingPage: '/'
    };
  }

  let visitorId = '';
  let visitCount = 1;
  let isReturning = false;
  let firstSeen = '';

  try {
    visitorId = localStorage.getItem('bdigi_vid');
    if (!visitorId) {
      visitorId = `vid_${generateUUID().slice(0, 18)}`;
      localStorage.setItem('bdigi_vid', visitorId);
      localStorage.setItem('bdigi_v_first_seen', new Date().toISOString());
      localStorage.setItem('bdigi_v_count', '1');
      visitCount = 1;
      isReturning = false;
      firstSeen = new Date().toISOString();
    } else {
      firstSeen = localStorage.getItem('bdigi_v_first_seen') || new Date().toISOString();
      visitCount = parseInt(localStorage.getItem('bdigi_v_count') || '1', 10);
      isReturning = true;
    }
  } catch {
    visitorId = `vid_${Date.now()}`;
  }

  let sessionId = '';
  let landingPage = '';
  try {
    sessionId = sessionStorage.getItem('bdigi_sid');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${generateUUID().slice(0, 8)}`;
      sessionStorage.setItem('bdigi_sid', sessionId);
      sessionStorage.setItem('bdigi_landing_page', window.location.pathname + window.location.search);
      landingPage = window.location.pathname + window.location.search;

      // Increment visit count for a new session
      if (isReturning) {
        visitCount += 1;
        try { localStorage.setItem('bdigi_v_count', String(visitCount)); } catch {}
      }
    } else {
      landingPage = sessionStorage.getItem('bdigi_landing_page') || window.location.pathname;
    }
  } catch {
    sessionId = `sess_${Date.now()}`;
    landingPage = window.location.pathname;
  }

  return {
    visitorId,
    sessionId,
    visitCount,
    isReturning,
    firstSeen,
    landingPage
  };
};

/**
 * Extracts and formats the complete telemetry bundle for any visitor
 */
export const getVisitorTelemetry = (authUser = null, customRole = null) => {
  if (typeof window === 'undefined') return {};

  const deviceType = detectDeviceType();
  const os = detectOS();
  const browser = detectBrowser();
  const refInfo = parseReferrerInfo(document.referrer);
  const mktParams = extractMarketingParams();
  const sessionState = getSessionAndVisitorState();

  // Determine user identity
  let userRole = customRole || 'Guest Visitor';
  let userEmail = null;
  let userName = null;
  let userId = null;

  if (authUser && typeof authUser === 'object') {
    userId = authUser.id || null;
    userEmail = (authUser.email || '').toLowerCase().trim();
    userName = authUser.name || authUser.fullName || authUser.user_metadata?.full_name || '';
    
    if (authUser.role === 'admin' || authUser.role === 'staff') {
      userRole = userEmail ? `Platform Admin (${userEmail})` : 'Platform Admin';
    } else {
      userRole = userName && userEmail ? `Customer (${userName} <${userEmail}>)` : (userEmail ? `Customer (${userEmail})` : (userName || 'Customer'));
    }
  } else {
    // Check localStorage auth
    try {
      const stored = localStorage.getItem('auth_user') || localStorage.getItem('bdigi_auth_user');
      if (stored) {
        const p = JSON.parse(stored);
        if (p && typeof p === 'object') {
          userId = p.id || null;
          userEmail = (p.email || '').toLowerCase().trim();
          userName = p.name || p.fullName || '';
          if (p.role === 'admin' || p.role === 'staff') {
            userRole = userEmail ? `Platform Admin (${userEmail})` : 'Platform Admin';
          } else {
            userRole = userName && userEmail ? `Customer (${userName} <${userEmail}>)` : (userEmail ? `Customer (${userEmail})` : 'Customer');
          }
        }
      }
    } catch {}
  }

  if (userRole === 'Guest Visitor' && sessionState.isReturning) {
    userRole = `Returning Visitor (Visit #${sessionState.visitCount})`;
  }

  // Construct structured traffic source label
  let trafficSummary = refInfo.channel;
  if (mktParams.utm_source) {
    trafficSummary = `${mktParams.utm_source}${mktParams.utm_medium ? ` (${mktParams.utm_medium})` : ''}${mktParams.utm_campaign ? ` [${mktParams.utm_campaign}]` : ''}`;
  } else if (mktParams.fbclid) {
    trafficSummary = 'Facebook Ad / Post (fbclid)';
  } else if (mktParams.gclid) {
    trafficSummary = 'Google Ad (gclid)';
  } else if (refInfo.domain && refInfo.domain !== 'Direct') {
    trafficSummary = `${refInfo.channel} (${refInfo.domain})`;
  }

  return {
    // Identity
    userRole,
    userId,
    userEmail,
    userName,
    visitorId: sessionState.visitorId,
    sessionId: sessionState.sessionId,
    visitCount: sessionState.visitCount,
    isReturning: sessionState.isReturning,
    firstSeen: sessionState.firstSeen,

    // Navigation & Page
    pagePath: window.location.pathname || '/',
    pageTitle: typeof document !== 'undefined' ? document.title : '',
    pageUrl: window.location.href,
    landingPage: sessionState.landingPage,

    // Attribution & Marketing
    referrer: document.referrer || '',
    referrerDomain: refInfo.domain,
    trafficChannel: refInfo.channel,
    trafficSource: trafficSummary,
    utmSource: mktParams.utm_source || null,
    utmMedium: mktParams.utm_medium || null,
    utmCampaign: mktParams.utm_campaign || null,
    utmTerm: mktParams.utm_term || null,
    utmContent: mktParams.utm_content || null,
    fbclid: mktParams.fbclid || null,
    gclid: mktParams.gclid || null,
    ttclid: mktParams.ttclid || null,

    // Technology & Device
    deviceType,
    os,
    browser,
    screenResolution: typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : '—',
    viewportSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '—',
    language: typeof navigator !== 'undefined' ? navigator.language : 'en',
    timezone: (() => {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
    })(),

    // Timestamps
    timestamp: new Date().toISOString()
  };
};

/**
 * Resolves accurate user identity string for event logs
 */
export const resolveUserIdentity = (userObj = null, customRole = null) => {
  if (customRole) return customRole;

  if (userObj && typeof userObj === 'object') {
    if (userObj.role === 'admin' || userObj.role === 'staff') {
      return userObj.email ? `Platform Admin (${userObj.email})` : 'Platform Admin';
    }
    const name = userObj.name || userObj.fullName || userObj.user_metadata?.full_name || '';
    if (userObj.email) {
      return name ? `Customer (${name} <${userObj.email}>)` : `Customer (${userObj.email})`;
    }
    return name || 'Customer';
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth_user') || localStorage.getItem('bdigi_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (parsed.role === 'admin' || parsed.role === 'staff') {
            return parsed.email ? `Platform Admin (${parsed.email})` : 'Platform Admin';
          }
          const name = parsed.name || parsed.fullName || '';
          if (parsed.email) {
            return name ? `Customer (${name} <${parsed.email}>)` : `Customer (${parsed.email})`;
          }
          return name || 'Customer';
        }
      }
    } catch {}
  }

  return 'Guest Visitor';
};

