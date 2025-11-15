import { Topic } from "encore.dev/pubsub";

export interface OrderStatusChangedEvent {
  orderId: number;
  storeId: number;
  customerId: string;
  customerEmail: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface StockUpdatedEvent {
  productId: number;
  storeId: number;
  oldStock: number;
  newStock: number;
  timestamp: Date;
}

export interface NewOrderEvent {
  orderId: number;
  storeId: number;
  customerId: string;
  customerEmail: string;
  totalAmount: number;
  timestamp: Date;
}

export const orderStatusTopic = new Topic<OrderStatusChangedEvent>("order-status-changed", {
  deliveryGuarantee: "at-least-once",
});

export const stockUpdateTopic = new Topic<StockUpdatedEvent>("stock-updated", {
  deliveryGuarantee: "at-least-once",
});

export const newOrderTopic = new Topic<NewOrderEvent>("new-order", {
  deliveryGuarantee: "at-least-once",
});
