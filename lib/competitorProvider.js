const bookingProvider = require('./hotelsApi');
const googleProvider = require('./googleHotelsApi');
const serpApiProvider = require('./serpApiHotels');

const VALID_PROVIDERS = {
  booking: { service: bookingProvider, label: 'Booking.com', supportsRoomImport: true, supportsOtaBreakdown: false },
  hotellens: { service: googleProvider, label: 'Google Hotels (HotelLens)', supportsRoomImport: false, supportsOtaBreakdown: true },
  serpapi: { service: serpApiProvider, label: 'Google Hotels (SerpApi)', supportsRoomImport: false, supportsOtaBreakdown: true }
};

function getActiveProviderKey() {
  const raw = (process.env.COMPETITOR_PRICE_PROVIDER || 'booking').trim().toLowerCase();
  return VALID_PROVIDERS[raw] ? raw : 'booking';
}

function getCompetitorProvider() {
  return VALID_PROVIDERS[getActiveProviderKey()].service;
}

function getProviderInfo() {
  const key = getActiveProviderKey();
  const meta = VALID_PROVIDERS[key];
  return {
    key,
    label: meta.label,
    supportsRoomImport: meta.supportsRoomImport,
    supportsOtaBreakdown: meta.supportsOtaBreakdown
  };
}

module.exports = {
  getCompetitorProvider,
  getProviderInfo,
  bookingProvider,
  googleProvider,
  serpApiProvider
};
