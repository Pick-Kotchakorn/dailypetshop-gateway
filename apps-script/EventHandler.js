// ไฟล์ EventHandler.gs

/**
 * ฟังก์ชันหลักในการแยกแยะประเภทเหตุการณ์ (Event)
 */
function handleEvent(event) {
  const userId = event.source.userId;
  if (!userId) return;
  
  // 1. เรียก Loading ทันทีเพื่อให้ LINE แสดงสถานะ
  sendLoadingAnimation(userId);

  if (event.type === 'follow') {
    handleFollowEvent(event);
  } else if (event.type === 'message') {
    handleMessageEvent(event);
  }
}

/**
 * จัดการเมื่อมีผู้ใช้ "เพิ่มเพื่อน" (Follow Event)
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const timestamp = new Date(event.timestamp);
  const profile = getUserProfile(userId);
  
  const followerData = {
    userId: userId,
    displayName: profile.displayName || 'Unknown',
    pictureUrl: profile.pictureUrl || '',
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

  upsertFollower(followerData);

  saveLog({
    userId: userId,
    displayName: profile.displayName,
    userMessage: '[FOLLOW_EVENT]',
    botReply: '[NO_WELCOME_MESSAGE]',
    intent: 'system.follow'
  });
}

/**
 * จัดการเมื่อมี "ข้อความ" ส่งเข้ามา (Message Event)
 */
function handleMessageEvent(event) {
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMessage = event.message.text;
  
  // 1. ดึงโปรไฟล์เพื่อนำชื่อมาบันทึก Log และซ่อมข้อมูลที่หายไป
  const profile = getUserProfile(userId);

  // 2. บันทึก Log การสนทนาลง Sheet Conversations
  saveLog({
    userId: userId,
    displayName: profile.displayName || 'Customer', 
    userMessage: userMessage,
    botReply: '[NO_REPLY]',
    intent: 'general.chat'
  });

  // 🎯 3. คุณต้องเพิ่มบรรทัดนี้เข้าไปครับ! (สำคัญมาก)
  // ถ้าไม่มีบรรทัดนี้ ข้อมูลในชีท Followers จะไม่ยอมอัปเดตเวลาและจำนวนข้อความครับ
  updateFollowerInteraction(userId, profile); 
}