// SMS Provider - REAL OTP via MSG91 / Fast2SMS / Twilio
// No hardcoded 123456 in prod per audit CRITICAL

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResult> {
  const provider = process.env.SMS_PROVIDER || 'msg91';
  const apiKey = process.env.SMS_API_KEY;

  // In dev with OTP_ENABLED=true, we allow test code - but NEVER in prod
  if (process.env.NODE_ENV !== 'production' && process.env.OTP_ENABLED === 'true') {
    console.warn(`[SMS] DEV MODE: OTP for ${phone} is ${otp} - would send via ${provider} in prod. Set OTP_ENABLED=false + SMS_API_KEY for REAL`);
    return { success: true, messageId: `dev_${Date.now()}`, provider: 'dev_mock' };
  }

  if (!apiKey) {
    console.error('[SMS] SMS_API_KEY not configured - cannot send REAL OTP. See .env.example for REAL setup');
    return { success: false, error: 'SMS provider not configured - set SMS_API_KEY per .env.example', provider };
  }

  try {
    if (provider === 'msg91') {
      return await sendViaMSG91(phone, otp);
    } else if (provider === 'fast2sms') {
      return await sendViaFast2SMS(phone, otp);
    } else if (provider === 'twilio') {
      return await sendViaTwilio(phone, otp);
    } else {
      return await sendViaMSG91(phone, otp);
    }
  } catch (e: any) {
    console.error(`[SMS] Failed to send OTP via ${provider}: ${e.message}`);
    return { success: false, error: e.message, provider };
  }
}

async function sendViaMSG91(phone: string, otp: string): Promise<SMSResult> {
  // MSG91 API: https://docs.msg91.com/p/tf9Gxl0Y9uHhLa8a2u1rK0w/otp-send
  const authKey = process.env.SMS_API_KEY!;
  const senderId = process.env.SMS_SENDER_ID || 'DBAZAR';
  const templateId = process.env.SMS_TEMPLATE_ID;

  if (!templateId) {
    console.warn('[SMS] SMS_TEMPLATE_ID not set - using generic OTP send');
    // Generic SMS send
    const res = await fetch(`https://api.msg91.com/api/v5/flow/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: authKey },
      body: JSON.stringify({
        flow_id: templateId,
        sender: senderId,
        mobiles: `91${phone}`,
        OTP: otp
      })
    });
    const data = await res.json();
    if (data.type === 'success') {
      return { success: true, messageId: data.message, provider: 'msg91' };
    }
    throw new Error(data.message || 'MSG91 failed');
  }

  // OTP API with template
  const url = `https://api.msg91.com/api/v5/otp?authkey=${authKey}&mobile=91${phone}&otp=${otp}&sender=${senderId}&template_id=${templateId}&otp_length=6&otp_expiry=${process.env.OTP_EXPIRY_MINUTES || 5}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.type === 'success' || data.message === 'OTP sent successfully') {
    console.log(`[SMS] REAL OTP sent via MSG91 to ${phone.slice(-4)}`);
    return { success: true, messageId: data.request_id || `msg91_${Date.now()}`, provider: 'msg91' };
  }
  throw new Error(data.message || 'MSG91 OTP failed');
}

async function sendViaFast2SMS(phone: string, otp: string): Promise<SMSResult> {
  const apiKey = process.env.SMS_API_KEY!;
  const senderId = process.env.SMS_SENDER_ID || 'DBAZAR';

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: apiKey },
    body: JSON.stringify({
      route: 'dlt',
      sender_id: senderId,
      message: `Your OTP for Digital Bazar is ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} mins. Do not share.`,
      language: 'english',
      flash: 0,
      numbers: phone
    })
  });
  const data = await res.json();
  if (data.return === true || data.status_code === 200) {
    console.log(`[SMS] REAL OTP sent via Fast2SMS to ${phone.slice(-4)}`);
    return { success: true, messageId: data.request_id || `fast2sms_${Date.now()}`, provider: 'fast2sms' };
  }
  throw new Error(data.message || 'Fast2SMS failed');
}

async function sendViaTwilio(phone: string, otp: string): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio not configured - set TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER');
  }

  // Use eval to avoid webpack bundling when package not installed
  const twilioRequire = eval("require") as any;
  const client = twilioRequire('twilio')(accountSid, authToken);
  const message = await client.messages.create({
    body: `Your Digital Bazar OTP is ${otp}. Valid ${process.env.OTP_EXPIRY_MINUTES || 5} mins.`,
    from: fromNumber,
    to: `+91${phone}`
  });
  console.log(`[SMS] REAL OTP sent via Twilio to ${phone.slice(-4)} SID ${message.sid}`);
  return { success: true, messageId: message.sid, provider: 'twilio' };
}

export function getSMSConfigState() {
  const apiKey = process.env.SMS_API_KEY;
  const provider = process.env.SMS_PROVIDER || 'msg91';
  if (!apiKey) return { mode: 'mock', healthy: false, message: 'SMS not configured - set SMS_API_KEY per .env.example for REAL OTP' };
  return { mode: provider, healthy: true, message: `REAL SMS via ${provider} configured` };
}
