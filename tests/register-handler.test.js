'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createRegisterHandler } = require('../api/auth/register-handler');

// A stand in for Prisma. Records what was written so the tests can assert on
// what would have reached the database.
function fakePrisma({ existing = null } = {}) {
  const created = [];
  return {
    created,
    user: {
      findUnique: async () => existing,
      create: async ({ data }) => {
        created.push(data);
        return { id: 'generated-uuid', role: 'USER', ...data };
      }
    }
  };
}

function fakeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

function build(prisma) {
  return createRegisterHandler({
    prisma,
    hashPassword: async (plain) => `hashed:${plain}`,
    signToken: (id) => `token-for-${id}`
  });
}

const VALID = { name: 'Stanley Ogbumuo', email: 'stanley@parkviewhotel.com', password: 'correct-horse' };

// Acceptance criterion 1
test('a valid submission creates the account and signs the user in', async () => {
  const prisma = fakePrisma();
  const res = fakeResponse();
  await build(prisma)({ body: VALID }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.status, 'success');
  assert.equal(res.body.data.user.email, 'stanley@parkviewhotel.com');
  assert.equal(res.body.data.token, 'token-for-generated-uuid', 'a session token is issued');
  assert.equal(prisma.created.length, 1);
});

// Acceptance criterion 2
test('the password is hashed before storage and never returned', async () => {
  const prisma = fakePrisma();
  const res = fakeResponse();
  await build(prisma)({ body: VALID }, res);

  assert.equal(prisma.created[0].password, 'hashed:correct-horse');
  assert.notEqual(prisma.created[0].password, VALID.password);

  const serialised = JSON.stringify(res.body);
  assert.ok(!serialised.includes(VALID.password), 'the plain password must not appear in the response');
  assert.ok(!serialised.includes('hashed:'), 'the stored hash must not appear in the response');
  assert.equal('password' in res.body.data.user, false);
});

// Acceptance criterion 3
test('a duplicate email is refused and points the user at signing in', async () => {
  const prisma = fakePrisma({ existing: { id: 'someone-else', email: VALID.email } });
  const res = fakeResponse();
  await build(prisma)({ body: VALID }, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /already exists/i);
  assert.match(res.body.message, /sign in/i);
  assert.equal(prisma.created.length, 0, 'no second account is written');
});

test('a unique constraint raised by a race is reported the same way', async () => {
  const prisma = fakePrisma();
  prisma.user.create = async () => { const e = new Error('unique'); e.code = 'P2002'; throw e; };
  const res = fakeResponse();
  await build(prisma)({ body: VALID }, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /sign in/i);
});

// Acceptance criterion 4, server side half. The browser half is in register.js,
// which calls the same validateRegistration before it touches the network.
test('a short password is refused by the API as well as the form', async () => {
  const prisma = fakePrisma();
  const res = fakeResponse();
  await build(prisma)({ body: { ...VALID, password: 'short' } }, res);

  assert.equal(res.statusCode, 400);
  assert.ok(res.body.errors.password);
  assert.equal(prisma.created.length, 0);
});

test('an unexpected failure returns 500 without leaking the cause', async () => {
  const prisma = fakePrisma();
  prisma.user.findUnique = async () => { throw new Error('connection refused to 10.0.0.5'); };
  const res = fakeResponse();
  await build(prisma)({ body: VALID }, res);

  assert.equal(res.statusCode, 500);
  assert.ok(!JSON.stringify(res.body).includes('10.0.0.5'));
});
