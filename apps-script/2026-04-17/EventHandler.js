/**
 * 🧠 EVENTHANDLER.gs
 * จัดการเหตุการณ์จาก LINE และควบคุมลำดับการตอบโต้ (UX)
 * เชื่อมต่อ Dialogflow และ Google Sheets โดยดึงค่าจาก Config.js
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
      case 'unfollow':
        handleUnfollowEvent(event); 
        break;
      default:
        console.log("ℹ️ Unhandled event type: " + event.type);
    }
  } catch (err) {
    console.error("❌ Error handling " + event.type + ": " + err.message);
  }
}

/**
 * 🧠 EVENTHANDLER.gs
 */
/**
 * 💬 ฟังก์ชันจัดการข้อความ
 */
function handleMessageEvent(event) {
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  try {
    // 🌟 เรียกใช้งานฟังก์ชันใหม่ตามลำดับ UX
    markAsRead(userId);           // 1. ขึ้นว่า "อ่านแล้ว" ทันที
    sendLoadingAnimation(userId); // 2. ขึ้น "กำลังพิมพ์..." (Loading)

    // --- ส่วนประมวลผล Dialogflow และ Logic อื่นๆ คงเดิม ---
    const dfResponse = detectIntent(userId, userMessage);
    const profile = getUserProfile(userId) || { displayName: 'ลูกค้า' };
    
    const queryResult = dfResponse.queryResult;
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    const fulfillmentText = queryResult.fulfillmentText;
    const hasPayload = queryResult.fulfillmentMessages && queryResult.fulfillmentMessages.some(m => m.payload);

    updateFollowerInteraction(userId);

    if (intentName === 'Default Fallback Intent' && !fulfillmentText && !hasPayload) return;

    Utilities.sleep(1000); // หน่วงเวลาเพื่อให้ดูเป็นธรรมชาติ

    // การตอบกลับ (Response Logic) คงเดิมทุกประการ
    if (intentName === 'Check_Points') {
      const memberData = getCustomerProfile(userId);
      const pointMsg = memberData ? `คุณ ${profile.displayName} มีคะแนนสะสม ${memberData.points.toLocaleString()} แต้มค่ะ 🐾` : "ไม่พบข้อมูลสมาชิกค่ะ";
      sendMessage(userId, pointMsg);
    } else if (hasPayload) {
      const lineMessages = queryResult.fulfillmentMessages.filter(m => m.payload && m.payload.line).map(m => m.payload.line);
      if (lineMessages.length > 0) sendMessage(userId, lineMessages);
    } else if (fulfillmentText) {
      sendMessage(userId, fulfillmentText);
    }

    // บันทึกประวัติสนทนา
    saveLog({
      userId: userId,
      displayName: profile.displayName,
      userMessage: userMessage,
      intent: intentName,
      botReply: fulfillmentText || (hasPayload ? "Flex Message" : "")
    });

  } catch (error) {
    console.error("❌ Error in handleMessageEvent:", error);
  }
}

/**
 * 👤 จัดการเมื่อมีการเพิ่มเพื่อน (Follow) - ปรับปรุงเพื่อรองรับการตั้งค่า Welcome Message ใน LINE Manager
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const profile = getUserProfile(userId); // ดึงข้อมูลโปรไฟล์จาก LineAPI.js
  const timestamp = new Date(event.timestamp);

  // 1. บันทึกข้อมูลลงชีท Followers ตามโครงสร้าง 13 คอลัมน์
  saveFollowerData({
    userId: userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    language: profile.language || 'th',
    statusMessage: profile.statusMessage || '',
    timestamp: timestamp,
    source: event.source.type || 'user'
  });

  // 2. บันทึกประวัติการเพิ่มเพื่อนลงในชีท Conversations โดยให้ botReply เงียบ
  saveLog({
    userId: userId,
    displayName: profile.displayName,
    userMessage: "[Follow Event]", 
    intent: "FOLLOW",
    // เลือกใช้อย่างใดอย่างหนึ่งด้านล่างนี้ครับ:
    botReply: "[Sent by LINE Manager]" // แนะนำแบบนี้เพื่อให้รู้ว่ามีข้อความส่งออกไปแต่ส่งจากระบบ LINE
    // botReply: "" // หรือปล่อยว่างหากต้องการความเงียบสนิทในไฟล์ Log
  });
}

/**
 * 🚫 จัดการเมื่อผู้ใช้บล็อกบอท (Unfollow)
 */
function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  updateFollowerStatus(userId, "blocked");
}