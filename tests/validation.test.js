'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistration, PASSWORD_MIN_LENGTH } = require('../lib/validation');

test('accepts a complete, valid submission', () => {
  const result = validateRegistration({
    name: 'Stanley Ogbumuo',
    email: 'stanley@parkviewhotel.com',
    password: 'correct-horse'
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('trims the name and lowercases the email', () => {
  const { value } = validateRegistration({
    name: '  Stanley Ogbumuo  ',
    email: '  Stanley@ParkviewHotel.COM ',
    password: 'correct-horse'
  });
  assert.equal(value.name, 'Stanley Ogbumuo');
  assert.equal(value.email, 'stanley@parkviewhotel.com');
});

test('rejects a password below the minimum length', () => {
  const short = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
  const result = validateRegistration({ name: 'A Manager', email: 'a@b.com', password: short });
  assert.equal(result.valid, false);
  assert.match(result.errors.password, new RegExp(`at least ${PASSWORD_MIN_LENGTH} characters`));
});

test('accepts a password exactly at the minimum length', () => {
  const exact = 'a'.repeat(PASSWORD_MIN_LENGTH);
  const result = validateRegistration({ name: 'A Manager', email: 'a@b.com', password: exact });
  assert.equal(result.valid, true);
});

test('requires every field', () => {
  const result = validateRegistration({});
  assert.equal(result.valid, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
  assert.ok(result.errors.password);
});

test('rejects an address that is not deliverable', () => {
  for (const email of ['not-an-email', 'missing@domain', '@example.com', 'spaces in@mail.com']) {
    assert.equal(validateRegistration({ name: 'A', email, password: 'correct-horse' }).valid, false, email);
  }
});

test('survives non string input without throwing', () => {
  const result = validateRegistration({ name: 42, email: null, password: { a: 1 } });
  assert.equal(result.valid, false);
});
