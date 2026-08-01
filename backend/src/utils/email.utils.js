/**
 * Thin wrapper around Brevo's transactional-email API. The only email this
 * app sends today is the password-reset link; `sendEmail` stays generic in
 * case a second email type (e.g. a team-invite notice) is added later.
 */
const { BrevoClient } = require("@getbrevo/brevo");

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

/**
 * @param {{to: {email: string, name?: string}, subject: string, html: string}} params
 * @throws if the send fails - callers decide whether that's fatal.
 */
const sendEmail = async ({ to, subject, html }) => {
  await client.transactionalEmails.sendTransacEmail({
    sender: { email: process.env.EMAIL_FROM_ADDRESS, name: process.env.EMAIL_FROM_NAME },
    to: [to],
    subject,
    htmlContent: html,
  });
};

/**
 * Branded HTML body for the "forgot password" email. Kept as inline styles
 * only, since most email clients strip/ignore external or <style>-block CSS.
 */
const passwordResetEmailHtml = (resetUrl) => `
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td style="font-size:18px;font-weight:600;color:#111827;padding-bottom:16px;">VAE Inventory</td>
            </tr>
            <tr>
              <td style="font-size:15px;color:#374151;line-height:1.5;padding-bottom:24px;">
                We received a request to reset your password. Click the button below to choose a new one.
                This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${resetUrl}" style="background:#059669;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#9ca3af;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#059669;">${resetUrl}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

module.exports = { sendEmail, passwordResetEmailHtml };
