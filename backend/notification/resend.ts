import { secret } from "encore.dev/config";
import { Resend } from "resend";

const resendApiKey = secret("ResendApiKey");

export const resend = new Resend(resendApiKey());
