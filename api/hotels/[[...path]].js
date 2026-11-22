const prisma = require('../../lib/prisma');
const { verifyAuth } = require('../../lib/auth');
const hotelsApiService = require('../../lib/hotelsApi');
const { getCompetitorProvider, getProviderInfo } = require('../../lib/competitorProvider');

// Helper to build hotel access filter - uses organization if available, falls back to owner
const getHotelAccessFilter = (user) => {
  if (user.organizationId) {
    return { organizationId: user.organizationId };
  }
  return { ownerId: user.id };
};

const mapRoomTypesForFrontend = (roomTypes) => {
  return (roomTypes || []).map(rt => ({
    id: rt.id,
    name: rt.name,
    baseRate: rt.basePrice,
    maxOccupancy: rt.capacity,
    description: rt.features?.[0] || '',
    basePrice: rt.basePrice,
    capacity: rt.capacity,
    features: rt.features
  }));
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
    const match = urlPath.match(/\/api\/hotels\/?(.*)/);
    path = match && match[1] ? match[1].split('/').filter(Boolean) : [];
  }
  if (!Array.isArray(path)) path = [path];

  try {
    // /api/hotels - list or create hotels
    if (path.length === 0) {
      return handleHotelsList(req, res, user);
    }

    // /api/hotels/search
    if (path[0] === 'search' && req.method === 'GET') {
      return handleSearch(req, res);
    }

    // /api/hotels/import/search
    if (path[0] === 'import' && path[1] === 'search' && req.method === 'GET') {
      return handleImportSearch(req, res);
    }

    // /api/hotels/import/[hotelId]
    if (path[0] === 'import' && path.length === 2 && req.method === 'GET') {
      return handleImportHotel(req, res, path[1]);
    }

    // /api/hotels/market-report/[hotelId]
    if (path[0] === 'market-report' && path.length === 2 && req.method === 'GET') {
      return handleMarketReport(req, res, user, path[1]);
    }

    // /api/hotels/competitors/[hotelId]
    if (path[0] === 'competitors' && path.length === 2 && req.method === 'GET') {
      return handleCompetitors(req, res, user, path[1]);
    }

    // /api/hotels/competitor/[hotelId]/availability
    if (path[0] === 'competitor' && path[2] === 'availability' && req.method === 'GET') {
      return handleCompetitorAvailability(req, res, path[1]);
    }

    // /api/hotels/[hotelId] - get, update, or delete a specific hotel
    if (path.length === 1) {
      return handleSingleHotel(req, res, user, path[0]);
    }

    return res.status(404).json({ status: 'error', message: 'Not found' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

async function handleHotelsList(req, res, user) {
  if (req.method === 'GET') {
    const hotels = await prisma.hotel.findMany({
      where: getHotelAccessFilter(user),
      include: {
        roomTypes: true,
        competitors: true
      }
    });

    const mappedHotels = hotels.map(hotel => ({
      ...hotel,
      roomTypes: mapRoomTypesForFrontend(hotel.roomTypes)
    }));

    return res.status(200).json({
      status: 'success',
      results: mappedHotels.length,
      data: { hotels: mappedHotels }
    });
  }

  if (req.method === 'POST') {
    const { name, street, city, state, zipCode, country, starRating, amenities, roomTypes } = req.body;

    const mappedRoomTypes = (roomTypes || []).map(rt => ({
      name: rt.name,
      basePrice: rt.baseRate || rt.basePrice || 0,
      capacity: rt.maxOccupancy || rt.capacity || 2,
      features: rt.description ? [rt.description] : (rt.features || [])
    }));

    const hotelData = {
      name,
      street,
      city,
      state,
      zipCode,
      country,
      starRating,
      amenities,
      owner: {
        connect: { id: user.id }
      },
      roomTypes: {
        create: mappedRoomTypes
      }
    };

    // Link hotel to organization if user has one
    if (user.organizationId) {
      hotelData.organization = {
        connect: { id: user.organizationId }
      };
    }

    const hotel = await prisma.hotel.create({
      data: hotelData,
      include: {
        roomTypes: true
      }
    });

    return res.status(201).json({
      status: 'success',
      data: { hotel }
    });
  }

  return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

async function handleSingleHotel(req, res, user, id) {
  if (req.method === 'GET') {
    const hotel = await prisma.hotel.findFirst({
      where: {
        id,
        ...getHotelAccessFilter(user)
      },
      include: {
        roomTypes: true,
        competitors: true
      }
    });

    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel not found'
      });
    }

    const mappedHotel = {
      ...hotel,
      roomTypes: mapRoomTypesForFrontend(hotel.roomTypes)
    };

    return res.status(200).json({
      status: 'success',
      data: { hotel: mappedHotel }
    });
  }

  if (req.method === 'PUT') {
    const hotelExists = await prisma.hotel.findFirst({
      where: {
        id,
        ...getHotelAccessFilter(user)
      },
      include: {
        roomTypes: true
      }
    });

    if (!hotelExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel not found'
      });
    }

    const { roomTypes, ...hotelData } = req.body;

    // Update hotel basic info
    await prisma.hotel.update({
      where: { id },
      data: hotelData
    });

    // Handle room types if provided
    if (roomTypes && Array.isArray(roomTypes)) {
      const existingRoomTypeIds = hotelExists.roomTypes.map(rt => rt.id);
      const incomingRoomTypeIds = roomTypes.filter(rt => rt.id).map(rt => rt.id);

      // Delete room types that are no longer in the list
      const roomTypesToDelete = existingRoomTypeIds.filter(id => !incomingRoomTypeIds.includes(id));
      if (roomTypesToDelete.length > 0) {
        await prisma.roomType.deleteMany({
          where: {
            id: { in: roomTypesToDelete },
            hotelId: id
          }
        });
      }

      // Update existing and create new room types
      for (const rt of roomTypes) {
        const roomTypeData = {
          name: rt.name,
          basePrice: rt.baseRate || rt.basePrice || 0,
          capacity: rt.maxOccupancy || rt.capacity || 2,
          features: rt.description ? [rt.description] : (rt.features || [])
        };

        if (rt.id && existingRoomTypeIds.includes(rt.id)) {
          // Update existing room type
          await prisma.roomType.update({
            where: { id: rt.id },
            data: roomTypeData
          });
        } else if (!rt.id) {
          // Create new room type
          await prisma.roomType.create({
            data: {
              ...roomTypeData,
              hotelId: id
            }
          });
        }
      }
    }

    // Fetch updated hotel with room types
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        roomTypes: true,
        competitors: true
      }
    });

    const mappedHotel = {
      ...hotel,
      roomTypes: mapRoomTypesForFrontend(hotel.roomTypes)
    };

    return res.status(200).json({
      status: 'success',
      data: { hotel: mappedHotel }
    });
  }

  if (req.method === 'DELETE') {
    const hotelExists = await prisma.hotel.findFirst({
      where: {
        id,
        ...getHotelAccessFilter(user)
      }
    });

    if (!hotelExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel not found'
      });
    }

    await prisma.hotel.delete({
      where: { id }
    });

    return res.status(204).end();
  }

  return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

async function handleSearch(req, res) {
  const { city, checkInDate, checkOutDate } = req.query;

  if (!city || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide city, check-in and check-out dates'
    });
  }

  const checkIn = checkInDate.split('T')[0];
  const checkOut = checkOutDate.split('T')[0];

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const nights = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

  const apiResponse = await getCompetitorProvider().searchHotels(city, checkIn, checkOut);

  const hotelsData = apiResponse.hotels || [];

  const hotels = hotelsData.map(hotelData => {
    const property = hotelData.property || {};
    const priceBreakdown = property.priceBreakdown || {};
    const grossPrice = priceBreakdown.grossPrice || {};

    const totalPrice = grossPrice.value ||
                       property.priceDisplayInfo?.displayPrice?.amountUnformatted || 0;

    const pricePerNight = nights > 0 ? (totalPrice / nights) : totalPrice;

    let amenities = [];
    if (property.highlights) {
      amenities = property.highlights.map(h => h.translated_name || h.name || '').filter(Boolean);
    }

    let roomTypes = [];
    if (property.rooms) {
      roomTypes = property.rooms.map(r => r.name || '').filter(Boolean);
    } else if (property.roomTypeNames) {
      roomTypes = property.roomTypeNames;
    }

    return {
      hotelId: hotelData.hotel_id || '',
      googleEntityUrl: hotelData.googleEntityUrl || '',
      name: property.name || 'Hotel',
      starRating: property.starRating || 0,
      totalPrice: totalPrice,
      pricePerNight: pricePerNight,
      currency: grossPrice.currency || 'USD',
      amenities: amenities.slice(0, 10),
      roomTypes: roomTypes,
      address: property.location?.address || '',
      city: city || property.location?.city || '',
      imageUrl: property.photoUrls?.[0] || '',
      reviewScore: property.reviewScore || 0,
      reviewCount: property.reviewCount || 0,
      checkInDate,
      checkOutDate,
      nights
    };
  });

  const { getProviderInfo: _gpi } = require('../../lib/competitorProvider');
  res.status(200).json({
    status: 'success',
    data: {
      hotels,
      cityName: apiResponse.cityName || city,
      nights,
      provider: _gpi()
    }
  });
}

async function handleImportSearch(req, res) {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide a city to search'
    });
  }

  const result = await hotelsApiService.searchHotelsForImport(city);

  res.status(200).json({
    status: 'success',
    data: result
  });
}

async function handleImportHotel(req, res, hotelId) {
  if (!hotelId) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide a hotel ID'
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const checkInDate = tomorrow.toISOString().split('T')[0];
  const checkOutDate = nextWeek.toISOString().split('T')[0];

  const result = await hotelsApiService.getHotelDetailsForImport(hotelId, checkInDate, checkOutDate);

  res.status(200).json({
    status: 'success',
    data: result
  });
}

async function handleMarketReport(req, res, user, hotelId) {
  const { checkInDate, checkOutDate } = req.query;

  if (!hotelId || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide hotelId, check-in and check-out dates'
    });
  }

  const userHotel = await prisma.hotel.findFirst({
    where: {
      id: hotelId,
      ...getHotelAccessFilter(user)
    },
    include: {
      roomTypes: true
    }
  });

  if (!userHotel) {
    return res.status(404).json({
      status: 'error',
      message: 'Hotel not found'
    });
  }

  const checkIn = checkInDate.split('T')[0];
  const checkOut = checkOutDate.split('T')[0];

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const nights = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

  const city = userHotel.city;

  const apiResponse = await getCompetitorProvider().searchHotels(city, checkIn, checkOut);
  const rawHotels = apiResponse.hotels || [];

  const competitorHotels = rawHotels.map(hotel => {
    const property = hotel.property || {};
    const priceBreakdown = property.priceBreakdown || {};
    const grossPrice = priceBreakdown.grossPrice || {};
    const totalPrice = grossPrice.value || 0;
    const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;

    return {
      hotelId: hotel.hotel_id,
      name: property.name || 'Unknown Hotel',
      starRating: property.propertyClass || 0,
      totalPrice: totalPrice,
      pricePerNight: pricePerNight,
      reviewScore: property.reviewScore || 0
    };
  });

  const hotelsWithPrices = competitorHotels.filter(h => h.pricePerNight > 0);

  if (hotelsWithPrices.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        message: 'No competitor data available for this market',
        competitors: [],
        metrics: null
      }
    });
  }

  let userADR = 0;
  if (userHotel.roomTypes && userHotel.roomTypes.length > 0) {
    const totalBaseRate = userHotel.roomTypes.reduce((sum, rt) => sum + (rt.basePrice || rt.baseRate || 0), 0);
    userADR = totalBaseRate / userHotel.roomTypes.length;
  }

  const compSetADR = hotelsWithPrices.reduce((sum, h) => sum + parseFloat(h.pricePerNight), 0) / hotelsWithPrices.length;
  const compSetMinPrice = Math.min(...hotelsWithPrices.map(h => parseFloat(h.pricePerNight)));
  const compSetMaxPrice = Math.max(...hotelsWithPrices.map(h => parseFloat(h.pricePerNight)));

  let totalAvailableRooms = 0;
  let totalRoomsChecked = 0;
  let availabilityPromises = [];

  const hotelsToCheck = hotelsWithPrices.slice(0, 5);
  for (const hotel of hotelsToCheck) {
    if (hotel.hotelId) {
      availabilityPromises.push(
        hotelsApiService.getRoomAvailability(hotel.hotelId, checkIn, checkOut)
          .catch(() => null)
      );
    }
  }

  const availabilityResults = await Promise.all(availabilityPromises);

  availabilityResults.forEach(result => {
    if (result && result.status) {
      const totalRooms = (result.totalAvailableRooms || 0) + (result.totalUnavailableRooms || 0);
      if (totalRooms > 0) {
        totalAvailableRooms += result.totalAvailableRooms || 0;
        totalRoomsChecked += totalRooms;
      }
    }
  });

  let compSetOccupancy = 70;
  if (totalRoomsChecked > 0) {
    const bookedRooms = totalRoomsChecked - totalAvailableRooms;
    compSetOccupancy = Math.min(95, Math.max(40, (bookedRooms / totalRoomsChecked) * 100));
  }

  const ari = userADR > 0 ? (userADR / compSetADR) * 100 : 100;
  const userOccupancy = compSetOccupancy;
  const mpi = (userOccupancy / compSetOccupancy) * 100;
  const userRevPAR = userADR * (userOccupancy / 100);
  const compSetRevPAR = compSetADR * (compSetOccupancy / 100);
  const rgi = compSetRevPAR > 0 ? (userRevPAR / compSetRevPAR) * 100 : 100;

  const competitorBreakdown = hotelsWithPrices.map(hotel => ({
    name: hotel.name,
    starRating: hotel.starRating || 0,
    pricePerNight: parseFloat(hotel.pricePerNight).toFixed(2),
    totalPrice: parseFloat(hotel.totalPrice).toFixed(2),
    reviewScore: hotel.reviewScore || 0,
    hotelId: hotel.hotelId
  })).sort((a, b) => parseFloat(a.pricePerNight) - parseFloat(b.pricePerNight));

  const reportData = {
    hotelName: userHotel.name,
    city: city,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nights: nights,
    competitorCount: hotelsWithPrices.length,
    yourHotel: {
      adr: parseFloat(userADR.toFixed(2)),
      occupancy: parseFloat(userOccupancy.toFixed(1)),
      revpar: parseFloat(userRevPAR.toFixed(2))
    },
    compSet: {
      adr: parseFloat(compSetADR.toFixed(2)),
      minAdr: parseFloat(compSetMinPrice.toFixed(2)),
      maxAdr: parseFloat(compSetMaxPrice.toFixed(2)),
      occupancy: parseFloat(compSetOccupancy.toFixed(1)),
      revpar: parseFloat(compSetRevPAR.toFixed(2))
    },
    indices: {
      ari: parseFloat(ari.toFixed(1)),
      mpi: parseFloat(mpi.toFixed(1)),
      rgi: parseFloat(rgi.toFixed(1))
    },
    competitors: competitorBreakdown,
    priceDistribution: competitorBreakdown.slice(0, 20).map(c => ({
      name: c.name.substring(0, 15) + (c.name.length > 15 ? '...' : ''),
      price: parseFloat(c.pricePerNight),
      rating: c.starRating
    }))
  };

  res.status(200).json({
    status: 'success',
    data: reportData
  });
}

async function handleCompetitors(req, res, user, hotelId) {
  const { city, checkInDate, checkOutDate } = req.query;

  if (!city || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide city, check-in and check-out dates'
    });
  }

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

  const checkIn = checkInDate.split('T')[0];
  const checkOut = checkOutDate.split('T')[0];

  const locationResponse = await hotelsApiService.searchLocations(city);

  const locations = locationResponse.suggestions?.[0]?.entities || [];

  if (locations.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        competitors: []
      },
      message: `No locations found for '${city}'`
    });
  }

  const locationId = locations[0].destinationId;

  const hotelResponse = await hotelsApiService.searchHotels(locationId, checkIn, checkOut);

  const properties = hotelResponse.data?.propertySearch?.properties || [];

  const competitors = properties.map(property => ({
    externalId: property.id,
    name: property.name,
    starRating: property.star || 0,
    price: property.price?.lead?.amount || 0,
    roomType: 'Standard',
    distance: 0
  }));

  res.status(200).json({
    status: 'success',
    data: {
      competitors
    }
  });
}

async function handleCompetitorAvailability(req, res, hotelId) {
  const { checkInDate, checkOutDate } = req.query;

  if (!hotelId || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide hotelId, check-in and check-out dates'
    });
  }

  const checkIn = checkInDate.split('T')[0];
  const checkOut = checkOutDate.split('T')[0];

  const availabilityData = await hotelsApiService.getRoomAvailability(hotelId, checkIn, checkOut);

  res.status(200).json({
    status: 'success',
    data: availabilityData
  });
}
