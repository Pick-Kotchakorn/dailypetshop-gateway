/**
 * 🧠 EVENTHANDLER.gs
 * จัดการแยกแยะประเภทเหตุการณ์ (Event) จาก LINE
 */

function handleEvent(event) {
  const userId = event.source.userId;
  if (!userId) return;
  
  // 1. แสดง Loading Animation ทันทีเพื่อ User Experience ที่ดี
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
        console.log(`👤 User ${userId} unfollowed.`);
        break;
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ Error handling ${event.type}: ${err.message}`);
  }
}

/**
 * จัดการเมื่อมีผู้ใช้ "เพิ่มเพื่อน" (Follow Event)
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const timestamp = new Date(event.timestamp);
  
  // ดึงโปรไฟล์ (ถ้าดึงไม่ได้จะได้ค่า Default จาก LineAPI.js)
  const profile = getUserProfile(userId);
  
  const followerData = {
    userId: userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    language: profile.language || 'th',
    statusMessage: profile.statusMessage || '',
    firstFollowDate: timestamp,
    lastFollowDate: timestamp,
    followCount: 1,
    status: 'active',
    sourceChannel: 'LINE',
    tags: 'new-follower',
    lastInteraction: timestamp,
    totalMessages: 0
  };

  // บันทึกลง Sheet Followers
  upsertFollower(followerData);

  // บันทึก Log
  saveLog({
    userId: userId,
    displayName: profile.displayName,
    userMessage: '[FOLLOW_EVENT]',
    botReply: '[SYSTEM_REGISTERED]',
    intent: 'system.follow'
  });
}

/**
 * จัดการเมื่อมี "ข้อความ" ส่งเข้ามา (Message Event)
 */
function handleMessageEvent(event) {
  // รับเฉพาะข้อความตัวอักษร
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  const profile = getUserProfile(userId);

  // 1. อัปเดตข้อมูลการปฏิสัมพันธ์ (เวลาล่าสุด และจำนวนข้อความ)
  updateFollowerInteraction(userId, profile); 

  // 2. บันทึก Log การสนทนา
  saveLog({
    userId: userId,
    displayName: profile.displayName, 
    userMessage: userMessage,
    botReply: '[ACKNOWLEDGED]',
    intent: 'general.chat'
  });
  
  // หมายเหตุ: หากต้องการให้บอทตอบกลับแบบ Auto-Reply สามารถเพิ่ม replyMessage() ที่นี่ได้
}