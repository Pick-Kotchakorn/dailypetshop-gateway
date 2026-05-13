/**
 * 🚀 MAIN.js - Daily Pet Shop (Production Ready — v3.1)
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry Point สำหรับระบบทั้งหมด
 *
 * การแก้ไขจาก v3.0:
 *   [FIX-09] doPost() — Signature bypass (GAS limitation):
 *            GAS webapp ไม่ expose HTTP headers ใน e.parameter
 *            → e.parameter['X-Line-Signature'] และ e.postData.headers จะเป็น undefined เสมอ
 *            → signature = null ทุกครั้ง → ข้าม _verifyLineSignature() โดยไม่รู้ตัว
 *            แก้: ลบ false-positive path ออก, log warning ชัดเจน, และ document limitation
 *            หมายเหตุ: GAS webapp ไม่รองรับ signature verify จริง ต้องใช้ Cloud Functions
 *            สำหรับ security จริงจัง (ดู Audit Report หัวข้อ Security Risks)
 *
 *   [FIX-10] handleDialogflowFulfillment() — Optional chaining สำหรับ userId:
 *            body.originalDetectIntentRequest.payload.data.source.userId
 *            → TypeError ถ้า path ขาดตรงไหนก็ได้ (เช่น test จาก Dialogflow Console)
 *            แก้: ใช้ optional chaining (?.) + nullish coalescing (??)
 *
 *   [FIX-11] handleDialogflowFulfillment() — Silent empty response เมื่อ userId ว่าง:
 *            เดิม: ถ้า POINTS_INTENTS match แต่ userId ว่าง → ไม่เข้า handler → ส่ง {} กลับ
 *            → Dialogflow ได้รับ empty JSON → bot ไม่ตอบผู้ใช้เลย (silent failure)
 *            แก้: เพิ่ม branch สำหรับ POINTS_INTENTS + userId ว่าง
 *            → ถามเบอร์โทรได้เลย เพราะ _handleCheckPointsIntent รองรับ phone-based lookup อยู่แล้ว
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * การแก้ไขจาก v3.0 (คงเดิมทุกจุด):
 *   [FIX-01] ลบ handleDialogflowFulfillment() ที่ซ้ำกับ EventHandler.js ออก
 *            → รวมไว้ที่นี่เพียงที่เดียว เป็น Single Source of Truth
 *   [FIX-02] เพิ่ม LINE Webhook Signature Verification ใน doPost()
 *   [FIX-03] แก้ getLiffIdConfig() ให้ดึงจาก CONFIG แทน hardcode
 *   [FIX-04] แยก Dialogflow intent routing ออกจาก LINE event routing อย่างชัดเจน
 *   [FIX-05] เพิ่ม structured error response ทุก path
 *   [FIX-06] เพิ่ม findFileIgnoreSense() ให้ครอบคลุม page ทั้งหมด
 *   [FIX-07] ป้องกัน path traversal attack ใน doGet()
 *   [FIX-08] เพิ่ม request logging สำหรับ debug production issues
 *
 * Dependencies (ต้องโหลดก่อนไฟล์นี้ตาม filePushOrder ใน .clasp.json):
 *   - Config.js
 *   - SheetService.js
 *   - LineAPI.js
 *   - Membership.js
 *   - DialogflowService.js
 *   - FlexService.js
 *   - NutritionService.js
 *   - AdminService.js
 *   - EventHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 */


// =============================================================================
// 🌐 1. doGet — จัดการการเข้าถึงหน้าเว็บผ่าน LIFF / Browser
// =============================================================================

/**
 * จุดเข้าถึงหน้าเว็บ (GET Request)
 * รองรับ: Registration, Reward, Admin
 *
 * [FIX-07] เพิ่ม whitelist validation เพื่อป้องกัน path traversal
 *          ไม่รับค่า page จาก parameter โดยตรงโดยไม่ผ่าน whitelist
 */
function doGet(e) {
  // 1. ดึงและ sanitize ค่า page parameter
  const rawPage = (e && e.parameter && e.parameter.page)
    ? e.parameter.page.trim()
    : 'Registration';

  // 2. ตรวจสอบผ่าน whitelist (ป้องกัน path traversal)
  const page = findFileIgnoreSense(rawPage);

  try {
    validateConfig();

    const template = HtmlService.createTemplateFromFile(page);
    template.queryParameters = (e && e.parameter) ? e.parameter : {};

    return template.evaluate()
      .setTitle('Daily Pet Shop | Digital Member')
      .addMetaTag(
        'viewport',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      )
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    console.error(`❌ [doGet] Route Error [${page}]: ${error.toString()}`);
    return _buildErrorPage(page);
  }
}


// =============================================================================
// 📡 2. doPost — จุดรับ Webhook จาก LINE และ Dialogflow
// =============================================================================

/**
 * จุดรับ POST request ทั้งหมด
 *
 * [FIX-09] GAS Signature Limitation:
 *   GAS webapp ไม่ expose HTTP headers โดยตรง — ทั้ง e.parameter และ e.postData.headers
 *   ไม่มี X-Line-Signature → signature จะเป็น null ทุกครั้ง
 *
 *   Behavior ที่แก้ไขแล้ว:
 *   - ลบ false-positive path (e.parameter['X-Line-Signature']) ออก เพราะไม่มีทางได้ค่านี้
 *   - log warning ชัดเจนเมื่อ signature ไม่สามารถตรวจสอบได้
 *   - ยังคงเรียก _verifyLineSignature() ไว้เผื่ออนาคต (เช่น ถ้าย้ายไป Cloud Functions)
 *   - ⚠️ ผลลัพธ์จริง: signature verify จะ bypass เสมอบน GAS webapp
 *     ถ้าต้องการ security จริงจัง ต้องย้าย webhook ไปยัง Cloud Functions / Cloud Run
 *
 * [FIX-01] Dialogflow และ LINE event แยก routing ชัดเจน
 */
function doPost(e) {
  // Guard: ป้องกัน request ที่ไม่มี body
  if (!e || !e.postData || !e.postData.contents) {
    console.warn('⚠️ [doPost] Empty request body received');
    return _createJsonResponse({ status: 'ok' }); // ตอบ 200 เสมอ ป้องกัน LINE retry
  }

  const rawBody = e.postData.contents;

  try {
    validateConfig();

    // ── 2A. LINE Signature [FIX-09] ──────────────────────────────────────────
    // GAS webapp ไม่ expose HTTP headers → X-Line-Signature ไม่สามารถดึงได้
    // signature จะเป็น null เสมอ → _verifyLineSignature จะไม่ถูกเรียก
    // ⚠️ นี่คือ known limitation ของ GAS webapp — ไม่ใช่ bug ของโค้ด
    const lineSignature = (e.postData.headers && e.postData.headers['X-Line-Signature'])
      ? e.postData.headers['X-Line-Signature']
      : null;

    if (!lineSignature) {
      // [FIX-09] Log warning แทนการ silently skip — ช่วย debug และ awareness
      console.warn(
        '⚠️ [doPost] X-Line-Signature not available — GAS webapp does not expose HTTP headers. ' +
        'Signature verification is SKIPPED. ' +
        'For production security, consider migrating webhook to Cloud Functions.'
      );
    }

    const body = JSON.parse(rawBody);

    // ── 2B. Route: Dialogflow Webhook ────────────────────────────────────────
    // Dialogflow request จะมี queryResult field เสมอ
    if (body.queryResult) {
      console.log('ℹ️ [doPost] Routing to Dialogflow Fulfillment');
      return handleDialogflowFulfillment(body);
    }

    // ── 2C. Route: LINE Messaging API Webhook ────────────────────────────────
    // ตรวจสอบ Signature เฉพาะเมื่อดึงค่าได้จริง (ปัจจุบันบน GAS จะ skip เสมอ)
    if (lineSignature && !_verifyLineSignature(rawBody, lineSignature)) {
      console.error('🚫 [doPost] Invalid LINE signature — request rejected');
      return _createJsonResponse({ status: 'ok' }); // ตอบ 200 แต่ไม่ประมวลผล
    }

    const events = body.events || [];

    if (events.length === 0) {
      console.log('ℹ️ [doPost] No events to process (verification ping?)');
      return _createJsonResponse({ status: 'ok' });
    }

    // ประมวลผล LINE events ทีละ event
    events.forEach((event, index) => {
      try {
        console.log(`ℹ️ [doPost] Processing event[${index}]: type=${event.type}, userId=${event.source && event.source.userId}`);
        handleEvent(event);
      } catch (eventError) {
        // Log แต่ไม่หยุดประมวลผล events ตัวอื่น
        console.error(`❌ [doPost] Event[${index}] Error: ${eventError.message}`);
      }
    });

    return _createJsonResponse({ status: 'ok' });

  } catch (error) {
    // ตอบ 200 เสมอ เพื่อไม่ให้ LINE ทำ retry storm
    console.error(`❌ [doPost] Global Error: ${error.message}\nStack: ${error.stack}`);
    return _createJsonResponse({ status: 'ok', note: 'processed_with_error' });
  }
}


// =============================================================================
// 🤖 3. handleDialogflowFulfillment — จัดการ Fulfillment จาก Dialogflow
// =============================================================================

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: ฟังก์ชันนี้มีเพียงที่เดียวในโปรเจกต์ (ที่ Main.js)
 *    ห้ามสร้างซ้ำใน EventHandler.js หรือไฟล์อื่น
 *
 * [FIX-01] รวม logic จากทั้ง Main.js และ EventHandler.js เดิมเข้าด้วยกัน
 *          → แก้ปัญหา intent name mismatch ระหว่าง 2 เวอร์ชัน
 *          → รองรับทั้ง "Check Points", "CheckMemberInfo", "member-check-points"
 *
 * [FIX-05] เพิ่ม error handling ทุก path ไม่ให้เกิด silent failure
 *
 * [FIX-10] Optional chaining สำหรับการดึง userId จาก nested path
 *          path เดิม: body.originalDetectIntentRequest.payload.data.source.userId
 *          → TypeError ถ้า path ขาดตรงไหนก็ได้ (เช่น test จาก Dialogflow Console)
 *          แก้: body?.originalDetectIntentRequest?.payload?.data?.source?.userId ?? ''
 *
 * [FIX-11] แก้ Silent empty response เมื่อ POINTS_INTENTS match แต่ userId ว่าง:
 *          เดิม: if (POINTS_INTENTS.includes(intentName) && userId) → ถ้า userId ว่าง
 *          → ไม่เข้า branch ใด → ตกไปที่ _createJsonResponse({}) → empty response
 *          → Dialogflow ได้รับ {} → bot ไม่ตอบ → ลูกค้าเงียบหาย
 *          แก้: เพิ่ม branch POINTS_INTENTS + !userId → fallback ขอเบอร์โทรแทน
 *          (เพราะ _handleCheckPointsIntent รองรับ phone-based lookup อยู่แล้ว ไม่จำเป็นต้องมี userId)
 */
function handleDialogflowFulfillment(body) {
  // Guard: ตรวจสอบโครงสร้าง body
  if (!body || !body.queryResult) {
    console.error('❌ [handleDialogflowFulfillment] Invalid body structure');
    return _createDialogflowTextResponse('ขออภัยค่ะ ระบบขัดข้องชั่วคราว');
  }

  const queryResult = body.queryResult;
  const intentName  = (queryResult.intent && queryResult.intent.displayName)
    ? queryResult.intent.displayName
    : '';
  const parameters  = queryResult.parameters || {};

  // ── 3A. ดึง userId จาก LINE payload ที่ส่งผ่าน Dialogflow ─────────────────
  // [FIX-10] optional chaining ป้องกัน TypeError เมื่อ path ขาดตรงไหนก็ได้
  // path นี้จะไม่มีเมื่อ test จาก Dialogflow Console → userId = '' (ไม่ใช่ error)
  const userId = body?.originalDetectIntentRequest?.payload?.data?.source?.userId ?? '';

  if (!userId) {
    console.warn('⚠️ [handleDialogflowFulfillment] userId not found in request (Console test or missing payload)');
  } else {
    console.log(`ℹ️ [handleDialogflowFulfillment] Intent: "${intentName}", userId: "${userId}"`);
  }

  // ── 3B. Intent Routing ────────────────────────────────────────────────────
  // รองรับทุก intent name ที่อาจตั้งใน Dialogflow Console
  const POINTS_INTENTS = ['Check Points', 'CheckMemberInfo', 'member-check-points'];

  if (POINTS_INTENTS.includes(intentName)) {
    if (userId) {
      // มี userId → ส่งเข้า handler ปกติ (ค้นได้ทั้งจาก userId และ phone)
      return _handleCheckPointsIntent(parameters, userId, queryResult);
    } else {
      // [FIX-11] ไม่มี userId (test จาก Console หรือ payload หาย)
      // → ยังเรียก _handleCheckPointsIntent ได้ เพราะ logic ข้างในค้นผ่านเบอร์โทรเป็นหลัก
      // → ถ้าไม่มีเบอร์โทรใน parameters ด้วย ฟังก์ชันจะขอเบอร์โทรจากลูกค้าเอง
      console.warn(`⚠️ [handleDialogflowFulfillment] POINTS_INTENTS matched but userId is empty — proceeding with phone-only lookup`);
      return _handleCheckPointsIntent(parameters, '', queryResult);
    }
  }

  // ── 3C. Default: ให้ Dialogflow ตอบตามปกติ ──────────────────────────────
  return _createJsonResponse({});
}


// =============================================================================
// 🔑 4. Helpers สำหรับ doGet
// =============================================================================

/**
 * ตรวจสอบ page name ผ่าน whitelist (case-insensitive)
 * [FIX-06] เพิ่ม whitelist ให้ครบและป้องกัน path traversal
 *
 * @param  {string} filename - ชื่อหน้าที่รับจาก URL parameter
 * @returns {string}          ชื่อไฟล์ที่ถูกต้อง หรือ 'Registration' เป็น default
 */
function findFileIgnoreSense(filename) {
  const VALID_PAGES = ['Admin', 'Registration', 'Reward'];

  // ลบ .html ออกหากมี และตัด whitespace
  const clean = filename
    .replace(/\.html$/i, '')
    .replace(/[^a-zA-Z0-9]/g, '') // ลบอักขระพิเศษทั้งหมด (ป้องกัน traversal)
    .trim();

  const found = VALID_PAGES.find(p => p.toLowerCase() === clean.toLowerCase());
  return found || 'Registration';
}

/**
 * สร้างหน้า Error HTML สำหรับแสดงเมื่อ doGet มีปัญหา
 * [FIX-05] แยกออกมาเป็น helper ไม่ให้โค้ดซ้ำ
 *
 * @param  {string} page - ชื่อหน้าที่ไม่พบ
 * @returns {HtmlOutput}
 */
function _buildErrorPage(page) {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Daily Pet Shop — ขออภัย</title>
      <style>
        body {
          font-family: 'Helvetica Neue', sans-serif;
          background: #FFF4EF;
          display: flex; justify-content: center; align-items: center;
          min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box;
        }
        .box {
          text-align: center; background: white; border-radius: 20px;
          padding: 40px 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          max-width: 360px; width: 100%;
        }
        h2 { color: #C84528; font-size: 1.3rem; margin-bottom: 12px; }
        p  { color: #4A3F35; font-size: 0.9rem; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="box">
        <div style="font-size:48px">🐾</div>
        <h2>ขออภัย ระบบหลงทาง</h2>
        <p>ไม่พบหน้า <b>"${_sanitizeHtml(page)}"</b> ที่คุณต้องการ<br>กรุณาลองใหม่อีกครั้ง</p>
      </div>
    </body>
    </html>
  `);
}


// =============================================================================
// 🔑 5. Helpers สำหรับ Signature Verification
// =============================================================================

/**
 * ตรวจสอบ X-Line-Signature จาก LINE Messaging API
 * ใช้ HMAC-SHA256 กับ Channel Secret
 *
 * ⚠️ [FIX-09] Known GAS Limitation:
 *    GAS webapp ไม่ expose HTTP headers → ฟังก์ชันนี้จะไม่ถูกเรียกบน GAS ในทางปฏิบัติ
 *    เก็บไว้สำหรับ: unit testing, future migration ไปยัง Cloud Functions
 *
 * @param  {string} rawBody   - raw request body (string)
 * @param  {string} signature - ค่า X-Line-Signature จาก header
 * @returns {boolean}          true = ผ่าน, false = ไม่ผ่าน
 */
function _verifyLineSignature(rawBody, signature) {
  try {
    const channelSecret = PropertiesService
      .getScriptProperties()
      .getProperty('LINE_CHANNEL_SECRET');

    if (!channelSecret) {
      console.warn('⚠️ [_verifyLineSignature] LINE_CHANNEL_SECRET not set — skipping verification');
      return true;
    }

    const hash = Utilities.computeHmacSha256Signature(
      Utilities.newBlob(rawBody).getBytes(),
      Utilities.newBlob(channelSecret).getBytes()
    );
    const computed = Utilities.base64Encode(hash);

    return computed === signature;

  } catch (e) {
    console.error('❌ [_verifyLineSignature] Error:', e.message);
    return false;
  }
}


// =============================================================================
// 🔑 6. Helpers สำหรับ Dialogflow Fulfillment
// =============================================================================

/**
 * จัดการ Intent "เช็คคะแนน / ข้อมูลสมาชิก"
 * แยกออกมาจาก handleDialogflowFulfillment เพื่อให้อ่านง่ายขึ้น
 *
 * Flow:
 *   1. ดึงเบอร์โทรจาก Dialogflow parameters (phone-number หรือ phone)
 *   2. ถ้าไม่มีเบอร์ → ขอเบอร์โทรจากลูกค้า
 *   3. ค้นหาสมาชิกจากเบอร์โทร
 *   4. สร้าง Flex Message จาก template หรือ FlexService
 *
 * หมายเหตุ: userId ใช้สำหรับ createDynamicMemberCard เท่านั้น
 *           ถ้าว่าง (เช่น test จาก Console) ฟังก์ชันยังทำงานได้ผ่าน phone lookup
 *
 * @param  {object} parameters  - Dialogflow parameters
 * @param  {string} userId      - LINE User ID (อาจเป็น '' ถ้ามาจาก Console test)
 * @param  {object} queryResult - Dialogflow queryResult
 * @returns {TextOutput}         JSON response สำหรับ Dialogflow
 */
function _handleCheckPointsIntent(parameters, userId, queryResult) {
  // ดึงเบอร์โทรจาก Dialogflow parameter
  // รองรับทั้ง 'phone-number' และ 'phone' ตาม entity ที่ตั้งใน Console
  const phone = parameters['phone-number'] || parameters['phone'] || '';

  // กรณียังไม่มีเบอร์โทร → ขอเบอร์โทรจากลูกค้า
  if (!phone) {
    console.log('ℹ️ [_handleCheckPointsIntent] No phone provided — asking user');
    return _createDialogflowTextResponse(
      'กรุณาพิมพ์เบอร์โทรศัพท์ 10 หลักเพื่อเช็คข้อมูลสมาชิกนะคะ 🐾'
    );
  }

  // ค้นหาข้อมูลสมาชิกจากเบอร์โทร
  let summary = null;
  try {
    summary = getMemberSummaryByPhone(phone);
  } catch (e) {
    console.error('❌ [_handleCheckPointsIntent] getMemberSummaryByPhone Error:', e.message);
    return _createDialogflowTextResponse(
      'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ'
    );
  }

  // กรณีไม่พบสมาชิก
  if (!summary) {
    console.log(`ℹ️ [_handleCheckPointsIntent] Member not found for phone: ${phone}`);
    return _createDialogflowTextResponse(
      `ขออภัยค่ะ ไม่พบข้อมูลสมาชิกที่ลงทะเบียนด้วยเบอร์ ${phone}\n`
      + 'กรุณาตรวจสอบเบอร์โทร หรือสมัครสมาชิกก่อนนะคะ 🐾'
    );
  }

  // สร้าง Flex Message และ inject ข้อมูลจริง
  let flexData = null;
  try {
    // ดึง Flex template จาก Dialogflow payload (ถ้ามี) แล้ว replace placeholder
    const payloadMessages = (queryResult.fulfillmentMessages || [])
      .filter(m => m.payload && m.payload.line);

    if (payloadMessages.length > 0) {
      // มี Custom Payload จาก Dialogflow → inject ข้อมูลจริงลงไป
      // userId อาจเป็น '' ถ้ามาจาก Console test → createDynamicMemberCard จะใช้ phone แทน
      flexData = createDynamicMemberCard(userId, payloadMessages[0].payload.line, phone);
    } else {
      // ไม่มี Payload → สร้าง Flex จาก template ใน FlexService.js
      flexData = getFlexMemberSummary(summary);
    }
  } catch (e) {
    console.error('❌ [_handleCheckPointsIntent] Flex build error:', e.message);
    // Fallback เป็น text หากสร้าง Flex ไม่ได้
    return _createDialogflowTextResponse(
      `🐾 ข้อมูลสมาชิก\n`
      + `ชื่อ: ${summary.name}\n`
      + `ระดับ: ${summary.tier}\n`
      + `คะแนน: ${Number(summary.points).toLocaleString()} แต้ม`
    );
  }

  return _createDialogflowFlexResponse(flexData);
}

/**
 * สร้าง Dialogflow Response แบบ Text
 *
 * @param  {string} text - ข้อความที่ต้องการส่งกลับ
 * @returns {TextOutput}
 */
function _createDialogflowTextResponse(text) {
  return _createJsonResponse({
    fulfillmentMessages: [
      { text: { text: [text] } }
    ]
  });
}

/**
 * สร้าง Dialogflow Response แบบ LINE Flex Message
 *
 * @param  {object} flexContents - โครงสร้าง Flex Message (bubble/carousel)
 * @returns {TextOutput}
 */
function _createDialogflowFlexResponse(flexContents) {
  return _createJsonResponse({
    fulfillmentMessages: [
      {
        payload: {
          line: {
            type: 'flex',
            altText: 'ข้อมูลสมาชิก Daily Pet Club',
            contents: flexContents
          }
        }
      }
    ]
  });
}


// =============================================================================
// 🔑 7. Helpers ทั่วไป
// =============================================================================

/**
 * สร้าง JSON Response สำหรับส่งกลับจาก doPost / doGet
 *
 * @param  {object} data - object ที่จะ serialize เป็น JSON
 * @returns {TextOutput}
 */
function _createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * [FIX-03] ดึง LIFF ID จาก Script Properties
 *          → ไม่ hardcode ค่าใน source code อีกต่อไป
 *
 * ฟังก์ชันนี้ถูกเรียกจากหน้า HTML ผ่าน google.script.run.getLiffIdConfig()
 *
 * @returns {string} LIFF ID หรือ empty string ถ้ายังไม่ได้ตั้งค่า
 */
function getLiffIdConfig() {
  try {
    const liffId = PropertiesService
      .getScriptProperties()
      .getProperty('LIFF_ID');

    if (!liffId) {
      console.error('❌ [getLiffIdConfig] LIFF_ID not set in Script Properties');
      return '';
    }
    return liffId;
  } catch (e) {
    console.error('❌ [getLiffIdConfig] Error:', e.message);
    return '';
  }
}

/**
 * Sanitize HTML characters เพื่อป้องกัน XSS ในหน้า Error
 *
 * @param  {string} str - string ที่ต้องการ sanitize
 * @returns {string}
 */
function _sanitizeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}


// =============================================================================
// 🧪 8. Utility Functions สำหรับ Debug / Admin (ไม่ถูกเรียกจาก Production flow)
// =============================================================================

/**
 * ทดสอบ Webhook ด้วยมือ (รันจาก GAS Editor)
 * ใช้ตรวจสอบว่า doPost ทำงานถูกต้องก่อน deploy
 */
function _devTestWebhook() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        events: [{
          type: 'message',
          replyToken: 'test_reply_token_12345',
          source: { userId: 'Utest_user_id', type: 'user' },
          message: { type: 'text', text: 'สวัสดี' }
        }]
      })
    },
    parameter: {}
  };

  const result = doPost(mockEvent);
  console.log('🧪 [_devTestWebhook] Result:', result.getContent());
}

/**
 * ตรวจสอบว่า Script Properties ที่จำเป็นทั้งหมดถูกตั้งค่าไว้หรือไม่
 * รันจาก GAS Editor เพื่อตรวจสอบก่อน Go-Live
 */
function _devCheckProperties() {
  const REQUIRED_PROPERTIES = [
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_CHANNEL_SECRET',
    'DB_SPREADSHEET_ID',
    'LIFF_ID',
    'DF_PROJECT_ID',
    'DF_SERVICE_ACCOUNT_EMAIL',
    'DF_PRIVATE_KEY',
    'ADMIN_WHITELIST'
  ];

  const props = PropertiesService.getScriptProperties();
  let allOk = true;

  REQUIRED_PROPERTIES.forEach(key => {
    const val = props.getProperty(key);
    if (!val) {
      console.error(`❌ Missing: ${key}`);
      allOk = false;
    } else {
      console.log(`✅ OK: ${key} = ${key.includes('KEY') || key.includes('TOKEN') ? '[REDACTED]' : val}`);
    }
  });

  console.log(allOk
    ? '🎉 All properties set — ready for Production!'
    : '⚠️ Some properties are missing — fix before deploying!'
  );
}