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
    // 1. กรองเฉพาะ POST Method
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    console.log('🔔 Webhook received from LINE');

    // 2. รับค่าจาก Header และ Body
    const signature = request.headers.get('x-line-signature');
    const body = await request.text();
    const channelSecret = env.LINE_CHANNEL_SECRET;

    // 🔍 3. จุดแก้ไข: Bypass สำหรับการกดปุ่ม Verify ใน LINE Developers Console
    // หากไม่มี signature หรือ body สั้นมาก ให้ตอบกลับ 200 OK ทันทีเพื่อให้ผ่านการ Verify
    if (!signature || body.length < 5) {
      console.log('⚠️ Verification request detected or Missing Signature');
      return new Response('OK', { status: 200 });
    }

    if (!channelSecret) {
      console.error('❌ LINE_CHANNEL_SECRET is NOT set!');
      return new Response('Server Error: Missing Secret', { status: 500 });
    }

    // ✅ 4. Validate Signature (ใช้ Web Crypto API)
    try {
      const isValid = await verifyLineSignature(body, channelSecret, signature);
      
      if (!isValid) {
        console.log('❌ Invalid signature. Request rejected.');
        // หาก Verify ผ่านแล้วแต่ใช้งานจริงยังติด 403 ให้ลองเปลี่ยนเป็น status: 200 ชั่วคราวเพื่อ Debug
        return new Response('Invalid signature', { status: 403 });
      }
    } catch (error) {
      console.error('❌ Signature Validation Error:', error.message);
      return new Response('Validation failed', { status: 500 });
    }

    console.log('✅ Signature validated');

    // 🎯 5. ตั้งค่า Endpoints สำหรับส่งต่อข้อมูล (Multiple Endpoints ตาม unabot)
    const endpoints = [
      { 
        name: 'GAS (Production)', 
        url: env.FORWARD_URL || GAS_ENDPOINT_DEFAULT,
        enabled: true
      },
      { 
        name: 'Webhook.site (Debug)', 
        url: env.WEBHOOK_SITE_URL || WEBHOOK_SITE_DEFAULT,
        enabled: env.ENABLE_WEBHOOK_SITE !== 'false' // เปิด/ปิดได้ผ่าน Dashboard
      }
    ];

    // 🚀 6. ส่งข้อมูลแบบ Parallel (ไม่รอผล เพื่อป้องกัน LINE Timeout)
    ctx.waitUntil(
      forwardToMultipleEndpoints(endpoints, body, signature)
    );

    // 7. ตอบกลับ LINE ทันทีเป็น 200 OK
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