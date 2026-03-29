// ไฟล์ SheetService.gs

/**
 * ฟังก์ชันติดตั้งระบบ: สร้าง Sheet และหัวข้อคอลัมน์ให้อัตโนมัติ
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // 1. สร้าง/ตรวจสอบ Sheet Followers
  let followerSheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  if (!followerSheet) {
    followerSheet = ss.insertSheet(CONFIG.SHEET_NAME.FOLLOWERS);
    followerSheet.appendRow([
      'User ID', 'Display Name', 'Picture URL', 'Language', 'Status Message', 
      'First Follow Date', 'Last Follow Date', 'Follow Count', 'Status', 
      'Source Channel', 'Tags', 'Last Interaction', 'Total Messages'
    ]);
    followerSheet.getRange("1:1").setFontWeight("bold").setBackground("#d9ead3");
  }

  // 2. สร้าง/ตรวจสอบ Sheet Conversations
  let convSheet = ss.getSheetByName(CONFIG.SHEET_NAME.CONVERSATIONS);
  if (!convSheet) {
    convSheet = ss.insertSheet(CONFIG.SHEET_NAME.CONVERSATIONS);
    convSheet.appendRow(['Timestamp', 'User ID', 'Display Name', 'User Message', 'Bot Reply', 'Intent']);
    convSheet.getRange("1:1").setFontWeight("bold").setBackground("#cfe2f3");
  }

  // 3. สร้าง/ตรวจสอบ Sheet Members (Tamagotchi)
  let memberSheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
  if (!memberSheet) {
    memberSheet = ss.insertSheet(CONFIG.SHEET_NAME.MEMBERS);
    memberSheet.appendRow(['Customer ID', 'Pet Type', 'Pet Name', 'Level', 'Total Spending', 'Tokens', 'Tier']);
    memberSheet.getRange("1:1").setFontWeight("bold").setBackground("#fff2cc");
  }
  
  console.log("✅ Database Setup Completed!");
}

/**
 * บันทึกหรืออัปเดตข้อมูลผู้ติดตาม
 */
function upsertFollower(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  // ค้นหา User เดิม
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.userId) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    data.userId, data.displayName, data.pictureUrl, data.language, data.statusMessage,
    data.firstFollowDate, data.lastFollowDate, data.followCount, data.status,
    data.sourceChannel, data.tags, data.lastInteraction, data.totalMessages
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * บันทึกประวัติการสนทนา
 */
function saveLog(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.CONVERSATIONS);
  sheet.appendRow([
    new Date(), data.userId, data.displayName, data.userMessage, data.botReply, data.intent
  ]);
}