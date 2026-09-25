/**
 * Premium Web Audio API Harmonic Bell Synthesizer & Custom Audio Tune Engine
 * 
 * Features:
 * 1. Supports custom uploaded audio tunes (MP3, WAV, OGG, M4A, AAC) from Cloudinary / Supabase.
 * 2. High-clarity Web Audio API harmonic bell synthesizer fallback (zero external dependencies).
 * 3. Preloads active audio tunes for instantaneous zero-latency playback.
 * 4. Strict debouncing & message ID deduplication to guarantee sounds only play ONCE per message event.
 * 5. Instant stopNotificationSound() when messages are read or threads opened.
 * 6. Robust volume control and automatic browser interaction audio unlocking.
 */

let audioContextInstance = null;
let hasUserInteracted = false;
let lastSoundPlayedTime = 0;
const SOUND_DEBOUNCE_MS = 1800; // Prevent duplicate rapid ringing while allowing clean alerts

// Active audio tracking for instantaneous cancellation when read
let currentPlayingAudio = null;

// Registry of message IDs that have already played their tune (Anti-Double-Ring Guarantee)
const playedMessageIds = new Set();
const MAX_PLAYED_HISTORY = 300;

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
 * Stops any currently playing notification sound or tune immediately.
 * Called when a message is read, when a conversation is opened, or when acknowledged.
 */
// Persistent HTML5 Audio instance primed on interaction
let persistentAlertAudio = null;
let defaultBellBlobUrl = null;

/**
 * Creates a zero-latency, high-clarity 16-bit 22.05kHz crystal bell WAV Blob URL natively in browser.
 * Dual-harmonic tone: 1479.98 Hz (F#6) + 2217.46 Hz (C#7) with smooth natural decay.
 * Zero network request, zero external dependencies.
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

    // RIFF identifier 'RIFF'
    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + numSamples * 2, true);
    // 'WAVE'
    view.setUint32(8, 0x57415645, false);
    // 'fmt '
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true); // subchunk1 size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byteRate
    view.setUint16(32, 2, true); // blockAlign
    view.setUint16(34, 16, true); // bitsPerSample
    // 'data'
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, numSamples * 2, true);

    // Generate bell acoustics (harmonics + natural envelope)
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
 * Gets or initializes the persistent HTML5 Audio element
 */
function getPersistentAudio() {
  if (typeof Audio === 'undefined') return null;
  if (!persistentAlertAudio) {
    try {
      persistentAlertAudio = new Audio();
      persistentAlertAudio.preload = 'auto';
    } catch {}
  }
  return persistentAlertAudio;
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
  if (persistentAlertAudio) {
    try {
      persistentAlertAudio.pause();
      persistentAlertAudio.currentTime = 0;
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
    (persistentAlertAudio && !persistentAlertAudio.paused && !persistentAlertAudio.ended)
  );
};

/**
 * Unlocks Web Audio API and HTMLAudio on modern browsers requiring user gesture.
 * Primes persistent HTMLAudio with an inaudible pulse so it maintains autoplay authority.
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

  // Prime persistent HTML5 Audio element on user gesture
  try {
    const audio = getPersistentAudio();
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

// Listen for any user interaction on window to keep AudioContext & HTMLAudio unlocked
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

    const executeChime = () => {
      try {
        const now = ctx.currentTime;
        const volScale = Math.max(0.1, Math.min(1.0, volume));

        if (type === 'notification' || type === 'bell' || type === 'crystal_bell' || type === 'custom') {
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
      } catch (innerErr) {
        // Fail gracefully
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(executeChime).catch(() => {
        executeChime();
      });
    } else {
      executeChime();
    }
  } catch (err) {
    // Fail gracefully
  }
};

/**
 * Primary sound alert player.
 * Checks for custom uploaded audio first, falling back to crystal bell chime synthesizer.
 * Strictly debounces and guarantees only ONE ring per event.
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
    stopNotificationSound(); // Halt any existing playback cleanly before starting new alert

    // 1. If custom audio tune is configured, active, and selected as tune
    const activeUrl = cachedCustomAudioUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_custom_audio_url') : null);
    const isCustomActive = cachedCustomAudioActive && (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_custom_audio_active') !== 'false' : true);
    const activePreset = cachedAudioPreset || (typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_audio_preset') : 'custom');
    const activeVol = cachedAudioVolume !== undefined ? cachedAudioVolume : 1.0;

    const targetTone = (activePreset && activePreset !== 'custom') ? activePreset : type;

    // Use primed persistent HTML5 Audio element for ultra-reliable background playback
    const audio = getPersistentAudio();
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
            playSynthesizedChime(targetTone, activeVol);
          });
        }
      } catch {
        currentPlayingAudio = null;
      }
    }

    // 2. Play Web Audio synthesized chime if HTML5 was not triggered
    if (!html5Started) {
      playSynthesizedChime(targetTone, activeVol);
    }

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
 * Anti-Double-Ring Deduplication Player:
 * Guarantees that for any specific message ID, the tune will ring ONLY ONCE!
 */
export const playMessageChimeForMessage = (messageId, force = false) => {
  if (messageId) {
    const strId = String(messageId).trim();
    if (playedMessageIds.has(strId)) {
      // Already played for this message — strictly prevent secondary ring!
      return;
    }
    playedMessageIds.add(strId);
    if (playedMessageIds.size > MAX_PLAYED_HISTORY) {
      const [first] = playedMessageIds;
      playedMessageIds.delete(first);
    }
  }
  playMessageChime(force);
};

/**
 * Dedicated sound tester for Admin Portal preview & validation.
 * Plays the specified tune directly and returns the audio play promise or true.
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
          playSynthesizedChime('bell', safeVol);
        });
      }
      return playPromise;
    } catch (err) {
      currentPlayingAudio = null;
      playSynthesizedChime('bell', safeVol);
      return Promise.resolve(true);
    }
  } else {
    playSynthesizedChime(preset || 'bell', safeVol);
    return Promise.resolve(true);
  }
};

export default playNotificationSound;
