// Best-effort email sender. If EMAIL_USER/EMAIL_PASS aren't configured in
// .env, this just logs the email to the console instead of throwing, so the
// password-reset flow still works end-to-end in local development without
// needing a real mail provider set up.
const sendEmail = async ({ to, subject, text, html }) => {
  const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log(
      "\n[sendEmail] No EMAIL_USER/EMAIL_PASS configured in .env — printing email instead of sending:\n" +
        `To: ${to}\nSubject: ${subject}\n${text}\n`
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    // Lazy-require so the app doesn't hard-fail if nodemailer isn't installed
    // yet in an environment that never triggers this path.
    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST || "smtp.gmail.com",
      port: Number(EMAIL_PORT) || 465,
      secure: true,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      text,
      html,
    });

    return { sent: true };
  } catch (error) {
    console.error("[sendEmail] Failed to send email:", error.message);
    console.log(`[sendEmail] Falling back to console output:\nTo: ${to}\n${text}`);
    return { sent: false, reason: "send_failed" };
  }
};

module.exports = sendEmail;
