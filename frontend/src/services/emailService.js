import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ayendecx.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Ayende-CX';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Send invitation email
 */
export const sendInvitationEmail = async ({
  to,
  firstName,
  lastName,
  businessName,
  inviterName,
  role,
  invitationLink,
  message,
}) => {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `You're invited to join ${businessName} on Ayende-CX`,
      text: `
Hi ${firstName},

${inviterName} has invited you to join ${businessName} as a ${role} on Ayende-CX.

${message ? `Personal message from ${inviterName}:\n"${message}"\n\n` : ''}

To accept this invitation and set up your account, click the link below:
${invitationLink}

This invitation will expire in 7 days.

If you have any questions, please contact ${inviterName} or your team administrator.

Best regards,
The Ayende-CX Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to Join ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Ayende-CX</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">You're Invited!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hi ${firstName},</h2>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a <strong>${role}</strong> on Ayende-CX.
              </p>
              
              ${message ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 5px 0; color: #333333; font-size: 14px; font-weight: bold;">Personal message from ${inviterName}:</p>
                <p style="margin: 0; color: #666666; font-size: 14px; font-style: italic;">"${message}"</p>
              </div>
              ` : ''}
              
              <p style="margin: 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                To accept this invitation and set up your account, click the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="${invitationLink}" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 10px 0; color: #999999; font-size: 14px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; color: #667eea; font-size: 14px; word-break: break-all;">
                ${invitationLink}
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                  ⚠️ This invitation will expire in <strong>7 days</strong>.
                </p>
                <p style="margin: 0; color: #999999; font-size: 14px;">
                  If you have any questions, please contact ${inviterName} or your team administrator.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                Best regards,<br>
                The Ayende-CX Team
              </p>
              <p style="margin: 0; color: #cccccc; font-size: 12px;">
                © ${new Date().getFullYear()} Ayende-CX. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    };

    const result = await sgMail.send(msg);
    console.log('✅ Invitation email sent successfully to:', to);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
};

/**
 * Send welcome email after business registration
 */
export const sendWelcomeEmail = async ({
  to,
  firstName,
  businessName,
  username,
}) => {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `Welcome to Ayende-CX, ${firstName}!`,
      text: `
Hi ${firstName},

Welcome to Ayende-CX! Your business account for ${businessName} has been successfully created.

Your login credentials:
Username: ${username}

You can now login and start using Ayende-CX to manage your business operations.

Login here: ${FRONTEND_URL}/login

Get started:
1. Set up your products and inventory
2. Add your team members
3. Start processing transactions

If you need any help, our support team is here to assist you.

Best regards,
The Ayende-CX Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Ayende-CX</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🎉 Welcome!</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 18px;">Your account is ready</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hi ${firstName},</h2>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Welcome to <strong>Ayende-CX</strong>! Your business account for <strong>${businessName}</strong> has been successfully created.
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: bold;">Your Login Credentials:</p>
                <p style="margin: 0; color: #666666; font-size: 16px;">
                  <strong>Username:</strong> ${username}
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                You can now login and start using Ayende-CX to manage your business operations.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="${FRONTEND_URL}/login" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Login to Your Account
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; padding: 20px; background-color: #f0f7ff; border-radius: 8px;">
                <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: bold;">🚀 Get Started:</p>
                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.8;">
                  <li>Set up your products and inventory</li>
                  <li>Add your team members</li>
                  <li>Start processing transactions</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px;">
                If you need any help, our support team is here to assist you.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                Best regards,<br>
                The Ayende-CX Team
              </p>
              <p style="margin: 0; color: #cccccc; font-size: 12px;">
                © ${new Date().getFullYear()} Ayende-CX. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    };

    const result = await sgMail.send(msg);
    console.log('✅ Welcome email sent successfully to:', to);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    
    // Don't throw error - registration should succeed even if email fails
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email (for future use)
 */
export const sendPasswordResetEmail = async ({
  to,
  firstName,
  resetLink,
}) => {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: 'Reset Your Ayende-CX Password',
      text: `
Hi ${firstName},

We received a request to reset your password for your Ayende-CX account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
The Ayende-CX Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333;">Password Reset Request</h2>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px;">Hi ${firstName},</p>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px;">
                We received a request to reset your password for your Ayende-CX account.
              </p>
              
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 4px; background-color: #667eea;">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #999999; font-size: 14px;">
                This link will expire in <strong>1 hour</strong>.
              </p>
              
              <p style="margin: 20px 0; color: #999999; font-size: 14px;">
                If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    };

    const result = await sgMail.send(msg);
    console.log('✅ Password reset email sent successfully to:', to);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export default {
  sendInvitationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
