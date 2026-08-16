/**
 * High-Pitched Web Audio API Notification Synthesizer
 * Plays ultra-crisp, high-frequency sound alerts without external heavy audio assets.
 * Frequencies tuned between 1200Hz - 2000Hz with fast exponential decay.
 */

let audioContextInstance = null;
let hasUserInteracted = false;

// Listen for first user interaction on window to initialize or resume Web Audio
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    hasUserInteracted = true;
    if (audioContextInstance && audioContextInstance.state === 'suspended') {
      audioContextInstance.resume().catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
}

export const playNotificationSound = (type = 'notification') => {
  try {
    if (typeof window === 'undefined') return;

    // Do not attempt to play if browser autoplay policy has not received a user interaction yet
    if (!hasUserInteracted) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextInstance || audioContextInstance.state === 'closed') {
      audioContextInstance = new AudioCtx();
    }

    const ctx = audioContextInstance;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (ctx.state !== 'running') return;

    const now = ctx.currentTime;

    if (type === 'notification') {
      // High-pitched 3-note rapid chime (1200Hz -> 1600Hz -> 2000Hz)
      const notes = [1200, 1600, 2000];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.2, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.12);
      });
    } else if (type === 'message' || type === 'receive') {
      // Crisp 2-tone high chime (1320Hz -> 1760Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1320, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.06);

      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.15);
    } else {
      // Short high alert pop (1500Hz -> 1800Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (err) {
    // Fail silently without cluttering console
  }
};
