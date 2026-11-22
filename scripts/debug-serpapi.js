require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.SERPAPI_KEY;
const CITY = process.argv[2] || 'New Carrollton';
const CHECK_IN = process.argv[3] || '2026-06-20';
const CHECK_OUT = process.argv[4] || '2026-06-29';
const HOTEL_NAME_MATCH = process.argv[5] || '';

async function main() {
  if (!API_KEY) {
    console.error('SERPAPI_KEY missing from .env');
    process.exit(1);
  }

  console.log(`\n=== STEP 1: Search hotels in "${CITY}" ${CHECK_IN} → ${CHECK_OUT} ===\n`);

  const searchRes = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_hotels',
      q: CITY,
      check_in_date: CHECK_IN,
      check_out_date: CHECK_OUT,
      adults: 2,
      currency: 'USD',
      gl: 'us',
      hl: 'en',
      api_key: API_KEY
    }
  });

  const properties = searchRes.data.properties || [];
  console.log(`Got ${properties.length} hotels. First three:\n`);
  properties.slice(0, 3).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     rate_per_night: ${JSON.stringify(p.rate_per_night)}`);
    console.log(`     total_rate: ${JSON.stringify(p.total_rate)}`);
    console.log(`     property_token: ${p.property_token}`);
    console.log('');
  });

  if (!properties.length) {
    console.log('No hotels returned. Stopping.');
    return;
  }

  let target = properties[0];
  if (HOTEL_NAME_MATCH) {
    const match = properties.find(p => p.name && p.name.toLowerCase().includes(HOTEL_NAME_MATCH.toLowerCase()));
    if (match) {
      target = match;
      console.log(`Filtered to hotel matching "${HOTEL_NAME_MATCH}": ${target.name}\n`);
    } else {
      console.log(`No match for "${HOTEL_NAME_MATCH}" found. Using first result.\n`);
    }
  }
  console.log(`\n=== STEP 2: Get property details for "${target.name}" ===\n`);

  const detailsRes = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_hotels',
      q: CITY,
      property_token: target.property_token,
      check_in_date: CHECK_IN,
      check_out_date: CHECK_OUT,
      adults: 2,
      currency: 'USD',
      gl: 'us',
      hl: 'en',
      api_key: API_KEY
    }
  });

  const d = detailsRes.data || {};
  console.log(`Name: ${d.name}`);
  console.log(`Address: ${d.address}`);
  console.log(`Top-level keys: ${Object.keys(d).join(', ')}\n`);

  console.log(`rate_per_night: ${JSON.stringify(d.rate_per_night, null, 2)}`);
  console.log(`total_rate: ${JSON.stringify(d.total_rate, null, 2)}\n`);

  console.log(`featured_prices count: ${(d.featured_prices || []).length}`);
  (d.featured_prices || []).forEach((o, i) => {
    console.log(`  [${i}] ${o.source} — nightly ${JSON.stringify(o.rate_per_night)} — total ${JSON.stringify(o.total_rate)}`);
  });

  console.log(`\nprices count: ${(d.prices || []).length}`);
  (d.prices || []).forEach((o, i) => {
    console.log(`  [${i}] ${o.source} — nightly ${JSON.stringify(o.rate_per_night)} — total ${JSON.stringify(o.total_rate)}`);
  });

  console.log(`\n=== FULL RAW RESPONSE (truncated to 8000 chars) ===\n`);
  console.log(JSON.stringify(d, null, 2).slice(0, 8000));
}

main().catch((e) => {
  console.error('FAILED:', e.response?.data || e.message);
  process.exit(1);
});
