/**
 * 🧠 EVENTHANDLER.gs
 * จัดการเหตุการณ์จาก LINE โดยเชื่อมต่อ Dialogflow 100% (No Hard Code)
 */

function handleEvent(event) {
  const userId = event.source.userId;
  if (!userId) return;
  
  // 1. แสดง Loading Animation เพื่อ UX ที่ดี
  sendLoadingAnimation(userId);

  // 2. แยกแยะประเภท Event
  try {
    switch (event.type) {
      case 'follow':
        handleFollowEvent(event);
        break;
      case 'message':
        handleMessageEvent(event);
        break;
      case 'unfollow':
        console.log("👤 User " + userId + " unfollowed.");
        break;
      default:
        console.log("ℹ️ Unhandled event type: " + event.type);
    }
  } catch (err) {
    console.error("❌ Error handling " + event.type + ": " + err.message);
  }
}

/**
 * จัดการ "ข้อความ" โดยดึงคำตอบจาก Dialogflow เท่านั้น
 */
function handleMessageEvent(event) {
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const profile = getUserProfile(userId);

  try {
    // 1. ส่งข้อความไปให้ Dialogflow วิเคราะห์ (เรียกใช้จาก DialogflowService.js)
    const dfResponse = detectIntent(userId, userMessage);
    
    // 2. ดึงค่าจาก Dialogflow Response
    const queryResult = dfResponse.queryResult;
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    const fulfillmentText = queryResult.fulfillmentText || "ขออภัยค่ะ น้องบอทไม่เข้าใจคำถามนี้";
    
    /**
     * 💡 Logic พิเศษ: ตรวจสอบคะแนนสะสมจาก Google Sheets
     * เงื่อนไข: ชื่อ Intent ใน Dialogflow ต้องตั้งชื่อว่า 'Check_Points'
     */
    if (intentName === 'Check_Points') {
      // เรียกใช้ฟังก์ชันให้ตรงกับ Membership.js [cite: 17]
      const memberData = getCustomerProfile(userId);
      
      if (memberData) {
        const pointMsg = "คุณ " + profile.displayName + " มีคะแนนสะสม " + memberData.points.toLocaleString() + " แต้มค่ะ 🐾";
        replyMessage(replyToken, pointMsg);
      } else {
        replyMessage(replyToken, "ไม่พบข้อมูลสมาชิกของคุณในระบบค่ะ กรุณาสมัครสมาชิกก่อนนะคะ");
      }
    } else {
      // 3. ตอบกลับด้วยข้อความที่ตั้งไว้ใน Dialogflow Console โดยตรง (No Hard Code)
      replyMessage(replyToken, fulfillmentText);
    }

    // 4. บันทึก Log ลง Google Sheets [cite: 22]
    saveLog({
      userId: userId,
      displayName: profile.displayName,
      userMessage: userMessage,
      botReply: fulfillmentText,
      intent: intentName
    });

  } catch (error) {
    console.error("❌ Error in handleMessageEvent:", error);
    replyMessage(replyToken, "ขออภัยค่ะ ระบบประมวลผลขัดข้อง กรุณาลองใหม่อีกครั้ง");
  }
}

/**
 * จัดการเมื่อมีการเพิ่มเพื่อน
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const profile = getUserProfile(userId);
  const timestamp = new Date(event.timestamp);

  // บันทึกข้อมูลผู้ติดตาม [cite: 15]
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

  const welcomeMsg = "สวัสดีคุณ " + profile.displayName + " ยินดีต้อนรับสู่ Daily Pet Shop ค่ะ! 🐶";
  replyMessage(event.replyToken, welcomeMsg);
}