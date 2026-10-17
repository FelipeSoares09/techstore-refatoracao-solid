class OrderPrinter {
  print(order, totals) {
    const customer = order.getCustomer();

    console.log("Resumo do pedido");
    console.log(`Cliente: ${customer.getName()}`);
    console.log(`Cidade: ${customer.getCityStateLabel()}`);
    console.log(`Itens: ${order.getTotalItems()}`);
    console.log(`Subtotal: R$ ${totals.subtotal.toFixed(2)}`);
    console.log(`Desconto: R$ ${totals.discount.toFixed(2)}`);
    console.log(`Frete: R$ ${totals.freight.toFixed(2)}`);
    console.log(`Taxas: R$ ${totals.paymentFee.toFixed(2)}`);
    console.log(`Total: R$ ${totals.total.toFixed(2)}`);
  }
}

module.exports = OrderPrinter;
