/**
 * 🧠 EVENTHANDLER.js - Daily Pet Shop (Production Ready — v3.1)
 * ─────────────────────────────────────────────────────────────────────────────
 * การแก้ไขจาก v3.0:
 *   [FIX-09] handleUnfollowEvent(): เปลี่ยน updateFollowerStatus() → updateUnfollowStatus()
 *            เพราะ SheetService.js export ชื่อ updateUnfollowStatus() เท่านั้น
 *            updateFollowerStatus() ไม่มีในโค้ดจริง → silent ReferenceError ทุกครั้งที่ user block
 *   [FIX-10] handlePostbackEvent(): เพิ่ม userId เป็น arg ที่ 4 ของ handleNutritionStep()
 *            signature จริงคือ handleNutritionStep(userId, step, value, replyToken)
 *            เดิมส่งแค่ 3 args → replyToken = undefined → NutritionService ใช้ replyMessage(undefined,...) → 400
 *            หลังจาก NutritionService.js ถูกแก้เป็น push-based แล้ว arg ที่ 4 จะเป็น userId
 *            (ดูรายละเอียด NutritionService.js v3.1)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * การแก้ไขจาก v3.0 (คงเดิมทุกจุด):
 *   [FIX-01] ลบ handleDialogflowFulfillment() ออก — ย้ายไปอยู่ที่ Main.js เพียงที่เดียว
 *   [FIX-02] แก้ isExistingMember() ที่ไม่มีในโค้ด → ใช้ getCustomerProfile() แทน
 *   [FIX-03] แก้ Reply Token Timing — ย้าย getUserProfile() และ detectIntent()
 *            ไปทำก่อน แล้วค่อย reply เพื่อลดความเสี่ยง token expired
 *            และเปลี่ยนมาใช้ push message สำหรับ async flow ที่ใช้เวลานาน
 *   [FIX-04] แก้ CONFIG → getConfig() ทุกจุด
 *   [FIX-05] เพิ่ม structured error handling ทุก handler
 *   [FIX-06] แก้ Nutrition trigger ให้ส่ง push message แทน reply
 *            เพราะ startNutritionConsultation ใช้เวลานานเกิน token lifetime
 *   [FIX-07] เพิ่ม guard สำหรับ postback data parsing ป้องกัน malformed input
 *   [FIX-08] แยก buildLineTextResponse() เป็น helper ลด code duplication
 *
 * Dependencies:
 *   - Config.js        (getConfig)
 *   - SheetService.js  (saveFollowerData, saveLog, updateFollowerInteraction,
 *                       updateUnfollowStatus)          ← [FIX-09] ชื่อที่ถูกต้อง
 *   - LineAPI.js       (sendMessage, sendLoadingAnimation, markAsRead,
 *                       getUserProfile, linkRichMenuToUser, replyMessage)
 *   - Membership.js    (getCustomerProfile)
 *   - DialogflowService.js (detectIntent)
 *   - FlexService.js   (createDynamicMemberCard)
 *   - NutritionService.js  (startNutritionConsultation, handleNutritionStep)
 * ─────────────────────────────────────────────────────────────────────────────
 */


// =============================================================================
// 🎯 1. handleEvent() — Main Event Router
// =============================================================================

/**
 * จุดเข้าหลักสำหรับ LINE events ทั้งหมด
 * ถูกเรียกจาก doPost() ใน Main.js
 *
 * @param {object} event - LINE Webhook Event object
 */
function handleEvent(event) {
  if (!event || !event.source || !event.source.userId) {
    console.warn('⚠️ [handleEvent] Event missing userId — skipping');
    return;
  }

  const userId    = event.source.userId;
  const eventType = event.type || 'unknown';

  try {
    switch (eventType) {
      case 'follow':
        handleFollowEvent(event);
        break;
      case 'message':
        handleMessageEvent(event);
        break;
      case 'postback':
        handlePostbackEvent(event);
        break;
      case 'unfollow':
        handleUnfollowEvent(event);
        break;
      default:
        console.log(`ℹ️ [handleEvent] Unhandled event type: "${eventType}" from userId: ${userId}`);
    }
  } catch (err) {
    console.error(`❌ [handleEvent] Uncaught error in "${eventType}" handler: ${err.message}\nStack: ${err.stack}`);

    // บันทึก error ลง log โดยไม่ throw ต่อ
    // ป้องกัน doPost() fail ซึ่งจะทำให้ LINE ทำ retry
    try {
      saveLog({
        userId:      userId,
        displayName: 'System Error',
        userMessage: `Event: ${eventType}`,
        intent:      'ERROR',
        botReply:    err.message
      });
    } catch (logErr) {
      console.error('❌ [handleEvent] saveLog also failed:', logErr.message);
    }
  }
}


// =============================================================================
// 👤 2. handleFollowEvent() — จัดการการเพิ่มเพื่อน
// =============================================================================

/**
 * จัดการ Follow Event
 *
 * [FIX-02] ใช้ getCustomerProfile() แทน isExistingMember() ที่ไม่มีในโค้ด
 *          → สมาชิกเก่าที่ block แล้ว re-follow จะได้ Member menu ถูกต้อง
 *
 * @param {object} event - LINE Follow Event
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;

  // ดึงโปรไฟล์ LINE
  let profile = { displayName: 'ลูกค้าใหม่', pictureUrl: '', language: 'th', statusMessage: '' };
  try {
    const fetched = getUserProfile(userId);
    if (fetched) profile = fetched;
  } catch (e) {
    console.warn(`⚠️ [handleFollowEvent] getUserProfile failed: ${e.message}`);
  }

  // [FIX-02] ตรวจสอบสมาชิกด้วย getCustomerProfile() ที่มีในโค้ดจริง
  let isMember = false;
  try {
    isMember = getCustomerProfile(userId) !== null;
  } catch (e) {
    console.warn(`⚠️ [handleFollowEvent] getCustomerProfile failed: ${e.message}`);
  }

  // บันทึกข้อมูล Follower
  try {
    saveFollowerData({
      userId:        userId,
      displayName:   profile.displayName  || 'ลูกค้า',
      pictureUrl:    profile.pictureUrl   || '',
      language:      profile.language     || 'th',
      statusMessage: profile.statusMessage || '',
      source:        event.source.type    || 'user'
    });
  } catch (e) {
    console.error(`❌ [handleFollowEvent] saveFollowerData failed: ${e.message}`);
  }

  // ผูก Rich Menu ตามสถานะสมาชิก
  const cfg         = getConfig();
  const targetAlias = isMember
    ? cfg.ALIAS.MEMBER.HOME
    : cfg.ALIAS.VISITOR.HOME;

  try {
    linkRichMenuToUser(userId, targetAlias);
  } catch (e) {
    console.error(`❌ [handleFollowEvent] linkRichMenuToUser failed: ${e.message}`);
  }

  // บันทึก Log
  try {
    saveLog({
      userId:      userId,
      displayName: profile.displayName || 'ลูกค้า',
      userMessage: '[Follow Event]',
      intent:      'FOLLOW',
      botReply:    isMember ? 'Welcome Back Member' : 'New Visitor Joined'
    });
  } catch (e) {
    console.error(`❌ [handleFollowEvent] saveLog failed: ${e.message}`);
  }
}


// =============================================================================
// 💬 3. handleMessageEvent() — จัดการข้อความ
// =============================================================================

/**
 * จัดการ Message Event (รองรับเฉพาะ text message)
 *
 * [FIX-03] ลำดับการทำงานใหม่:
 *   1. ดึง profile + เรียก Dialogflow ก่อน (operations ที่ใช้เวลา)
 *   2. ค่อย send response หลังจากมีข้อมูลครบ
 *   3. ใช้ push message แทน reply สำหรับ async flow
 *      → reply token มีอายุ 30 วินาที ถ้าทำ API calls หลายตัวก่อนจะ expired
 *
 * [FIX-06] Nutrition flow ใช้ push message แทน reply
 *
 * @param {object} event - LINE Message Event
 */
function handleMessageEvent(event) {
  // รองรับเฉพาะ text message
  if (!event.message || event.message.type !== 'text') {
    console.log('ℹ️ [handleMessageEvent] Non-text message — skipping');
    return;
  }

  const userId      = event.source.userId;
  const replyToken  = event.replyToken;
  const userMessage = event.message.text.trim();
  const cfg         = getConfig();

  // ── [FIX-06] ดักจับ Nutrition trigger ────────────────────────────────────
  // Nutrition flow ใช้เวลานาน → ใช้ push message แทน reply
  // ส่ง loading animation ทันทีเพื่อ UX แล้วค่อย push result
  if (userMessage === cfg.NUTRITION.TRIGGER_TEXT) {
    try {
      sendLoadingAnimation(userId);
      // ส่ง userId เท่านั้น ไม่ส่ง replyToken เพราะ nutrition flow ใช้เวลา > 30 วินาที
      startNutritionConsultation(userId);
    } catch (e) {
      console.error(`❌ [handleMessageEvent] Nutrition trigger failed: ${e.message}`);
      _safePushMessage(userId, 'ขออภัยค่ะ ระบบโภชนาการขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ 🐾');
    }
    return;
  }

  // ── Main Dialogflow Flow ──────────────────────────────────────────────────
  try {
    // Step 1: Mark as read (fire-and-forget ไม่ต้องรอ)
    try { markAsRead(userId); } catch (e) { /* non-critical */ }

    // Step 2: Loading animation (fire-and-forget)
    try { sendLoadingAnimation(userId); } catch (e) { /* non-critical */ }

    // Step 3: ดึง Profile (ทำก่อน Dialogflow เพื่อใช้ใน log)
    let profile = { displayName: 'ลูกค้า' };
    try {
      const fetched = getUserProfile(userId);
      if (fetched) profile = fetched;
    } catch (e) {
      console.warn(`⚠️ [handleMessageEvent] getUserProfile failed: ${e.message}`);
    }

    // Step 4: เรียก Dialogflow [FIX-03] ทำก่อน reply เพื่อให้มีข้อมูลก่อน token expire
    let dfResponse = null;
    try {
      dfResponse = detectIntent(userId, userMessage);
    } catch (e) {
      console.error(`❌ [handleMessageEvent] detectIntent failed: ${e.message}`);
    }

    // Step 5: อัปเดต interaction (non-critical)
    try { updateFollowerInteraction(userId); } catch (e) { /* non-critical */ }

    // Step 6: ประมวลผล Dialogflow response และส่งข้อความ
    let finalBotReply = '';
    let intentName    = 'Unknown';

    if (!dfResponse || !dfResponse.queryResult) {
      // Dialogflow ไม่ตอบ → ส่ง fallback
      finalBotReply = 'ขออภัยค่ะ ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ 🐾';
      _safePushMessage(userId, finalBotReply);

    } else {
      const queryResult = dfResponse.queryResult;
      intentName = (queryResult.intent && queryResult.intent.displayName)
        ? queryResult.intent.displayName
        : 'Default Fallback Intent';

      const fulfillmentText = queryResult.fulfillmentText || '';
      const hasPayload = (queryResult.fulfillmentMessages || [])
        .some(m => m.payload && m.payload.line);

      if (hasPayload) {
        // ── CASE 1: Custom Payload (Flex Message) ──────────────────────────
        finalBotReply = _handlePayloadResponse(userId, queryResult);

      } else if (fulfillmentText) {
        // ── CASE 2: Text Response ──────────────────────────────────────────
        finalBotReply = _handleTextResponse(userId, intentName, fulfillmentText);

      } else {
        // ── CASE 3: ไม่มีทั้ง payload และ text ───────────────────────────
        console.warn(`⚠️ [handleMessageEvent] No fulfillment content for intent: ${intentName}`);
        finalBotReply = 'ขออภัยค่ะ ไม่พบคำตอบสำหรับคำถามนี้ 🐾';
        _safePushMessage(userId, finalBotReply);
      }
    }

    // Step 7: บันทึก Log
    try {
      saveLog({
        userId:      userId,
        displayName: profile.displayName || 'ลูกค้า',
        userMessage: userMessage,
        intent:      intentName,
        botReply:    finalBotReply || '(No Response)'
      });
    } catch (e) {
      console.error(`❌ [handleMessageEvent] saveLog failed: ${e.message}`);
    }

  } catch (error) {
    console.error(`❌ [handleMessageEvent] Unexpected error: ${error.message}\nStack: ${error.stack}`);
    // Fallback push message เพื่อไม่ให้ลูกค้าเงียบหาย
    _safePushMessage(userId, 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ 🐾');
  }
}


// =============================================================================
// 🔘 4. handlePostbackEvent() — จัดการการกดปุ่ม
// =============================================================================

/**
 * จัดการ Postback Event
 *
 * [FIX-07] เพิ่ม guard สำหรับ postback data parsing
 *          ป้องกัน malformed data ทำให้ระบบ crash
 *
 * [FIX-10] แก้ argument mismatch ใน handleNutritionStep():
 *          เดิม: handleNutritionStep(userId, step, params.value)   ← ขาด arg ที่ 4
 *          ใหม่: handleNutritionStep(userId, step, params.value, userId)
 *          NutritionService.js v3.1 เปลี่ยนเป็น push-based แล้ว
 *          → arg ที่ 4 ที่รับคือ userId (ใช้แทน replyToken เดิม)
 *
 * @param {object} event - LINE Postback Event
 */
function handlePostbackEvent(event) {
  const userId     = event.source.userId;
  const replyToken = event.replyToken;
  const rawData    = (event.postback && event.postback.data) ? event.postback.data : '';

  if (!rawData) {
    console.warn(`⚠️ [handlePostbackEvent] Empty postback data from userId: ${userId}`);
    return;
  }

  // [FIX-07] Parse postback data อย่างปลอดภัย
  let params = {};
  try {
    rawData.split('&').forEach(pair => {
      const parts = pair.split('=');
      if (parts.length === 2) {
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      }
    });
  } catch (e) {
    console.error(`❌ [handlePostbackEvent] Failed to parse postback data: "${rawData}" — ${e.message}`);
    return;
  }

  // Route: Nutrition Quiz
  if (params.action === 'nutrition' && params.step && params.value) {
    const step = parseInt(params.step, 10);

    // Validate step range
    if (isNaN(step) || step < 1 || step > getConfig().NUTRITION.QUESTION_STEPS) {
      console.warn(`⚠️ [handlePostbackEvent] Invalid nutrition step: ${params.step}`);
      return;
    }

    try {
      // [FIX-10] ส่ง userId เป็น arg ที่ 4 แทน replyToken
      // NutritionService.js v3.1 ใช้ sendMessage(userId,...) แบบ push-based ทั้งหมดแล้ว
      // replyToken จาก postback event ไม่ถูกใช้ใน Nutrition flow เพราะ
      // handleNutritionStep อาจใช้เวลา > 30 วินาที (อ่าน/เขียน sheet)
      handleNutritionStep(userId, step, params.value, userId);
    } catch (e) {
      console.error(`❌ [handlePostbackEvent] handleNutritionStep failed: ${e.message}`);
      _safePushMessage(userId, 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ 🐾');
    }
    return;
  }

  // Route: อื่นๆ (เพิ่ม handler ได้ในอนาคต)
  console.log(`ℹ️ [handlePostbackEvent] Unhandled postback action: "${params.action}" from userId: ${userId}`);
}


// =============================================================================
// 🚫 5. handleUnfollowEvent() — จัดการการบล็อก
// =============================================================================

/**
 * จัดการ Unfollow Event
 *
 * [FIX-09] เปลี่ยน updateFollowerStatus(userId, 'blocked') → updateUnfollowStatus(userId)
 *          เพราะ SheetService.js นิยามเฉพาะ updateUnfollowStatus() เท่านั้น
 *          updateFollowerStatus() ไม่มีในโค้ดจริง → ReferenceError ทุกครั้งที่ user block bot
 *          updateUnfollowStatus() ทำหน้าที่เดียวกัน: set status = 'blocked' + update timestamp
 *
 * LINE ไม่ส่ง userId กับ Unfollow event ใน บาง case → guard ไว้
 *
 * @param {object} event - LINE Unfollow Event
 */
function handleUnfollowEvent(event) {
  const userId = event.source && event.source.userId;
  if (!userId) {
    console.warn('⚠️ [handleUnfollowEvent] No userId in unfollow event');
    return;
  }

  try {
    // [FIX-09] updateFollowerStatus → updateUnfollowStatus (ชื่อที่ถูกต้องใน SheetService.js)
    updateUnfollowStatus(userId);
    console.log(`ℹ️ [handleUnfollowEvent] userId ${userId} marked as blocked`);
  } catch (e) {
    console.error(`❌ [handleUnfollowEvent] updateUnfollowStatus failed: ${e.message}`);
  }
}


// =============================================================================
// 🔑 6. Private Helpers
// =============================================================================

/**
 * จัดการ response แบบ Custom Payload (Flex Message)
 * [FIX-08] แยกออกมาลด complexity ของ handleMessageEvent
 *
 * @param  {string} userId      - LINE User ID
 * @param  {object} queryResult - Dialogflow queryResult
 * @returns {string}             botReply string สำหรับ log
 */
function _handlePayloadResponse(userId, queryResult) {
  let lineMessages = (queryResult.fulfillmentMessages || [])
    .filter(m => m.payload && m.payload.line)
    .map(m => m.payload.line);

  if (lineMessages.length === 0) {
    console.warn('⚠️ [_handlePayloadResponse] Payload flag true but no line payload found');
    return '(Empty Payload)';
  }

  // inject ข้อมูลสมาชิกแทน placeholder ### (ถ้ามีฟังก์ชัน)
  try {
    if (typeof createDynamicMemberCard === 'function') {
      lineMessages = lineMessages.map(msg => createDynamicMemberCard(userId, msg));
    }
  } catch (e) {
    console.warn(`⚠️ [_handlePayloadResponse] createDynamicMemberCard failed: ${e.message}`);
  }

  _safePushMessage(userId, lineMessages);
  return 'Flex/Payload from Dialogflow';
}

/**
 * จัดการ response แบบ Text
 * [FIX-08] แยกออกมาลด complexity ของ handleMessageEvent
 *
 * @param  {string} userId          - LINE User ID
 * @param  {string} intentName      - Dialogflow intent display name
 * @param  {string} fulfillmentText - ข้อความจาก Dialogflow
 * @returns {string}                 finalBotReply สำหรับ log
 */
function _handleTextResponse(userId, intentName, fulfillmentText) {
  let text = fulfillmentText;

  // inject ข้อมูลสมาชิกแทน placeholder ### (ถ้ามีฟังก์ชัน)
  try {
    if (typeof createDynamicMemberCard === 'function') {
      text = createDynamicMemberCard(userId, text);
    }
  } catch (e) {
    console.warn(`⚠️ [_handleTextResponse] createDynamicMemberCard failed: ${e.message}`);
  }

  // สร้าง message object
  const responseObj = { type: 'text', text: String(text) };

  // เพิ่ม Quick Reply สำหรับ Fallback และ main-menu intent
  const QUICK_REPLY_INTENTS = ['Default Fallback Intent', 'main-menu'];
  if (QUICK_REPLY_INTENTS.includes(intentName)) {
    responseObj.quickReply = {
      items: [
        { type: 'action', action: { type: 'message', label: 'ติดต่อแอดมิน',      text: 'ติดต่อแอดมิน'      } },
        { type: 'action', action: { type: 'message', label: 'โปรโมชั่นสมาชิก',   text: 'โปรโมชั่นสมาชิก'   } },
        { type: 'action', action: { type: 'message', label: 'เมนูหลัก',           text: 'เมนูหลัก'           } }
      ]
    };
  }

  _safePushMessage(userId, responseObj);
  return String(text);
}

/**
 * Push message แบบปลอดภัย — ไม่ throw แม้จะ fail
 * [FIX-03] ใช้ push แทน reply เพื่อหลีกเลี่ยงปัญหา reply token expired
 *
 * @param {string}        userId  - LINE User ID
 * @param {string|object|Array} message - ข้อความหรือ message object
 */
function _safePushMessage(userId, message) {
  try {
    sendMessage(userId, message);
  } catch (e) {
    console.error(`❌ [_safePushMessage] sendMessage failed for userId ${userId}: ${e.message}`);
  }
}