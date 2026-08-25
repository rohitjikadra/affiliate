import { env } from "../config/env.js";
import { logger } from "./logger.js";

export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!env.resendApiKey || !env.alertFromEmail) {
    logger.info("email_skipped", { to: input.to, subject: input.subject });
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.alertFromEmail,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("email_failed", { status: response.status, body: body.slice(0, 300) });
    throw new Error("Failed to send email");
  }

  return true;
}
