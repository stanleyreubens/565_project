'use strict';

// US-01 Register an account.
// The rules come from /shared/validation.js, the same module the API applies,
// so the form cannot start enforcing something different from the server.
const { validateRegistration } = globalThis.Validation;

const form = document.getElementById('register-form');
const submit = document.getElementById('submit');
const formError = document.getElementById('form-error');
const fields = ['name', 'email', 'password'];

function showErrors(errors) {
  fields.forEach((field) => {
    const input = document.getElementById(field);
    const slot = document.getElementById(`${field}-error`);
    const message = errors[field] || '';
    slot.textContent = message;
    input.classList.toggle('invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  });
}

function readForm() {
  return {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };
}

// Re-check a field once the user has left it, so errors clear as they fix them
// rather than waiting for another submit.
fields.forEach((field) => {
  document.getElementById(field).addEventListener('blur', () => {
    const { errors } = validateRegistration(readForm());
    const slot = document.getElementById(`${field}-error`);
    const input = document.getElementById(field);
    slot.textContent = errors[field] || '';
    input.classList.toggle('invalid', Boolean(errors[field]));
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';

  const payload = readForm();
  const { valid, errors } = validateRegistration(payload);

  showErrors(errors);

  // A password below the minimum never reaches the network.
  if (!valid) {
    const firstBad = fields.find((field) => errors[field]);
    if (firstBad) document.getElementById(firstBad).focus();
    return;
  }

  submit.disabled = true;
  submit.textContent = 'Creating your account...';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    if (!response.ok) {
      showErrors(body.errors || {});
      formError.textContent = body.errors ? '' : body.message;
      if (body.errors && body.errors.email) document.getElementById('email').focus();
      return;
    }

    // Registering signs the account in.
    localStorage.setItem('token', body.data.token);
    form.hidden = true;
    document.querySelector('.signin').hidden = true;
    document.getElementById('done-detail').textContent =
      `Welcome, ${body.data.user.name}. Your account ${body.data.user.email} is ready.`;
    document.getElementById('done').hidden = false;
  } catch (networkError) {
    formError.textContent = 'Could not reach the server. Check your connection and try again.';
  } finally {
    submit.disabled = false;
    submit.textContent = 'Create account';
  }
});
