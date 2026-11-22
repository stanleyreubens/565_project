const axios = require('axios');

class HotelsApiService {
  constructor() {
    this.baseUrl = 'https://booking-com15.p.rapidapi.com/api/v1';
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.apiHost = 'booking-com15.p.rapidapi.com';
  }

  async searchLocations(query) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/hotels/searchDestination`,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        },
        params: {
          query: query,
          languagecode: 'en-us'
        }
      });

      if (response.data && response.data.status === true && response.data.data) {
        const destinations = response.data.data || [];

        if (destinations.length > 0) {
          return {
            status: true,
            destination: destinations[0],
            allDestinations: destinations
          };
        }
      }

      return {
        status: false,
        message: 'No matching destinations found',
        allDestinations: []
      };
    } catch (error) {
      throw new Error(`Failed to search locations: ${error.message}`);
    }
  }

  async searchHotels(city, checkInDate, checkOutDate) {
    try {
      const locationResult = await this.searchLocations(city);

      if (!locationResult.status || !locationResult.destination) {
        return {
          status: false,
          message: `No destination found for "${city}"`,
          hotels: []
        };
      }

      const destId = locationResult.destination.dest_id;

      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/hotels/searchHotels`,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        },
        params: {
          dest_id: destId,
          search_type: locationResult.destination.dest_type || 'CITY',
          adults: '1',
          children_age: '',
          room_qty: '1',
          page_number: '1',
          arrival_date: checkInDate,
          departure_date: checkOutDate,
          units: 'metric',
          temperature_unit: 'c',
          languagecode: 'en-us',
          currency_code: 'USD',
          location: 'US'
        }
      });

      if (response.data && response.data.status === true && response.data.data) {
        const hotels = response.data.data.hotels || [];

        return {
          status: true,
          hotels: hotels,
          cityName: locationResult.destination.name || city
        };
      } else {
        return {
          status: false,
          message: response.data.message || 'API returned error or no data',
          hotels: []
        };
      }
    } catch (error) {
      throw new Error(`Failed to search hotels: ${error.message}`);
    }
  }

  async getRoomAvailability(hotelId, checkInDate, checkOutDate) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/hotels/getRoomListWithAvailability`,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        },
        params: {
          hotel_id: hotelId,
          arrival_date: checkInDate,
          departure_date: checkOutDate,
          adults: '1',
          room_qty: '1',
          units: 'metric',
          temperature_unit: 'c',
          languagecode: 'en-us',
          currency_code: 'USD'
        }
      });

      if (response.data && response.data.status === true) {
        const availableRooms = response.data.available || [];
        const unavailableRooms = response.data.unavailable || [];

        const processedAvailable = availableRooms.map(room => ({
          roomId: room.roomtype_id || room.room_id,
          blockId: room.block_id,
          name: room.room_name || room.name || 'Room',
          maxOccupancy: room.max_occupancy || room.nr_adults || 2,
          roomCount: room.nr_stays || room.room_count || 1,
          roomSize: room.room_surface_in_m2 || 0,
          roomSizeFt: room.room_surface_in_feet2 || 0,
          price: room.product_price_breakdown?.gross_amount?.value ||
                 room.min_price?.value ||
                 room.price || 0,
          pricePerNight: room.product_price_breakdown?.gross_amount_per_night?.value ||
                         room.min_price_per_night?.value || 0,
          currency: room.product_price_breakdown?.gross_amount?.currency || 'USD',
          breakfastIncluded: room.breakfast_included === 1,
          halfBoard: room.half_board === 1,
          fullBoard: room.full_board === 1,
          mealPlan: room.mealplan || '',
          refundable: room.refundable === 1 || room.refundable_until !== '',
          freeCancellation: room.refundable_until !== '' ||
                           room.transactional_policy_objects?.some(p => p.key === 'FreeCancellationKey'),
          smoking: room.smoking === 1 ? 'Smoking' : room.smoking === 0 ? 'Non-smoking' : 'Unknown',
          isAvailable: true
        }));

        const processedUnavailable = unavailableRooms.map(room => ({
          roomId: room.roomtype_id || room.room_id,
          blockId: room.block_id,
          name: room.room_name || room.name || 'Room',
          maxOccupancy: room.max_occupancy || room.nr_adults || 2,
          roomCount: 0,
          roomSize: room.room_surface_in_m2 || 0,
          roomSizeFt: room.room_surface_in_feet2 || 0,
          price: 0,
          pricePerNight: 0,
          currency: 'USD',
          breakfastIncluded: room.breakfast_included === 1,
          halfBoard: room.half_board === 1,
          fullBoard: room.full_board === 1,
          mealPlan: room.mealplan || '',
          refundable: false,
          freeCancellation: false,
          smoking: room.smoking === 1 ? 'Smoking' : room.smoking === 0 ? 'Non-smoking' : 'Unknown',
          isAvailable: false
        }));

        const groupedAvailable = this.groupRoomsByName(processedAvailable);
        const groupedUnavailable = this.groupRoomsByName(processedUnavailable);

        return {
          status: true,
          hotelId: hotelId,
          available: groupedAvailable,
          unavailable: groupedUnavailable,
          totalAvailableRooms: groupedAvailable.reduce((sum, r) => sum + r.roomCount, 0),
          totalUnavailableRooms: groupedUnavailable.length,
          allRoomOptions: [...processedAvailable, ...processedUnavailable]
        };
      }

      return {
        status: false,
        message: response.data?.message || 'No room availability data found',
        available: [],
        unavailable: []
      };
    } catch (error) {
      throw new Error(`Failed to fetch room availability: ${error.message}`);
    }
  }

  groupRoomsByName(rooms) {
    const grouped = {};
    rooms.forEach(room => {
      if (!grouped[room.name]) {
        grouped[room.name] = room;
      } else {
        if (room.pricePerNight < grouped[room.name].pricePerNight) {
          grouped[room.name] = room;
        }
      }
    });
    return Object.values(grouped);
  }

  async getHotelDetailsForImport(hotelId, checkInDate, checkOutDate) {
    try {
      const roomData = await this.getRoomAvailability(hotelId, checkInDate, checkOutDate);

      if (!roomData.status) {
        return {
          status: false,
          message: 'Could not fetch hotel room details'
        };
      }

      const roomTypes = roomData.available.map(room => ({
        name: room.name,
        baseRate: room.pricePerNight || 0,
        maxOccupancy: room.maxOccupancy || 2,
        description: `${room.roomSize ? room.roomSize + ' m²' : ''} ${room.breakfastIncluded ? '- Breakfast included' : ''}`.trim()
      }));

      return {
        status: true,
        roomTypes: roomTypes,
        totalRooms: roomData.totalAvailableRooms + roomData.totalUnavailableRooms
      };
    } catch (error) {
      return {
        status: false,
        message: error.message
      };
    }
  }

  async searchHotelsForImport(city) {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(tomorrow);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const checkInDate = tomorrow.toISOString().split('T')[0];
      const checkOutDate = nextWeek.toISOString().split('T')[0];

      const result = await this.searchHotels(city, checkInDate, checkOutDate);

      if (!result.status || !result.hotels) {
        return {
          status: false,
          message: result.message || 'No hotels found',
          hotels: []
        };
      }

      const hotels = result.hotels.map(hotel => {
        const property = hotel.property || {};
        const priceBreakdown = property.priceBreakdown || {};
        const grossPrice = priceBreakdown.grossPrice || {};

        return {
          hotelId: hotel.hotel_id,
          name: property.name || 'Unknown Hotel',
          starRating: property.starRating || 0,
          address: property.location?.address || '',
          city: city,
          pricePerNight: grossPrice.value ? grossPrice.value / 7 : 0,
          reviewScore: property.reviewScore || 0,
          photoUrl: property.photoUrls?.[0] || ''
        };
      });

      return {
        status: true,
        hotels: hotels,
        cityName: city
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        hotels: []
      };
    }
  }
}

module.exports = new HotelsApiService();
