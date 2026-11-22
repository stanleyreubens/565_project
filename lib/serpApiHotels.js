const axios = require('axios');

class SerpApiHotelsService {
  constructor() {
    this.baseUrl = 'https://serpapi.com/search.json';
    this.apiKey = process.env.SERPAPI_KEY;
  }

  _ensureKey() {
    if (!this.apiKey) {
      throw new Error('SERPAPI_KEY is not set in environment');
    }
  }

  async searchHotels(city, checkInDate, checkOutDate, opts = {}) {
    this._ensureKey();
    const {
      adults = 2,
      children = 0,
      currency = 'USD',
      gl = 'us',
      hl = 'en'
    } = opts;

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const nights = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));

    try {
      const response = await axios({
        method: 'GET',
        url: this.baseUrl,
        params: {
          engine: 'google_hotels',
          q: city,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          adults,
          children,
          currency,
          gl,
          hl,
          api_key: this.apiKey
        }
      });

      const data = response.data || {};
      const properties = Array.isArray(data.properties) ? data.properties : [];

      const normalized = properties.map(p => {
        const ratePerNight = Number(p.rate_per_night?.extracted_lowest) || 0;
        const totalRate = Number(p.total_rate?.extracted_lowest) || ratePerNight * nights;
        const photo = p.images?.[0]?.thumbnail || p.images?.[0]?.original_image || '';
        return {
          hotel_id: p.property_token || '',
          property: {
            name: p.name || 'Hotel',
            starRating: Number(p.extracted_hotel_class) || 0,
            reviewScore: Number(p.overall_rating) || 0,
            reviewCount: Number(p.reviews) || 0,
            photoUrls: photo ? [photo] : [],
            priceBreakdown: {
              grossPrice: {
                value: totalRate,
                currency
              }
            },
            location: { address: p.address || '', city }
          },
          googleEntityUrl: p.property_token || ''
        };
      });

      return {
        status: normalized.length > 0,
        hotels: normalized,
        cityName: city,
        nights,
        totalResults: normalized.length,
        message: normalized.length === 0 ? 'No hotels found' : undefined
      };
    } catch (error) {
      throw new Error(`SerpApi search failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getPriceComparison(propertyToken, opts = {}) {
    this._ensureKey();
    if (!propertyToken) {
      throw new Error('propertyToken is required');
    }
    const {
      checkInDate,
      checkOutDate,
      adults = 2,
      children = 0,
      currency = 'USD',
      gl = 'us',
      hl = 'en',
      q = 'hotels'
    } = opts;

    if (!checkInDate || !checkOutDate) {
      throw new Error('checkInDate and checkOutDate are required for SerpApi price comparison');
    }

    try {
      const response = await axios({
        method: 'GET',
        url: this.baseUrl,
        params: {
          engine: 'google_hotels',
          q,
          property_token: propertyToken,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          adults,
          children,
          currency,
          gl,
          hl,
          api_key: this.apiKey
        }
      });

      const data = response.data || {};
      const featuredOffers = Array.isArray(data.featured_prices) ? data.featured_prices : [];
      const otherOffers = Array.isArray(data.prices) ? data.prices : [];

      const seen = new Set();
      const allOffers = [];
      for (const offer of [...featuredOffers, ...otherOffers]) {
        const key = `${offer.source}|${offer.rate_per_night?.extracted_lowest || 0}`;
        if (seen.has(key)) continue;
        seen.add(key);
        allOffers.push(offer);
      }

      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      const nights = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));

      const headlinePrice = Number(data.rate_per_night?.extracted_lowest) || 0;

      return {
        status: true,
        hotelName: data.name || '',
        address: data.address || '',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        currency,
        headlinePrice,
        offers: allOffers.map(o => {
          const nightly = Number(o.rate_per_night?.extracted_lowest) || 0;
          const total = Number(o.total_rate?.extracted_lowest) || nightly * nights;
          return {
            provider: o.source || 'Unknown',
            nightlyPrice: nightly,
            totalPrice: total,
            currency: o.rate_per_night?.currency || currency,
            freeCancellation: !!o.free_cancellation_until_date,
            cancellationDeadline: o.free_cancellation_until_date || null,
            bookingUrl: o.link || '',
            providerUrl: o.link || '',
            providerIconUrl: o.logo || ''
          };
        })
      };
    } catch (error) {
      throw new Error(`SerpApi price comparison failed: ${error.response?.data?.error || error.message}`);
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
      message: 'Room-level availability is not supported by SerpApi. Use Booking provider for this feature.',
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

    const result = await this.searchHotels(city, checkIn, checkOut);
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
        address: property.location?.address || '',
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
      message: 'Room-type import is not supported by SerpApi. Switch COMPETITOR_PRICE_PROVIDER=booking to import room types.'
    };
  }
}

module.exports = new SerpApiHotelsService();
