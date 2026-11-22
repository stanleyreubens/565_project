const axios = require('axios');

class GoogleHotelsApiService {
  constructor() {
    this.baseUrl = 'https://hotellens.p.rapidapi.com/api/v1';
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.apiHost = 'hotellens.p.rapidapi.com';
  }

  _headers() {
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': this.apiHost
    };
  }

  async searchHotels(city, checkInDate, checkOutDate, opts = {}) {
    const { limit = 20, adults = 2, rooms = 1, children = 0, currency = 'USD' } = opts;

    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/hotels`,
        headers: this._headers(),
        params: {
          location: city,
          check_in: checkInDate,
          check_out: checkOutDate,
          limit,
          adults,
          rooms,
          children,
          currency
        }
      });

      const data = response.data || {};
      const hotels = Array.isArray(data.hotels) ? data.hotels : [];

      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      const nights = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));

      const normalized = hotels.map(h => {
        // HotelLens `price` is per-night. Downstream handleSearch divides
        // grossPrice.value by nights to get pricePerNight, so we pre-multiply
        // to stay consistent with the booking-com15 wrapper (which returns totals).
        const nightlyPrice = Number(h.price) || 0;
        const totalPrice = nightlyPrice * nights;
        return {
          hotel_id: h.url || '',
          property: {
            name: h.name || 'Hotel',
            starRating: Number(h.stars) || 0,
            reviewScore: Number(h.rating) || 0,
            reviewCount: Number(h.reviews) || 0,
            photoUrls: h.image_url ? [h.image_url] : [],
            priceBreakdown: {
              grossPrice: {
                value: totalPrice,
                currency: h.currency || currency
              }
            },
            location: { address: '', city: data.location || city }
          },
          googleEntityUrl: h.url || ''
        };
      });

      return {
        status: hotels.length > 0,
        hotels: normalized,
        cityName: data.location || city,
        nights,
        totalResults: data.total_results || hotels.length,
        message: hotels.length === 0 ? 'No hotels found' : undefined
      };
    } catch (error) {
      throw new Error(`Failed to search hotels: ${error.message}`);
    }
  }

  async getPriceComparison(googleEntityUrl, opts = {}) {
    if (!googleEntityUrl) {
      throw new Error('googleEntityUrl is required');
    }

    const {
      limit = 20,
      checkInDate,
      checkOutDate,
      adults = 2,
      rooms = 1,
      children = 0,
      currency = 'USD'
    } = opts;

    const params = { url: googleEntityUrl, limit, adults, rooms, children, currency };
    if (checkInDate) params.check_in = checkInDate;
    if (checkOutDate) params.check_out = checkOutDate;

    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/hotels/prices`,
        headers: this._headers(),
        params
      });

      const data = response.data || {};
      const offers = Array.isArray(data.offers) ? data.offers : [];

      return {
        status: true,
        hotelName: data.name || '',
        address: data.address || '',
        checkIn: data.check_in || null,
        checkOut: data.check_out || null,
        nights: data.nights || 0,
        currency: data.currency || 'USD',
        headlinePrice: data.headline_price_value || 0,
        offers: offers.map(o => ({
          provider: o.provider,
          nightlyPrice: o.nightly_price_value || 0,
          totalPrice: o.total_price_value || 0,
          currency: o.currency || 'USD',
          freeCancellation: o.free_cancellation || false,
          cancellationDeadline: o.cancellation_deadline || null,
          bookingUrl: o.booking_url || '',
          providerUrl: o.provider_url || '',
          providerIconUrl: o.provider_icon_url || ''
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get price comparison: ${error.message}`);
    }
  }

  async searchLocations(query) {
    return {
      status: true,
      destination: { name: query, dest_id: query, dest_type: 'CITY' },
      suggestions: [{ entities: [{ destinationId: query }] }]
    };
  }

  async getRoomAvailability(_hotelId, _checkInDate, _checkOutDate) {
    return {
      status: false,
      message: 'Room-level availability is not supported by Google Hotels (HotelLens) provider. Use Booking provider for this feature.',
      available: [],
      unavailable: []
    };
  }

  async searchHotelsForImport(city) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const checkIn = tomorrow.toISOString().split('T')[0];
    const checkOut = nextWeek.toISOString().split('T')[0];

    const result = await this.searchHotels(city, checkIn, checkOut, { limit: 20 });

    if (!result.status) {
      return { status: false, message: result.message || 'No hotels found', hotels: [] };
    }

    const hotels = result.hotels.map(h => {
      const property = h.property || {};
      const grossPrice = property.priceBreakdown?.grossPrice || {};
      const totalPrice = grossPrice.value || 0;
      const pricePerNight = result.nights > 0 ? totalPrice / result.nights : totalPrice;
      return {
        hotelId: h.hotel_id,
        name: property.name,
        starRating: property.starRating,
        address: '',
        city,
        pricePerNight,
        reviewScore: property.reviewScore,
        photoUrl: property.photoUrls?.[0] || ''
      };
    });

    return { status: true, hotels, cityName: result.cityName };
  }

  async getHotelDetailsForImport(_hotelId, _checkInDate, _checkOutDate) {
    return {
      status: false,
      message: 'Room-type import is not supported by Google Hotels (HotelLens) provider. Switch COMPETITOR_PRICE_PROVIDER=booking to import room types.'
    };
  }
}

module.exports = new GoogleHotelsApiService();
