/**
 * 🧠 EVENTHANDLER.gs
 * จัดการเหตุการณ์จาก LINE โดยเชื่อมต่อ Dialogflow 100% (No Hard Code)
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
        // ย้ายการแสดงผลทั้งหมดไปไว้ใน handleMessageEvent เพื่อคุม Sequence
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
 * ใหม่: ฟังก์ชันจัดการเมื่อผู้ใช้ Block (Unfollow)
 */
function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  console.log("👤 User " + userId + " blocked the bot.");
  
  updateFollowerStatus(userId, "blocked");
}

/**
 * 🧠 EVENTHANDLER.gs - เวอร์ชั่นปรับปรุงลำดับ UX ตามวิดีโอ (พร้อมใช้งาน)
 */
function handleMessageEvent(event) {
  // ตรวจสอบว่าเป็นข้อความประเภท Text เท่านั้น
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const markAsReadToken = event.markAsReadToken; 

  try {
    // 🌟 STEP 1: ขึ้นสถานะ "อ่านแล้ว" (Read) ทันที 
    // เป็นการตอบสนองแรกที่ User จะเห็นในหน้าแชท
    if (markAsReadToken) {
      markAsRead(markAsReadToken);
    }

    // 🌟 STEP 2: แสดง Loading Animation (จุดสามจุด) ทันที
    // เพื่อให้ User ทราบว่าระบบกำลังประมวลผลอยู่
    sendLoadingAnimation(userId);

    // --- [ ช่วงเวลาประมวลผลเบื้องหลัง ] ---

    // 🌟 STEP 3: ส่งข้อความไปวิเคราะห์ที่ Dialogflow
    const dfResponse = detectIntent(userId, userMessage);
    const queryResult = dfResponse.queryResult;
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    const fulfillmentText = queryResult.fulfillmentText || "ขออภัยค่ะ ไม่เข้าใจคำถามนี้";
    
    // 🌟 STEP 4: ดึงข้อมูลโปรไฟล์และอัปเดต Interaction
    // ย้ายมาทำตรงนี้เพื่อไม่ให้ขวางความเร็วของ Step 1 และ 2
    const profile = getUserProfile(userId) || { displayName: 'Customer' }; 
    updateFollowerInteraction(userId, profile);

    // 🌟 STEP 5: หน่วงเวลาเพื่อให้ดูเป็นธรรมชาติ (Natural Delay)
    // เลียนแบบการพิมพ์ของมนุษย์ตามที่เห็นในวิดีโอตัวอย่าง
    Utilities.sleep(1200); 

    // 🌟 STEP 6: เตรียมคำตอบและส่งกลับ
    if (intentName === 'Check_Points') {
      const memberData = getCustomerProfile(userId);
      if (memberData) {
        const pointMsg = "คุณ " + profile.displayName + " มีคะแนนสะสม " + memberData.points.toLocaleString() + " แต้มค่ะ 🐾";
        replyMessage(replyToken, pointMsg);
        
        // อัปเดตข้อมูลสำหรับบันทึก Log
        saveLog({
          userId: userId,
          displayName: profile.displayName,
          userMessage: userMessage,
          botReply: pointMsg,
          intent: intentName
        });
      } else {
        replyMessage(replyToken, "ไม่พบข้อมูลสมาชิกของคุณในระบบค่ะ");
      }
    } else {
      // กรณี Intent ทั่วไป ส่งคำตอบจาก Dialogflow
      replyMessage(replyToken, fulfillmentText);
      
      // บันทึก Log
      saveLog({
        userId: userId,
        displayName: profile.displayName,
        userMessage: userMessage,
        botReply: fulfillmentText,
        intent: intentName
      });
    }

  } catch (error) {
    console.error("❌ Error in handleMessageEvent:", error);
    // กรณีเกิดข้อผิดพลาดรุนแรง ให้แจ้งเตือนผู้ใช้
    if (replyToken) {
      replyMessage(replyToken, "ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง");
    }
  }
}

/**
 * จัดการเมื่อมีการเพิ่มเพื่อน (ตัดส่วนการส่งข้อความออก)
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const profile = getUserProfile(userId);
  const timestamp = new Date(event.timestamp);

  // 1. บันทึกข้อมูลผู้ติดตามลง Google Sheets เท่านั้น
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

  // 2. ส่วนการส่ง welcomeMsg และ replyMessage ถูกตัดออกตามเงื่อนไข
  console.log("👤 New Follower: " + profile.displayName + " (Data saved to sheet)");
}