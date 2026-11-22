class PricingService {
  constructor() {
    this.minimumMargin = 10;
  }

  calculateRecommendedPrice(data) {
    const {
      competitorPrices = [],
      events = [],
      basePrice = 100,
      starRating = 3,
      costPerNight = 50,
      smerfRate = null
    } = data;

    // Calculate cost-based floor
    const costFloor = costPerNight * (1 + this.minimumMargin / 100);

    // Use SMERF rate as floor if it's higher than cost floor
    const minimumViablePrice = smerfRate
      ? Math.max(costFloor, smerfRate)
      : costFloor;

    let competitorAverage = 0;
    let competitorPricesFiltered = [];

    if (competitorPrices.length > 0) {
      competitorPricesFiltered = competitorPrices.filter(p => p.price > 0);

      if (competitorPricesFiltered.length > 0) {
        competitorAverage = competitorPricesFiltered.reduce((sum, p) => sum + p.price, 0) / competitorPricesFiltered.length;
      }
    }

    const eventImpact = this.calculateEventImpact(events);

    let recommendedPrice = competitorAverage > 0
      ? competitorAverage
      : basePrice;

    recommendedPrice *= (1 + eventImpact.demandMultiplier);

    recommendedPrice = Math.max(recommendedPrice, minimumViablePrice);

    recommendedPrice = Math.round(recommendedPrice);

    const strategies = this.generatePricingStrategies(
      recommendedPrice,
      competitorPricesFiltered,
      minimumViablePrice,
      starRating,
      eventImpact
    );

    return {
      recommendedPrice,
      minimumViablePrice,
      competitorAverage,
      eventImpact,
      strategies,
      smerfRate,
      smerfApplied: smerfRate && smerfRate > costFloor
    };
  }

  calculateEventImpact(events) {
    if (!events || events.length === 0) {
      return {
        demandMultiplier: 0,
        significantEvents: [],
        totalImpactScore: 0
      };
    }

    const totalImpactScore = events.reduce((sum, event) => sum + (event.impactScore || 0), 0);

    const significantEvents = events.filter(event => (event.impactScore || 0) >= 7);

    let demandMultiplier = 0;

    if (totalImpactScore > 30) demandMultiplier = 0.5;
    else if (totalImpactScore > 20) demandMultiplier = 0.35;
    else if (totalImpactScore > 15) demandMultiplier = 0.25;
    else if (totalImpactScore > 10) demandMultiplier = 0.15;
    else if (totalImpactScore > 5) demandMultiplier = 0.1;
    else if (totalImpactScore > 0) demandMultiplier = 0.05;

    return {
      demandMultiplier,
      significantEvents,
      totalImpactScore
    };
  }

  generatePricingStrategies(recommendedPrice, competitorPrices, minimumViablePrice, starRating, eventImpact) {
    const strategies = [];

    strategies.push({
      name: 'Balanced',
      price: recommendedPrice,
      description: 'Optimal balance of competitiveness and profit'
    });

    const valuePrice = Math.max(
      Math.round(recommendedPrice * 0.95),
      minimumViablePrice
    );
    strategies.push({
      name: 'Value Leader',
      price: valuePrice,
      description: 'Position as the best value option'
    });

    if (starRating >= 4) {
      const premiumPrice = Math.round(recommendedPrice * 1.1);
      strategies.push({
        name: 'Premium',
        price: premiumPrice,
        description: 'Position as a premium option'
      });
    }

    if (eventImpact.demandMultiplier >= 0.2) {
      const highDemandPrice = Math.round(recommendedPrice * 1.15);
      strategies.push({
        name: 'High Demand',
        price: highDemandPrice,
        description: 'Capitalize on increased demand from events'
      });
    }

    const occupancyDrivenPrice = Math.max(
      Math.round(recommendedPrice * 0.9),
      minimumViablePrice
    );
    strategies.push({
      name: 'Occupancy Focused',
      price: occupancyDrivenPrice,
      description: 'Focus on maximizing occupancy'
    });

    return strategies;
  }
}

module.exports = new PricingService();
