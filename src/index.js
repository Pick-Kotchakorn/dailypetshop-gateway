/**
 * 🛠️ dailypetshop-gateway (Full Version - No Library Edition)
 * โครงสร้างตามมาตรฐาน unabot-gateway
 * - ใช้ Web Crypto API แทน @line/bot-sdk (แก้ปัญหา Build Error)
 * - ปักหมุด URL ของ GAS ไว้ในโค้ด (ไม่ต้องใส่ใน Secrets)
 * - รองรับการกดปุ่ม Verify ใน LINE Developers Console
 */

// 📌 ปักหมุด URL ปลายทาง
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx7weqmdOSE1ZZ-df8KyWrQx02p2MYANOxjr49_rB-AKUasSIxKx8i6_EonEB7EGweM/exec';
const WEBHOOK_SITE_URL = 'https://webhook.site/d5cc4ad6-7286-4879-ba7a-0455d0a53d2b';
const DIALOGFLOW_ENDPOINT = 'https://dialogflow.cloud.google.com/v1/integrations/line/webhook/a0ab3d28-5a9a-4234-a76a-ba77b0bd197e';

export default {
  async fetch(request, env, ctx) {
    // 1. ตรวจสอบเบื้องต้น (Allow Only POST)
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 }); 
    }

    const signature = request.headers.get('x-line-signature');
    const body = await request.text();

    // 2. Bypass สำหรับการกดปุ่ม "Verify" ใน LINE Console 
    // (มักจะไม่มี Signature หรือส่ง Body มาทดสอบสั้นๆ)
    if (!signature || body === '{}' || body.length < 5) {
      console.log('⚠️ Verification/Empty request detected');
      return new Response('OK', { status: 200 });
    }

    // 3. ตรวจสอบความปลอดภัย (Signature Validation)
    const channelSecret = env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      console.error('❌ Missing LINE_CHANNEL_SECRET in Cloudflare Variables');
      return new Response('Config Error', { status: 500 });
    }

    const isValid = await verifyLineSignature(body, channelSecret, signature);
    
    if (!isValid) {
      console.error('🚫 Invalid Signature');
      return new Response('Unauthorized', { status: 403 });
    }

    console.log('✅ Signature Validated. Forwarding...');

    // 4. เตรียม Endpoints (เลียนแบบ Logic unabot-gateway)
    const endpoints = [
      { 
        name: 'Google Apps Script', 
        url: GAS_ENDPOINT, 
        enabled: true 
      },
      { 
        name: 'Webhook.site (Debug)', 
        url: WEBHOOK_SITE_URL, 
        enabled: env.ENABLE_DEBUG === 'true' 
      }
    ];

    // 5. ส่งข้อมูลออกไปแบบ Parallel (ไม่รอผลเพื่อความเร็ว)
    ctx.waitUntil(forwardToMultipleEndpoints(endpoints, body, signature));

    // ตอบกลับ LINE ทันที
    return new Response('OK', { status: 200 });
  }
};

/**
 * 🔒 ฟังก์ชันตรวจสอบลายเซ็นแบบมาตรฐาน Web Crypto (HMAC-SHA256)
 * ใช้แทน validateSignature จาก Library ภายนอก
 */
async function verifyLineSignature(body, secret, signature) {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', 
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, 
      ['sign']
    );
    const signatureBin = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signatureBin)));
    return base64Signature === signature;
  } catch (err) {
    console.error('🔒 Crypto Error:', err.message);
    return false;
  }
}

/**
 * 🚀 ฟังก์ชันส่งต่อข้อมูลไปยังหลาย Endpoints พร้อมกัน
 */
async function forwardToMultipleEndpoints(endpoints, body, signature) {
  const promises = endpoints
    .filter(ep => ep.enabled)
    .map(async (endpoint) => {
      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-line-signature': signature,
            'user-agent': 'dailypetshop-gateway'
          },
          body: body
        });
        console.log(`✅ ${endpoint.name} Status: ${response.status}`);
      } catch (err) {
        console.error(`❌ ${endpoint.name} Error:`, err.message);
      }
    });

  await Promise.allSettled(promises);
}