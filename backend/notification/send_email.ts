import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { resend } from "./resend";

interface SendEmailRequest {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

// Sends an email using Resend.
export const sendEmail = api<SendEmailRequest, {id: string}>(
  {auth: true, expose: true, method: "POST", path: "/notifications/email"},
  async (req) => {
    const auth = getAuthData()!;

    try {
      const result = await resend.emails.send({
        from: req.from || 'noreply@yourdomain.com',
        to: req.to,
        subject: req.subject,
        html: req.html,
      });

      if (result.error) {
        throw APIError.internal(`Failed to send email: ${result.error.message}`);
      }

      return { id: result.data?.id || '' };
    } catch (error) {
      throw APIError.internal(`Failed to send email: ${error}`);
    }
  }
);
