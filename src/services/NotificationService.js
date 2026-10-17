class NotificationService {
  sendOrderConfirmation(customer, orderId, total) {
    console.log(
      `[NOTIFICACAO] Pedido ${orderId} confirmado para ${customer.getEmail()}. Total: R$ ${Number(total).toFixed(2)}`
    );
  }
}

module.exports = NotificationService;
