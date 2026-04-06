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
function handleMessageEvent(event) {
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  try {
    // ✅ แก้ไข: เรียก markAsRead โดยใช้ userId เพื่อให้ขึ้นสถานะ "อ่านแล้ว" ใน LINE
    markAsRead(userId); 
    showLoading(userId);

    const dfResponse = detectIntent(userId, userMessage);
    const profile = getUserProfile(userId) || { displayName: 'ลูกค้า' };
    
    const queryResult = dfResponse.queryResult;
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    const fulfillmentText = queryResult.fulfillmentText;
    const hasPayload = queryResult.fulfillmentMessages && queryResult.fulfillmentMessages.some(m => m.payload);

    // อัปเดตสถิติการใช้งานในชีท Followers
    updateFollowerInteraction(userId);

    let botReplyText = "";

    // จัดการคำตอบแบบ Payload (Flex Message)
    if (hasPayload) {
      const lineMessages = queryResult.fulfillmentMessages
        .filter(m => m.payload && m.payload.line)
        .map(m => m.payload.line);
      
      if (lineMessages.length > 0) {
        sendMessage(userId, lineMessages);
        botReplyText = "(Flex Message)";
      }
    } 
    // จัดการคำตอบแบบข้อความปกติ
    else if (fulfillmentText) {
      sendMessage(userId, fulfillmentText);
      botReplyText = fulfillmentText;
    }

    // ✅ แก้ไข: บันทึกประวัติการสนทนาลงในชีท Conversations
    saveLog({
      userId: userId,
      displayName: profile.displayName,
      userMessage: userMessage,
      intent: intentName,
      botReply: botReplyText
    });

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