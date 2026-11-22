const prisma = require('../../lib/prisma');
const { verifyAuth } = require('../../lib/auth');
const pricingService = require('../../lib/pricing');
const hotelsApiService = require('../../lib/hotelsApi');
const { getCompetitorProvider } = require('../../lib/competitorProvider');

// Helper to build hotel access filter - uses organization if available, falls back to owner
const getHotelAccessFilter = (user) => {
  if (user.organizationId) {
    return { organizationId: user.organizationId };
  }
  return { ownerId: user.id };
};

module.exports = async (req, res) => {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return res.status(authResult.status).json({
      status: 'error',
      message: authResult.error
    });
  }

  const user = authResult.user;

  // Handle path from Vercel rewrite or local server
  let path = req.query.path;
  if (!path) {
    const urlPath = req.url.split('?')[0];
    const match = urlPath.match(/\/api\/pricing\/?(.*)/);
    path = match && match[1] ? match[1].split('/').filter(Boolean) : [];
  }
  if (!Array.isArray(path)) path = [path];

  try {
    // SMERF ROUTES
    // /api/pricing/smerf/all - GET all SMERF rates for user's hotels
    if (path[0] === 'smerf' && path[1] === 'all' && req.method === 'GET') {
      const smerfRates = await prisma.smerfRate.findMany({
        where: {
          hotel: getHotelAccessFilter(user)
        },
        include: {
          hotel: {
            select: { id: true, name: true }
          },
          roomType: {
            select: { id: true, name: true }
          }
        },
        orderBy: { startDate: 'asc' }
      });

      return res.status(200).json({
        status: 'success',
        results: smerfRates.length,
        data: { smerfRates }
      });
    }

    // /api/pricing/smerf/hotel/[hotelId] - GET all SMERF rates for a hotel
    if (path[0] === 'smerf' && path[1] === 'hotel' && path.length === 3 && req.method === 'GET') {
      const hotelId = path[2];

      const hotel = await prisma.hotel.findFirst({
        where: { id: hotelId, ...getHotelAccessFilter(user) }
      });

      if (!hotel) {
        return res.status(404).json({ status: 'error', message: 'Hotel not found' });
      }

      const smerfRates = await prisma.smerfRate.findMany({
        where: { hotelId },
        include: {
          roomType: {
            select: { id: true, name: true }
          }
        },
        orderBy: { startDate: 'asc' }
      });

      return res.status(200).json({
        status: 'success',
        results: smerfRates.length,
        data: { smerfRates }
      });
    }

    // /api/pricing/smerf/[hotelId]/[roomTypeId] - GET SMERF rates
    if (path[0] === 'smerf' && path.length === 3 && req.method === 'GET') {
      const hotelId = path[1];
      const roomTypeId = path[2];
      const { startDate, endDate } = req.query;

      const hotel = await prisma.hotel.findFirst({
        where: { id: hotelId, ...getHotelAccessFilter(user) }
      });

      if (!hotel) {
        return res.status(404).json({ status: 'error', message: 'Hotel not found' });
      }

      const whereClause = {
        hotelId,
        roomTypeId
      };

      // Filter by date overlap if dates provided
      if (startDate || endDate) {
        whereClause.startDate = { lte: endDate ? new Date(endDate) : new Date('2099-12-31') };
        whereClause.endDate = { gte: startDate ? new Date(startDate) : new Date('1970-01-01') };
      }

      const smerfRates = await prisma.smerfRate.findMany({
        where: whereClause,
        orderBy: { startDate: 'asc' }
      });

      return res.status(200).json({
        status: 'success',
        results: smerfRates.length,
        data: { smerfRates }
      });
    }

    // /api/pricing/smerf - POST create SMERF rate
    if (path[0] === 'smerf' && path.length === 1 && req.method === 'POST') {
      const { hotelId, roomTypeId, startDate, endDate, rate, groupName, segment, notes } = req.body;

      const hotel = await prisma.hotel.findFirst({
        where: { id: hotelId, ...getHotelAccessFilter(user) }
      });

      if (!hotel) {
        return res.status(404).json({ status: 'error', message: 'Hotel not found' });
      }

      const smerfRate = await prisma.smerfRate.create({
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          rate,
          groupName,
          segment,
          notes,
          hotelId,
          roomTypeId
        }
      });

      return res.status(201).json({
        status: 'success',
        data: { smerfRate }
      });
    }

    // /api/pricing/smerf/[id] - PUT update SMERF rate
    if (path[0] === 'smerf' && path.length === 2 && req.method === 'PUT') {
      const id = path[1];
      const { startDate, endDate, rate, groupName, segment, notes } = req.body;

      const existingRate = await prisma.smerfRate.findFirst({
        where: { id },
        include: { hotel: true }
      });

      // Check ownership via organization or direct ownership
      const hasAccess = user.organizationId
        ? existingRate.hotel.organizationId === user.organizationId
        : existingRate.hotel.ownerId === user.id;

      if (!existingRate || !hasAccess) {
        return res.status(404).json({ status: 'error', message: 'SMERF rate not found' });
      }

      const smerfRate = await prisma.smerfRate.update({
        where: { id },
        data: {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          rate,
          groupName,
          segment,
          notes
        }
      });

      return res.status(200).json({
        status: 'success',
        data: { smerfRate }
      });
    }

    // /api/pricing/smerf/[id] - DELETE SMERF rate
    if (path[0] === 'smerf' && path.length === 2 && req.method === 'DELETE') {
      const id = path[1];

      const existingRate = await prisma.smerfRate.findFirst({
        where: { id },
        include: { hotel: true }
      });

      // Check ownership via organization or direct ownership
      const hasAccess = existingRate && (user.organizationId
        ? existingRate.hotel.organizationId === user.organizationId
        : existingRate.hotel.ownerId === user.id);

      if (!existingRate || !hasAccess) {
        return res.status(404).json({ status: 'error', message: 'SMERF rate not found' });
      }

      await prisma.smerfRate.delete({ where: { id } });

      return res.status(200).json({
        status: 'success',
        message: 'SMERF rate deleted'
      });
    }

    // /api/pricing/[id] - PATCH to update pricing record
    if (path.length === 1 && path[0] !== 'smerf' && req.method === 'PATCH') {
      const id = path[0];
      const { actualPrice } = req.body;

      const pricingRecord = await prisma.pricingHistory.findFirst({
        where: {
          id,
          hotel: getHotelAccessFilter(user)
        }
      });

      if (!pricingRecord) {
        return res.status(404).json({
          status: 'error',
          message: 'Pricing record not found'
        });
      }

      const updatedRecord = await prisma.pricingHistory.update({
        where: { id },
        data: { actualPrice }
      });

      return res.status(200).json({
        status: 'success',
        data: {
          pricingHistory: updatedRecord
        }
      });
    }

    // /api/pricing/hotels/[hotelId]/rooms/[roomTypeId]/pricing - GET
    if (path.length === 5 && path[0] === 'hotels' && path[2] === 'rooms' && path[4] === 'pricing' && req.method === 'GET') {
      const hotelId = path[1];
      const roomTypeId = path[3];
      const { startDate, endDate } = req.query;

      const hotel = await prisma.hotel.findFirst({
        where: {
          id: hotelId,
          ...getHotelAccessFilter(user)
        }
      });

      if (!hotel) {
        return res.status(404).json({
          status: 'error',
          message: 'Hotel not found'
        });
      }

      const pricingHistory = await prisma.pricingHistory.findMany({
        where: {
          hotelId,
          roomTypeId,
          date: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined
          }
        },
        include: {
          competitorPrices: true,
          events: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      return res.status(200).json({
        status: 'success',
        results: pricingHistory.length,
        data: {
          pricingHistory
        }
      });
    }

    // /api/pricing/hotels/[hotelId]/rooms/[roomTypeId]/calculate - POST
    if (path.length === 5 && path[0] === 'hotels' && path[2] === 'rooms' && path[4] === 'calculate' && req.method === 'POST') {
      const hotelId = path[1];
      const roomTypeId = path[3];
      const { date } = req.body;

      const hotel = await prisma.hotel.findFirst({
        where: {
          id: hotelId,
          ...getHotelAccessFilter(user)
        },
        include: {
          roomTypes: {
            where: {
              id: roomTypeId
            }
          }
        }
      });

      if (!hotel || hotel.roomTypes.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Hotel or room type not found'
        });
      }

      const roomType = hotel.roomTypes[0];

      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const checkInDate = targetDate.toISOString().split('T')[0];
      const checkOutDate = nextDay.toISOString().split('T')[0];

      let competitorPrices = [];

      try {
        const searchResult = await getCompetitorProvider().searchHotels(hotel.city, checkInDate, checkOutDate);

        if (searchResult.status && searchResult.hotels && searchResult.hotels.length > 0) {
          competitorPrices = searchResult.hotels
            .filter(h => {
              const property = h.property || {};
              return !hotel.bookingId || h.hotel_id !== hotel.bookingId;
            })
            .slice(0, 10)
            .map(h => {
              const property = h.property || {};
              const priceBreakdown = property.priceBreakdown || {};
              const grossPrice = priceBreakdown.grossPrice || {};

              return {
                hotelId: String(h.hotel_id || 'unknown'),
                hotelName: property.name || 'Unknown Hotel',
                roomType: 'Standard',
                price: grossPrice.value || 0,
                starRating: property.propertyClass || 0,
                reviewScore: property.reviewScore || 0
              };
            })
            .filter(h => h.price > 0);
        }
      } catch (apiError) {
        // Silent fail - continue without competitor data
      }

      const events = await prisma.event.findMany({
        where: {
          city: hotel.city,
          startDate: {
            lte: nextDay
          },
          endDate: {
            gte: targetDate
          }
        }
      });

      // Fetch SMERF rate for this specific room type (use highest if multiple exist)
      const smerfRates = await prisma.smerfRate.findMany({
        where: {
          hotelId,
          roomTypeId,
          startDate: { lte: targetDate },
          endDate: { gte: targetDate }
        }
      });
      const smerfRate = smerfRates.length > 0
        ? Math.max(...smerfRates.map(s => s.rate))
        : null;

      // Fetch ALL SMERF rates for this hotel on this date (all room types)
      const allHotelSmerfRates = await prisma.smerfRate.findMany({
        where: {
          hotelId,
          startDate: { lte: targetDate },
          endDate: { gte: targetDate }
        },
        include: {
          roomType: {
            select: { id: true, name: true, basePrice: true }
          }
        },
        orderBy: { rate: 'desc' }
      });

      const pricingData = {
        competitorPrices,
        events,
        basePrice: roomType.basePrice,
        starRating: hotel.starRating || 3,
        costPerNight: roomType.basePrice * 0.5,
        smerfRate
      };

      const pricingRecommendation = pricingService.calculateRecommendedPrice(pricingData);

      const targetDateOnly = new Date(date);
      targetDateOnly.setHours(0, 0, 0, 0);

      // Check if a pricing record already exists for this hotel/room/date
      const existingRecord = await prisma.pricingHistory.findUnique({
        where: {
          hotelId_roomTypeId_date: {
            hotelId,
            roomTypeId,
            date: targetDateOnly
          }
        }
      });

      let pricingRecord;

      if (existingRecord) {
        // Update the existing record with new recommendation
        // First, delete old competitor prices for this record
        await prisma.competitorPrice.deleteMany({
          where: { pricingHistoryId: existingRecord.id }
        });

        pricingRecord = await prisma.pricingHistory.update({
          where: { id: existingRecord.id },
          data: {
            price: roomType.basePrice,
            recommendedPrice: pricingRecommendation.recommendedPrice,
            competitorPrices: {
              create: competitorPrices.map(comp => ({
                hotelId: comp.hotelId,
                hotelName: comp.hotelName,
                roomType: comp.roomType,
                price: comp.price
              }))
            },
            events: {
              set: events.map(event => ({ id: event.id }))
            }
          },
          include: {
            competitorPrices: true,
            events: true
          }
        });
      } else {
        // Create a new pricing record
        pricingRecord = await prisma.pricingHistory.create({
          data: {
            date: targetDateOnly,
            price: roomType.basePrice,
            recommendedPrice: pricingRecommendation.recommendedPrice,
            hotel: {
              connect: { id: hotelId }
            },
            roomType: {
              connect: { id: roomTypeId }
            },
            competitorPrices: {
              create: competitorPrices.map(comp => ({
                hotelId: comp.hotelId,
                hotelName: comp.hotelName,
                roomType: comp.roomType,
                price: comp.price
              }))
            },
            events: {
              connect: events.map(event => ({ id: event.id }))
            }
          },
          include: {
            competitorPrices: true,
            events: true
          }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          pricingRecommendation,
          pricingRecord,
          allHotelSmerfRates
        }
      });
    }

    return res.status(404).json({ status: 'error', message: 'Not found' });
  } catch (error) {
    console.error('Pricing API Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};
