class OrderSummaryBuilder {
  build(order, totals) {
    const customer = order.getCustomer();

    return {
      id: order.id,
      customerName: customer.getName(),
      customerEmail: customer.getEmail(),
      city: customer.getCity(),
      state: customer.getState(),
      items: order.getItems().map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        subtotal: item.getSubtotal()
      })),
      subtotal: totals.subtotal,
      discount: Number(totals.discount.toFixed(2)),
      freight: Number(totals.freight.toFixed(2)),
      paymentFee: Number(totals.paymentFee.toFixed(2)),
      total: totals.total,
      paymentMethod: order.getPaymentMethod(),
      status: order.status,
      createdAt: order.createdAt
    };
  }
}

module.exports = OrderSummaryBuilder;
