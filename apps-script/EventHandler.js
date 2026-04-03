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
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const markAsReadToken = event.markAsReadToken; 

  try {
    // 🌟 ขั้นตอนที่ 1: ขึ้นสถานะ "อ่านแล้ว" ทันที (Immediate Read)
    // เราทำส่วนนี้ก่อนเพื่อให้ User เห็นการตอบสนองแรกสุด
    if (markAsReadToken) {
      markAsRead(markAsReadToken);
    }

    // 🌟 ขั้นตอนที่ 2: แสดง Loading Animation (จุดสามจุด)
    // เพื่อบอก User ว่าระบบรับทราบและกำลังคิดคำตอบอยู่
    sendLoadingAnimation(userId);

    // --- [ ช่วงนี้คือการประมวลผลเบื้องหลังที่ใช้เวลา ] ---

    // 🌟 ขั้นตอนที่ 3: ส่งไป Dialogflow และดึงข้อมูล Profile
    // การเรียก API ภายนอกจะมีความหน่วง เราจึงเอามาไว้หลัง Read/Loading
    const dfResponse = detectIntent(userId, userMessage);
    const profile = getUserProfile(userId) || { displayName: 'Customer' };
    
    const queryResult = dfResponse.queryResult;
    const intentName = queryResult.intent ? queryResult.intent.displayName : 'Default Fallback Intent';
    const fulfillmentText = queryResult.fulfillmentText || "ขออภัยค่ะ ไม่เข้าใจคำถามนี้";

    // อัปเดตข้อมูลการปฏิสัมพันธ์ (ทำแบบเงียบๆ เบื้องหลัง)
    updateFollowerInteraction(userId, profile);

    // 🌟 ขั้นตอนที่ 4: หน่วงเวลาให้ดูเป็นธรรมชาติ (Natural Delay)
    // หากระบบประมวลผลเร็วเกินไป User จะรู้สึกเหมือนคุยกับหุ่นยนต์ 
    // การใส่ Sleep สั้นๆ จะช่วยให้ UX ดูเหมือนมีการพิมพ์จริงๆ
    Utilities.sleep(1500);

    // 🌟 ขั้นตอนที่ 5: ส่งข้อความตอบกลับ
    if (intentName === 'Check_Points') {
      const memberData = getCustomerProfile(userId);
      if (memberData) {
        const pointMsg = `คุณ ${profile.displayName} มีคะแนนสะสม ${memberData.points.toLocaleString()} แต้มค่ะ 🐾`;
        replyMessage(replyToken, pointMsg);
        saveLog({ userId, displayName: profile.displayName, userMessage, botReply: pointMsg, intent: intentName });
      } else {
        replyMessage(replyToken, "ไม่พบข้อมูลสมาชิกของคุณในระบบค่ะ");
      }
    } else {
      // ส่งคำตอบทั่วไปจาก Dialogflow
      replyMessage(replyToken, fulfillmentText);
      saveLog({ userId, displayName: profile.displayName, userMessage, botReply: fulfillmentText, intent: intentName });
    }

  } catch (error) {
    console.error("❌ Error in handleMessageEvent:", error);
    if (replyToken) {
      replyMessage(replyToken, "ขออภัยค่ะ ระบบขัดข้องชั่วคราว");
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