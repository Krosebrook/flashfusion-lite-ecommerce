import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { SQLDatabase } from 'encore.dev/storage/sqldb';
import { resend } from "./resend";

const notificationDB = SQLDatabase.named("store");

interface SendOrderConfirmationRequest {
  order_id: number;
  store_id: number;
}

// Sends an order confirmation email.
export const sendOrderConfirmation = api<SendOrderConfirmationRequest, {id: string}>(
  {auth: true, expose: true, method: "POST", path: "/notifications/order-confirmation"},
  async (req) => {
    const auth = getAuthData()!;

    // Get order details
    const orderResult = await notificationDB.rawQueryRow<{
      id: number;
      customer_email: string;
      customer_name?: string;
      total_amount: number;
      currency: string;
      store_name: string;
      items_data: string;
    }>(
      `
      SELECT 
        o.id, o.customer_email, o.customer_name, o.total_amount, o.currency,
        s.name as store_name,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        ) as items_data
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1 AND o.store_id = $2
      GROUP BY o.id, s.name
      `,
      req.order_id,
      req.store_id
    );

    if (!orderResult) {
      throw APIError.notFound("Order not found");
    }

    const items = typeof orderResult.items_data === 'string' ? JSON.parse(orderResult.items_data) : orderResult.items_data;

    // Generate email HTML
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unit_price / 100).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.total_price / 100).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Hi ${orderResult.customer_name || 'there'},</p>
        <p>Thank you for your order from <strong>${orderResult.store_name}</strong>!</p>
        
        <h2 style="color: #333; margin-top: 30px;">Order Details</h2>
        <p><strong>Order ID:</strong> #${orderResult.id}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #dee2e6;">Total:</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #dee2e6;">$${(orderResult.total_amount / 100).toFixed(2)} ${orderResult.currency}</td>
            </tr>
          </tfoot>
        </table>
        
        <p style="margin-top: 30px;">We'll send you another email when your order ships.</p>
        <p>Thanks for shopping with us!</p>
        <p><strong>${orderResult.store_name}</strong></p>
      </div>
    `;

    try {
      const result = await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: [orderResult.customer_email],
        subject: `Order Confirmation - ${orderResult.store_name}`,
        html: html,
      });

      if (result.error) {
        throw APIError.internal(`Failed to send order confirmation: ${result.error.message}`);
      }

      return { id: result.data?.id || '' };
    } catch (error) {
      throw APIError.internal(`Failed to send order confirmation: ${error}`);
    }
  }
);
