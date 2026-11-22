const prisma = require('../../lib/prisma');
const { verifyAuth } = require('../../lib/auth');
const ticketmasterService = require('../../lib/ticketmaster');

module.exports = async (req, res) => {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return res.status(authResult.status).json({
      status: 'error',
      message: authResult.error
    });
  }

  // Handle path from Vercel rewrite or local server
  let path = req.query.path;
  if (!path) {
    const urlPath = req.url.split('?')[0];
    const match = urlPath.match(/\/api\/events\/?(.*)/);
    path = match && match[1] ? match[1].split('/').filter(Boolean) : [];
  }
  if (!Array.isArray(path)) path = [path];
  const eventId = path[0];

  try {
    // /api/events - list or create events
    if (!eventId || eventId === '') {
      if (req.method === 'GET') {
        const { city, startDate, endDate } = req.query;

        if (!city || !startDate || !endDate) {
          return res.status(400).json({
            status: 'error',
            message: 'Please provide city, start date, and end date'
          });
        }

        const formattedStartDate = startDate.split('T')[0];
        const formattedEndDate = endDate.split('T')[0];

        const ticketmasterEvents = await ticketmasterService.searchEvents(city, formattedStartDate, formattedEndDate);

        return res.status(200).json({
          status: 'success',
          results: ticketmasterEvents.length,
          data: {
            events: ticketmasterEvents,
            source: 'api'
          }
        });
      }

      if (req.method === 'POST') {
        const {
          name,
          description,
          venue,
          address,
          city,
          state,
          country,
          latitude,
          longitude,
          startDate,
          endDate,
          expectedAttendance,
          category,
          impactScore
        } = req.body;

        const event = await prisma.event.create({
          data: {
            name,
            description,
            venue,
            address,
            city,
            state,
            country,
            latitude,
            longitude,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            expectedAttendance,
            category,
            source: 'MANUAL',
            impactScore: impactScore || 5
          }
        });

        return res.status(201).json({
          status: 'success',
          data: { event }
        });
      }

      return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }

    // /api/events/[id] - get, update, or delete a specific event
    const id = eventId;

    if (req.method === 'GET') {
      const event = await prisma.event.findUnique({
        where: { id }
      });

      if (!event) {
        return res.status(404).json({
          status: 'error',
          message: 'Event not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { event }
      });
    }

    if (req.method === 'PUT') {
      const existingEvent = await prisma.event.findUnique({
        where: { id }
      });

      if (!existingEvent) {
        return res.status(404).json({
          status: 'error',
          message: 'Event not found'
        });
      }

      if (existingEvent.source !== 'MANUAL') {
        return res.status(403).json({
          status: 'error',
          message: 'Only manually created events can be updated'
        });
      }

      const event = await prisma.event.update({
        where: { id },
        data: req.body
      });

      return res.status(200).json({
        status: 'success',
        data: { event }
      });
    }

    if (req.method === 'DELETE') {
      const existingEvent = await prisma.event.findUnique({
        where: { id }
      });

      if (!existingEvent) {
        return res.status(404).json({
          status: 'error',
          message: 'Event not found'
        });
      }

      if (existingEvent.source !== 'MANUAL') {
        return res.status(403).json({
          status: 'error',
          message: 'Only manually created events can be deleted'
        });
      }

      await prisma.event.delete({
        where: { id }
      });

      return res.status(204).end();
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process request'
    });
  }
};
