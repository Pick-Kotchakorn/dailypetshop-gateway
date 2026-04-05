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
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);

  if (!sheet) {
    console.log(`System: Sheet "${CONFIG.SHEET_NAME.FOLLOWERS}" not found. Running setup...`);
    setupDatabase();
    sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  }

  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString() === userId.toString()) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) return null;

  const headers = values[0];
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
 * 📝 เพิ่มข้อมูลสมาชิกใหม่
 * @param {object} memberData - ข้อมูลสมาชิกใหม่
 */
function addNewMember(memberData) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);

  if (!sheet) {
    console.log(`System: Sheet "${CONFIG.SHEET_NAME.FOLLOWERS}" not found. Running setup...`);
    setupDatabase();
  }

  const newRow = [
    memberData.userId,
    memberData.displayName,
    50, // แต้มเริ่มต้น
    0,  // ยอดซื้อสะสม
    'Bronze', // เลเวลเริ่มต้น
    new Date(), // วันที่สมัคร
    new Date(), // Last Access
    0,  // Total Visits
    50  // Lifetime Points
  ];

  sheet.appendRow(newRow);
}

/**
 * 🔄 อัปเดตข้อมูล Last Access
 * @param {string} userId - รหัสผู้ใช้ LINE
 */
function updateLastAccess(userId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString() === userId.toString()) {
      sheet.getRange(i + 1, 7).setValue(new Date()); // Column G (Last Access)
      break;
    }
  }
}

/**
 * 🏗️ ตั้งค่า Database เริ่มต้น (สร้าง Sheet และ Header)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // สร้าง Sheet สำหรับสมาชิก
  let membersSheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
  if (!membersSheet) {
    membersSheet = ss.insertSheet(CONFIG.SHEET_NAME.MEMBERS);
    membersSheet.appendRow([
      'User ID', 'Name', 'Current Points', 'Lifetime Points', 'Total Spending', 'Level', 'Last Access', 'Total Visits'
    ]);
  }

  // สร้าง Sheet สำหรับ Followers
  let followersSheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  if (!followersSheet) {
    followersSheet = ss.insertSheet(CONFIG.SHEET_NAME.FOLLOWERS);
    followersSheet.appendRow([
      'User ID', 'Name', 'Current Points', 'Lifetime Points', 'Total Spending', 'Level', 'Member Since', 'Last Access', 'Total Visits'
    ]);
  }
}