/**
 * 🛠️ dailypetshop-gateway (Production Version)
 * ด่านหน้าสำหรับรับ Webhook จาก LINE และส่งต่อข้อมูล
 */

export default {
  async fetch(request, env, ctx) {
    // 1. ตรวจสอบเบื้องต้น (อนุญาตเฉพาะ POST)
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 }); 
    }

    const signature = request.headers.get('x-line-signature');
    const body = await request.text();

    // 2. Bypass สำหรับการกดปุ่ม "Verify" ใน LINE Developers Console 
    if (!signature || body === '{}' || body.length < 5) {
      return new Response('OK', { status: 200 });
    }

    // 3. ตรวจสอบ Signature (ความปลอดภัย)
    const channelSecret = env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      console.error('❌ Missing LINE_CHANNEL_SECRET');
      return new Response('Config Error', { status: 500 });
    }

    const isValid = await verifyLineSignature(body, channelSecret, signature);
    if (!isValid) {
      return new Response('Unauthorized', { status: 403 });
    }

    // 4. เตรียมส่งข้อมูลไปยังปลายทาง (ดึงค่าจาก env)
    // หมายเหตุ: เราจะไปตั้งค่า GAS_ENDPOINT ในไฟล์ wrangler.jsonc ต่อไป
    const endpoints = [
      { 
        name: 'Google Apps Script', 
        url: env.GAS_ENDPOINT, 
        enabled: true 
      }
    ];

    // 5. ส่งข้อมูลออกแบบ Parallel (ไม่รอผลเพื่อความเร็วในการตอบกลับ LINE)
    ctx.waitUntil(forwardToMultipleEndpoints(endpoints, body, signature));

    return new Response('OK', { status: 200 });
  }
};

/**
 * 🔒 ฟังก์ชันตรวจสอบลายเซ็น (HMAC-SHA256)
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
    return false;
  }
}

/**
 * 🚀 ฟังก์ชันส่งต่อข้อมูล
 */
async function forwardToMultipleEndpoints(endpoints, body, signature) {
  const promises = endpoints
    .filter(ep => ep.enabled && ep.url)
    .map(async (endpoint) => {
      try {
        await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-line-signature': signature,
            'user-agent': 'dailypetshop-gateway'
          },
          body: body
        });
      } catch (err) {
        console.error(`❌ ${endpoint.name} Error:`, err.message);
      }
    });

  await Promise.allSettled(promises);
}