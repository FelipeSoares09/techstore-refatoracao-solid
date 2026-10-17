const ProductRepository = require("../repositories/ProductRepository");
const OrderRepository = require("../repositories/OrderRepository");
const NotificationService = require("./NotificationService");
const Logger = require("../utils/Logger");
const OrderValidator = require("./OrderValidator");
const DiscountCalculator = require("./DiscountCalculator");
const FreightCalculator = require("./FreightCalculator");
const PaymentProcessor = require("./PaymentProcessor");
const OrderSummaryBuilder = require("./OrderSummaryBuilder");
const OrderPrinter = require("./OrderPrinter");

/**
 * Orquestra o fluxo do pedido por composição.
 * Depende de abstrações injetáveis (DIP) e não concentra regras de negócio (SRP).
 */
class OrderService {
  constructor(dependencies = {}) {
    this.productRepository =
      dependencies.productRepository || new ProductRepository();
    this.orderRepository =
      dependencies.orderRepository || new OrderRepository();
    this.notificationService =
      dependencies.notificationService || new NotificationService();
    this.logger = dependencies.logger || new Logger();
    this.validator =
      dependencies.validator || new OrderValidator(this.productRepository);
    this.discountCalculator =
      dependencies.discountCalculator || new DiscountCalculator();
    this.freightCalculator =
      dependencies.freightCalculator || new FreightCalculator();
    this.paymentProcessor =
      dependencies.paymentProcessor || new PaymentProcessor();
    this.summaryBuilder =
      dependencies.summaryBuilder || new OrderSummaryBuilder();
    this.printer = dependencies.printer || new OrderPrinter();
  }

  process(order) {
    this.logger.info(`Iniciando processamento do pedido ${order.id}.`);

    this.validator.validate(order);

    const subtotal = order.getSubtotal();
    let discount = this.discountCalculator.calculate(order, subtotal);
    const freight = this.freightCalculator.calculate(
      order,
      order.getTotalWeight()
    );
    const payment = this.paymentProcessor.process(order, subtotal);

    discount += payment.extraDiscount;

    const total = Number(
      (subtotal - discount + freight + payment.paymentFee).toFixed(2)
    );

    if (total <= 0) {
      throw new Error("Total do pedido invalido.");
    }

    for (const item of order.getItems()) {
      this.productRepository.updateStock(item.product.id, item.quantity);
    }

    if (payment.paymentStatus === "approved") {
      order.markAsConfirmed();
    } else {
      order.markAsWaitingPayment();
    }

    const totals = {
      subtotal,
      discount,
      freight,
      paymentFee: payment.paymentFee,
      total
    };

    const orderSummary = this.summaryBuilder.build(order, totals);
    this.orderRepository.save(orderSummary);

    if (order.status === "confirmed") {
      this.notificationService.sendOrderConfirmation(
        order.getCustomer(),
        order.id,
        total
      );
    } else {
      this.logger.warn(`Pedido ${order.id} aguardando pagamento.`);
    }

    this.printer.print(order, totals);

    return orderSummary;
  }
}

module.exports = OrderService;
