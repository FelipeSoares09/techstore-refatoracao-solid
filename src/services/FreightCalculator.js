class FreightCalculator {
  constructor(regionRates = FreightCalculator.defaultRegionRates()) {
    this.regionRates = regionRates;
  }

  static defaultRegionRates() {
    return {
      sudeste: { base: 20, perKg: 4 },
      sul: { base: 28, perKg: 5 },
      "centro-oeste": { base: 35, perKg: 6 },
      nordeste: { base: 45, perKg: 7 },
      norte: { base: 60, perKg: 9 },
      default: { base: 50, perKg: 8 }
    };
  }

  calculate(order, totalWeight) {
    if (order.getCouponCode() === "FRETEGRATIS") {
      return 0;
    }

    const region = order.getCustomer().getRegion();
    const rate = this.regionRates[region] || this.regionRates.default;

    return rate.base + totalWeight * rate.perKg;
  }
}

module.exports = FreightCalculator;
