const prisma = require('../../lib/prisma');
const { verifyAuth } = require('../../lib/auth');

module.exports = async (req, res) => {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return res.status(authResult.status).json({
      status: 'error',
      message: authResult.error
    });
  }

  const user = authResult.user;

  // Require organization for reminders
  if (!user.organizationId) {
    return res.status(403).json({
      status: 'error',
      message: 'Organization required for reminders'
    });
  }

  // Handle path from Vercel rewrite or local server
  let path = req.query.path;
  if (!path) {
    const urlPath = req.url.split('?')[0];
    const match = urlPath.match(/\/api\/reminders\/?(.*)/);
    path = match && match[1] ? match[1].split('/').filter(Boolean) : [];
  }
  if (!Array.isArray(path)) path = [path];

  try {
    // GET /api/reminders - List all reminders for organization
    if (path.length === 0 && req.method === 'GET') {
      const { status, priority, hotelId } = req.query;

      const whereClause = {
        organizationId: user.organizationId
      };

      if (status) {
        whereClause.status = status;
      }
      if (priority) {
        whereClause.priority = priority;
      }
      if (hotelId) {
        whereClause.hotelId = hotelId;
      }

      const reminders = await prisma.reminder.findMany({
        where: whereClause,
        include: {
          hotel: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' }
        ]
      });

      return res.status(200).json({
        status: 'success',
        results: reminders.length,
        data: { reminders }
      });
    }

    // POST /api/reminders - Create a new reminder
    if (path.length === 0 && req.method === 'POST') {
      const { title, description, dueDate, priority, category, hotelId } = req.body;

      if (!title || !dueDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Title and due date are required'
        });
      }

      // Verify hotel belongs to organization if provided
      if (hotelId) {
        const hotel = await prisma.hotel.findFirst({
          where: { id: hotelId, organizationId: user.organizationId }
        });
        if (!hotel) {
          return res.status(404).json({
            status: 'error',
            message: 'Hotel not found'
          });
        }
      }

      const reminder = await prisma.reminder.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          priority: priority || 'MEDIUM',
          category,
          hotelId,
          createdById: user.id,
          organizationId: user.organizationId
        },
        include: {
          hotel: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return res.status(201).json({
        status: 'success',
        data: { reminder }
      });
    }

    // GET /api/reminders/upcoming - Get upcoming reminders (next 7 days)
    if (path[0] === 'upcoming' && req.method === 'GET') {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const reminders = await prisma.reminder.findMany({
        where: {
          organizationId: user.organizationId,
          status: 'PENDING',
          dueDate: {
            gte: now,
            lte: nextWeek
          }
        },
        include: {
          hotel: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { dueDate: 'asc' }
      });

      return res.status(200).json({
        status: 'success',
        results: reminders.length,
        data: { reminders }
      });
    }

    // GET /api/reminders/overdue - Get overdue reminders
    if (path[0] === 'overdue' && req.method === 'GET') {
      const now = new Date();

      const reminders = await prisma.reminder.findMany({
        where: {
          organizationId: user.organizationId,
          status: 'PENDING',
          dueDate: {
            lt: now
          }
        },
        include: {
          hotel: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { dueDate: 'asc' }
      });

      return res.status(200).json({
        status: 'success',
        results: reminders.length,
        data: { reminders }
      });
    }

    // PUT /api/reminders/:id - Update a reminder
    if (path.length === 1 && req.method === 'PUT') {
      const id = path[0];
      const { title, description, dueDate, priority, status, category, hotelId } = req.body;

      const existingReminder = await prisma.reminder.findFirst({
        where: { id, organizationId: user.organizationId }
      });

      if (!existingReminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found'
        });
      }

      // Verify hotel belongs to organization if provided
      if (hotelId) {
        const hotel = await prisma.hotel.findFirst({
          where: { id: hotelId, organizationId: user.organizationId }
        });
        if (!hotel) {
          return res.status(404).json({
            status: 'error',
            message: 'Hotel not found'
          });
        }
      }

      const reminder = await prisma.reminder.update({
        where: { id },
        data: {
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority,
          status,
          category,
          hotelId
        },
        include: {
          hotel: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return res.status(200).json({
        status: 'success',
        data: { reminder }
      });
    }

    // PATCH /api/reminders/:id/complete - Mark reminder as complete
    if (path.length === 2 && path[1] === 'complete' && req.method === 'PATCH') {
      const id = path[0];

      const existingReminder = await prisma.reminder.findFirst({
        where: { id, organizationId: user.organizationId }
      });

      if (!existingReminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found'
        });
      }

      const reminder = await prisma.reminder.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });

      return res.status(200).json({
        status: 'success',
        data: { reminder }
      });
    }

    // PATCH /api/reminders/:id/dismiss - Dismiss reminder
    if (path.length === 2 && path[1] === 'dismiss' && req.method === 'PATCH') {
      const id = path[0];

      const existingReminder = await prisma.reminder.findFirst({
        where: { id, organizationId: user.organizationId }
      });

      if (!existingReminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found'
        });
      }

      const reminder = await prisma.reminder.update({
        where: { id },
        data: { status: 'DISMISSED' }
      });

      return res.status(200).json({
        status: 'success',
        data: { reminder }
      });
    }

    // DELETE /api/reminders/:id - Delete a reminder
    if (path.length === 1 && req.method === 'DELETE') {
      const id = path[0];

      const existingReminder = await prisma.reminder.findFirst({
        where: { id, organizationId: user.organizationId }
      });

      if (!existingReminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found'
        });
      }

      await prisma.reminder.delete({ where: { id } });

      return res.status(200).json({
        status: 'success',
        message: 'Reminder deleted'
      });
    }

    return res.status(404).json({ status: 'error', message: 'Not found' });
  } catch (error) {
    console.error('Reminders API error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
