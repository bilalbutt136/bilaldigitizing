/**
 * Premium Web Audio API Harmonic Bell Synthesizer
 * Plays high-clarity, studio-quality harmonic chimes with natural acoustic resonance.
 * Includes strict debouncing to guarantee sounds only play ONCE per notification event.
 */

let audioContextInstance = null;
let hasUserInteracted = false;
let lastSoundPlayedTime = 0;
const SOUND_DEBOUNCE_MS = 350; // Prevent duplicate rapid ringing while allowing immediate responses

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

export const playNotificationSound = (type = 'chat', force = false) => {
  try {
    if (typeof window === 'undefined') return;

    // Check if user disabled audio in localStorage
    try {
      const isMuted = localStorage.getItem('bdigi_audio_enabled') === 'false';
      if (isMuted && !force) return;
    } catch {}

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextInstance || audioContextInstance.state === 'closed') {
      audioContextInstance = new AudioCtx();
    }

    const ctx = audioContextInstance;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Anti-Double-Ring Debounce Guard: Guarantee only ONE crisp chime plays per event
    const nowMs = Date.now();
    if (!force && nowMs - lastSoundPlayedTime < SOUND_DEBOUNCE_MS) {
      return;
    }
    lastSoundPlayedTime = nowMs;

    const now = ctx.currentTime;

    if (type === 'notification' || type === 'bell') {
      // 🔔 High-Volume Premium Crystal Bell Chime (F#6 / 1479.98 Hz -> C#7 / 2217.46 Hz)
      // Layered dual-harmonic chime with clean attack and luxurious acoustic decay
      
      // Note 1: Fundamental + Overtone (Starts at 0.00s)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1479.98, now); // F#6
      
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.70, now + 0.006); // Crisp loud attack
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.32);

      // Note 2: Harmonic Peak Bell (Starts at 0.08s, rings out loud & clear)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2217.46, now + 0.08); // C#7
      
      gain2.gain.setValueAtTime(0.001, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.85, now + 0.088); // High volume peak
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.70); // Long sweet bell decay

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.70);

      // Sub-harmonic body warmth (Adds depth so it doesn't sound thin or piercing)
      const oscBody = ctx.createOscillator();
      const gainBody = ctx.createGain();
      oscBody.type = 'triangle';
      oscBody.frequency.setValueAtTime(1108.73, now + 0.08); // C#6 Warmth
      
      gainBody.gain.setValueAtTime(0.001, now + 0.08);
      gainBody.gain.linearRampToValueAtTime(0.30, now + 0.09);
      gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      oscBody.connect(gainBody);
      gainBody.connect(ctx.destination);
      oscBody.start(now + 0.08);
      oscBody.stop(now + 0.45);

    } else if (type === 'chat' || type === 'message' || type === 'receive') {
      // 💬 Melodic Incoming Message Ping (A5 / 880Hz -> E6 / 1318.5Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.75, now + 0.005);
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
      gain.gain.linearRampToValueAtTime(0.35, now + 0.004);
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
      gain.gain.linearRampToValueAtTime(0.65, now + 0.005);
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
 * Convenient loud and clear chime for incoming chat messages
 */
export const playMessageChime = (force = false) => {
  playNotificationSound('chat', force);
};

export default playNotificationSound;

