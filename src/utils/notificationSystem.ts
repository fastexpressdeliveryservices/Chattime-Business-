/**
 * Mobile Background Notifications & Phone Ringing Engine for Chat Time
 * Rings and alerts like a native phone app even when screen is sleeping or tab is hidden.
 */

let callAudioCtx: AudioContext | null = null;
let callRingInterval: any = null;
let isRinging = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!callAudioCtx) {
    callAudioCtx = new AudioCtx();
  }
  if (callAudioCtx.state === 'suspended') {
    callAudioCtx.resume().catch(() => {});
  }
  return callAudioCtx;
}

/**
 * Request system notification permission on mobile / desktop
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Synthesizes a loud, authentic phone ringtone pulse (dual-tone standard cellular cadence)
 */
function playPhoneRingCadence(volume: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Dual telephone frequencies (440Hz + 480Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(480, now);

    // Cadence: 1.5 seconds ring, followed by silence
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.setValueAtTime(volume * 0.4, now + 1.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
  } catch (err) {
    console.warn('Could not play phone ring cadence:', err);
  }
}

/**
 * Start phone ringing continuously (audio + vibration) for incoming call
 */
export function startCallRinging(callerName: string, callType: 'voice' | 'video' = 'voice') {
  if (isRinging) return;
  isRinging = true;

  // Immediate ring burst
  playPhoneRingCadence(0.9);

  // Vibrate mobile phone in call pattern [400ms on, 200ms off, 400ms on, 200ms off, 800ms off]
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([400, 200, 400, 200, 800]);
    } catch {}
  }

  // Repeat ring cadence every 3.2 seconds until answered or declined
  callRingInterval = setInterval(() => {
    if (!isRinging) return;
    playPhoneRingCadence(0.9);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {}
    }
  }, 3200);

  // Trigger system notification via Service Worker so it appears when phone is sleeping/locked
  showIncomingCallNotification(callerName, callType);
}

/**
 * Stop phone ringing immediately
 */
export function stopCallRinging() {
  isRinging = false;
  if (callRingInterval) {
    clearInterval(callRingInterval);
    callRingInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0); // Cancel vibration
    } catch {}
  }
}

/**
 * Display native notification for incoming call
 */
export async function showIncomingCallNotification(
  callerName: string,
  callType: 'voice' | 'video' = 'voice'
) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const title = `📞 Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`;
  const body = `${callerName} is calling you on Chat Time`;

  // Prefer ServiceWorker showNotification if available (works when phone is locked/sleeping)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        reg.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'incoming-call',
          renotify: true,
          requireInteraction: true,
          vibrate: [400, 200, 400, 200, 800],
          data: { url: '/', type: 'call' },
        } as any);
        return;
      }
    } catch (err) {
      console.warn('Service worker showNotification failed:', err);
    }
  }

  // Fallback to desktop Notification constructor
  try {
    new Notification(title, {
      body,
      icon: '/icon.svg',
      tag: 'incoming-call',
      requireInteraction: true,
    });
  } catch (err) {
    console.warn('Fallback Notification failed:', err);
  }
}

/**
 * Play message chime and display native notification for incoming chat message
 */
export async function showMessageNotification(senderName: string, messageText: string, chatId?: string) {
  // Mobile vibration: 2 short pulses
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([150, 80, 150]);
    } catch {}
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const title = senderName;
  const body = messageText || 'Sent a new message';

  // Use ServiceWorker showNotification for sleeping/background support
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        reg.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: chatId ? `chat-${chatId}` : 'new-message',
          renotify: true,
          vibrate: [150, 80, 150],
          data: { url: '/', chatId, type: 'message' },
        } as any);
        return;
      }
    } catch {}
  }

  try {
    new Notification(title, {
      body,
      icon: '/icon.svg',
      tag: chatId ? `chat-${chatId}` : 'new-message',
    });
  } catch {}
}

/**
 * Test ringtone and notification tool
 */
export async function triggerTestCallNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }
  startCallRinging('Sarah Jenkins (Chat Time)', 'voice');
  setTimeout(() => {
    stopCallRinging();
  }, 6000); // Ring for 6 seconds on test
  return true;
}
