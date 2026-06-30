import nodemailer from 'nodemailer';
import { SESClient } from '@aws-sdk/client-ses';

// Get email configuration - supports AWS SES SMTP and regular SMTP
const getEmailConfig = () => {
  // Check for AWS SES SMTP configuration (NODEMAILER_* variables)
  const nodemailerHost = process.env.NODEMAILER_HOST;
  const nodemailerPort = process.env.NODEMAILER_PORT;
  const nodemailerUser = process.env.NODEMAILER_USER;
  const nodemailerPass = process.env.NODEMAILER_PASS;

  if (nodemailerHost && nodemailerUser && nodemailerPass) {
    // Use AWS SES SMTP
    return {
      type: 'smtp' as const,
      host: nodemailerHost,
      port: parseInt(nodemailerPort || '465'),
      secure: true, // AWS SES SMTP requires SSL/TLS
      auth: {
        user: nodemailerUser,
        pass: nodemailerPass,
      },
    };
  }

  // Check for AWS SES SDK configuration
  const sesRegion = process.env.AWS_SES_REGION;
  const sesAccessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
  const sesSecretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;

  if (sesRegion && sesAccessKeyId && sesSecretAccessKey) {
    // Use AWS SES SDK
    return {
      type: 'ses' as const,
      region: sesRegion,
      credentials: {
        accessKeyId: sesAccessKeyId,
        secretAccessKey: sesSecretAccessKey,
      },
    };
  }

  // Fallback to regular SMTP
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error('Email configuration is missing. Please set NODEMAILER_HOST, NODEMAILER_USER, NODEMAILER_PASS or SMTP_HOST, SMTP_USER, SMTP_PASSWORD in your .env file.');
  }

  return {
    type: 'smtp' as const,
    host,
    port,
    secure,
    auth: {
      user,
      pass: password,
    },
  };
};

// Create transporter
const createTransporter = () => {
  try {
    const config = getEmailConfig();
    
    if (config.type === 'ses') {
      // Create SES client
      const sesClient = new SESClient({
        region: config.region,
        credentials: {
          accessKeyId: config.credentials.accessKeyId,
          secretAccessKey: config.credentials.secretAccessKey,
        },
      });

      // Create nodemailer transporter with SES
      // Using @aws-sdk/client-ses with nodemailer
      return nodemailer.createTransport({
        SES: { 
          ses: sesClient,
          aws: { SESClient }
        } as any,
      });
    } else {
      // Use SMTP
      return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Send invite email
export const sendInviteEmail = async (
  email: string,
  inviteLink: string,
  role: 'super_admin' | 'publisher',
  inviterName?: string
): Promise<void> => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service is not configured');
  }

  const roleLabel = role === 'super_admin' ? 'Супер админ' : 'Нийтлэгч';
  const fromEmail = process.env.NODEMAILER_FROM || process.env.AWS_SES_FROM || process.env.SMTP_FROM || 'noreply@onlime.mn';

  const mailOptions = {
    from: `"LIME" <${fromEmail}>`,
    to: email,
    subject: 'LIME тусламж системд урилга',
    html: `
      <!DOCTYPE html>
      <html lang="mn">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="x-apple-disable-message-reformatting">
        <style>
          table, td, div, h1, p {
            font-family: Arial, sans-serif;
          }
          @media screen and (max-width: 530px) {
            .unsub {
              display: block;
              padding: 15px;
              margin-top: 14px;
              border-radius: 24px;
              background-color: #555555;
              text-decoration: none !important;
            }
            .col-lge {
              max-width: 100% !important;
            }
            .card {
              max-width: 100%;
            }
            .sec {
              max-width: 100%;
            }
            .text {
              margin: 50px;
              padding: 20px;
            }
            .phone-content {
              display: inline-block;
            }
            .desk-content {
              display: none;
            }
          }
          @media screen and (min-width: 531px) {
            .col-sml {
              max-width: 27% !important;
            }
            .col-lge {
              max-width: 73% !important;
            }
            .card {
              max-width: 80%;
              margin-left: 80px;
            }
            .home {
              padding-left: 28px;
            }
            .sec {
              max-width: 80%;
            }
            .sechome {
              padding-right: 28px;
            }
            .phone-content {
              display: none;
            }
            .desk-content {
              display: inline-block;
            }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; word-spacing:normal; font-family:'Mulish',sans-serif">
        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
          <tbody>
            <tr>
              <td align="center" style="padding:0;">
                <table role="presentation" style="width:100%;max-width:600px;border:none;border-spacing:0;text-align:center;font-family:Arial,sans-serif;font-size:16px;line-height:22px;color:black;">
                  <tbody>
                    <!-- Logo Header -->
                    <tr>
                      <td style="padding:24px 30px 20px 30px;background-color:#02251A;">
                        <div style="text-align:center;">
                          <img src="https://help.lime.mn/icons/logo-white.png" alt="LIME" style="height:32px;width:auto;margin:0 auto;" />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px;background-color:#ffffff;">
                        <div style="max-width:520px;margin:0 auto;">
                          <h1 style="margin:0 0 12px 0;font-size:18px;line-height:28px;font-weight:600;color:#02251A;">Сайн байна уу,</h1>
                          <p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:#02251A;">
                            Таныг LIME тусламж системд <strong style="color:#02251A;">${roleLabel}</strong> эрхтэйгээр уриж байна.
                          </p>
                          <p style="margin:0 0 24px 0;font-size:15px;line-height:22px;color:#02251A;">
                            Системд бүртгэл үүсгэхийн тулд доорх товч дээр дарна уу:
                          </p>
                          <div style="text-align:center;margin:0 0 24px 0;">
                            <a href="${inviteLink}" style="display:inline-block;padding:14px 36px;background-color:#02251A;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;transition:background-color 0.2s;">Бүртгэл үүсгэх</a>
                          </div>
                          <div style="padding:16px;background-color:#f3f4f6;border-radius:8px;margin:0 0 20px 0;">
                            <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;font-weight:500;">Холбоос:</p>
                            <p style="margin:0;font-size:12px;color:#02251A;word-break:break-all;font-family:monospace;">${inviteLink}</p>
                          </div>
                          <p style="margin:0;font-size:13px;line-height:20px;color:#6b7280;">
                            <strong style="color:#02251A;">Анхаар:</strong> Энэ урилга 72 цагийн дараа хүчингүй болно.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <!-- Footer - Minimal -->
                    <tr>
                      <td style="padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;background-color:#f9fafb;">
                        <div style="margin-bottom:15px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 12px auto;">
                            <tr>
                              <td style="padding:0 6px;">
                                <a href="https://www.facebook.com/lime.mn" target="_blank" style="display:block;width:32px;height:32px;background-color:#1877f2;border-radius:50%;text-decoration:none;text-align:center;line-height:32px;font-family:Arial,sans-serif;">
                                  <span style="color:#ffffff;font-size:20px;font-weight:bold;">f</span>
                                </a>
                              </td>
                              <td style="padding:0 6px;">
                                <a href="https://www.instagram.com/lime.mn" target="_blank" style="display:block;width:32px;height:32px;background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);border-radius:50%;text-decoration:none;text-align:center;line-height:32px;font-family:Arial,sans-serif;">
                                  <span style="color:#ffffff;font-size:18px;font-weight:bold;">●</span>
                                </a>
                              </td>
                              <td style="padding:0 6px;">
                                <a href="https://twitter.com/lime_mn" target="_blank" style="display:block;width:32px;height:32px;background-color:#000000;border-radius:50%;text-decoration:none;text-align:center;line-height:32px;font-family:Arial,sans-serif;">
                                  <span style="color:#ffffff;font-size:16px;font-weight:bold;">X</span>
                                </a>
                              </td>
                              <td style="padding:0 6px;">
                                <a href="https://www.linkedin.com/company/lime-mn" target="_blank" style="display:block;width:32px;height:32px;background-color:#0077b5;border-radius:50%;text-decoration:none;text-align:center;line-height:32px;font-family:Arial,sans-serif;">
                                  <span style="color:#ffffff;font-size:14px;font-weight:bold;">in</span>
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">
                            © LIME ${new Date().getFullYear()} | <a href="https://www.onlime.mn" style="color:#6b7280;text-decoration:none;">www.onlime.mn</a>
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `,
    text: `
LIME тусламж системд урилга

Сайн байна уу,

Таныг LIME тусламж системд ${roleLabel} эрхтэйгээр уриж байна${inviterName ? ` (${inviterName}-аас)` : ''}.

Системд нэвтрэхийн тулд доорх холбоос дээр дарна уу:
${inviteLink}

Анхаар: Энэ урилга 72 цагийн дараа хүчингүй болно.

© LIME 2026
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string
): Promise<void> => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service is not configured');
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@lime.mn';

  const mailOptions = {
    from: `"LIME тусламж" <${fromEmail}>`,
    to: email,
    subject: 'LIME тусламж - Нууц үг солих',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'TT Norms Pro', Arial, sans-serif; line-height: 1.6; color: #374151; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #02251A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; padding: 12px 24px; background-color: #02251A; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Нууц үг солих</h1>
          </div>
          <div class="content">
            <p>Сайн байна уу,</p>
            <p>Та нууц үг солих хүсэлт илгээсэн байна. Доорх холбоос дээр дарж шинэ нууц үгээ тохируулна уу:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Нууц үг солих</a>
            </p>
            <p>Эсвэл доорх холбоосыг хуулах:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetLink}</p>
            <p><strong>Анхаар:</strong> Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлож болно.</p>
            <p>Энэ холбоос 1 цагийн дараа хүчингүй болно.</p>
          </div>
          <div class="footer">
            <p>© LIME 2026. Энэ нь автоматаар илгээгдсэн имэйл юм.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
