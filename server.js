const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Auth routes - consolidated
app.all('/api/auth/*', (req, res) => {
  const pathMatch = req.path.match(/^\/api\/auth\/(.*)$/);
  const pathParts = pathMatch ? pathMatch[1].split('/').filter(Boolean) : [];
  req.query.path = pathParts;
  require('./api/auth/[[...path]]')(req, res);
});

// Hotels routes - consolidated (specific routes first)
app.all('/api/hotels/search', (req, res) => {
  req.query.path = ['search'];
  require('./api/hotels/[[...path]]')(req, res);
});
app.all('/api/hotels/import/search', (req, res) => {
  req.query.path = ['import', 'search'];
  require('./api/hotels/[[...path]]')(req, res);
});
app.all('/api/hotels/import/:hotelId', (req, res) => {
  req.query.path = ['import', req.params.hotelId];
  require('./api/hotels/[[...path]]')(req, res);
});
app.all('/api/hotels/market-report/:hotelId', (req, res) => {
  req.query.path = ['market-report', req.params.hotelId];
  require('./api/hotels/[[...path]]')(req, res);
});
app.all('/api/hotels/competitors/:hotelId', (req, res) => {
  req.query.path = ['competitors', req.params.hotelId];
  require('./api/hotels/[[...path]]')(req, res);
});
app.all('/api/hotels/competitor/:hotelId/availability', (req, res) => {
  req.query.path = ['competitor', req.params.hotelId, 'availability'];
  require('./api/hotels/[[...path]]')(req, res);
});
app.get('/api/hotels/price-comparison', async (req, res) => {
  try {
    const { url, limit, checkInDate, checkOutDate, adults, rooms, children, currency, q } = req.query;
    if (!url) {
      return res.status(400).json({ status: 'error', message: 'url or property_token (price-comparison identifier) is required' });
    }
    const { getCompetitorProvider } = require('./lib/competitorProvider');
    const provider = getCompetitorProvider();
    if (typeof provider.getPriceComparison !== 'function') {
      return res.status(400).json({ status: 'error', message: 'Active provider does not support OTA price comparison' });
    }
    const data = await provider.getPriceComparison(url, {
      limit: Number(limit) || 20,
      checkInDate: checkInDate ? String(checkInDate).split('T')[0] : undefined,
      checkOutDate: checkOutDate ? String(checkOutDate).split('T')[0] : undefined,
      adults: adults ? Number(adults) : undefined,
      rooms: rooms ? Number(rooms) : undefined,
      children: children ? Number(children) : undefined,
      currency: currency || undefined,
      q: q || undefined
    });
    res.json({ status: 'success', data });
  } catch (e) {
    res.status(502).json({ status: 'error', message: e.message });
  }
});
app.all('/api/hotels/:hotelId', (req, res) => {
  req.query.path = [req.params.hotelId];
  require('./api/hotels/[[...path]]')(req, res);
});
app.all('/api/hotels', (req, res) => {
  req.query.path = [];
  require('./api/hotels/[[...path]]')(req, res);
});

// Events routes - consolidated
app.all('/api/events/:id', (req, res) => {
  req.query.path = [req.params.id];
  require('./api/events/[[...path]]')(req, res);
});
app.all('/api/events', (req, res) => {
  req.query.path = [];
  require('./api/events/[[...path]]')(req, res);
});

// Pricing routes - consolidated
// SMERF routes (must come before generic :id route)
app.all('/api/pricing/smerf/all', (req, res) => {
  req.query.path = ['smerf', 'all'];
  require('./api/pricing/[[...path]]')(req, res);
});
app.all('/api/pricing/smerf/hotel/:hotelId', (req, res) => {
  req.query.path = ['smerf', 'hotel', req.params.hotelId];
  require('./api/pricing/[[...path]]')(req, res);
});
app.all('/api/pricing/smerf/:hotelId/:roomTypeId', (req, res) => {
  req.query.path = ['smerf', req.params.hotelId, req.params.roomTypeId];
  require('./api/pricing/[[...path]]')(req, res);
});
app.all('/api/pricing/smerf/:id', (req, res) => {
  req.query.path = ['smerf', req.params.id];
  require('./api/pricing/[[...path]]')(req, res);
});
app.all('/api/pricing/smerf', (req, res) => {
  req.query.path = ['smerf'];
  require('./api/pricing/[[...path]]')(req, res);
});
app.all('/api/pricing/hotels/:hotelId/rooms/:roomTypeId/pricing', (req, res) => {
  req.query.path = ['hotels', req.params.hotelId, 'rooms', req.params.roomTypeId, 'pricing'];
  require('./api/pricing/[[...path]]')(req, res);
});
app.all('/api/pricing/hotels/:hotelId/rooms/:roomTypeId/calculate', (req, res) => {
  req.query.path = ['hotels', req.params.hotelId, 'rooms', req.params.roomTypeId, 'calculate'];
  require('./api/pricing/[[...path]]')(req, res);
});
app.all('/api/pricing/:id', (req, res) => {
  req.query.path = [req.params.id];
  require('./api/pricing/[[...path]]')(req, res);
});

// Reminders routes
app.all('/api/reminders/upcoming', (req, res) => {
  req.query.path = ['upcoming'];
  require('./api/reminders/[[...path]]')(req, res);
});
app.all('/api/reminders/overdue', (req, res) => {
  req.query.path = ['overdue'];
  require('./api/reminders/[[...path]]')(req, res);
});
app.all('/api/reminders/:id/complete', (req, res) => {
  req.query.path = [req.params.id, 'complete'];
  require('./api/reminders/[[...path]]')(req, res);
});
app.all('/api/reminders/:id/dismiss', (req, res) => {
  req.query.path = [req.params.id, 'dismiss'];
  require('./api/reminders/[[...path]]')(req, res);
});
app.all('/api/reminders/:id', (req, res) => {
  req.query.path = [req.params.id];
  require('./api/reminders/[[...path]]')(req, res);
});
app.all('/api/reminders', (req, res) => {
  req.query.path = [];
  require('./api/reminders/[[...path]]')(req, res);
});

// Health check
app.get('/api/health', require('./api/health'));

// Provider info (which competitor data source is active)
app.get('/api/config/provider', (_req, res) => {
  const { getProviderInfo } = require('./lib/competitorProvider');
  res.json({ status: 'success', data: getProviderInfo() });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
