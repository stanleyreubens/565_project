'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// US-01 Register an account
app.post('/api/auth/register', require('./api/auth/register'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// The browser loads the same validation rules the API applies.
app.get('/shared/validation.js', (_req, res) => {
  res.type('application/javascript').sendFile(path.join(__dirname, 'lib', 'validation.js'));
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Hotel Revenue Manager listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
