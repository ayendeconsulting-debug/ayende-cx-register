import sgMail from '@sendgrid/mail';

/**
 * Email Service for POS
 * Handles sending emails via SendGrid
 */

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('[EMAIL] SendGrid API key not configured. Email sending will fail.');
}

/**
 * Send team invitation email
 */
export const sendInvitationEmail = async ({
  email,
  firstName,
  lastName,
  businessName,
  inviterName,
  invitationLink,
  role,
  message,
  expiresAt,
}) => {
  try {
    const msg = {
      to: email,
      from: process.env.DEFAULT_FROM_EMAIL || 'noreply@ayendecx.com',
      subject: `You've been invited to join ${businessName} on Ayende-CX`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #3498db;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3498db;
              margin-bottom: 10px;
            }
            .content {
              margin-bottom: 30px;
            }
            h1 {
              color: #2c3e50;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #3498db;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box strong {
              color: #2c3e50;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #3498db;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #2980b9;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .expiry-notice {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
            .link-box {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ayende-CX</div>
              <p style="color: #666; margin: 0;">POS System</p>
            </div>

            <div class="content">
              <h1>You're Invited to Join the Team! 🎉</h1>
              
              <p>Hi <strong>${firstName} ${lastName}</strong>,</p>
              
              <p><strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a <strong>${role}</strong> on the Ayende-CX POS system.</p>
              
              ${message ? `
                <div class="info-box">
                  <strong>Personal Message:</strong><br>
                  "${message}"
                </div>
              ` : ''}
              
              <div class="info-box">
                <strong>Your Role:</strong> ${role}<br>
                <strong>Business:</strong> ${businessName}<br>
                <strong>Invited By:</strong> ${inviterName}
              </div>

              <p style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </p>

              <div class="expiry-notice">
                ⏰ <strong>Note:</strong> This invitation expires on <strong>${new Date(expiresAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong>
              </div>

              <p style="font-size: 14px; color: #666;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <div class="link-box">
                ${invitationLink}
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Once you accept the invitation, you'll be able to create your account and start working with the team.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated email from Ayende-CX POS System.</p>
              <p>If you did not expect this invitation, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">
                <strong>Ayende-CX</strong><br>
                Making business management simple and efficient
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
You've been invited to join ${businessName} on Ayende-CX

Hi ${firstName} ${lastName},

${inviterName} has invited you to join ${businessName} as a ${role} on the Ayende-CX POS system.

${message ? `Personal Message: "${message}"` : ''}

Your Role: ${role}
Business: ${businessName}
Invited By: ${inviterName}

To accept this invitation, click the link below:
${invitationLink}

This invitation expires on ${new Date(expiresAt).toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

Once you accept the invitation, you'll be able to create your account and start working with the team.

---
This is an automated email from Ayende-CX POS System.
If you did not expect this invitation, you can safely ignore this email.

Ayende-CX
Making business management simple and efficient
      `,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Invitation email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send invitation email:', error);
    if (error.response) {
      console.error('[EMAIL] SendGrid error:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send invitation reminder email
 */
export const sendInvitationReminderEmail = async ({
  email,
  firstName,
  businessName,
  invitationLink,
  role,
  expiresAt,
}) => {
  try {
    const msg = {
      to: email,
      from: process.env.DEFAULT_FROM_EMAIL || 'noreply@ayendecx.com',
      subject: `Reminder: Your invitation to ${businessName} is expiring soon`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reminder: Invitation Expiring Soon</h1>
            <p>Hi ${firstName},</p>
            <p>This is a reminder that your invitation to join <strong>${businessName}</strong> as a <strong>${role}</strong> is expiring soon.</p>
            <div class="warning">
              ⏰ Expires on: ${new Date(expiresAt).toLocaleDateString()}
            </div>
            <p style="text-align: center;">
              <a href="${invitationLink}" class="button">Accept Invitation Now</a>
            </p>
            <p>Don't miss out on this opportunity to join the team!</p>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Reminder email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send reminder email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendInvitationEmail,
  sendInvitationReminderEmail,
};