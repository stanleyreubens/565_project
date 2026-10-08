'use strict';

/**
 * Registration rules for US-01.
 *
 * These live in their own module with no database or framework dependencies so
 * that both sides of the application can apply the same rules: the browser
 * checks them before the form submits, and the API checks them again on
 * arrival. A client side check protects the user's time, not the database.
 */

const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 100;

// Deliberately permissive. The only addresses worth rejecting here are the ones
// that cannot possibly be delivered to; anything stricter rejects real people.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(input = {}) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  const errors = {};

  if (!name) {
    errors.name = 'Enter your name.';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Your name can be at most ${NAME_MAX_LENGTH} characters.`;
  }

  if (!email) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter an email address in the form name@example.com.';
  }

  if (!password) {
    errors.password = 'Choose a password.';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Your password must be at least ${PASSWORD_MIN_LENGTH} characters. Add ${PASSWORD_MIN_LENGTH - password.length} more.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { name, email, password }
  };
}

const api = { validateRegistration, PASSWORD_MIN_LENGTH, NAME_MAX_LENGTH };

// The same file runs in both places: Node requires it, and the browser loads it
// from /shared/validation.js. Keeping one copy is what stops the rule the form
// enforces from drifting away from the rule the API enforces.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else {
  globalThis.Validation = api;
}
