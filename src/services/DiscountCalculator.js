/**
 * Calcula descontos por composição de regras.
 * Novas regras podem ser adicionadas sem alterar o orquestrador (OCP).
 */
class DiscountCalculator {
  constructor(rules = DiscountCalculator.defaultRules()) {
    this.rules = rules;
  }

  static defaultRules() {
    return [
      {
        name: "vip",
        apply(order, subtotal, discount) {
          if (order.getCustomer().getType() === "vip") {
            return discount + subtotal * 0.08;
          }
          return discount;
        }
      },
      {
        name: "employee",
        apply(order, subtotal, discount) {
          if (order.getCustomer().getType() === "employee") {
            return discount + subtotal * 0.15;
          }
          return discount;
        }
      },
      {
        name: "coupon-TECH10",
        apply(order, subtotal, discount) {
          if (order.getCouponCode() === "TECH10") {
            return discount + subtotal * 0.1;
          }
          return discount;
        }
      },
      {
        name: "coupon-FRETEGRATIS",
        apply(order, subtotal, discount) {
          if (order.getCouponCode() === "FRETEGRATIS") {
            return discount + 0;
          }
          return discount;
        }
      },
      {
        name: "high-value",
        apply(order, subtotal, discount) {
          if (subtotal > 8000) {
            return discount + 250;
          }
          return discount;
        }
      }
    ];
  }

  calculate(order, subtotal) {
    return this.rules.reduce(
      (discount, rule) => rule.apply(order, subtotal, discount),
      0
    );
  }
}

module.exports = DiscountCalculator;
