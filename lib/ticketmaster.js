const axios = require('axios');

class TicketmasterService {
  constructor() {
    this.baseUrl = 'https://app.ticketmaster.com/discovery/v2';
    this.apiKey = process.env.TICKETMASTER_API_KEY;

    // Common DMA IDs for major cities (Designated Market Areas give better results)
    this.dmaMap = {
      'washington': 224,
      'washington dc': 224,
      'washington, dc': 224,
      'dc': 224,
      'new york': 345,
      'new york city': 345,
      'nyc': 345,
      'los angeles': 324,
      'la': 324,
      'chicago': 602,
      'houston': 618,
      'phoenix': 753,
      'philadelphia': 504,
      'san antonio': 641,
      'san diego': 825,
      'dallas': 623,
      'austin': 635,
      'san francisco': 807,
      'seattle': 819,
      'denver': 751,
      'boston': 506,
      'atlanta': 524,
      'miami': 528,
      'minneapolis': 613,
      'detroit': 505,
      'tampa': 539,
      'orlando': 534,
      'las vegas': 839,
      'baltimore': 512,
      'portland': 820,
      'sacramento': 862,
      'charlotte': 517,
      'san jose': 807,
      'pittsburgh': 508,
      'cleveland': 510,
      'nashville': 659,
      'indianapolis': 527,
      'kansas city': 616,
      'columbus': 535,
      'milwaukee': 617,
      'st. louis': 609,
      'st louis': 609,
      'new orleans': 622,
      'raleigh': 560,
      'salt lake city': 770,
      'cincinnati': 515
    };

    // State code mapping
    this.stateCodeMap = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
    };

    // Geocoding cache for city coordinates (approximate centers)
    this.cityCoordinates = {
      'bowie, md': { lat: 38.9428, lng: -76.7303 },
      'bowie md': { lat: 38.9428, lng: -76.7303 },
      'baltimore, md': { lat: 39.2904, lng: -76.6122 },
      'baltimore md': { lat: 39.2904, lng: -76.6122 },
      'baltimore': { lat: 39.2904, lng: -76.6122 },
      'annapolis, md': { lat: 38.9784, lng: -76.4922 },
      'annapolis md': { lat: 38.9784, lng: -76.4922 },
      'silver spring, md': { lat: 38.9907, lng: -77.0261 },
      'silver spring md': { lat: 38.9907, lng: -77.0261 },
      'rockville, md': { lat: 39.0840, lng: -77.1528 },
      'rockville md': { lat: 39.0840, lng: -77.1528 },
      'columbia, md': { lat: 39.2037, lng: -76.8610 },
      'columbia md': { lat: 39.2037, lng: -76.8610 },
      'frederick, md': { lat: 39.4143, lng: -77.4105 },
      'frederick md': { lat: 39.4143, lng: -77.4105 },
      'arlington, va': { lat: 38.8799, lng: -77.1068 },
      'arlington va': { lat: 38.8799, lng: -77.1068 },
      'alexandria, va': { lat: 38.8048, lng: -77.0469 },
      'alexandria va': { lat: 38.8048, lng: -77.0469 },
      'richmond, va': { lat: 37.5407, lng: -77.4360 },
      'richmond va': { lat: 37.5407, lng: -77.4360 }
    };
  }

  // Parse city input to extract city name and state code
  parseLocation(input) {
    const cleanInput = input.trim().toLowerCase();

    // Check for "City, ST" or "City ST" format
    const patterns = [
      /^(.+),\s*([a-z]{2})$/i,  // "Bowie, MD"
      /^(.+)\s+([a-z]{2})$/i,   // "Bowie MD"
    ];

    for (const pattern of patterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        return {
          city: match[1].trim(),
          stateCode: match[2].toUpperCase()
        };
      }
    }

    // Check if input is just a state name
    if (this.stateCodeMap[cleanInput]) {
      return {
        city: null,
        stateCode: this.stateCodeMap[cleanInput]
      };
    }

    return { city: cleanInput, stateCode: null };
  }

  async searchEvents(city, startDate, endDate) {
    try {
      const formattedStartDate = `${startDate}T00:00:00Z`;
      const formattedEndDate = `${endDate}T23:59:59Z`;

      let allEvents = [];
      const cityLower = city.toLowerCase().trim();

      // Parse the location input
      const location = this.parseLocation(city);

      // Check if we have a DMA ID for this city
      const dmaId = this.dmaMap[cityLower] || this.dmaMap[location.city];

      // Check if we have coordinates for geo search
      const coords = this.cityCoordinates[cityLower];

      console.log(`Searching for: "${city}" - DMA: ${dmaId}, Coords: ${coords ? 'yes' : 'no'}, State: ${location.stateCode}`);

      // Strategy 1: DMA search (for major cities)
      if (dmaId) {
        const dmaEvents = await this.searchByDMA(dmaId, formattedStartDate, formattedEndDate);
        allEvents = [...allEvents, ...dmaEvents];
        console.log(`DMA search found: ${dmaEvents.length} events`);
      }

      // Strategy 2: Geo/radius search (for smaller cities with known coordinates)
      if (coords) {
        const geoEvents = await this.searchByGeo(coords.lat, coords.lng, formattedStartDate, formattedEndDate, 30);
        const existingIds = new Set(allEvents.map(e => e.id));
        for (const event of geoEvents) {
          if (!existingIds.has(event.id)) {
            allEvents.push(event);
            existingIds.add(event.id);
          }
        }
        console.log(`Geo search added: ${geoEvents.length} events (after dedup: ${allEvents.length})`);
      }

      // Strategy 3: State code search
      if (location.stateCode && allEvents.length < 100) {
        const stateEvents = await this.searchByState(location.stateCode, formattedStartDate, formattedEndDate);
        const existingIds = new Set(allEvents.map(e => e.id));
        for (const event of stateEvents) {
          if (!existingIds.has(event.id)) {
            allEvents.push(event);
            existingIds.add(event.id);
          }
        }
        console.log(`State search added events (after dedup: ${allEvents.length})`);
      }

      // Strategy 4: City name search (fallback)
      if (allEvents.length === 0) {
        const cityName = location.city || city;
        const cityEvents = await this.searchByCity(cityName, formattedStartDate, formattedEndDate);
        allEvents = [...allEvents, ...cityEvents];
        console.log(`City name search found: ${cityEvents.length} events`);
      }

      // Strategy 5: Keyword search (additional fallback)
      if (allEvents.length < 20) {
        const keywordEvents = await this.searchByKeyword(city, formattedStartDate, formattedEndDate);
        const existingIds = new Set(allEvents.map(e => e.id));
        for (const event of keywordEvents) {
          if (!existingIds.has(event.id)) {
            allEvents.push(event);
            existingIds.add(event.id);
          }
        }
        console.log(`Keyword search added events (after dedup: ${allEvents.length})`);
      }

      console.log(`Total events found for "${city}": ${allEvents.length}`);
      return this.formatEvents(allEvents);
    } catch (error) {
      console.error('Error searching events:', error.message);
      return [];
    }
  }

  async searchByDMA(dmaId, startDateTime, endDateTime) {
    let allEvents = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      try {
        const response = await axios({
          method: 'get',
          url: `${this.baseUrl}/events.json`,
          params: {
            apikey: this.apiKey,
            dmaId: dmaId,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            size: 200,
            page: page,
            sort: 'date,asc',
            includeFamily: 'yes'
          }
        });

        if (!response.data._embedded || !response.data._embedded.events) {
          break;
        }

        allEvents = [...allEvents, ...response.data._embedded.events];

        if (response.data.page) {
          totalPages = response.data.page.totalPages || 1;
          page++;
        } else {
          break;
        }
      } catch (error) {
        console.error('DMA search error:', error.message);
        break;
      }
    }

    return allEvents;
  }

  async searchByGeo(lat, lng, startDateTime, endDateTime, radius = 25) {
    let allEvents = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages && page < 5) { // Limit to 5 pages for geo search
      try {
        const response = await axios({
          method: 'get',
          url: `${this.baseUrl}/events.json`,
          params: {
            apikey: this.apiKey,
            latlong: `${lat},${lng}`,
            radius: radius,
            unit: 'miles',
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            size: 200,
            page: page,
            sort: 'date,asc',
            includeFamily: 'yes'
          }
        });

        if (!response.data._embedded || !response.data._embedded.events) {
          break;
        }

        allEvents = [...allEvents, ...response.data._embedded.events];

        if (response.data.page) {
          totalPages = response.data.page.totalPages || 1;
          page++;
        } else {
          break;
        }
      } catch (error) {
        console.error('Geo search error:', error.message);
        break;
      }
    }

    return allEvents;
  }

  async searchByState(stateCode, startDateTime, endDateTime) {
    let allEvents = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages && page < 3) { // Limit to 3 pages for state search
      try {
        const response = await axios({
          method: 'get',
          url: `${this.baseUrl}/events.json`,
          params: {
            apikey: this.apiKey,
            stateCode: stateCode,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            size: 200,
            page: page,
            sort: 'date,asc',
            includeFamily: 'yes'
          }
        });

        if (!response.data._embedded || !response.data._embedded.events) {
          break;
        }

        allEvents = [...allEvents, ...response.data._embedded.events];

        if (response.data.page) {
          totalPages = response.data.page.totalPages || 1;
          page++;
        } else {
          break;
        }
      } catch (error) {
        console.error('State search error:', error.message);
        break;
      }
    }

    return allEvents;
  }

  async searchByCity(cityName, startDateTime, endDateTime) {
    let allEvents = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      try {
        const response = await axios({
          method: 'get',
          url: `${this.baseUrl}/events.json`,
          params: {
            apikey: this.apiKey,
            city: cityName,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            size: 200,
            page: page,
            sort: 'date,asc',
            includeFamily: 'yes'
          }
        });

        if (!response.data._embedded || !response.data._embedded.events) {
          break;
        }

        allEvents = [...allEvents, ...response.data._embedded.events];

        if (response.data.page) {
          totalPages = response.data.page.totalPages || 1;
          page++;
        } else {
          break;
        }
      } catch (error) {
        console.error('City search error:', error.message);
        break;
      }
    }

    return allEvents;
  }

  async searchByKeyword(keyword, startDateTime, endDateTime) {
    try {
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/events.json`,
        params: {
          apikey: this.apiKey,
          keyword: keyword,
          startDateTime: startDateTime,
          endDateTime: endDateTime,
          size: 200,
          sort: 'date,asc'
        }
      });

      if (response.data._embedded && response.data._embedded.events) {
        return response.data._embedded.events;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  formatEvents(events) {
    return events.map(event => {
      const venue = event._embedded?.venues?.[0] || {};
      const impactScore = this.calculateImpactScore(event);

      return {
        name: event.name,
        description: event.description || event.info || '',
        location: {
          venue: venue.name || '',
          address: venue.address?.line1 || '',
          city: venue.city?.name || '',
          state: venue.state?.stateCode || venue.state?.name || '',
          country: venue.country?.name || '',
          coordinates: {
            latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
            longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null
          }
        },
        startDate: event.dates?.start?.dateTime || event.dates?.start?.localDate,
        endDate: event.dates?.end?.dateTime || event.dates?.start?.localDate,
        category: event.classifications?.[0]?.segment?.name || 'General',
        subcategory: event.classifications?.[0]?.genre?.name || '',
        imageUrl: event.images?.[0]?.url || '',
        url: event.url || '',
        source: 'ticketmaster',
        sourceId: event.id,
        impactScore,
        status: event.dates?.status?.code || 'unknown',
        priceRange: event.priceRanges?.[0] ? {
          min: event.priceRanges[0].min,
          max: event.priceRanges[0].max,
          currency: event.priceRanges[0].currency
        } : null
      };
    });
  }

  calculateImpactScore(event) {
    let score = 5;

    const venue = event._embedded?.venues?.[0];
    if (venue) {
      if (venue.capacity) {
        const capacity = parseInt(venue.capacity);
        if (capacity > 20000) score += 3;
        else if (capacity > 10000) score += 2;
        else if (capacity > 5000) score += 1;
      } else if (venue.name) {
        const venueName = venue.name.toLowerCase();
        if (venueName.includes('arena')) score += 2;
        if (venueName.includes('stadium')) score += 3;
        if (venueName.includes('center') || venueName.includes('centre')) score += 1;
      }
    }

    const category = event.classifications?.[0]?.segment?.name?.toLowerCase();
    if (category === 'music') score += 1;
    if (category === 'sports') score += 2;

    if (event.dates?.status?.code === 'onsale') score += 1;
    if (event.dates?.status?.code === 'offsale') score -= 1;
    if (event.dates?.status?.code === 'cancelled') score -= 3;

    if (event.popularity && event.popularity > 0.7) score += 2;
    else if (event.popularity && event.popularity > 0.5) score += 1;

    return Math.min(Math.max(score, 1), 10);
  }
}

module.exports = new TicketmasterService();
