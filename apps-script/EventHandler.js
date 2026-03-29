// ไฟล์ EventHandler.gs

/**
 * ฟังก์ชันหลักในการแยกแยะประเภทเหตุการณ์ (Event)
 */
function handleEvent(event) {
  const eventType = event.type;
  
  switch (eventType) {
    case 'follow':
      return handleFollowEvent(event);
    case 'message':
      return handleMessageEvent(event);
    default:
      console.log(`Unhandled event type: ${eventType}`);
      return null;
  }
}

/**
 * จัดการเมื่อมีผู้ใช้ "เพิ่มเพื่อน" (Follow Event)
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const timestamp = new Date(event.timestamp);
  
  // 1. ดึงข้อมูลโปรไฟล์จาก LINE API
  const profile = getUserProfile(userId); // เรียกใช้จาก LineAPI.gs
  
  // 2. เตรียมข้อมูลบันทึก (อ้างอิงโครงสร้าง Followers Sheet)
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

  // 3. บันทึกลง Sheet (เรียกใช้จาก SheetService.gs)
  upsertFollower(followerData);

  // 4. บันทึกประวัติการสนทนาเป็น Log (ระบุ Intent เป็น system.follow)
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
  const profile = getUserProfile(userId);
  
  // ในขั้นตอนนี้เราจะบันทึก Log การสนทนาลง Sheet ก่อน
  // ส่วนระบบโต้ตอบกับ Tamagotchi จะมาเขียนเพิ่มในภายหลัง
  saveLog({
    userId: userId,
    displayName: profile.displayName,
    userMessage: userMessage,
    botReply: 'ได้รับข้อความแล้ว', // ข้อความสมมติ
    intent: 'general.chat'
  });

  // ตัวอย่างการอัปเดตสถานะ Interaction ล่าสุด
  // (สามารถเขียนฟังก์ชันเพิ่มใน SheetService เพื่ออัปเดต lastInteraction และ totalMessages ได้)
}