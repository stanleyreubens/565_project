'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { createRegisterHandler } = require('./register-handler');

const BCRYPT_COST = 12;
const TOKEN_LIFETIME = '30d';

module.exports = createRegisterHandler({
  prisma,
  hashPassword: (plain) => bcrypt.hash(plain, BCRYPT_COST),
  signToken: (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME })
});
