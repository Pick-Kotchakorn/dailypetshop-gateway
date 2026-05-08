/**
 * 🧠 EVENTHANDLER.gs - Daily Pet Shop (Production Engine - Version 2.1)
 * จัดการ LINE Events: ตัดการ Hard Code ข้อความ และรองรับ Dynamic Workflow จาก Dialogflow
 */

function handleEvent(event) {
  const userId = event.source.userId;
  if (!userId) return;

  try {
    switch (event.type) {
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
        console.log("ℹ️ Unhandled event type: " + event.type);
    }
  } catch (err) {
    console.error(`❌ Error handling ${event.type}: ${err.message}`);
    saveLog({ 
      userId: userId, 
      displayName: "System Error",
      intent: "ERROR", 
      userMessage: `Event: ${event.type}`,
      botReply: err.message 
    });
  }
}

/**
 * 👤 1. จัดการการเพิ่มเพื่อน (Follow Event)
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  sendLoadingAnimation(userId);
  
  const profile = getUserProfile(userId) || { displayName: "ลูกค้าใหม่" };
  const isMember = (typeof isExistingMember === 'function') ? isExistingMember(userId) : false;

  saveFollowerData({
    userId: userId,
    displayName: profile.displayName || "ลูกค้า",
    pictureUrl: profile.pictureUrl || "",
    language: profile.language || 'th',
    statusMessage: profile.statusMessage || '',
    source: event.source.type || 'user'
  });

  const targetAlias = isMember ? CONFIG.ALIAS.MEMBER.HOME : CONFIG.ALIAS.VISITOR.HOME;
  linkRichMenuToUser(userId, targetAlias);

  saveLog({
    userId: userId,
    displayName: profile.displayName || "ลูกค้า",
    userMessage: "[Follow Event]",
    intent: "FOLLOW",
    botReply: isMember ? "Welcome Back Member" : "New Visitor Joined"
  });
}

function handleMessageEvent(event) {
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const replyToken = event.replyToken; // เก็บ Token สำหรับใช้ตอบกลับฟรีและรวดเร็ว
  const userMessage = event.message.text.trim(); // ใช้ trim() เพื่อความแม่นยำในการเช็กคำสั่ง

  // ✨ [ปรับปรุง] ดักจับคำสั่ง และส่งต่อ replyToken ไปยังระบบโภชนาการ
  if (userMessage === CONFIG.NUTRITION.TRIGGER_TEXT) {
    startNutritionConsultation(userId, replyToken); // ส่งต่อทั้ง userId และ replyToken
    return; // จบการทำงานทันทีเพื่อไม่ให้ไปรันส่วน Dialogflow ต่อ
  }

  try {
    markAsRead(userId);         
    sendLoadingAnimation(userId);

    const profile = getUserProfile(userId) || { displayName: 'ลูกค้า' };
    const dfResponse = detectIntent(userId, userMessage);
    const queryResult = dfResponse.queryResult;
    
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    let fulfillmentText = queryResult.fulfillmentText;
    
    // ตรวจสอบข้อมูล Payload จาก Dialogflow
    const hasPayload = queryResult.fulfillmentMessages && queryResult.fulfillmentMessages.some(m => m.payload);

    updateFollowerInteraction(userId);

    let finalBotReply = "";

    // 🛠️ CASE 1: หากมีการส่ง Custom Payload
    if (hasPayload) {
      let lineMessages = queryResult.fulfillmentMessages
        .filter(m => m.payload && m.payload.line)
        .map(m => m.payload.line);
      
      if (lineMessages.length > 0 && typeof createDynamicMemberCard === 'function') {
        lineMessages = createDynamicMemberCard(userId, lineMessages);
      }

      sendMessage(userId, lineMessages);
      finalBotReply = "Flex/Payload from Dialogflow (Replaced ###)";
    } 
    // 🛠️ CASE 2: หากเป็นการตอบกลับแบบ Text ธรรมดา
    else if (fulfillmentText) {
      if (typeof createDynamicMemberCard === 'function') {
        fulfillmentText = createDynamicMemberCard(userId, fulfillmentText);
      }

      let responseObj = { "type": "text", "text": fulfillmentText };
      
      if (intentName === 'Default Fallback Intent' || intentName === 'main-menu') {
        responseObj.quickReply = {
          "items": [
            { "type": "action", "action": { "type": "message", "label": "ติดต่อแอดมิน", "text": "ติดต่อแอดมิน" } },
            { "type": "action", "action": { "type": "message", "label": "โปรโมชั่นสมาชิก", "text": "โปรโมชั่นสมาชิก" } },
            { "type": "action", "action": { "type": "message", "label": "เมนูหลัก", "text": "เมนูหลัก" } }
          ]
        };
      }
      
      sendMessage(userId, responseObj);
      finalBotReply = fulfillmentText;
    }

    saveLog({
      userId: userId,
      displayName: profile.displayName || "ลูกค้า",
      userMessage: userMessage,
      intent: intentName,
      botReply: finalBotReply || "(No Response)"
    });

  } catch (error) {
    console.error("❌ Error in handleMessageEvent:", error);
    saveLog({ userId: userId, displayName: "System Error", intent: "ERROR", botReply: error.toString() });
  }
}

/**
 * 🔘 3. จัดการการกดปุ่ม (Postback Event)
 */
function handlePostbackEvent(event) {
  const userId = event.source.userId;
  const replyToken = event.replyToken; // เก็บ Token จากปุ่มกด
  const data = event.postback.data; 

  if (data && data.includes("action=nutrition")) {
    const params = {};
    data.split("&").forEach(p => {
      const v = p.split("=");
      params[v[0]] = v[1];
    });

    if (params.step && params.value) {
      // ส่ง replyToken ต่อไปที่ handleNutritionStep
      handleNutritionStep(userId, parseInt(params.step), params.value, replyToken);
    }
  }
}

/**
 * 🚫 4. จัดการการบล็อก (Unfollow Event)
 */
function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  updateFollowerStatus(userId, "blocked");
}

/**
 * 🧠 จัดการ Webhook Fulfillment จาก Dialogflow (เวอร์ชันอัปเดต รองรับการค้นหาด้วยเบอร์โทร)
 * @doc ทำหน้าที่รับข้อมูลจาก Dialogflow, ดึง userId, และส่งเบอร์โทรศัพท์ไปประมวลผล Flex Message
 */
function handleDialogflowFulfillment(body) {
  const queryResult = body.queryResult;
  const intentName = queryResult.intent.displayName;
  
  // 1. ดึง userId จากโครงสร้างของ LINE ที่ส่งผ่าน Dialogflow
  let userId = "";
  try {
    userId = body.originalDetectIntentRequest.payload.data.source.userId;
  } catch (e) {
    console.error("❌ ไม่สามารถดึง userId ได้: " + e.message);
  }

  // 2. ตรวจสอบ Intent และความพร้อมของข้อมูล
  if (intentName === 'member-check-points' && userId) {
    
    // 📱 ดึงเบอร์โทรศัพท์จาก Parameters ที่ลูกค้าพิมพ์เข้ามา
    const parameters = queryResult.parameters;
    const phone = parameters['phone-number'] || parameters['phone'];

    // ดึง Fulfillment Messages ทั้งหมดมาจาก Dialogflow
    let messages = queryResult.fulfillmentMessages;

    // 🔄 วนลูปเพื่อหา Custom Payload และแทนที่ตัวแปร ###
    messages = messages.map(msg => {
      if (msg.payload && msg.payload.line) {
        // ✅ ส่งทั้ง userId, โครงสร้าง Flex และเบอร์โทรศัพท์ ไปประมวลผล
        msg.payload.line = createDynamicMemberCard(userId, msg.payload.line, phone);
      }
      return msg;
    });

    // 3. สร้าง Response กลับไปหา Dialogflow
    const response = {
      "fulfillmentMessages": messages
    };

    return createJsonResponse(response);
  }

  // หากเป็น Intent อื่นที่ไม่ได้ระบุไว้ ให้ Dialogflow ตอบตามปกติ
  return createJsonResponse({});
}