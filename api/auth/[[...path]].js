const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { verifyAuth } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Handle path from Vercel rewrite or local server
  let pathArray = req.query.path;
  if (!pathArray) {
    // Extract from URL for Vercel
    const urlPath = req.url.split('?')[0];
    const match = urlPath.match(/\/api\/auth\/?(.*)/);
    pathArray = match && match[1] ? match[1].split('/').filter(Boolean) : [];
  }
  const path = Array.isArray(pathArray) ? pathArray[0] : pathArray || '';

  if (path === 'login' && req.method === 'POST') {
    return handleLogin(req, res);
  } else if (path === 'register' && req.method === 'POST') {
    return handleRegister(req, res);
  } else if (path === 'me' && req.method === 'GET') {
    return handleMe(req, res);
  }

  return res.status(404).json({ status: 'error', message: 'Not found' });
};

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
}

async function handleRegister(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email and password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Extract email domain for organization
    const emailDomain = email.split('@')[1].toLowerCase();

    // Find or create organization based on email domain
    let organization = await prisma.organization.findUnique({
      where: { emailDomain }
    });

    if (!organization) {
      // Create new organization with domain name as default name
      const orgName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
      organization = await prisma.organization.create({
        data: {
          name: orgName,
          emailDomain
        }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        organizationId: organization.id
      }
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed'
    });
  }
}

async function handleMe(req, res) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return res.status(authResult.status).json({
      status: 'error',
      message: authResult.error
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
}
