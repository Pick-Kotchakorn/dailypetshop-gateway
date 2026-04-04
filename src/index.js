/**
 * 🛠️ dailypetshop-gateway (Production Version)
 * ด่านหน้า: รองรับ Caching (KV), Idempotency และ Fast Response
 */

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') return new Response('OK', { status: 200 });

    const signature = request.headers.get('x-line-signature');
    const bodyText = await request.text();
    
    if (!signature || bodyText === '{}') return new Response('OK', { status: 200 });

    const channelSecret = env.LINE_CHANNEL_SECRET;
    const isValid = await verifyLineSignature(bodyText, channelSecret, signature);
    if (!isValid) return new Response('Unauthorized', { status: 403 });

    const body = JSON.parse(bodyText);
    const events = body.events || [];

    for (const event of events) {
      const userId = event.source.userId;
      if (!userId) continue;

      // 🛡️ 1. Idempotency Lock (กัน Spam 5 วินาที) [cite: 21, 22]
      const lockKey = `lock:${userId}:${event.timestamp}`;
      const isLocked = await env.DPS_USER_CACHE.get(lockKey);
      if (isLocked) continue;
      await env.DPS_USER_CACHE.put(lockKey, "1", { expirationTtl: 5 });

      // 🧠 2. State Machine: เช็ค Cache ก่อนส่งไป GAS [cite: 7, 12, 26]
      if (event.type === 'postback') {
        const data = event.postback.data;
        if (data.includes('action=register')) {
          const cachedStatus = await env.DPS_USER_CACHE.get(`user:${userId}`);
          if (cachedStatus === 'REGISTERED') {
            // ถ้าสมัครแล้ว ให้ข้ามการเรียก GAS และจบการทำงาน (หรือส่งข้อความแจ้งเตือนด่วน)
            continue; 
          }
        }
      }
    }

    // 🚀 3. ส่งข้อมูลไปที่ GAS Endpoint [cite: 14]
    ctx.waitUntil(forwardToGAS(env.GAS_ENDPOINT, bodyText, signature));

    return new Response('OK', { status: 200 });
  }
};

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

async function forwardToGAS(url, body, signature) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-line-signature': signature
      },
      body: body
    });
  } catch (err) {
    console.error("❌ GAS Forward Error:", err.message);
  }
}