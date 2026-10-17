class OrderValidator {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  validate(order) {
    const customer = order.getCustomer();

    if (!customer) {
      throw new Error("Cliente obrigatorio.");
    }

    if (!customer.hasValidEmail()) {
      throw new Error("E-mail do cliente invalido.");
    }

    const items = order.getItems();

    if (!items || items.length === 0) {
      throw new Error("Pedido sem itens.");
    }

    for (const item of items) {
      if (!item.product) {
        throw new Error("Item sem produto.");
      }

      if (item.quantity <= 0) {
        throw new Error("Quantidade invalida.");
      }

      const product = this.productRepository.findById(item.product.id);

      if (!product) {
        throw new Error(`Produto ${item.product.id} nao encontrado.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}.`);
      }
    }
  }
}

module.exports = OrderValidator;
