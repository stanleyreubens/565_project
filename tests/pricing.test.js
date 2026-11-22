'use strict';

/**
 * Tests for the pricing engine.
 *
 * lib/pricing.js is pure: it takes numbers in and returns numbers out, with no
 * database, no network and no clock. That is what makes the rule the whole
 * product rests on something we can assert on directly.
 *
 * Run with: npm test
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');

const competitors = (...prices) => prices.map((price, i) => ({ hotelName: `Rival ${i + 1}`, price }));
const events = (...scores) => scores.map((impactScore, i) => ({ name: `Event ${i + 1}`, impactScore }));

// ---------------------------------------------------------------------------
// The competitor average is what anchors the rate
// ---------------------------------------------------------------------------

test('anchors the recommendation to the average of the competitor set', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(180, 200, 220),
    costPerNight: 50
  });
  assert.equal(result.competitorAverage, 200);
  assert.equal(result.recommendedPrice, 200);
});

test('falls back to the room type base price when no competitor rates are available', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: [],
    basePrice: 145,
    costPerNight: 50
  });
  assert.equal(result.competitorAverage, 0);
  assert.equal(result.recommendedPrice, 145);
});

test('ignores competitor rates of zero rather than letting them drag the average down', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200, 0, 220, 0),
    costPerNight: 50
  });
  // A sold out competitor reports 0. Averaging it in would give 105.
  assert.equal(result.competitorAverage, 210);
  assert.equal(result.recommendedPrice, 210);
});

test('rounds the recommendation to a whole unit of currency', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(181, 184),
    costPerNight: 50
  });
  assert.equal(result.recommendedPrice, 183);
  assert.equal(Number.isInteger(result.recommendedPrice), true);
});

// ---------------------------------------------------------------------------
// Local events raise demand in bands
// ---------------------------------------------------------------------------

test('no events means no uplift', () => {
  const impact = pricing.calculateEventImpact([]);
  assert.equal(impact.demandMultiplier, 0);
  assert.equal(impact.totalImpactScore, 0);
});

test('the demand multiplier steps up with the combined impact score', () => {
  const cases = [
    { scores: [3], total: 3, multiplier: 0.05 },
    { scores: [4, 4], total: 8, multiplier: 0.10 },
    { scores: [6, 6], total: 12, multiplier: 0.15 },
    { scores: [8, 8, 2], total: 18, multiplier: 0.25 },
    { scores: [9, 9, 7], total: 25, multiplier: 0.35 },
    { scores: [9, 9, 9, 8], total: 35, multiplier: 0.50 }
  ];

  for (const { scores, total, multiplier } of cases) {
    const impact = pricing.calculateEventImpact(events(...scores));
    assert.equal(impact.totalImpactScore, total, `total for ${scores}`);
    assert.equal(impact.demandMultiplier, multiplier, `multiplier for ${scores}`);
  }
});

test('an event scoring 7 or more counts as significant', () => {
  const impact = pricing.calculateEventImpact(events(7, 6, 9));
  assert.equal(impact.significantEvents.length, 2);
  assert.deepEqual(impact.significantEvents.map((e) => e.impactScore).sort(), [7, 9]);
});

test('a conference weekend raises the rate above the market', () => {
  const quiet = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200, 200),
    costPerNight: 50
  });
  const busy = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200, 200),
    events: events(9, 9, 8),
    costPerNight: 50
  });

  assert.equal(quiet.recommendedPrice, 200);
  assert.equal(busy.recommendedPrice, 270); // 200 x 1.35
  assert.ok(busy.recommendedPrice > quiet.recommendedPrice);
});

// ---------------------------------------------------------------------------
// The floor: the rule that stops the system recommending a loss
// ---------------------------------------------------------------------------

test('never recommends below the cost floor, however cheap the market is', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(40, 45),       // a price war
    costPerNight: 100                            // floor is 100 x 1.10 = 110
  });

  // 100 * (1 + 10/100) is 110.00000000000001 in floating point, not 110.
  assert.ok(Math.abs(result.minimumViablePrice - 110) < 1e-9);
  assert.equal(result.recommendedPrice, 110, 'the floor overrides the market');
  assert.ok(result.recommendedPrice > result.competitorAverage);
});

test('a contracted group rate above the cost floor becomes the floor', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(90, 90),
    costPerNight: 50,                            // cost floor is 55
    smerfRate: 130                               // the signed rate is higher
  });

  assert.equal(result.minimumViablePrice, 130);
  assert.equal(result.recommendedPrice, 130);
  assert.equal(result.smerfApplied, true);
});

test('a contracted rate below the cost floor does not weaken the floor', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200, 200),
    costPerNight: 100,                           // cost floor is 110
    smerfRate: 70                                // cheaper than cost
  });

  assert.ok(Math.abs(result.minimumViablePrice - 110) < 1e-9, 'the cost floor still wins');
  assert.equal(result.smerfApplied, false);
});

// ---------------------------------------------------------------------------
// Strategies: the manager chooses a position, not a number
// ---------------------------------------------------------------------------

test('always offers Balanced, Value Leader and Occupancy Focused', () => {
  const { strategies } = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200, 200),
    starRating: 3,
    costPerNight: 50
  });

  const names = strategies.map((s) => s.name);
  assert.ok(names.includes('Balanced'));
  assert.ok(names.includes('Value Leader'));
  assert.ok(names.includes('Occupancy Focused'));
});

test('offers Premium only to properties of four stars or more', () => {
  const threeStar = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200), starRating: 3, costPerNight: 50
  });
  const fourStar = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200), starRating: 4, costPerNight: 50
  });

  assert.equal(threeStar.strategies.some((s) => s.name === 'Premium'), false);
  assert.equal(fourStar.strategies.some((s) => s.name === 'Premium'), true);
});

test('offers High Demand only when events justify it', () => {
  const quiet = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200), events: events(3), costPerNight: 50
  });
  const busy = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200), events: events(9, 9), costPerNight: 50
  });

  assert.equal(quiet.strategies.some((s) => s.name === 'High Demand'), false);
  assert.equal(busy.strategies.some((s) => s.name === 'High Demand'), true);
});

test('no strategy is ever priced below the floor', () => {
  const { strategies, minimumViablePrice } = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(115, 118),
    costPerNight: 100,                           // floor is 110
    starRating: 5,
    events: events(9, 9, 9)
  });

  for (const strategy of strategies) {
    assert.ok(
      strategy.price >= minimumViablePrice,
      `${strategy.name} at ${strategy.price} is below the floor of ${minimumViablePrice}`
    );
  }
});

test('every strategy carries a name, a price and an explanation', () => {
  const { strategies } = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(200), costPerNight: 50
  });

  for (const strategy of strategies) {
    assert.equal(typeof strategy.name, 'string');
    assert.equal(Number.isFinite(strategy.price), true);
    assert.ok(strategy.description.length > 0, `${strategy.name} needs a description`);
  }
});

// ---------------------------------------------------------------------------
// The worked example used in the demo
// ---------------------------------------------------------------------------

test('worked example: three rivals and a conference weekend', () => {
  const result = pricing.calculateRecommendedPrice({
    competitorPrices: competitors(180, 195, 210), // average 195
    events: events(8, 7),                         // total 15: not > 15, so the 0.15 band
    basePrice: 150,
    starRating: 4,
    costPerNight: 60,                             // floor 66
    smerfRate: null
  });

  assert.equal(result.competitorAverage, 195);
  assert.equal(result.eventImpact.demandMultiplier, 0.15);
  assert.equal(result.recommendedPrice, 224);     // 195 x 1.15 = 224.25, rounded
  assert.equal(result.strategies.length, 4);      // Premium yes (4 star), High Demand no (0.15 < 0.2)
});
