const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwIzSOuWgZfZ5Bf4pK_d1oRS1XX7i-s89tZaD6rsYrPBO6Iu1OmMyETg_lYikjCC-M/exec';
const AI_SYSTEM_URL = 'https://dailypet-ai-worker.pickky-kotchakorn.workers.dev'; 
const WEBHOOK_SITE_URL = 'https://webhook.site/99c7d467-91a0-402e-b8ac-0ceb8d38ffd4';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') return new Response('OK', { status: 200 });

    const signature = request.headers.get('x-line-signature');
    const bodyText = await request.text();

    // ตรวจสอบความถูกต้องเบื้องต้น
    if (!signature || bodyText === '{}' || bodyText.length < 5) {
      return new Response('OK', { status: 200 });
    }

    const channelSecret = env.LINE_CHANNEL_SECRET;
    if (!channelSecret) return new Response('Config Error', { status: 500 });

    const isValid = await verifyLineSignature(bodyText, channelSecret, signature);
    if (!isValid) return new Response('Unauthorized', { status: 403 });

    console.log('✅ Signature Validated. Processing Data...');

    // ดึงข้อมูลสำคัญจาก LINE Webhook
    const body = JSON.parse(bodyText);
    const event = body.events ? body.events[0] : null;

    if (event && event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const userMessage = event.message.text;

      // สร้าง Payload พิเศษสำหรับ AI System
      const aiPayload = JSON.stringify({
        source: 'line_gateway',
        userId: userId,
        message: userMessage,
        profile: {
          displayName: "Customer", // ส่วนนี้สามารถขยายเพื่อดึงชื่อจริงจาก LINE API ได้ในอนาคต
          platform: "LINE"
        }
      });

      // ตั้งค่าปลายทาง
      const endpoints = [
        { name: 'Google Apps Script', url: GAS_ENDPOINT, body: bodyText, enabled: true },
        { name: 'AI System Brain', url: AI_SYSTEM_URL, body: aiPayload, enabled: true },
        { name: 'Webhook.site (Debug)', url: WEBHOOK_SITE_URL, body: bodyText, enabled: env.ENABLE_DEBUG === 'true' }
      ];

      // กระจายข้อมูลไปยังปลายทางต่างๆ
      ctx.waitUntil(forwardToMultipleEndpoints(endpoints, signature));
    }

    return new Response('OK', { status: 200 });
  }
};

async function verifyLineSignature(body, secret, signature) {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBin = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signatureBin)));
    return base64Signature === signature;
  } catch (err) { return false; }
}

async function forwardToMultipleEndpoints(endpoints, signature) {
  const promises = endpoints.filter(ep => ep.enabled).map(async (endpoint) => {
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-line-signature': signature 
        },
        body: endpoint.body
      });
      console.log(`✅ ${endpoint.name}: Sent successfully (${response.status})`);
    } catch (err) {
      console.error(`❌ ${endpoint.name}: Failed to send`, err);
    }
  });
  return Promise.all(promises);
}