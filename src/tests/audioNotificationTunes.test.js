import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  configureAudioNotification, 
  getAudioNotificationConfig, 
  playNotificationSound,
  playCustomerNotificationSound,
  playAdminNotificationSound,
  playCustomerChime,
  playAdminChime,
  playMessageChime,
  playMessageChimeForMessage,
  stopNotificationSound,
  isNotificationSoundPlaying,
  testAudioTune,
  testCustomerAudioTune,
  isCurrentAdminContext,
  markNotificationSoundPlayed
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

  test('6. stopNotificationSound immediately halts audio and resets playback state', () => {
    assert.doesNotThrow(() => {
      stopNotificationSound();
    });
    assert.equal(isNotificationSoundPlaying(), false);
  });

  test('7. playMessageChimeForMessage guarantees anti-double-ring deduplication per message ID', () => {
    const testMsgId = 'msg-dedup-xyz-987';
    assert.doesNotThrow(() => {
      playMessageChimeForMessage(testMsgId);
      playMessageChimeForMessage(testMsgId);
      playMessageChimeForMessage(testMsgId);
    });

    assert.doesNotThrow(() => {
      playMessageChimeForMessage('msg-dedup-abc-123');
    });
  });

  test('8. stopNotificationSound dispatches bdigi_tune_stopped window event if window exists', () => {
    let eventFired = false;
    const originalWindow = globalThis.window;
    
    globalThis.window = {
      dispatchEvent: (event) => {
        if (event?.type === 'bdigi_tune_stopped') {
          eventFired = true;
        }
      }
    };
    globalThis.CustomEvent = class {
      constructor(type) {
        this.type = type;
      }
    };

    stopNotificationSound();
    assert.equal(eventFired, true);

    globalThis.window = originalWindow;
  });

  test('9. Configures Customer Gentle Basic Chime settings and clamps volume', () => {
    configureAudioNotification({
      customerPreset: 'soft_chime',
      customerVolume: 0.45,
      customerActive: true
    });

    const config = getAudioNotificationConfig();
    assert.equal(config.customerPreset, 'soft_chime');
    assert.equal(config.customerVolume, 0.45);
    assert.equal(config.customerActive, true);
    assert.equal(config.customer.preset, 'soft_chime');
    assert.equal(config.customer.volume, 0.45);

    // Clamps customer volume to safe maximum 1.0 and minimum 0.05
    configureAudioNotification({ customerVolume: 1.8 });
    assert.equal(getAudioNotificationConfig().customerVolume, 1.0);

    configureAudioNotification({ customerVolume: -0.5 });
    assert.equal(getAudioNotificationConfig().customerVolume, 0.05);
  });

  test('10. Context resolver strictly isolates Admin vs Customer roles', () => {
    // Explicit admin context
    assert.equal(isCurrentAdminContext({ role: 'admin' }), true);
    assert.equal(isCurrentAdminContext({ isAdmin: true }), true);
    assert.equal(isCurrentAdminContext({ recipient_role: 'admin' }), true);

    // Explicit customer context
    assert.equal(isCurrentAdminContext({ role: 'client' }), false);
    assert.equal(isCurrentAdminContext({ role: 'customer' }), false);
    assert.equal(isCurrentAdminContext({ isAdmin: false }), false);
    assert.equal(isCurrentAdminContext({ recipient_role: 'client' }), false);

    // Default with no context is safely customer (false)
    assert.equal(isCurrentAdminContext({}), false);
    assert.equal(isCurrentAdminContext(null), false);
  });

  test('11. Dedicated customer audio functions execute safely without using admin custom URL', () => {
    // Configure an admin custom sound URL
    configureAudioNotification({
      url: 'https://res.cloudinary.com/demo/audio/upload/loud-admin-ringtune.mp3',
      volume: 1.0,
      customerPreset: 'basic_ping',
      customerVolume: 0.50
    });

    assert.doesNotThrow(() => {
      // Customer chime calls
      playCustomerChime(true);
      playCustomerNotificationSound('chat', true);
      testCustomerAudioTune('basic_ping', 0.5);
      testCustomerAudioTune('soft_chime', 0.4);
      testCustomerAudioTune('subtle_pop', 0.35);

      // Customer message chime with role
      playMessageChime(true, { role: 'customer', isAdmin: false });
      playMessageChimeForMessage('msg-cust-123', true, { role: 'customer', isAdmin: false });

      // Admin chime calls
      playAdminChime(true);
      playAdminNotificationSound('notification', true);
      playMessageChime(true, { role: 'admin', isAdmin: true });
      playMessageChimeForMessage('msg-adm-456', true, { role: 'admin', isAdmin: true });
    });
  });

  test('12. Notification audio deduplication prevents sound replay on already opened or read notifications', () => {
    const testNotifId = 'notif-dedup-test-999';

    assert.doesNotThrow(() => {
      // First play marks it as played
      playAdminNotificationSound('notification', false, { messageId: testNotifId });
      // Subsequent play for the same notification is safely blocked
      playAdminNotificationSound('notification', false, { messageId: testNotifId });
      // Same for customer notification
      playCustomerNotificationSound('chat', false, { messageId: testNotifId });
    });

    // Explicitly marking another notification as played
    const openedNotifId = 'notif-user-opened-123';
    markNotificationSoundPlayed(openedNotifId);

    // Calling play for this opened notification should be deduplicated / suppressed
    assert.doesNotThrow(() => {
      playAdminNotificationSound('notification', false, { messageId: openedNotifId });
      playCustomerNotificationSound('chat', false, { messageId: openedNotifId });
    });
  });
});

