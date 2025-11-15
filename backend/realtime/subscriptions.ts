import { Subscription } from "encore.dev/pubsub";
import { orderStatusTopic, stockUpdateTopic, newOrderTopic } from "./topics";
import { notification, analytics } from "~encore/clients";

new Subscription(orderStatusTopic, "notify-order-status", {
  handler: async (event) => {
    console.log(`Order ${event.orderId} status changed: ${event.oldStatus} -> ${event.newStatus}`);
    
    try {
      await notification.sendOrderConfirmation({
        order_id: event.orderId,
        store_id: event.storeId,
      });
    } catch (error) {
      console.error("Failed to send order status notification:", error);
    }
  },
});

new Subscription(stockUpdateTopic, "log-stock-changes", {
  handler: async (event) => {
    console.log(`Product ${event.productId} stock updated: ${event.oldStock} -> ${event.newStock}`);
    
    if (event.newStock <= 5 && event.oldStock > 5) {
      console.warn(`⚠️ Low stock alert for product ${event.productId}: ${event.newStock} remaining`);
    }
    
    if (event.newStock === 0) {
      console.error(`❌ Product ${event.productId} is out of stock!`);
    }
  },
});

new Subscription(newOrderTopic, "process-new-order", {
  handler: async (event) => {
    console.log(`New order received: ${event.orderId} for store ${event.storeId}`);
    
    try {
      await analytics.track({
        storeId: event.storeId,
        event_type: "purchase",
        session_id: `order-${event.orderId}`,
        metadata: {
          orderId: event.orderId,
          amount: event.totalAmount,
        },
      });
    } catch (error) {
      console.error("Failed to track order analytics:", error);
    }
  },
});
