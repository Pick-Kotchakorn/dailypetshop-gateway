/**
 * 📊 SheetService.js - จัดการการทำงานกับ Google Sheets
 * จัดการการอ่าน/เขียนข้อมูลสมาชิก และการตั้งค่า Database เริ่มต้น
 */

/**
 * 🔍 ค้นหาข้อมูลสมาชิกจาก UserId
 * @param {string} userId - รหัสผู้ใช้ LINE
 * @returns {object|null} ข้อมูลสมาชิก หรือ null ถ้าไม่พบ
 */
function findMemberById(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] && row[0].toString() === userId.toString());

  if (rowIndex === -1) return null;

  const data = values[rowIndex];
  return {
    userId: data[0],
    name: data[1] || '',
    points: Number(data[2]) || 0,
    totalSpending: Number(data[3]) || 0,
    level: data[4] || 'Bronze',
    memberSince: data[5] ? new Date(data[5]).toLocaleDateString('th-TH') : '',
    lastAccess: data[6] ? new Date(data[6]).toLocaleDateString('th-TH') : '',
    totalVisits: Number(data[7]) || 0,
    lifetimePoints: Number(data[8]) || 0
  };
}

/**
 * 💾 บันทึกหรืออัปเดตข้อมูล Follower (รองรับ 13 คอลัมน์ตามหัวข้อที่กำหนด)
 */
function saveFollowerData(data) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === data.userId);
  const now = new Date();

  if (rowIndex === -1) {
    // กรณีเพื่อนใหม่: เพิ่มแถวใหม่ 13 คอลัมน์
    sheet.appendRow([
      data.userId,          // 1. User ID
      data.displayName,     // 2. Display Name
      data.pictureUrl,      // 3. Picture URL
      data.language || 'th',// 4. Language
      data.statusMessage,   // 5. Status Message
      now,                  // 6. First Follow
      now,                  // 7. Last Follow
      1,                    // 8. Follow Count
      'active',             // 9. Status
      data.source || 'user',// 10. Source
      '',                   // 11. Tags
      now,                  // 12. Last Interaction
      1                     // 13. Total Messages
    ]);
  } else {
    // กรณีเคยเป็นเพื่อนแล้ว: อัปเดตข้อมูลบางส่วน (Minimal Impact)
    const row = rowIndex + 1;
    const currentFollowCount = Number(values[rowIndex][7]) || 0;
    sheet.getRange(row, 2).setValue(data.displayName);   // Update Name
    sheet.getRange(row, 7).setValue(now);                // Last Follow
    sheet.getRange(row, 8).setValue(currentFollowCount + 1); // Follow Count +1
    sheet.getRange(row, 9).setValue('active');           // กลับมา active
    sheet.getRange(row, 12).setValue(now);               // Last Interaction
  }
}

/**
 * 🚫 อัปเดตสถานะเป็น blocked เมื่อผู้ใช้บล็อกบอท
 */
function updateFollowerStatus(userId, status) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === userId);
  
  if (rowIndex !== -1) {
    // คอลัมน์ที่ 9 คือ Status
    sheet.getRange(rowIndex + 1, 9).setValue(status);
  }
}

/**
 * 🔄 อัปเดตข้อมูล Last Access (Behavior เดิม)
 */
function updateLastAccess(userId) {
  updateFollowerStatus(userId, 'active'); // ทุกครั้งที่เข้าถึง ให้มั่นใจว่าเป็น active
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === userId);
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex + 1, 7).setValue(new Date()); // Column G
  }
}

/**
 * 🛠 Helper: ดึง Sheet object และจัดการกรณีไม่มี Sheet (DRY Principle)
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

/**
 * 🏗️ ตั้งค่า Database เริ่มต้น (Minimal Impact - รักษาโครงสร้างเดิม)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // Sheet สมาชิก
  if (!ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS)) {
    ss.insertSheet(CONFIG.SHEET_NAME.MEMBERS).appendRow([
      'User ID', 'Name', 'Current Points', 'Lifetime Points', 'Total Spending', 'Level', 'Last Access', 'Total Visits'
    ]);
  }

  // Sheet Followers (จัดหัวข้อตามที่คุณระบุ 13 หัวข้อ)
  if (!ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS)) {
    ss.insertSheet(CONFIG.SHEET_NAME.FOLLOWERS).appendRow([
      'User ID', 'Display Name', 'Picture URL', 'Language', 'Status Message', 
      'First Follow', 'Last Follow', 'Follow Count', 'Status', 'Source', 
      'Tags', 'Last Interaction', 'Total Messages'
    ]);
  }
}

/**
 * 📝 ฟังก์ชันเดิมที่ใช้ในระบบ (รักษาไว้เพื่อไม่ให้กระทบจุดอื่น)
 */
function addNewMember(memberData) {
  saveFollowerData(memberData);
}