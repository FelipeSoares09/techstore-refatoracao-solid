class Order {
  constructor(id, customer, items, couponCode, paymentMethod, installments) {
    this.id = id;
    this.customer = customer;
    this.items = items;
    this.couponCode = couponCode;
    this.paymentMethod = paymentMethod;
    this.installments = installments;
    this.status = "created";
    this.createdAt = new Date();
  }

  getCustomer() {
    return this.customer;
  }

  getItems() {
    return this.items;
  }

  getCouponCode() {
    return this.couponCode;
  }

  getPaymentMethod() {
    return this.paymentMethod;
  }

  getInstallments() {
    return this.installments;
  }

  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getSubtotal() {
    return this.items.reduce((total, item) => total + item.getSubtotal(), 0);
  }

  getTotalWeight() {
    return this.items.reduce((total, item) => {
      return total + item.product.weight * item.quantity;
    }, 0);
  }

  markAsConfirmed() {
    this.status = "confirmed";
  }

  markAsWaitingPayment() {
    this.status = "waiting_payment";
  }
}

module.exports = Order;
