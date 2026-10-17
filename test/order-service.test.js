const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const Address = require("../src/domain/Address");
const Customer = require("../src/domain/Customer");
const Order = require("../src/domain/Order");
const OrderItem = require("../src/domain/OrderItem");
const Product = require("../src/domain/Product");
const OrderService = require("../src/services/OrderService");
const DiscountCalculator = require("../src/services/DiscountCalculator");
const FreightCalculator = require("../src/services/FreightCalculator");
const PaymentProcessor = require("../src/services/PaymentProcessor");

function createSilentLogger() {
  return {
    info() {},
    warn() {},
    error() {}
  };
}

function createFakeRepositories(products) {
  const stock = new Map(products.map((p) => [p.id, p.stock]));

  return {
    productRepository: {
      findById(id) {
        const product = products.find((item) => item.id === id);
        if (!product) {
          return undefined;
        }
        return { ...product, stock: stock.get(id) };
      },
      updateStock(productId, quantity) {
        stock.set(productId, stock.get(productId) - quantity);
      },
      getStock(productId) {
        return stock.get(productId);
      }
    },
    orderRepository: {
      orders: [],
      save(summary) {
        this.orders.push(summary);
        return summary;
      }
    }
  };
}

function buildSampleOrder(overrides = {}) {
  const notebook = new Product("p1", "Notebook Pro 14", "notebook", 6200, 2.1, 8);
  const mouse = new Product("p2", "Mouse Sem Fio", "peripheral", 120, 0.2, 30);

  const customer =
    overrides.customer ||
    new Customer(
      "c1",
      "Ana Souza",
      "ana.souza@example.com",
      "18999990000",
      "vip",
      new Address(
        "Rua das Palmeiras",
        "120",
        "Presidente Prudente",
        "SP",
        "19000-000",
        "sudeste"
      )
    );

  return new Order(
    overrides.id || "o1001",
    customer,
    overrides.items || [new OrderItem(notebook, 1), new OrderItem(mouse, 2)],
    overrides.couponCode !== undefined ? overrides.couponCode : "TECH10",
    overrides.paymentMethod || "credit_card",
    overrides.installments !== undefined ? overrides.installments : 3
  );
}

describe("TechStore - comportamento preservado", () => {
  it("processa o pedido de exemplo com os mesmos totais", () => {
    const notebook = new Product("p1", "Notebook Pro 14", "notebook", 6200, 2.1, 8);
    const mouse = new Product("p2", "Mouse Sem Fio", "peripheral", 120, 0.2, 30);
    const repos = createFakeRepositories([notebook, mouse]);
    const notifications = [];

    const service = new OrderService({
      productRepository: repos.productRepository,
      orderRepository: repos.orderRepository,
      notificationService: {
        sendOrderConfirmation(customer, orderId, total) {
          notifications.push({ email: customer.getEmail(), orderId, total });
        }
      },
      logger: createSilentLogger(),
      printer: { print() {} }
    });

    const result = service.process(buildSampleOrder());

    assert.equal(result.subtotal, 6440);
    assert.equal(result.discount, 1159.2);
    assert.equal(result.freight, 30);
    assert.equal(result.paymentFee, 161);
    assert.equal(result.total, 5471.8);
    assert.equal(result.status, "confirmed");
    assert.equal(result.city, "Presidente Prudente");
    assert.equal(result.state, "SP");
    assert.equal(repos.orderRepository.orders.length, 1);
    assert.equal(notifications.length, 1);
    assert.equal(repos.productRepository.getStock("p1"), 7);
    assert.equal(repos.productRepository.getStock("p2"), 28);
  });

  it("aplica desconto PIX adicional e frete gratuito", () => {
    const notebook = new Product("p1", "Notebook Pro 14", "notebook", 6200, 2.1, 8);
    const repos = createFakeRepositories([notebook]);

    const service = new OrderService({
      productRepository: repos.productRepository,
      orderRepository: repos.orderRepository,
      notificationService: { sendOrderConfirmation() {} },
      logger: createSilentLogger(),
      printer: { print() {} }
    });

    const order = buildSampleOrder({
      items: [new OrderItem(notebook, 1)],
      couponCode: "FRETEGRATIS",
      paymentMethod: "pix",
      installments: 1
    });

    const result = service.process(order);

    // VIP 8% + PIX 3% = 11% de 6200 = 682
    assert.equal(result.discount, 682);
    assert.equal(result.freight, 0);
    assert.equal(result.paymentFee, 0);
    assert.equal(result.total, 5518);
    assert.equal(result.status, "confirmed");
  });

  it("mantém pedido aguardando pagamento no boleto", () => {
    const mouse = new Product("p2", "Mouse Sem Fio", "peripheral", 120, 0.2, 30);
    const repos = createFakeRepositories([mouse]);
    const warnings = [];

    const service = new OrderService({
      productRepository: repos.productRepository,
      orderRepository: repos.orderRepository,
      notificationService: {
        sendOrderConfirmation() {
          throw new Error("nao deveria notificar boleto");
        }
      },
      logger: {
        info() {},
        warn(message) {
          warnings.push(message);
        },
        error() {}
      },
      printer: { print() {} }
    });

    const result = service.process(
      buildSampleOrder({
        items: [new OrderItem(mouse, 1)],
        couponCode: null,
        paymentMethod: "boleto",
        installments: 1,
        customer: new Customer(
          "c2",
          "Joao",
          "joao@example.com",
          "11999999999",
          "regular",
          new Address("Rua A", "1", "Curitiba", "PR", "80000-000", "sul")
        )
      })
    );

    assert.equal(result.status, "waiting_payment");
    assert.equal(result.freight, 28 + 0.2 * 5);
    assert.equal(warnings.length, 1);
  });
});

describe("Calculadoras isoladas", () => {
  it("DiscountCalculator aplica regras VIP e cupom", () => {
    const calculator = new DiscountCalculator();
    const order = buildSampleOrder();
    const discount = calculator.calculate(order, 6440);
    assert.equal(discount, 1159.2);
  });

  it("FreightCalculator usa regiao do cliente via Demeter", () => {
    const calculator = new FreightCalculator();
    const order = buildSampleOrder();
    assert.equal(calculator.calculate(order, 2.5), 30);
  });

  it("PaymentProcessor aplica taxa de cartao parcelado", () => {
    const processor = new PaymentProcessor();
    const order = buildSampleOrder();
    const payment = processor.process(order, 6440);
    assert.equal(payment.paymentFee, 161);
    assert.equal(payment.paymentStatus, "approved");
  });
});

describe("Principio de Demeter no dominio", () => {
  it("Customer expoe cidade e regiao sem forcar acesso a Address", () => {
    const customer = new Customer(
      "c1",
      "Ana",
      "ana@example.com",
      "1",
      "vip",
      new Address("Rua", "1", "Presidente Prudente", "SP", "19000-000", "sudeste")
    );

    assert.equal(customer.getRegion(), "sudeste");
    assert.equal(customer.getCityStateLabel(), "Presidente Prudente/SP");
    assert.equal(customer.hasValidEmail(), true);
  });
});
