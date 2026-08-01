/**
 * High-Visibility Web Audio API Ringtone & Sound Synthesizer
 * Plays crisp, loud, attention-grabbing ringtone alerts tuned for high audibility across speakers.
 * Frequency range: 850Hz - 2200Hz with dual-pulse acoustic ringing.
 */

let globalAudioCtx = null;

// Initialize or resume shared AudioContext safely
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    globalAudioCtx = new AudioCtx();
  }

  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }

  return globalAudioCtx;
};

// Automatic listener to unlock AudioContext on initial user interaction (browser policy compliance)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Play synthesized sound alert or loud ringtone
 * @param {'ringtone' | 'incoming_chat' | 'receive' | 'notification' | 'message' | 'send'} type 
 */
export const playNotificationSound = (type = 'notification') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Loud, distinct multi-pulse ringtone (LOUD ALARM RING FOR SLEEPING USERS / ADMINS)
    if (type === 'ringtone' || type === 'incoming_chat' || type === 'receive') {
      // 2 Burst Cycles of High-Pitched Dual Ring Tone
      const pulses = [0, 0.28, 0.56]; // 3 rapid ring bursts

      pulses.forEach((pulseOffset) => {
        // High Bell Osc 1 (1400Hz -> 1800Hz sweep)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1400, now + pulseOffset);
        osc1.frequency.exponentialRampToValueAtTime(1800, now + pulseOffset + 0.12);

        gain1.gain.setValueAtTime(0.75, now + pulseOffset);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + pulseOffset + 0.22);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now + pulseOffset);
        osc1.stop(now + pulseOffset + 0.22);

        // Harmonic Ring Osc 2 (950Hz -> 1350Hz counter-tone for rich acoustics)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(950, now + pulseOffset + 0.04);
        osc2.frequency.exponentialRampToValueAtTime(1350, now + pulseOffset + 0.16);

        gain2.gain.setValueAtTime(0.6, now + pulseOffset + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + pulseOffset + 0.24);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now + pulseOffset + 0.04);
        osc2.stop(now + pulseOffset + 0.24);
      });

    } else if (type === 'message' || type === 'notification') {
      // Crisp 3-note attention chime (1050Hz -> 1400Hz -> 1750Hz)
      const notes = [1050, 1400, 1750];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.55, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });

    } else if (type === 'send') {
      // Subtle metallic pop for sending message
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

    } else {
      // Default alert chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (err) {
    console.warn('Web Audio notification sound error:', err);
  }
};

/**
 * Live test helper to trigger loud ringtone manually for user confirmation
 */
export const testPlayRingtone = () => {
  playNotificationSound('ringtone');
};
