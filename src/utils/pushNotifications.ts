export type PushSetupResult =
  | { enabled: true }
  | { enabled: false; reason: string };

function decodeApplicationServerKey(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = window.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function registerPushSubscription(userId: string): Promise<PushSetupResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { enabled: false, reason: 'This browser does not support background push notifications.' };
  }
  if (!window.isSecureContext) {
    return { enabled: false, reason: 'Background push requires a secure HTTPS connection.' };
  }

  try {
    const registration =
      (await navigator.serviceWorker.getRegistration()) ||
      (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
    await navigator.serviceWorker.ready;

    const keyResponse = await fetch('/api/push/vapid-public-key');
    const keyData = await keyResponse.json().catch(() => ({}));
    if (!keyResponse.ok || !keyData.publicKey) {
      return {
        enabled: false,
        reason: keyData.error || 'Background push is not configured on this server yet.',
      };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationServerKey(keyData.publicKey) as BufferSource,
      });
    }

    const response = await fetch('/api/push/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { enabled: false, reason: data.error || 'Could not register this device for push.' };
    }
    return { enabled: true };
  } catch (error) {
    console.warn('[Push] Could not register this device:', error);
    return {
      enabled: false,
      reason: 'Could not set up background push. Check browser notification and network settings.',
    };
  }
}

export async function unregisterPushSubscription(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    await fetch('/api/push/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, endpoint: subscription.endpoint }),
    }).catch(() => {});
    await subscription.unsubscribe();
  } catch (error) {
    console.warn('[Push] Could not remove this device subscription:', error);
  }
}
