class PaymentProcessor {
  constructor(strategies = PaymentProcessor.defaultStrategies()) {
    this.strategies = strategies;
  }

  static defaultStrategies() {
    return {
      pix: (order, subtotal) => ({
        paymentFee: 0,
        paymentStatus: "approved",
        extraDiscount: subtotal * 0.03
      }),
      credit_card: (order, subtotal) => ({
        paymentFee: order.getInstallments() > 1 ? subtotal * 0.025 : 0,
        paymentStatus: "approved",
        extraDiscount: 0
      }),
      boleto: () => ({
        paymentFee: 0,
        paymentStatus: "waiting_payment",
        extraDiscount: 0
      })
    };
  }

  process(order, subtotal) {
    const method = order.getPaymentMethod();
    const strategy = this.strategies[method];

    if (!strategy) {
      throw new Error("Forma de pagamento invalida.");
    }

    return strategy(order, subtotal);
  }
}

module.exports = PaymentProcessor;
