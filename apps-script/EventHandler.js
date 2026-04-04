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
 * 💬 ฟังก์ชันจัดการข้อความ (ฉบับแก้ไขตำแหน่ง markAsReadToken)
 */
function handleMessageEvent(event) {
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  
  // ✅ แก้ไข: ดึง markAsReadToken จากภายในอ็อบเจกต์ message
  const markAsReadToken = event.message.markAsReadToken; 

  try {
    // 🌟 1. ขึ้นสถานะ "อ่านแล้ว" และ "Loading" พร้อมกันทันที
    if (markAsReadToken) {
      markAsRead(markAsReadToken);
    }
    sendLoadingAnimation(userId);

    // 🌟 2. ส่งไป Dialogflow เพื่อวิเคราะห์ Intent
    const dfResponse = detectIntent(userId, userMessage);
    const profile = getUserProfile(userId) || { displayName: 'ลูกค้า' };
    
    const queryResult = dfResponse.queryResult;
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    const fulfillmentText = queryResult.fulfillmentText;

    // ตรวจสอบว่ามี Custom Payload (เช่น Flex Message) หรือไม่
    const hasPayload = queryResult.fulfillmentMessages && 
                       queryResult.fulfillmentMessages.some(m => m.payload);

    // บันทึกการปฏิสัมพันธ์เบื้องหลัง
    updateFollowerInteraction(userId, profile);

    // 🌟 3. เงียบเมื่อไม่รู้คำตอบ (Silence on Fallback)
    // ปรับเงื่อนไข: จะเงียบก็ต่อเมื่อ (เป็น Fallback) และ (ไม่มีทั้งข้อความและไม่มี Payload)
    if (intentName === 'Default Fallback Intent' && !fulfillmentText && !hasPayload) {
      console.log(`ℹ️ Bot stayed silent for message: "${userMessage}"`);
      return; 
    }

    // 🌟 4. ลดเวลาหน่วงให้สั้นลง (เหลือ 1 วินาที)
    Utilities.sleep(1000);

    // 🌟 5. ส่งคำตอบกลับ
    // กรณีที่ 1: ตรวจสอบแต้มสมาชิก (Logic ภายใน Apps Script)
    if (intentName === 'Check_Points') {
      const memberData = getCustomerProfile(userId);
      if (memberData && memberData.points !== undefined) {
        const pointMsg = `คุณ ${profile.displayName} มีคะแนนสะสม ${memberData.points.toLocaleString()} แต้มค่ะ 🐾`;
        replyMessage(replyToken, pointMsg);
        saveLog({ userId, displayName: profile.displayName, userMessage, botReply: pointMsg, intent: intentName });
      } else {
        const noMemberMsg = "ไม่พบข้อมูลสมาชิกของคุณค่ะ สนใจสมัครสมาชิกไหมคะ?";
        replyMessage(replyToken, noMemberMsg);
        saveLog({ userId, displayName: profile.displayName, userMessage, botReply: noMemberMsg, intent: intentName });
      }
      return;
    }

    // กรณีที่ 2: มี Custom Payload จาก Dialogflow (เช่น Flex Message สมัครสมาชิก)
    if (hasPayload) {
      const lineMessages = queryResult.fulfillmentMessages
        .filter(m => m.payload && m.payload.line)
        .map(m => m.payload.line);
      
      if (lineMessages.length > 0) {
        replyMessage(replyToken, lineMessages);
        saveLog({ userId, displayName: profile.displayName, userMessage, botReply: "Flex Message Sent", intent: intentName });
        return;
      }
    }

    // กรณีที่ 3: ส่งข้อความ Text ธรรมดาจาก Dialogflow
    if (fulfillmentText) {
      replyMessage(replyToken, fulfillmentText);
      saveLog({ userId, displayName: profile.displayName, userMessage, botReply: fulfillmentText, intent: intentName });
    }

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

  upsertFollower({
    userId: userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage || '',
    firstFollowDate: timestamp,
    lastFollowDate: timestamp,
    followCount: 1,
    status: 'active',
    sourceChannel: 'LINE'
  });
  console.log("👤 New Follower saved: " + profile.displayName);
}

/**
 * 🚫 จัดการเมื่อผู้ใช้บล็อกบอท (Unfollow)
 */
function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  updateFollowerStatus(userId, "blocked");
}