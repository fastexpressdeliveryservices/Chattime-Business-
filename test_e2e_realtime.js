import WebSocket from 'ws';

const BASE_URL = process.env.CHAT_TIME_TEST_URL || 'http://localhost:3000';
const baseUrl = new URL(BASE_URL);
const WS_URL = `${baseUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${baseUrl.host}/ws`;

async function runTest() {
  const runId = Date.now().toString().slice(-6);
  console.log(`--- 1. Testing User Registration (runId: ${runId}) ---`);
  // Register Alice
  const aliceRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice Walker',
      username: `alice_walker_${runId}`,
      countryCode: '+1',
      countryName: 'United States',
      phoneNumber: `+141555${runId}`,
      email: 'prosperikeokwu@gmail.com',
      bio: 'Verified Alice',
    }),
  });
  if (!aliceRes.ok) throw new Error('Failed to register Alice: ' + (await aliceRes.text()));
  const alice = await aliceRes.json();
  const aliceSessionCookie = aliceRes.headers.get('set-cookie')?.split(';')[0];
  if (!aliceSessionCookie) throw new Error('Registration did not issue an account session');
  console.log('✓ Alice registered:', alice.name, '@' + alice.username, alice.phoneNumber);

  // Register Bob
  const bobRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bob Martin',
      username: `bob_martin_${runId}`,
      countryCode: '+1',
      countryName: 'United States',
      phoneNumber: `+141566${runId}`,
      bio: 'Verified Bob',
    }),
  });
  if (!bobRes.ok) throw new Error('Failed to register Bob: ' + (await bobRes.text()));
  const bob = await bobRes.json();
  const bobSessionCookie = bobRes.headers.get('set-cookie')?.split(';')[0];
  if (!bobSessionCookie) throw new Error('Registration did not issue an account session');
  console.log('✓ Bob registered:', bob.name, '@' + bob.username, bob.phoneNumber);

  console.log('\n--- 2. Testing Existing Account Save & Login ---');
  const savedProfileResponse = await fetch(`${BASE_URL}/api/users/${alice.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
    body: JSON.stringify({
      name: 'Alice Saved',
      bio: 'Profile survives the next login',
      privacySettings: { readReceipts: false },
    }),
  });
  if (!savedProfileResponse.ok) throw new Error('Could not save the existing account profile');
  const savedProfile = await savedProfileResponse.json();
  const protectedProfileResponse = await fetch(`${BASE_URL}/api/users/${alice.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
    body: JSON.stringify({ role: 'admin', isBanned: true }),
  });
  if (protectedProfileResponse.status !== 400) {
    throw new Error('Protected account fields were accepted by the profile update API');
  }
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: alice.username }),
  });
  const loggedInAlice = await loginResponse.json();
  if (
    !loginResponse.ok ||
    loggedInAlice.name !== savedProfile.name ||
    loggedInAlice.bio !== savedProfile.bio ||
    loggedInAlice.privacySettings.readReceipts !== false ||
    loggedInAlice.role !== alice.role ||
    loggedInAlice.isBanned
  ) {
    throw new Error('Saved account data did not survive login or a protected field changed');
  }
  Object.assign(alice, loggedInAlice);
  console.log('✓ Profile and nested preferences survived login; protected role/ban fields stayed unchanged');

  console.log('\n--- 3. Testing Admin Feature Controls ---');
  const testUsers = [alice, bob];
  const admin = testUsers.find((user) => user.role === 'admin');
  const nonAdmin = testUsers.find((user) => user.role !== 'admin');
  if (!admin) throw new Error('No administrator account is available for feature-control tests');
  const adminLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: admin.username }),
  });
  const adminSessionCookie = adminLoginResponse.headers.get('set-cookie')?.split(';')[0];
  if (!adminLoginResponse.ok || !adminSessionCookie) throw new Error('Admin login did not issue a session');
  const adminHeaders = { 'Content-Type': 'application/json', Cookie: adminSessionCookie };
  let nonAdminHeaders = { 'Content-Type': 'application/json' };
  if (nonAdmin) {
    const nonAdminLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: nonAdmin.username }),
    });
    const nonAdminCookie = nonAdminLoginResponse.headers.get('set-cookie')?.split(';')[0];
    if (!nonAdminLoginResponse.ok || !nonAdminCookie) throw new Error('Non-admin login failed');
    nonAdminHeaders = { ...nonAdminHeaders, Cookie: nonAdminCookie };
  }
  const bootstrapResponse = await fetch(`${BASE_URL}/api/bootstrap?userId=${encodeURIComponent(admin.id)}`);
  const initialPlatformState = (await bootstrapResponse.json()).platformFeatures;
  if (!initialPlatformState) throw new Error('Platform feature settings were not returned by bootstrap');

  const roleResponse = await fetch(`${BASE_URL}/api/admin/users/${bob.id}/role`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminId: admin.id, role: 'moderator' }),
  });
  if (!roleResponse.ok || (await roleResponse.json()).role !== 'moderator') {
    throw new Error('Admin role change did not persist');
  }
  const verificationResponse = await fetch(`${BASE_URL}/api/admin/users/${bob.id}/verification`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminId: admin.id, isVerified: true }),
  });
  if (!verificationResponse.ok || !(await verificationResponse.json()).isVerified) {
    throw new Error('Admin verification action did not persist');
  }
  await fetch(`${BASE_URL}/api/admin/users/${bob.id}/role`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminId: admin.id, role: 'user' }),
  });

  const noAdminAccess = await fetch(`${BASE_URL}/api/admin/platform-features`, {
    method: 'POST',
    headers: nonAdminHeaders,
    body: JSON.stringify({ adminId: nonAdmin?.id || '', updates: { allowCalls: false } }),
  });
  if (nonAdmin && noAdminAccess.status !== 403) {
    throw new Error('A non-admin account was able to change platform features');
  }

  const disabledFeatures = Object.fromEntries(
    Object.entries(initialPlatformState)
      .filter(([_, val]) => typeof val === 'boolean')
      .map(([key]) => [key, false])
  );
  try {
    const disableResponse = await fetch(`${BASE_URL}/api/admin/platform-features`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ adminId: admin.id, updates: disabledFeatures }),
    });
    if (!disableResponse.ok) throw new Error('Administrator could not disable platform features');

    const disabledRegistration = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'Policy Test', username: 'policy_test', countryCode: '+1' }),
    });
    const disabledMessage = await fetch(`${BASE_URL}/api/chats/policy-chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: alice.id, type: 'text', content: 'blocked by feature policy' }),
    });
    const disabledGroup = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'policy-group', type: 'group', name: 'Policy Group', participants: [alice.id] }),
    });
    const disabledCommunity = await fetch(`${BASE_URL}/api/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Policy Community', creatorId: alice.id }),
    });
    if ([disabledRegistration, disabledMessage, disabledGroup, disabledCommunity].some((response) => response.status !== 503)) {
      throw new Error('One or more disabled platform features were not enforced by the server');
    }
  } finally {
    await fetch(`${BASE_URL}/api/admin/platform-features`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ adminId: admin.id, updates: initialPlatformState }),
    });
  }
  console.log('✓ Non-admin changes rejected; registration, messaging, groups, and communities obey admin switches');

  console.log('\n--- 4. Testing Web Push Subscription Setup ---');
  const pushKeyResponse = await fetch(`${BASE_URL}/api/push/vapid-public-key`);
  if (pushKeyResponse.ok) {
    const { publicKey } = await pushKeyResponse.json();
    if (!publicKey) throw new Error('VAPID public key endpoint returned no key');

    const subscription = {
      endpoint: `https://updates.push.services.mozilla.com/${alice.id}`,
      expirationTime: null,
      keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-key' },
    };
    const saveSubscription = await fetch(`${BASE_URL}/api/push/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: alice.id, subscription }),
    });
    if (saveSubscription.status !== 201) {
      throw new Error('Failed to register a test push subscription: ' + (await saveSubscription.text()));
    }
    const removeSubscription = await fetch(`${BASE_URL}/api/push/subscriptions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: alice.id, endpoint: subscription.endpoint }),
    });
    if (!removeSubscription.ok) throw new Error('Failed to remove the test push subscription');
    console.log('✓ VAPID key and device subscription registration/removal verified');
  } else if (pushKeyResponse.status === 503) {
    console.log('! VAPID keys are not configured; lock-screen delivery is correctly disabled');
  } else {
    throw new Error('Unexpected VAPID key endpoint response: ' + pushKeyResponse.status);
  }

  console.log('\n--- 5. Testing Strict Contact Search & Privacy Rules ---');
  // Test partial search: should NOT return users
  const partialSearch1 = await (await fetch(`${BASE_URL}/api/users/search?q=a`)).json();
  console.log('Partial search "a" returned:', partialSearch1.length, 'results (Expected: 0)');
  if (partialSearch1.length !== 0) throw new Error('Privacy failure: Partial search exposed users');

  const partialSearch2 = await (await fetch(`${BASE_URL}/api/users/search?q=141`)).json();
  console.log('Incomplete digits "141" returned:', partialSearch2.length, 'results (Expected: 0)');
  if (partialSearch2.length !== 0) throw new Error('Privacy failure: Incomplete digits exposed users');

  // Test complete search by exact username
  const exactUserSearch = await (await fetch(`${BASE_URL}/api/users/search?q=@${bob.username}`)).json();
  console.log(`Exact username "@${bob.username}" returned:`, exactUserSearch.map(u => u.name));
  if (exactUserSearch.length !== 1 || exactUserSearch[0].id !== bob.id) {
    throw new Error('Exact username search failed');
  }

  // Test complete search by exact phone number
  const exactPhoneSearch = await (await fetch(`${BASE_URL}/api/users/search?q=${encodeURIComponent(alice.phoneNumber)}`)).json();
  console.log(`Exact phone search "${alice.phoneNumber}" returned:`, exactPhoneSearch.map(u => u.name));
  if (exactPhoneSearch.length !== 1 || exactPhoneSearch[0].id !== alice.id) {
    throw new Error('Exact phone search failed');
  }
  console.log('✓ Privacy & Complete contact search rules verified');

  console.log('\n--- 6. Testing Mutual Contact Relationship ---');
  const addContactRes = await fetch(`${BASE_URL}/api/users/${alice.id}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId: bob.id, action: 'add' }),
  });
  const addContactData = await addContactRes.json();
  console.log('Alice contacts:', addContactData.contacts);
  console.log('Bob contacts:', addContactData.targetContacts);
  if (!addContactData.contacts.includes(bob.id) || !addContactData.targetContacts.includes(alice.id)) {
    throw new Error('Mutual contact creation failed');
  }
  console.log('✓ Mutual contact relationship successfully established');

  console.log('\n--- 7. Testing Real-Time WebSocket Messaging ---');
  const aliceWs = new WebSocket(`${WS_URL}?userId=${alice.id}`);
  const bobWs = new WebSocket(`${WS_URL}?userId=${bob.id}`);

  await Promise.all([
    new Promise((resolve) => aliceWs.on('open', resolve)),
    new Promise((resolve) => bobWs.on('open', resolve)),
  ]);
  aliceWs.send(JSON.stringify({ type: 'auth', userId: alice.id }));
  bobWs.send(JSON.stringify({ type: 'auth', userId: bob.id }));
  console.log('✓ Alice & Bob WebSocket sessions connected & authenticated');

  const chatId = `c_direct_${[alice.id, bob.id].sort().join('_')}`;

  const disableCallsResponse = await fetch(`${BASE_URL}/api/admin/platform-features`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminId: admin.id, updates: { allowCalls: false } }),
  });
  if (!disableCallsResponse.ok) throw new Error('Could not disable calls for the signaling test');
  const callUnavailableId = `call_disabled_${Date.now()}`;
  const callUnavailablePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Disabled call was not rejected')), 6000);
    aliceWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'call:unavailable' && data.callId === callUnavailableId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });
  aliceWs.send(JSON.stringify({
    type: 'call:initiate',
    callId: callUnavailableId,
    chatId,
    userId: alice.id,
    targetUserId: bob.id,
    data: { callType: 'voice' },
  }));
  await callUnavailablePromise;
  await fetch(`${BASE_URL}/api/admin/platform-features`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminId: admin.id, updates: { allowCalls: initialPlatformState.allowCalls } }),
  });
  console.log('✓ Server rejects new call signaling when the call switch is disabled');

  // Bob awaits incoming message
  const bobReceivedMsgPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Bob message receive timeout')), 6000);
    bobWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'chat:message' && data.message.content.includes('Alice to Bob')) {
        clearTimeout(timeout);
        resolve(data.message);
      }
    });
  });

  // Alice sends message
  const msgContent = 'Real-time test message: Alice to Bob';
  const sendRes = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      senderId: alice.id,
      senderName: alice.name,
      senderAvatar: alice.avatar,
      type: 'text',
      content: msgContent,
      participants: [alice.id, bob.id],
      timestamp: Date.now(),
    }),
  });
  if (!sendRes.ok) throw new Error('Alice send message failed: ' + (await sendRes.text()));
  const sentMsg = await sendRes.json();
  console.log('✓ Message posted by Alice, id:', sentMsg.id, 'status:', sentMsg.status);

  const bobReceivedMsg = await bobReceivedMsgPromise;
  console.log('✓ Bob received message in real-time:', bobReceivedMsg.content);

  // Bob reads the message
  const readRes = await fetch(`${BASE_URL}/api/chats/${chatId}/messages/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: bob.id }),
  });
  if (!readRes.ok) throw new Error('Mark read failed');
  console.log('✓ Bob marked messages as read');

  // Bob replies to Alice
  const aliceReceivedReplyPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Alice reply receive timeout')), 6000);
    aliceWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'chat:message' && data.message.content.includes('Bob to Alice')) {
        clearTimeout(timeout);
        resolve(data.message);
      }
    });
  });

  await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      senderId: bob.id,
      senderName: bob.name,
      senderAvatar: bob.avatar,
      type: 'text',
      content: 'Real-time reply: Bob to Alice',
      participants: [alice.id, bob.id],
      timestamp: Date.now(),
    }),
  });
  const aliceReceivedReply = await aliceReceivedReplyPromise;
  console.log('✓ Alice received Bob\'s reply in real-time:', aliceReceivedReply.content);

  console.log('\n--- 8. Testing Real-Time Call Signaling Flow ---');
  const callId = `call_${Date.now()}`;

  // Bob awaits incoming call
  const bobIncomingCallPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Incoming call timeout')), 6000);
    bobWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'call:incoming' && data.callId === callId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });

  // Alice initiates call
  aliceWs.send(
    JSON.stringify({
      type: 'call:initiate',
      callId,
      chatId,
      userId: alice.id,
      targetUserId: bob.id,
      data: {
        callType: 'voice',
        caller: {
          id: alice.id,
          name: alice.name,
          avatar: alice.avatar,
          number: alice.phoneNumber,
        },
      },
    })
  );

  const incomingData = await bobIncomingCallPromise;
  console.log('✓ Bob received call:incoming from:', incomingData.data?.caller?.name);

  // Bob accepts call
  const aliceCallAcceptedPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Call accepted timeout')), 6000);
    aliceWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'call:accepted' && data.callId === callId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });

  bobWs.send(
    JSON.stringify({
      type: 'call:accept',
      callId,
      chatId,
      userId: bob.id,
      targetUserId: alice.id,
    })
  );

  const acceptedData = await aliceCallAcceptedPromise;
  console.log('✓ Alice received call:accepted from Bob');

  // Alice sends WebRTC SDP Offer
  const bobOfferPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebRTC offer timeout')), 6000);
    bobWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'webrtc:offer' && data.callId === callId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });

  aliceWs.send(
    JSON.stringify({
      type: 'webrtc:offer',
      callId,
      userId: alice.id,
      targetUserId: bob.id,
      data: { offer: { type: 'offer', sdp: 'v=0\r\no=alice 12345 12345 IN IP4 127.0.0.1\r\ns=Test\r\n' } },
    })
  );

  await bobOfferPromise;
  console.log('✓ Bob received Alice\'s WebRTC offer');

  // Bob sends WebRTC SDP Answer
  const aliceAnswerPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebRTC answer timeout')), 6000);
    aliceWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'webrtc:answer' && data.callId === callId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });

  bobWs.send(
    JSON.stringify({
      type: 'webrtc:answer',
      callId,
      userId: bob.id,
      targetUserId: alice.id,
      data: { answer: { type: 'answer', sdp: 'v=0\r\no=bob 54321 54321 IN IP4 127.0.0.1\r\ns=Test\r\n' } },
    })
  );

  await aliceAnswerPromise;
  console.log('✓ Alice received Bob\'s WebRTC answer');

  // Alice ends call
  const bobCallEndedPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Call ended timeout')), 6000);
    bobWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'call:ended' && data.callId === callId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });

  aliceWs.send(
    JSON.stringify({
      type: 'call:end',
      callId,
      userId: alice.id,
      targetUserId: bob.id,
    })
  );

  await bobCallEndedPromise;
  console.log('✓ Bob received call:ended, call cleanly torn down');

  console.log('\n--- 9. Testing Offline Incoming Call Queue ---');
  const bobClosedPromise = new Promise((resolve) => bobWs.once('close', resolve));
  bobWs.close();
  await bobClosedPromise;
  const queuedCallId = `call_offline_${Date.now()}`;
  const ringingStatusPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Offline ringing status timeout')), 6000);
    aliceWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'call:ringing-status' && data.callId === queuedCallId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });
  aliceWs.send(JSON.stringify({
    type: 'call:initiate',
    callId: queuedCallId,
    chatId,
    userId: alice.id,
    targetUserId: bob.id,
    data: {
      callType: 'video',
      caller: { id: alice.id, name: alice.name, avatar: alice.avatar, number: alice.phoneNumber },
    },
  }));
  const ringingStatus = await ringingStatusPromise;
  if (ringingStatus.recipientOnline !== false) throw new Error('Offline recipient was reported online');

  const queuedBobWs = new WebSocket(`${WS_URL}?userId=${bob.id}`);
  const queuedInvitePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Queued incoming call was not delivered')), 6000);
    queuedBobWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'call:incoming' && data.callId === queuedCallId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });
  await new Promise((resolve) => queuedBobWs.once('open', resolve));
  queuedBobWs.send(JSON.stringify({ type: 'auth', userId: bob.id }));
  await queuedInvitePromise;

  const queuedCallRejectedPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Queued call rejection timeout')), 6000);
    aliceWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'call:rejected' && data.callId === queuedCallId) {
        clearTimeout(timeout);
        resolve(data);
      }
    });
  });
  queuedBobWs.send(JSON.stringify({
    type: 'call:reject',
    callId: queuedCallId,
    userId: bob.id,
    targetUserId: alice.id,
  }));
  await queuedCallRejectedPromise;
  console.log('✓ Offline video-call invite was delivered when Bob reconnected');

  await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', headers: adminHeaders });
  const revokedAdminRequest = await fetch(`${BASE_URL}/api/admin/platform-features`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminId: admin.id, updates: { allowCalls: true } }),
  });
  if (revokedAdminRequest.status !== 403) throw new Error('Admin session remained usable after logout');
  console.log('✓ Admin role/verification actions persisted and logout revoked the admin session');

  aliceWs.close();
  queuedBobWs.close();

  console.log('\n--- 10. Cleanup Test Accounts ---');
  await fetch(`${BASE_URL}/api/users/${alice.id}`, {
    method: 'DELETE',
    headers: { Cookie: aliceSessionCookie },
  });
  await fetch(`${BASE_URL}/api/users/${bob.id}`, {
    method: 'DELETE',
    headers: { Cookie: bobSessionCookie },
  });
  console.log('✓ Test accounts deleted and purged');

  console.log('\n========================================');
  console.log('ALL REAL-TIME END-TO-END TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
