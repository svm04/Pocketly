// Best-effort email sender. Sends via Brevo's REST API over HTTPS rather
// than raw SMTP — Render's free tier blocks outbound traffic on SMTP ports
// (25/465/587) as of Sept 2025, so a nodemailer/SMTP transporter just hangs
// until it times out there. Going over HTTPS (port 443, same as any normal
// API call) sidesteps that entirely and works on the free tier.
//
// If BREVO_API_KEY/EMAIL_FROM aren't configured in .env, this just logs the
// email to the console instead of throwing, so the password-reset flow
// still works end-to-end in local development without a real provider set
// up.
const sendEmail = async ({ to, subject, text, html }) => {
  const { BREVO_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME } = process.env;

  if (!BREVO_API_KEY || !EMAIL_FROM) {
    console.log(
      "\n[sendEmail] No BREVO_API_KEY/EMAIL_FROM configured in .env — printing email instead of sending:\n" +
        `To: ${to}\nSubject: ${subject}\n${text}\n`
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME || "Pocketly" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Brevo API responded ${response.status}: ${body}`);
    }

    return { sent: true };
  } catch (error) {
    console.error("[sendEmail] Failed to send email:", error.message);
    console.log(`[sendEmail] Falling back to console output:\nTo: ${to}\n${text}`);
    return { sent: false, reason: "send_failed" };
  }
};

module.exports = sendEmail;
