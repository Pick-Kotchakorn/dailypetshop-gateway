/**
 * 📊 SheetService.js - Daily Pet Shop (Database Engine)
 * จัดการฐานข้อมูลระดับ Production: เน้นความเร็ว, ความแม่นยำ และความปลอดภัยของข้อมูล
 */

// Global Cache เพื่อลดการเปิด Spreadsheet ซ้ำซ้อน (Performance Optimization)
let _ss_cache = null;

function getSS() {
  if (!_ss_cache) {
    _ss_cache = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return _ss_cache;
}

/**
 * 📊 setupDatabase - ตั้งค่าโครงสร้างตารางข้อมูลทั้งหมดของ Daily Pet Shop
 * ครอบคลุม: Members, Followers, Rewards, Orders, และ Conversations (Logs)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); //
  const HEADER_COLOR = "#c84528"; // สีแบรนด์ที่คุณต้องการ
  const TEXT_COLOR = "#ffffff";

  // 1. นิยามโครงสร้างของแต่ละชีท (คอลัมน์ต้องตรงกับ Logic ใน Membership.gs และ AdminService.gs)
  const sheetsDefinition = [
    {
      name: CONFIG.SHEET_NAME.MEMBERS,
      headers: [
        'User ID', 'Full Name', 'Nickname', 'Gender', 'Birthday', 'Telephone', 
        'Province', 'Pet Info', 'Member Since', 'Last Access', 'Total Visits', 
        'Status', 'Added From', 'Current Points', 'Lifetime Points', 'Total Spending', 'Level'
      ] //[cite: 9, 13]
    },
    {
      name: CONFIG.SHEET_NAME.FOLLOWERS,
      headers: [
        'User ID', 'Display Name', 'Picture URL', 'Language', 'Status Message', 
        'First Follow', 'Last Follow', 'Follow Count', 'Status', 'Source', 
        'Tags', 'Last Interaction', 'Total Messages'
      ] //[cite: 4, 13]
    },
    {
      name: CONFIG.SHEET_NAME.REWARDS,
      headers: ['Reward ID', 'Title', 'Description', 'Points Needed', 'Stock', 'Image URL', 'Status'] //[cite: 13]
    },
    {
      name: CONFIG.SHEET_NAME.ORDERS,
      headers: ['Order ID', 'User ID', 'Product Details', 'Amount/Points', 'Status', 'Tracking No', 'Timestamp'] //[cite: 13]
    },
    {
      name: CONFIG.SHEET_NAME.CONVERSATIONS, // หรือ Logs
      headers: ['Timestamp', 'User ID', 'Display Name', 'User Message', 'Intent', 'Bot Reply'] //[cite: 4, 13]
    }
  ];

  // 2. เริ่มกระบวนการสร้างและจัดรูปแบบชีท
  sheetsDefinition.forEach(sheetDef => {
    let sheet = ss.getSheetByName(sheetDef.name) || ss.insertSheet(sheetDef.name); //[cite: 13]
    
    // เคลียร์ข้อมูลเดิมในแถวแรก (เฉพาะส่วนหัว)
    sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).clear(); 

    // ใส่ข้อมูลหัวข้อคอลัมน์ใหม่
    const headerRange = sheet.getRange(1, 1, 1, sheetDef.headers.length);
    headerRange.setValues([sheetDef.headers])
               .setBackground(HEADER_COLOR)
               .setFontColor(TEXT_COLOR)
               .setFontWeight("bold")
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle"); //[cite: 13]

    // ตั้งค่าความสวยงามเพิ่มเติม
    sheet.setFrozenRows(1); // ล็อคแถวหัวกระดาษ[cite: 13]
    sheet.autoResizeColumns(1, sheetDef.headers.length); // ปรับความกว้างคอลัมน์อัตโนมัติ
  });

  console.log("✅ ระบบฐานข้อมูล Daily Pet Shop ถูกตั้งค่าเรียบร้อยแล้ว!");
}

/**
 * 💾 2. บันทึก/อัปเดตข้อมูลผู้ติดตาม (13 คอลัมน์ตามมาตรฐาน)
 */
function saveFollowerData(data) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === data.userId);
  const now = new Date();

  if (rowIndex === -1) {
    sheet.appendRow([
      data.userId, data.displayName, data.pictureUrl, data.language, data.statusMessage, 
      now, now, 1, 'active', data.source, '', now, 1
    ]);
  } else {
    const row = rowIndex + 1;
    const currentFollowCount = Number(values[rowIndex][7]) || 0;
    sheet.getRange(row, 2).setValue(data.displayName);
    sheet.getRange(row, 7).setValue(now); 
    sheet.getRange(row, 8).setValue(currentFollowCount + 1);
    sheet.getRange(row, 9).setValue('active');
    sheet.getRange(row, 12).setValue(now);
  }
}

/**
 * 🔄 3. อัปเดตการปฏิสัมพันธ์ (Last Interaction)
 */
function updateFollowerInteraction(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === userId);
  
  if (idx !== -1) {
    const row = idx + 1;
    const currentMsgs = Number(data[idx][12]) || 0;
    sheet.getRange(row, 12).setValue(new Date());
    sheet.getRange(row, 13).setValue(currentMsgs + 1);
  }
}

/**
 * 📝 4. บันทึกประวัติระบบ (Audit Trail)
 */
function saveLog(logData) {
  try {
    const sheet = getSheet(CONFIG.SHEET_NAME.CONVERSATIONS);
    sheet.appendRow([
      new Date(), logData.userId, logData.displayName || "", 
      logData.userMessage || "", logData.intent || "", logData.botReply || "" 
    ]);
  } catch (e) { 
    console.error("❌ saveLog Error: " + e.message); 
  }
}

/**
 * 🚫 5. อัปเดตสถานะเมื่อมีการ Block
 */
function updateFollowerStatus(userId, status) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === userId);
  if (idx !== -1) sheet.getRange(idx + 1, 9).setValue(status);
}

/**
 * 🛠️ Helpers: ตัวช่วยจัดการชีทแบบ Singleton
 */
function getSheet(name) {
  const ss = getSS();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}