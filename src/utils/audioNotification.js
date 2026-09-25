/**
 * Premium Web Audio API Harmonic Bell Synthesizer & Custom Audio Tune Engine
 * 
 * Features:
 * 1. Supports custom uploaded audio tunes (MP3, WAV, OGG, M4A, AAC) from Cloudinary / Supabase.
 * 2. High-clarity Web Audio API harmonic bell synthesizer fallback (zero external dependencies).
 * 3. Preloads active audio tunes for instantaneous zero-latency playback.
 * 4. Strict debouncing to guarantee sounds only play ONCE per notification event.
 * 5. Robust volume control and automatic browser interaction audio unlocking.
 */

let audioContextInstance = null;
let hasUserInteracted = false;
let lastSoundPlayedTime = 0;
const SOUND_DEBOUNCE_MS = 350; // Prevent duplicate rapid ringing while allowing immediate responses

// In-memory cache for fast, synchronized access
let cachedCustomAudioUrl = null;
let cachedCustomAudioName = null;
let cachedCustomAudioActive = true;
let cachedAudioVolume = 1.0;
let cachedAudioPreset = 'custom';
let preloadedAudioElement = null;

// Initialize cached settings from localStorage if available
if (typeof localStorage !== 'undefined') {
  try {
    cachedCustomAudioUrl = localStorage.getItem('bdigi_custom_audio_url') || null;
    cachedCustomAudioName = localStorage.getItem('bdigi_custom_audio_name') || null;
    cachedCustomAudioActive = localStorage.getItem('bdigi_custom_audio_active') !== 'false';
    const savedVol = localStorage.getItem('bdigi_audio_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed)) cachedAudioVolume = Math.max(0, Math.min(1, parsed));
    }
    cachedAudioPreset = localStorage.getItem('bdigi_audio_preset') || 'custom';

    if (cachedCustomAudioUrl && typeof Audio !== 'undefined') {
      preloadedAudioElement = new Audio();
      preloadedAudioElement.preload = 'auto';
      preloadedAudioElement.src = cachedCustomAudioUrl;
    }
  } catch {}
}

/**
 * Configure audio notification settings globally.
 * Persists to localStorage and preloads audio.
 */
export const configureAudioNotification = ({ url, name, active = true, volume = 1.0, preset = 'custom' }) => {
  try {
    if (url !== undefined) cachedCustomAudioUrl = url || null;
    if (name !== undefined) cachedCustomAudioName = name || null;
    if (active !== undefined) cachedCustomAudioActive = active !== false;
    if (volume !== undefined) cachedAudioVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (preset !== undefined) cachedAudioPreset = preset || 'custom';

    if (typeof localStorage !== 'undefined') {
      if (cachedCustomAudioUrl) {
        localStorage.setItem('bdigi_custom_audio_url', cachedCustomAudioUrl);
      } else if (url !== undefined) {
        localStorage.removeItem('bdigi_custom_audio_url');
      }

      if (cachedCustomAudioName) {
        localStorage.setItem('bdigi_custom_audio_name', cachedCustomAudioName);
      } else if (name !== undefined) {
        localStorage.removeItem('bdigi_custom_audio_name');
      }

      localStorage.setItem('bdigi_custom_audio_active', String(cachedCustomAudioActive));
      localStorage.setItem('bdigi_audio_volume', String(cachedAudioVolume));
      localStorage.setItem('bdigi_audio_preset', cachedAudioPreset);
    }

    // Preload into memory for instantaneous response in browser
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
    isMuted
  };
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
};

// Listen for any user interaction on window to unlock Web Audio immediately
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('pointerdown', handleInteraction);
    window.removeEventListener('mousedown', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
    window.removeEventListener('click', handleInteraction);
  };

  window.addEventListener('pointerdown', handleInteraction, { passive: true });
  window.addEventListener('mousedown', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
  window.addEventListener('click', handleInteraction, { passive: true });
}

/**
 * Synthesizes a high-clarity harmonic bell chime or melodic ping via Web Audio API.
 */
const playSynthesizedChime = (type = 'notification', volume = 1.0) => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextInstance || audioContextInstance.state === 'closed') {
      audioContextInstance = new AudioCtx();
    }

    const ctx = audioContextInstance;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const volScale = Math.max(0.1, Math.min(1.0, volume));

    if (type === 'notification' || type === 'bell' || type === 'crystal_bell') {
      // 🔔 High-Volume Premium Crystal Bell Chime (F#6 / 1479.98 Hz -> C#7 / 2217.46 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1479.98, now); // F#6
      
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.70 * volScale, now + 0.006);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.32);

      // Note 2: Harmonic Peak Bell (C#7)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2217.46, now + 0.08); // C#7
      
      gain2.gain.setValueAtTime(0.001, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.85 * volScale, now + 0.088);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.70);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.70);

      // Sub-harmonic warmth
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

    } else if (type === 'ding_dong') {
      // 🛎️ Classic Two-Tone Resonant Doorbell (G5 / 784 Hz -> E5 / 659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now); // G5
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
      osc2.frequency.setValueAtTime(659.25, now + 0.22); // E5
      gain2.gain.setValueAtTime(0.001, now + 0.22);
      gain2.gain.linearRampToValueAtTime(0.80 * volScale, now + 0.228);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.75);

    } else if (type === 'chat' || type === 'message' || type === 'receive' || type === 'melodic_ping') {
      // 💬 Melodic Incoming Message Ping (A5 / 880Hz -> E6 / 1318.5Hz)
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

    } else if (type === 'send') {
      // ✉️ Subtle Outgoing Message Pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.exponentialRampToValueAtTime(1479.98, now + 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35 * volScale, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

    } else {
      // ⚡ Clean Confirmation Chime (1046.5Hz -> 1567.98Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.65 * volScale, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (err) {
    // Fail gracefully
  }
};

/**
 * Primary sound alert player.
 * Checks for custom uploaded audio first, falling back to crystal bell chime synthesizer.
 */
export const playNotificationSound = (type = 'chat', force = false) => {
  try {
    // Check if user disabled audio in localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const isMuted = localStorage.getItem('bdigi_audio_enabled') === 'false';
        if (isMuted && !force) return;
      }
    } catch {}

    // Anti-Double-Ring Debounce Guard: Guarantee only ONE crisp chime plays per event
    const nowMs = Date.now();
    if (!force && nowMs - lastSoundPlayedTime < SOUND_DEBOUNCE_MS) {
      return;
    }
    lastSoundPlayedTime = nowMs;

    unlockAudioContext();

    // 1. If custom audio tune is configured, active, and selected as tune
    const activeUrl = cachedCustomAudioUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_custom_audio_url') : null);
    const isCustomActive = cachedCustomAudioActive && (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_custom_audio_active') !== 'false' : true);
    const activePreset = cachedAudioPreset || (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_audio_preset') : 'custom');
    const activeVol = cachedAudioVolume !== undefined ? cachedAudioVolume : 1.0;

    // Play custom uploaded tune if available and active in browser
    if (activeUrl && isCustomActive && (activePreset === 'custom' || !activePreset) && typeof Audio !== 'undefined') {
      try {
        const audio = preloadedAudioElement && preloadedAudioElement.src === activeUrl
          ? preloadedAudioElement.cloneNode()
          : new Audio(activeUrl);
        
        audio.volume = Math.max(0, Math.min(1, activeVol));
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[AudioNotification] Custom audio play notice, playing synthesized bell:', err?.message);
            playSynthesizedChime(type, activeVol);
          });
        }
        return;
      } catch (err) {
        console.warn('[AudioNotification] Custom audio play exception, falling back to synth:', err?.message);
      }
    }

    // 2. Play preset or fallback synthesized bell chime
    const targetTone = (activePreset && activePreset !== 'custom') ? activePreset : type;
    playSynthesizedChime(targetTone, activeVol);

  } catch (err) {
    // Fail gracefully without crashing UI
  }
};

/**
 * Convenient loud and clear chime for incoming chat messages
 */
export const playMessageChime = (force = false) => {
  playNotificationSound('chat', force);
};

/**
 * Dedicated sound tester for Admin Portal preview & validation.
 * Plays the specified tune directly and returns the audio play promise or true.
 */
export const testAudioTune = (customUrl, volume = 1.0, preset = 'custom') => {
  unlockAudioContext();
  const safeVol = Math.max(0, Math.min(1, Number(volume) || 1.0));

  if (customUrl && (preset === 'custom' || !preset) && typeof Audio !== 'undefined') {
    try {
      const audio = new Audio(customUrl);
      audio.volume = safeVol;
      return audio.play();
    } catch (err) {
      playSynthesizedChime('bell', safeVol);
      return Promise.resolve(true);
    }
  } else {
    playSynthesizedChime(preset || 'bell', safeVol);
    return Promise.resolve(true);
  }
};

export default playNotificationSound;
