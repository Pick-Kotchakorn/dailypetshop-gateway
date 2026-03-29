// ไฟล์ EventHandler.gs

/**
 * ฟังก์ชันหลักในการแยกแยะประเภทเหตุการณ์ (Event)
 */
function handleEvent(event) {
  const userId = event.source.userId;
  
  // 1. เรียก Loading ทันทีเพื่อให้ LINE แสดงสถานะ
  sendLoadingAnimation(userId);

  // 2. แยกประเภท Event
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
  const userId = event.source.userId;
  const userMessage = event.message.text;

  // บันทึก Log การสนทนา
  saveLog({
    userId: userId,
    userMessage: userMessage,
    intent: "Message Received"
  });

  // 💡 จุดสำคัญ: อัปเดตข้อมูลผู้ติดตาม/สมาชิกที่นี่
  const profile = getUserProfile(userId);
  upsertFollower({
    userId: userId,
    displayName: profile.displayName,
    lastInteraction: new Date()
  });
}