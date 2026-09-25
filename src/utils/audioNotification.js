/**
 * Premium Web Audio API Harmonic Bell Synthesizer & Segregated Audio Tune Engine
 * 
 * Strict Dual-Role Architecture:
 * 1. ADMIN SIDE: High, prominent custom uploaded audio tune (MP3, WAV, OGG, M4A)
 *    or crystal studio bell alerts at full admin volume so no order or message is ever missed.
 * 2. CUSTOMER SIDE: Basic, gentle, subtle chime / melodic ping at comfortable volume
 *    that NEVER uses the admin's custom uploaded audio tune, guaranteeing zero disturbance.
 * 3. INSTANT STOP: stopNotificationSound() immediately silences any tune when read or acknowledged.
 * 4. ANTI-DOUBLE-RING: Strict debouncing & message ID deduplication guarantees sounds only play ONCE.
 */

let audioContextInstance = null;
let hasUserInteracted = false;
let lastSoundPlayedTime = 0;
const SOUND_DEBOUNCE_MS = 1400; // Prevent duplicate rapid ringing while allowing crisp single alerts

// Active audio tracking for instantaneous cancellation when read
let currentPlayingAudio = null;

// Registry of message IDs that have already played their tune (Anti-Double-Ring Guarantee)
const playedMessageIds = new Set();
const MAX_PLAYED_HISTORY = 300;

// ── Admin Audio Cache ────────────────────────────────────────────────────────
let cachedCustomAudioUrl = null;
let cachedCustomAudioName = null;
let cachedCustomAudioActive = true;
let cachedAudioVolume = 1.0;
let cachedAudioPreset = 'custom';
let preloadedAudioElement = null;

// ── Customer Basic Chime Cache ──────────────────────────────────────────────
let cachedCustomerAudioActive = true;
let cachedCustomerAudioVolume = 0.50; // Comfortable, gentle default volume
let cachedCustomerAudioPreset = 'basic_ping'; // 'basic_ping' | 'soft_chime' | 'subtle_pop'

// Initialize cached settings from localStorage if available
if (typeof localStorage !== 'undefined') {
  try {
    // Admin settings
    cachedCustomAudioUrl = localStorage.getItem('bdigi_admin_audio_url') || localStorage.getItem('bdigi_custom_audio_url') || null;
    cachedCustomAudioName = localStorage.getItem('bdigi_admin_audio_name') || localStorage.getItem('bdigi_custom_audio_name') || null;
    cachedCustomAudioActive = localStorage.getItem('bdigi_admin_audio_active') !== 'false' && localStorage.getItem('bdigi_custom_audio_active') !== 'false';
    const savedVol = localStorage.getItem('bdigi_admin_audio_volume') || localStorage.getItem('bdigi_audio_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed)) cachedAudioVolume = Math.max(0, Math.min(1, parsed));
    }
    cachedAudioPreset = localStorage.getItem('bdigi_admin_audio_preset') || localStorage.getItem('bdigi_audio_preset') || 'custom';

    // Customer settings
    cachedCustomerAudioActive = localStorage.getItem('bdigi_customer_audio_active') !== 'false';
    const savedCustVol = localStorage.getItem('bdigi_customer_audio_volume');
    if (savedCustVol !== null) {
      const parsedCust = parseFloat(savedCustVol);
      if (!isNaN(parsedCust)) cachedCustomerAudioVolume = Math.max(0.05, Math.min(1.0, parsedCust));
    }
    cachedCustomerAudioPreset = localStorage.getItem('bdigi_customer_audio_preset') || 'basic_ping';

    if (cachedCustomAudioUrl && typeof Audio !== 'undefined') {
      preloadedAudioElement = new Audio();
      preloadedAudioElement.preload = 'auto';
      preloadedAudioElement.src = cachedCustomAudioUrl;
    }
  } catch {}
}

/**
 * Configure audio notification settings globally.
 * Supports separate admin and customer parameters, persists to localStorage.
 */
export const configureAudioNotification = (config = {}) => {
  try {
    const adminCfg = config.admin || {};
    const customerCfg = config.customer || {};

    // Admin properties (accept top-level or nested admin)
    const url = config.url !== undefined ? config.url : adminCfg.url;
    const name = config.name !== undefined ? config.name : adminCfg.name;
    const active = config.active !== undefined ? config.active : adminCfg.active;
    const volume = config.volume !== undefined ? config.volume : adminCfg.volume;
    const preset = config.preset !== undefined ? config.preset : adminCfg.preset;

    if (url !== undefined) cachedCustomAudioUrl = url || null;
    if (name !== undefined) cachedCustomAudioName = name || null;
    if (active !== undefined) cachedCustomAudioActive = active !== false;
    if (volume !== undefined) cachedAudioVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (preset !== undefined) cachedAudioPreset = preset || 'custom';

    // Customer properties
    const custActive = config.customerActive !== undefined ? config.customerActive : customerCfg.active;
    const custVolume = config.customerVolume !== undefined ? config.customerVolume : customerCfg.volume;
    const custPreset = config.customerPreset !== undefined ? config.customerPreset : customerCfg.preset;

    if (custActive !== undefined) cachedCustomerAudioActive = custActive !== false;
    if (custVolume !== undefined) cachedCustomerAudioVolume = Math.max(0.05, Math.min(1, Number(custVolume) || 0.5));
    if (custPreset !== undefined) cachedCustomerAudioPreset = custPreset || 'basic_ping';

    if (typeof localStorage !== 'undefined') {
      // Store admin keys
      if (cachedCustomAudioUrl) {
        localStorage.setItem('bdigi_admin_audio_url', cachedCustomAudioUrl);
        localStorage.setItem('bdigi_custom_audio_url', cachedCustomAudioUrl);
      } else if (url !== undefined) {
        localStorage.removeItem('bdigi_admin_audio_url');
        localStorage.removeItem('bdigi_custom_audio_url');
      }

      if (cachedCustomAudioName) {
        localStorage.setItem('bdigi_admin_audio_name', cachedCustomAudioName);
        localStorage.setItem('bdigi_custom_audio_name', cachedCustomAudioName);
      } else if (name !== undefined) {
        localStorage.removeItem('bdigi_admin_audio_name');
        localStorage.removeItem('bdigi_custom_audio_name');
      }

      localStorage.setItem('bdigi_admin_audio_active', String(cachedCustomAudioActive));
      localStorage.setItem('bdigi_custom_audio_active', String(cachedCustomAudioActive));
      localStorage.setItem('bdigi_admin_audio_volume', String(cachedAudioVolume));
      localStorage.setItem('bdigi_audio_volume', String(cachedAudioVolume));
      localStorage.setItem('bdigi_admin_audio_preset', cachedAudioPreset);
      localStorage.setItem('bdigi_audio_preset', cachedAudioPreset);

      // Store customer keys
      localStorage.setItem('bdigi_customer_audio_active', String(cachedCustomerAudioActive));
      localStorage.setItem('bdigi_customer_audio_volume', String(cachedCustomerAudioVolume));
      localStorage.setItem('bdigi_customer_audio_preset', cachedCustomerAudioPreset);
    }

    // Preload admin custom audio into memory for instantaneous response
    if (typeof Audio !== 'undefined') {
      if (cachedCustomAudioUrl) {
        try {
          preloadedAudioElement = new Audio();
          preloadedAudioElement.preload = 'auto';
          preloadedAudioElement.src = cachedCustomAudioUrl;
        } catch {}
      } else {
        preloadedAudioElement = null;
      }
    }
  } catch (err) {
    console.warn('[AudioNotification] Configure notice:', err);
  }
};

/**
 * Get current active audio settings.
 */
export const getAudioNotificationConfig = () => {
  const isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_audio_enabled') === 'false' : false;
  return {
    url: cachedCustomAudioUrl,
    name: cachedCustomAudioName,
    active: cachedCustomAudioActive,
    volume: cachedAudioVolume,
    preset: cachedAudioPreset,
    admin: {
      url: cachedCustomAudioUrl,
      name: cachedCustomAudioName,
      active: cachedCustomAudioActive,
      volume: cachedAudioVolume,
      preset: cachedAudioPreset
    },
    customer: {
      active: cachedCustomerAudioActive,
      volume: cachedCustomerAudioVolume,
      preset: cachedCustomerAudioPreset
    },
    customerPreset: cachedCustomerAudioPreset,
    customerVolume: cachedCustomerAudioVolume,
    customerActive: cachedCustomerAudioActive,
    isMuted
  };
};

// ── Persistent HTML5 Audio instances & WAV Blob synthesizers ─────────────────
let persistentAdminAudio = null;
let persistentCustomerAudio = null;
let defaultBellBlobUrl = null;
let defaultCustomerBlobUrl = null;

/**
 * Creates a zero-latency, high-clarity 16-bit 22.05kHz crystal bell WAV Blob URL natively in browser.
 * Dual-harmonic tone: 1479.98 Hz (F#6) + 2217.46 Hz (C#7) with smooth natural decay.
 * Dedicated to ADMIN PORTAL.
 */
export function getDefaultBellBlobUrl() {
  if (defaultBellBlobUrl) return defaultBellBlobUrl;
  if (typeof window === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return null;
  try {
    const sampleRate = 22050;
    const duration = 0.55;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    view.setUint32(0, 0x52494646, false); // 'RIFF'
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false); // 'WAVE'
    view.setUint32(12, 0x666d7420, false); // 'fmt '
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // 'data'
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 6.5);
      const sample = decay * (
        0.65 * Math.sin(2 * Math.PI * 1479.98 * t) +
        0.35 * Math.sin(2 * Math.PI * 2217.46 * t)
      );
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, Math.floor(clamped * 32767), true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    defaultBellBlobUrl = URL.createObjectURL(blob);
    return defaultBellBlobUrl;
  } catch {
    return null;
  }
}

/**
 * Creates a zero-latency, gentle 16-bit 22.05kHz soft chime WAV Blob URL natively in browser.
 * Smooth harmonic ping (880 Hz -> 1318.5 Hz) with gentle exponential decay.
 * Dedicated to CUSTOMER PORTAL — soft, non-intrusive, never disturbs the client.
 */
export function getDefaultCustomerChimeBlobUrl() {
  if (defaultCustomerBlobUrl) return defaultCustomerBlobUrl;
  if (typeof window === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return null;
  try {
    const sampleRate = 22050;
    const duration = 0.38;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let freq = 880;
      let decay = Math.exp(-t * 9.0);
      if (t > 0.055) {
        freq = 1318.51;
        decay = Math.exp(-(t - 0.055) * 8.0);
      }
      // Gentle amplitude (0.35 max), very soft and warm
      const sample = 0.35 * decay * (
        0.85 * Math.sin(2 * Math.PI * freq * t) +
        0.15 * Math.sin(2 * Math.PI * (freq / 2) * t)
      );
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, Math.floor(clamped * 32767), true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    defaultCustomerBlobUrl = URL.createObjectURL(blob);
    return defaultCustomerBlobUrl;
  } catch {
    return null;
  }
}

function getPersistentAudio(isAdmin = true) {
  if (typeof Audio === 'undefined') return null;
  if (isAdmin) {
    if (!persistentAdminAudio) {
      try {
        persistentAdminAudio = new Audio();
        persistentAdminAudio.preload = 'auto';
      } catch {}
    }
    return persistentAdminAudio;
  } else {
    if (!persistentCustomerAudio) {
      try {
        persistentCustomerAudio = new Audio();
        persistentCustomerAudio.preload = 'auto';
      } catch {}
    }
    return persistentCustomerAudio;
  }
}

/**
 * Stops any currently playing notification sound or tune immediately.
 * Called when a message is read, when a conversation is opened, or when acknowledged.
 */
export const stopNotificationSound = () => {
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch {}
    currentPlayingAudio = null;
  }
  if (persistentAdminAudio) {
    try {
      persistentAdminAudio.pause();
      persistentAdminAudio.currentTime = 0;
    } catch {}
  }
  if (persistentCustomerAudio) {
    try {
      persistentCustomerAudio.pause();
      persistentCustomerAudio.currentTime = 0;
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bdigi_tune_stopped'));
  }
};

/**
 * Checks whether an audio tune is currently playing.
 */
export const isNotificationSoundPlaying = () => {
  return Boolean(
    (currentPlayingAudio && !currentPlayingAudio.paused && !currentPlayingAudio.ended) ||
    (persistentAdminAudio && !persistentAdminAudio.paused && !persistentAdminAudio.ended) ||
    (persistentCustomerAudio && !persistentCustomerAudio.paused && !persistentCustomerAudio.ended)
  );
};

/**
 * Unlocks Web Audio API and HTMLAudio on modern browsers requiring user gesture.
 */
export const unlockAudioContext = () => {
  hasUserInteracted = true;
  try {
    const AudioCtx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (AudioCtx && (!audioContextInstance || audioContextInstance.state === 'closed')) {
      audioContextInstance = new AudioCtx();
    }
    if (audioContextInstance && audioContextInstance.state === 'suspended') {
      audioContextInstance.resume().catch(() => {});
    }
  } catch {}

  // Prime persistent HTML5 Audio elements on user gesture
  try {
    const audio = getPersistentAudio(true);
    if (audio && !audio.__primed) {
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      audio.volume = 0.01;
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audio.__primed = true;
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    }
  } catch {}
};

// Listen for any user interaction on window to keep AudioContext unlocked
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudioContext();
  };

  window.addEventListener('pointerdown', handleInteraction, { passive: true });
  window.addEventListener('mousedown', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
  window.addEventListener('click', handleInteraction, { passive: true });
}

/**
 * Context & Role Resolver:
 * Determines whether the sound request originates from or targets the Admin Portal vs Customer.
 * Default is FALSE (Customer/Public Safe Default) to strictly protect customers from loud sounds.
 */
export const isCurrentAdminContext = (context = {}) => {
  if (context?.isAdmin !== undefined) return Boolean(context.isAdmin);
  if (context?.role !== undefined) return context.role === 'admin';
  if (context?.targetRole !== undefined) return context.targetRole === 'admin';
  if (context?.recipient_role !== undefined) return context.recipient_role === 'admin';

  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname || '';
    if (pathname.includes('/admin-portal') || pathname.includes('/admin')) {
      return true;
    }
    if (window.__BDIGI_IS_ADMIN__ === true) {
      return true;
    }
    if (typeof document !== 'undefined') {
      if (document.querySelector('.admin-portal-wrapper') || document.querySelector('.admin-portal-body')) {
        return true;
      }
    }
    try {
      const savedUser = localStorage.getItem('bdigi_auth_user');
      const savedView = localStorage.getItem('bdigi_current_view');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role === 'admin' && (savedView === 'admin' || pathname.includes('admin'))) {
          return true;
        }
      }
    } catch {}
  }

  return false;
};

/**
 * Synthesizes a high-clarity harmonic bell chime or melodic alert via Web Audio API.
 * Dedicated to ADMIN PORTAL (high, loud, unmistakable alert).
 */
const playAdminSynthesizedChime = (type = 'notification', volume = 1.0) => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextInstance || audioContextInstance.state === 'closed') {
      audioContextInstance = new AudioCtx();
    }

    const ctx = audioContextInstance;

    const executeChime = () => {
      try {
        const now = ctx.currentTime;
        const volScale = Math.max(0.1, Math.min(1.0, volume));

        if (type === 'ding_dong') {
          // 🛎️ Classic Two-Tone Resonant Doorbell (G5 / 784 Hz -> E5 / 659.25 Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(783.99, now);
          gain1.gain.setValueAtTime(0.001, now);
          gain1.gain.linearRampToValueAtTime(0.75 * volScale, now + 0.008);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.42);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, now + 0.22);
          gain2.gain.setValueAtTime(0.001, now + 0.22);
          gain2.gain.linearRampToValueAtTime(0.80 * volScale, now + 0.228);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.22);
          osc2.stop(now + 0.75);

        } else if (type === 'melodic_ping') {
          // 💬 Melodic Message Ping
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.06);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.75 * volScale, now + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.40);

        } else {
          // 🔔 Default: High-Clarity Premium Crystal Bell Chime (F#6 1479.98Hz -> C#7 2217.46Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(1479.98, now);
          gain1.gain.setValueAtTime(0.001, now);
          gain1.gain.linearRampToValueAtTime(0.70 * volScale, now + 0.006);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.32);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(2217.46, now + 0.08);
          gain2.gain.setValueAtTime(0.001, now + 0.08);
          gain2.gain.linearRampToValueAtTime(0.85 * volScale, now + 0.088);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.70);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.70);

          const oscBody = ctx.createOscillator();
          const gainBody = ctx.createGain();
          oscBody.type = 'triangle';
          oscBody.frequency.setValueAtTime(1108.73, now + 0.08);
          gainBody.gain.setValueAtTime(0.001, now + 0.08);
          gainBody.gain.linearRampToValueAtTime(0.30 * volScale, now + 0.09);
          gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          oscBody.connect(gainBody);
          gainBody.connect(ctx.destination);
          oscBody.start(now + 0.08);
          oscBody.stop(now + 0.45);
        }
      } catch {}
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(executeChime).catch(executeChime);
    } else {
      executeChime();
    }
  } catch {}
};

/**
 * Synthesizes a gentle, subtle, basic chime via Web Audio API.
 * Dedicated to CUSTOMER PORTAL (soft, pleasant, non-jarring, never loud).
 */
const playCustomerSynthesizedChime = (preset = 'basic_ping', volume = 0.50) => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextInstance || audioContextInstance.state === 'closed') {
      audioContextInstance = new AudioCtx();
    }

    const ctx = audioContextInstance;

    const executeChime = () => {
      try {
        const now = ctx.currentTime;
        // Soft volume clamp: strictly capped between 0.05 and 0.65 to ensure customer is NEVER startled
        const volScale = Math.max(0.05, Math.min(0.65, Number(volume) || 0.50));

        if (preset === 'soft_chime') {
          // Warm gentle two-tone chime (G5 / 783.99 Hz -> C6 / 1046.5 Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(783.99, now);
          gain1.gain.setValueAtTime(0.001, now);
          gain1.gain.linearRampToValueAtTime(0.38 * volScale, now + 0.01);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.32);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.5, now + 0.09);
          gain2.gain.setValueAtTime(0.001, now + 0.09);
          gain2.gain.linearRampToValueAtTime(0.42 * volScale, now + 0.10);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.09);
          osc2.stop(now + 0.45);

        } else if (preset === 'subtle_pop') {
          // Gentle light message pop (B5 / 987.77 Hz -> F#6 / 1479.98 Hz)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, now);
          osc.frequency.exponentialRampToValueAtTime(1479.98, now + 0.04);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.25 * volScale, now + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.14);

        } else {
          // Default: Gentle Melodic Ping (A5 / 880 Hz -> E6 / 1318.51 Hz)
          // Soft harmonic two-tone with smooth exponential fade
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(880, now);
          osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.055);

          gain1.gain.setValueAtTime(0.001, now);
          gain1.gain.linearRampToValueAtTime(0.38 * volScale, now + 0.008);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.35);

          // Sub-harmonic warmth at low volume
          const oscSub = ctx.createOscillator();
          const gainSub = ctx.createGain();
          oscSub.type = 'sine';
          oscSub.frequency.setValueAtTime(440, now);
          gainSub.gain.setValueAtTime(0.001, now);
          gainSub.gain.linearRampToValueAtTime(0.12 * volScale, now + 0.01);
          gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          oscSub.connect(gainSub);
          gainSub.connect(ctx.destination);
          oscSub.start(now);
          oscSub.stop(now + 0.25);
        }
      } catch {}
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(executeChime).catch(executeChime);
    } else {
      executeChime();
    }
  } catch {}
};

/**
 * ── ADMIN NOTIFICATION SOUND PLAYER ──────────────────────────────────────────
 * Plays the admin's chosen high audio tune (custom uploaded file or loud studio bell).
 * Guaranteed to NEVER play on customer devices.
 */
export const playAdminNotificationSound = (type = 'notification', force = false, options = {}) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const isMuted = localStorage.getItem('bdigi_audio_enabled') === 'false';
      if (isMuted && !force) return;
    }

    const nowMs = Date.now();
    if (!force && nowMs - lastSoundPlayedTime < SOUND_DEBOUNCE_MS) return;
    lastSoundPlayedTime = nowMs;

    unlockAudioContext();
    stopNotificationSound();

    const activeUrl = cachedCustomAudioUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_admin_audio_url') || localStorage.getItem('bdigi_custom_audio_url') : null);
    const isCustomActive = cachedCustomAudioActive && (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_admin_audio_active') !== 'false' : true);
    const activePreset = cachedAudioPreset || (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_admin_audio_preset') || localStorage.getItem('bdigi_audio_preset') : 'custom');
    const activeVol = cachedAudioVolume !== undefined ? cachedAudioVolume : 1.0;

    const targetTone = (activePreset && activePreset !== 'custom') ? activePreset : type;

    // Use persistent HTML5 Audio for custom uploaded file or crystal bell fallback
    const audio = getPersistentAudio(true);
    const customPlayUrl = (activeUrl && isCustomActive && (activePreset === 'custom' || !activePreset)) ? activeUrl : null;
    const fallbackWavUrl = (activePreset === 'crystal_bell' || activePreset === 'custom' || activePreset === 'bell' || !activePreset)
      ? getDefaultBellBlobUrl()
      : null;
    const candidateUrl = customPlayUrl || fallbackWavUrl;

    let html5Started = false;
    if (candidateUrl && audio) {
      try {
        audio.volume = Math.max(0, Math.min(1, activeVol));
        audio.src = candidateUrl;
        audio.currentTime = 0;
        currentPlayingAudio = audio;

        audio.onended = () => {
          if (currentPlayingAudio === audio) currentPlayingAudio = null;
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          html5Started = true;
          playPromise.catch(() => {
            if (currentPlayingAudio === audio) currentPlayingAudio = null;
            playAdminSynthesizedChime(targetTone, activeVol);
          });
        }
      } catch {
        currentPlayingAudio = null;
      }
    }

    if (!html5Started) {
      playAdminSynthesizedChime(targetTone, activeVol);
    }
  } catch {}
};

/**
 * ── CUSTOMER NOTIFICATION SOUND PLAYER ───────────────────────────────────────
 * Plays ONLY a gentle, subtle, basic ring tune (soft melodic ping or subtle chime).
 * Strictly isolated: NEVER plays the admin's custom uploaded audio tune!
 */
export const playCustomerNotificationSound = (type = 'chat', force = false, options = {}) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const isMuted = localStorage.getItem('bdigi_audio_enabled') === 'false';
      if (isMuted && !force) return;
    }

    const nowMs = Date.now();
    if (!force && nowMs - lastSoundPlayedTime < SOUND_DEBOUNCE_MS) return;
    lastSoundPlayedTime = nowMs;

    unlockAudioContext();
    stopNotificationSound();

    const activePreset = options.preset || cachedCustomerAudioPreset || 'basic_ping';
    const activeVol = options.volume !== undefined ? options.volume : cachedCustomerAudioVolume;

    // First attempt Web Audio API synthesis for zero latency and pristine gentle tone
    let webAudioSucceeded = false;
    try {
      const AudioCtx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
      if (AudioCtx) {
        playCustomerSynthesizedChime(activePreset, activeVol);
        webAudioSucceeded = true;
      }
    } catch {}

    // Fallback to customer-specific gentle WAV Blob if Web Audio was unavailable
    if (!webAudioSucceeded) {
      const audio = getPersistentAudio(false);
      const customerWav = getDefaultCustomerChimeBlobUrl();
      if (customerWav && audio) {
        try {
          audio.volume = Math.max(0.05, Math.min(0.65, Number(activeVol) || 0.50));
          audio.src = customerWav;
          audio.currentTime = 0;
          currentPlayingAudio = audio;
          audio.onended = () => {
            if (currentPlayingAudio === audio) currentPlayingAudio = null;
          };
          audio.play().catch(() => {});
        } catch {}
      }
    }
  } catch {}
};

/**
 * Direct Convenience Helper for Customer Side
 */
export const playCustomerChime = (force = false) => {
  playCustomerNotificationSound('chat', force);
};

/**
 * Direct Convenience Helper for Admin Side
 */
export const playAdminChime = (force = false) => {
  playAdminNotificationSound('chat', force);
};

/**
 * Unified Notification Sound Player:
 * Automatically detects whether context is Admin or Customer and plays the appropriate sound.
 */
export const playNotificationSound = (type = 'chat', force = false, messageId = null, context = {}) => {
  let resolvedContext = context;
  let resolvedMsgId = messageId;

  if (messageId && typeof messageId === 'object' && (!context || Object.keys(context).length === 0)) {
    resolvedContext = messageId;
    resolvedMsgId = null;
  }

  const isAdmin = isCurrentAdminContext(resolvedContext);
  if (isAdmin) {
    playAdminNotificationSound(type, force, resolvedContext);
  } else {
    playCustomerNotificationSound(type, force, resolvedContext);
  }
};

/**
 * Unified Message Chime:
 * Plays Admin high tune in Admin Portal; plays Customer basic chime on Customer side.
 */
export const playMessageChime = (force = false, context = {}) => {
  const isAdmin = isCurrentAdminContext(context);
  if (isAdmin) {
    playAdminNotificationSound('chat', force, context);
  } else {
    playCustomerNotificationSound('chat', force, context);
  }
};

/**
 * Anti-Double-Ring Deduplication Player:
 * Guarantees that for any specific message ID, the tune will ring ONLY ONCE!
 */
export const playMessageChimeForMessage = (messageId, force = false, context = {}) => {
  if (messageId) {
    const strId = String(messageId).trim();
    if (playedMessageIds.has(strId)) {
      return;
    }
    playedMessageIds.add(strId);
    if (playedMessageIds.size > MAX_PLAYED_HISTORY) {
      const [first] = playedMessageIds;
      playedMessageIds.delete(first);
    }
  }
  playMessageChime(force, context);
};

/**
 * Dedicated sound tester for Admin Portal preview & validation.
 */
export const testAudioTune = (customUrl, volume = 1.0, preset = 'custom') => {
  unlockAudioContext();
  stopNotificationSound();

  const safeVol = Math.max(0, Math.min(1, Number(volume) || 1.0));

  if (customUrl && (preset === 'custom' || !preset) && typeof Audio !== 'undefined') {
    try {
      const audio = new Audio(customUrl);
      audio.volume = safeVol;
      currentPlayingAudio = audio;

      audio.onended = () => {
        if (currentPlayingAudio === audio) currentPlayingAudio = null;
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (currentPlayingAudio === audio) currentPlayingAudio = null;
          playAdminSynthesizedChime('bell', safeVol);
        });
      }
      return playPromise;
    } catch {
      currentPlayingAudio = null;
      playAdminSynthesizedChime('bell', safeVol);
      return Promise.resolve(true);
    }
  } else {
    playAdminSynthesizedChime(preset || 'bell', safeVol);
    return Promise.resolve(true);
  }
};

/**
 * Dedicated sound tester for Customer Portal basic gentle chime preview.
 * Allows Admin to preview exactly what customers will hear.
 */
export const testCustomerAudioTune = (preset = 'basic_ping', volume = 0.50) => {
  unlockAudioContext();
  stopNotificationSound();

  const safeVol = Math.max(0.05, Math.min(0.65, Number(volume) || 0.50));
  playCustomerSynthesizedChime(preset, safeVol);
  return Promise.resolve(true);
};

export default playNotificationSound;
