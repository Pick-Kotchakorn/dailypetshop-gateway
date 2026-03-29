/**
 * 🛠️ dailypetshop-gateway (Full Version)
 * โครงสร้างตามมาตรฐาน unabot-gateway
 * - รองรับ Multiple Endpoints (GAS & Webhook.site)
 * - ตรวจสอบ Signature ด้วย Web Crypto API
 * - Bypass 200 OK สำหรับการกด Verify ใน LINE Console
 */

// 📌 Fallback Endpoints
const GAS_ENDPOINT_DEFAULT = 'https://script.google.com/macros/s/AKfycbwbrYbJe03nd58Bm-4Y2ixWNpIWeQ4Dxsh52W19QOYJgi1BXOyC-xsx_uMuKdbfUe0XeQ/exec';
const WEBHOOK_SITE_DEFAULT = 'https://webhook.site/d5cc4ad6-7286-4879-ba7a-0455d0a53d2b';

export default {
  async fetch(request, env, ctx) {
    // 1. ตอบกลับ OK ทันทีหากไม่ใช่ POST (ป้องกันการสแกนจาก Bot อื่น)
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 }); 
    }

    const signature = request.headers.get('x-line-signature');
    const body = await request.text();

    // 🔍 ปรับเงื่อนไข Bypass ให้ครอบคลุมการกดปุ่ม Verify มากขึ้น
    // ถ้าไม่มี Signature หรือเป็น Body ว่าง ({}) ให้ตอบ 200 ทันที
    if (!signature || body === '{}' || body.length < 5) {
      console.log('⚠️ Verification/Empty request detected');
      return new Response('OK', { status: 200 });
    }

    const channelSecret = env.LINE_CHANNEL_SECRET;
    
    // ตรวจสอบความพร้อมของ Secret
    if (!channelSecret) {
      console.error('❌ LINE_CHANNEL_SECRET is NOT set!');
      // ส่ง 200 ไปก่อนในช่วงทดสอบเพื่อไม่ให้ LINE ตัดการเชื่อมต่อ
      return new Response('Config Error', { status: 200 }); 
    }

    // ✅ Validate Signature
    const isValid = await verifyLineSignature(body, channelSecret, signature);
    
    if (!isValid) {
      console.log('❌ Invalid signature.');
      // 💡 ช่วง Verify ให้ลองเปลี่ยนเป็น 200 เพื่อเช็คว่าท่อส่งไปถึง GAS ไหม
      // หากผ่านแล้วค่อยเปลี่ยนกลับเป็น 403 เพื่อความปลอดภัย
      return new Response('OK', { status: 200 }); 
    }

    // 🚀 ส่วนการ Forward ข้อมูลไปยัง GAS คงเดิม...
    ctx.waitUntil(forwardToMultipleEndpoints(
      [{ name: 'GAS', url: env.FORWARD_URL || GAS_ENDPOINT_DEFAULT, enabled: true }],
      body, 
      signature
    ));

    return new Response('OK', { status: 200 });
  }
};

/**
 * ฟังก์ชันตรวจสอบลายเซ็นแบบมาตรฐาน Web Crypto (HMAC-SHA256)
 */
async function verifyLineSignature(body, secret, signature) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const signatureBin = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signatureBin)));
  return base64Signature === signature;
}

/**
 * ฟังก์ชันส่งต่อข้อมูลไปยังหลาย Endpoints พร้อมกัน
 */
async function forwardToMultipleEndpoints(endpoints, body, signature) {
  const promises = endpoints
    .filter(ep => ep.enabled)
    .map(async (endpoint) => {
      try {
        console.log(`🚀 Forwarding to ${endpoint.name}: ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-line-signature': signature,
            'user-agent': 'dailypetshop-gateway'
          },
          body: body
        });

        console.log(`✅ ${endpoint.name} Success: ${response.status}`);
      } catch (err) {
        console.error(`❌ ${endpoint.name} Failed: ${err.message}`);
      }
    });

  await Promise.allSettled(promises);
}