// ไฟล์ SheetService.gs

/**
 * ฟังก์ชันติดตั้งระบบ: สร้าง Sheet และหัวข้อคอลัมน์ให้อัตโนมัติ
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  const sheets = [
    { name: CONFIG.SHEET_NAME.FOLLOWERS, head: ['User ID', 'Display Name', 'Picture URL', 'Language', 'Status Message', 'First Follow Date', 'Last Follow Date', 'Follow Count', 'Status', 'Source Channel', 'Tags', 'Last Interaction', 'Total Messages'], color: "#d9ead3" },
    { name: CONFIG.SHEET_NAME.CONVERSATIONS, head: ['Timestamp', 'User ID', 'Display Name', 'User Message', 'Bot Reply', 'Intent'], color: "#cfe2f3" },
    // 🎯 อัปเดตหัวตาราง MEMBERS ให้ครบตามความต้องการ Admin Panel
    { 
      name: CONFIG.SHEET_NAME.MEMBERS, 
      head: [
        'Customer ID', 'Remark', 'Available Coupon', 'Current Points', 'Expiring Points', 
        'Member Since', 'Member Until', 'Added From', 'Last Access', 'Total Visits', 
        'Lifetime Points', 'Total Spending', 'Avg Spending', 'Balance (เงิน)',
        'Full Name', 'LINE Name', 'Username', 'Gender', 'Email', 'Tel', 'Birthday', 'Address', 'Level', 'Plastic Card', 'Referrer'
      ], 
      color: "#fff2cc" 
    }
  ];

  sheets.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.head);
      sheet.getRange("1:1").setFontWeight("bold").setBackground(s.color).setWrap(true);
    }
  });
}

/**
 * บันทึกหรืออัปเดตข้อมูลผู้ติดตาม
 */
function upsertFollower(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.userId) { rowIndex = i + 1; break; }
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

function updateFollowerInteraction(userId, profile = null) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      const rowIndex = i + 1;
      
      // 1. อัปเดต Last Interaction (L) และ Total Messages (M)
      sheet.getRange(rowIndex, 12).setValue(new Date());
      const currentMessages = Number(data[i][12]) || 0;
      sheet.getRange(rowIndex, 13).setValue(currentMessages + 1);
      
      // 2. 🛠️ ซ่อมข้อมูล: หากคอลัมน์ B, C, D ว่างเปล่า ให้เติมจาก Profile
      if (profile) {
        if (!data[i][1]) sheet.getRange(rowIndex, 2).setValue(profile.displayName);
        if (!data[i][2]) sheet.getRange(rowIndex, 3).setValue(profile.pictureUrl);
        if (!data[i][3]) sheet.getRange(rowIndex, 4).setValue(profile.language || 'th');
      }
      
      SpreadsheetApp.flush();
      return;
    }
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