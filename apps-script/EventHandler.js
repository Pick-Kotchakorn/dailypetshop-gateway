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
 * 💬 ฟังก์ชันจัดการข้อความ
 */
/**
 * 🧠 EVENTHANDLER.gs
 */
function handleMessageEvent(event) {
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  try {
    // แก้ไขจุดที่ 2: เรียกใช้ markAsRead โดยส่ง userId (หรือ Token ที่เกี่ยวข้อง)
    markAsRead(userId); 
    showLoading(userId);

    const dfResponse = detectIntent(userId, userMessage);
    const profile = getUserProfile(userId) || { displayName: 'ลูกค้า' };
    
    const queryResult = dfResponse.queryResult;
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    const fulfillmentText = queryResult.fulfillmentText;
    const hasPayload = queryResult.fulfillmentMessages && queryResult.fulfillmentMessages.some(m => m.payload);

    updateFollowerInteraction(userId);

    if (intentName === 'Default Fallback Intent' && !fulfillmentText && !hasPayload) return;

    Utilities.sleep(1000);

    // ส่วน Logic การตอบกลับคงเดิมเพื่อรักษา Behavior
    if (intentName === 'Check_Points') {
      const memberData = getCustomerProfile(userId);
      const pointMsg = memberData ? `คุณ ${profile.displayName} มีคะแนนสะสม ${memberData.points.toLocaleString()} แต้มค่ะ 🐾` : "ไม่พบข้อมูลสมาชิกค่ะ";
      sendMessage(userId, pointMsg);
      return;
    }

    if (hasPayload) {
      const lineMessages = queryResult.fulfillmentMessages.filter(m => m.payload && m.payload.line).map(m => m.payload.line);
      if (lineMessages.length > 0) sendMessage(userId, lineMessages);
      return;
    }

    if (fulfillmentText) sendMessage(userId, fulfillmentText);

  } catch (error) {
    console.error("❌ Error in handleMessageEvent:", error);
  }
}

/**
 * 👤 จัดการเมื่อมีการเพิ่มเพื่อน (Follow)
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const profile = getUserProfile(userId); 
  const timestamp = new Date(event.timestamp);

  saveFollowerData({
    userId: userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    language: profile.language || 'th',
    statusMessage: profile.statusMessage || '',
    timestamp: timestamp,
    source: event.source.type || 'user'
  });
}

/**
 * 🚫 จัดการเมื่อผู้ใช้บล็อกบอท (Unfollow)
 */
function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  updateFollowerStatus(userId, "blocked");
}