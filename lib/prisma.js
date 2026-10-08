const { PrismaClient } = require('@prisma/client');

// One client is shared across requests. In development it is cached on the
// global object so that reloading does not open a new connection pool.
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
