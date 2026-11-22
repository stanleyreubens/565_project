const jwt = require('jsonwebtoken');
const prisma = require('./prisma');

async function verifyAuth(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Not authorized to access this route', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        organization: true
      }
    });

    if (!user) {
      return { error: 'User no longer exists', status: 401 };
    }

    return { user };
  } catch (error) {
    return { error: 'Not authorized to access this route', status: 401 };
  }
}

module.exports = { verifyAuth };
