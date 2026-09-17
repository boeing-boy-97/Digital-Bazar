// Email Provider - REAL transactional via Resend / SendGrid / SMTP
// In-app always works, email optional but real when configured

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'resend';
  const apiKey = process.env.EMAIL_API_KEY;

  if (!apiKey) {
    console.warn(`[EMAIL] EMAIL_API_KEY not configured - skipping REAL email to ${to}. Set per .env.example for REAL. In-app notification still works.`);
    return { success: false, error: 'Email not configured - in-app only', provider: 'none' };
  }

  try {
    if (provider === 'resend') {
      return await sendViaResend(to, subject, html, text);
    } else if (provider === 'sendgrid') {
      return await sendViaSendGrid(to, subject, html, text);
    } else if (provider === 'smtp') {
      return await sendViaSMTP(to, subject, html, text);
    } else {
      return await sendViaResend(to, subject, html, text);
    }
  } catch (e: any) {
    console.error(`[EMAIL] Failed via ${provider}: ${e.message}`);
    return { success: false, error: e.message, provider };
  }
}

async function sendViaResend(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
  const apiKey = process.env.EMAIL_API_KEY!;
  const from = process.env.EMAIL_FROM || 'Digital Bazar <noreply@yourdomain.com>';

  // npm i resend - use eval to avoid webpack when not installed
  try {
    const resendRequire = eval("require") as any;
    const { Resend } = resendRequire('resend');
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });

    if (error) throw new Error(error.message);
    console.log(`[EMAIL] REAL email sent via Resend to ${to} id ${data?.id}`);
    return { success: true, messageId: data?.id, provider: 'resend' };
  } catch (e: any) {
    // Fallback to fetch if SDK not installed
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [to], subject, html, text })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[EMAIL] REAL email sent via Resend fetch to ${to}`);
      return { success: true, messageId: data.id, provider: 'resend' };
    }
    throw new Error(data.message || e.message);
  }
}

async function sendViaSendGrid(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
  const apiKey = process.env.EMAIL_API_KEY!;
  const from = process.env.EMAIL_FROM || 'noreply@yourdomain.com';

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  });

  if (res.ok || res.status === 202) {
    console.log(`[EMAIL] REAL email sent via SendGrid to ${to}`);
    return { success: true, messageId: `sg_${Date.now()}`, provider: 'sendgrid' };
  }
  const data = await res.json().catch(() => ({}));
  throw new Error(data.errors?.[0]?.message || 'SendGrid failed');
}

async function sendViaSMTP(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
  // npm i nodemailer - eval to avoid webpack bundling
  const nodemailerRequire = eval("require") as any;
  const nodemailer = nodemailerRequire('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text
  });

  console.log(`[EMAIL] REAL email sent via SMTP to ${to} id ${info.messageId}`);
  return { success: true, messageId: info.messageId, provider: 'smtp' };
}

export function getEmailConfigState() {
  const apiKey = process.env.EMAIL_API_KEY;
  const provider = process.env.EMAIL_PROVIDER || 'resend';
  if (!apiKey) return { mode: 'none', healthy: false, message: 'Email not configured - in-app only, set EMAIL_API_KEY per .env.example for REAL' };
  return { mode: provider, healthy: true, message: `REAL email via ${provider} configured` };
}
