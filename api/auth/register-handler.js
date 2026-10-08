'use strict';

const { validateRegistration } = require('../../lib/validation');

/**
 * Builds the POST /api/auth/register handler.
 *
 * The dependencies are passed in rather than required here, which keeps the
 * handler testable without a database or a generated Prisma client.
 */
function createRegisterHandler({ prisma, hashPassword, signToken }) {
  return async function handleRegister(req, res) {
    try {
      const { valid, errors, value } = validateRegistration(req.body);

      if (!valid) {
        return res.status(400).json({
          status: 'error',
          message: 'Check the highlighted fields and try again.',
          errors
        });
      }

      const existing = await prisma.user.findUnique({ where: { email: value.email } });

      if (existing) {
        return res.status(409).json({
          status: 'error',
          message: 'An account with this email already exists. Please sign in instead.',
          errors: { email: 'An account with this email already exists. Please sign in instead.' }
        });
      }

      const user = await prisma.user.create({
        data: {
          name: value.name,
          email: value.email,
          password: await hashPassword(value.password)
        }
      });

      // Registering signs the new account in, so the caller receives a token
      // alongside the user. The stored hash is never part of the response.
      return res.status(201).json({
        status: 'success',
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          token: signToken(user.id)
        }
      });
    } catch (error) {
      // A unique constraint can still fire if two requests race past the
      // lookup above. Report it the same way rather than as a server fault.
      if (error && error.code === 'P2002') {
        return res.status(409).json({
          status: 'error',
          message: 'An account with this email already exists. Please sign in instead.',
          errors: { email: 'An account with this email already exists. Please sign in instead.' }
        });
      }

      console.error('Registration failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Registration could not be completed. Try again in a moment.'
      });
    }
  };
}

module.exports = { createRegisterHandler };
