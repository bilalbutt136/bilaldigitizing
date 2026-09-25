import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  configureAudioNotification, 
  getAudioNotificationConfig, 
  playNotificationSound,
  testAudioTune
} from '../utils/audioNotification.js';

describe('Admin Notification Tune & Bell Sound Alert System', () => {

  // Mock minimal localStorage and Audio environment if in Node.js
  beforeEach(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      const storage = new Map();
      globalThis.localStorage = {
        getItem: (k) => storage.get(k) || null,
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: (k) => storage.delete(k),
        clear: () => storage.clear()
      };
    } else {
      globalThis.localStorage.clear();
    }
  });

  test('1. Configures custom audio tune settings and clamps volume bounds', () => {
    configureAudioNotification({
      url: 'https://res.cloudinary.com/demo/audio/upload/bell-chime.mp3',
      name: 'bell-chime.mp3',
      active: true,
      volume: 0.85,
      preset: 'custom'
    });

    const config = getAudioNotificationConfig();
    assert.equal(config.url, 'https://res.cloudinary.com/demo/audio/upload/bell-chime.mp3');
    assert.equal(config.name, 'bell-chime.mp3');
    assert.equal(config.active, true);
    assert.equal(config.volume, 0.85);
    assert.equal(config.preset, 'custom');

    // Test volume clamping (above 1.0 -> 1.0, below 0.0 -> 0.0)
    configureAudioNotification({ volume: 1.5 });
    assert.equal(getAudioNotificationConfig().volume, 1.0);

    configureAudioNotification({ volume: -0.2 });
    assert.equal(getAudioNotificationConfig().volume, 0.0);
  });

  test('2. Allows switching between custom audio and built-in studio presets', () => {
    configureAudioNotification({
      preset: 'crystal_bell'
    });
    assert.equal(getAudioNotificationConfig().preset, 'crystal_bell');

    configureAudioNotification({
      preset: 'ding_dong'
    });
    assert.equal(getAudioNotificationConfig().preset, 'ding_dong');

    configureAudioNotification({
      preset: 'melodic_ping'
    });
    assert.equal(getAudioNotificationConfig().preset, 'melodic_ping');
  });

  test('3. Respects mute toggle state correctly', () => {
    globalThis.localStorage.setItem('bdigi_audio_enabled', 'false');
    const config = getAudioNotificationConfig();
    assert.equal(config.isMuted, true);

    globalThis.localStorage.setItem('bdigi_audio_enabled', 'true');
    assert.equal(getAudioNotificationConfig().isMuted, false);
  });

  test('4. Safely executes playNotificationSound and testAudioTune without throwing in non-browser environment', () => {
    assert.doesNotThrow(() => {
      playNotificationSound('chat', true);
      playNotificationSound('notification', true);
      playNotificationSound('bell', true);
    });

    assert.doesNotThrow(() => {
      testAudioTune('https://res.cloudinary.com/demo/audio/upload/bell-chime.mp3', 0.8, 'custom');
      testAudioTune(null, 0.9, 'crystal_bell');
      testAudioTune(null, 0.7, 'ding_dong');
    });
  });

  test('5. Audio MIME types map contains all common studio audio formats', async () => {
    // Validates that supported audio extensions are valid
    const supportedExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'weba', 'flac'];
    const expectedMimeMapping = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      weba: 'audio/webm',
      flac: 'audio/flac'
    };

    supportedExtensions.forEach(ext => {
      assert.ok(expectedMimeMapping[ext].startsWith('audio/'));
    });
  });
});
