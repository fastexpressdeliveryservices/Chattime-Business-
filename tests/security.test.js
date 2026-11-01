import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPin, verifyPin, normalizePin } from '../src/server/db.ts';

test('PIN hashing is irreversible and verifies correctly', () => {
  const pin = '2468';
  const hash = hashPin(pin);

  assert.notEqual(hash, pin);
  assert.equal(verifyPin(pin, hash), true);
  assert.equal(verifyPin('1234', hash), false);
  assert.equal(normalizePin(pin), hash);
});
