/**
 * 📊 SheetService.js - จัดการการทำงานกับ Google Sheets
 */

/**
 * 💾 บันทึกหรืออัปเดตข้อมูล Follower (13 คอลัมน์)
 */
function saveFollowerData(data) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === data.userId);
  const now = new Date();

  if (rowIndex === -1) {
    // เพิ่มแถวใหม่ 13 คอลัมน์
    sheet.appendRow([
      data.userId,          // 1. User ID
      data.displayName,     // 2. Display Name
      data.pictureUrl,      // 3. Picture URL
      data.language,        // 4. Language
      data.statusMessage,   // 5. Status Message
      now,                  // 6. First Follow
      now,                  // 7. Last Follow
      1,                    // 8. Follow Count
      'active',             // 9. Status
      data.source,          // 10. Source
      '',                   // 11. Tags
      now,                  // 12. Last Interaction
      1                     // 13. Total Messages
    ]);
  } else {
    // อัปเดตเมื่อกลับมาติดตามใหม่
    const row = rowIndex + 1;
    const currentFollowCount = Number(values[rowIndex][7]) || 0;
    sheet.getRange(row, 2).setValue(data.displayName);   // Display Name
    sheet.getRange(row, 7).setValue(now);                // Last Follow
    sheet.getRange(row, 8).setValue(currentFollowCount + 1); 
    sheet.getRange(row, 9).setValue('active');           // สถานะเป็น active
  }
}

/**
 * 🚫 อัปเดตสถานะเป็น blocked
 */
function updateFollowerStatus(userId, status) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === userId);
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex + 1, 9).setValue(status); // คอลัมน์ที่ 9 (Status)
  }
}

/**
 * 🔄 อัปเดตการปฏิสัมพันธ์ (Last Interaction และ Message Count)
 */
function updateFollowerInteraction(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === userId);
  
  if (rowIndex !== -1) {
    const row = rowIndex + 1;
    const currentMessages = Number(values[rowIndex][12]) || 0;
    sheet.getRange(row, 12).setValue(new Date());        // 12. Last Interaction
    sheet.getRange(row, 13).setValue(currentMessages + 1); // 13. Total Messages
  }
}

/**
 * 🛠 Helper: ดึง Sheet object
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
 * 📝 บันทึกประวัติการสนทนาลงชีท Conversations
 */
function saveLog(logData) {
  const sheet = getSheet(CONFIG.SHEET_NAME.CONVERSATIONS);
  sheet.appendRow([
    new Date(),           // A: Timestamp
    logData.userId,      // B: User ID
    logData.displayName, // C: Display Name
    logData.userMessage, // D: User Message
    logData.intent,      // E: Intent
    logData.botReply     // F: Bot Reply
  ]);
}

/**
 * 📊 SheetService.js - ปรับปรุงโครงสร้างคอลัมน์ใหม่เพื่อ Data Analytics
 */

function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  const sheetsToCreate = [
    { 
      name: CONFIG.SHEET_NAME.MEMBERS, 
      headers: [
        // คอลัมน์ A: Key หลัก
        'User ID', 
        
        // กลุ่มที่ 1 (Identity): ดัชนี B-G
        'Full Name', 'Nickname', 'Gender', 'Birthday', 'Tel', 'Province', 'Pet Info',
        
        // กลุ่มที่ 2 (Activity): ดัชนี I-L
        'Member Since', 'Last Access', 'Total Visits', 'Status', 'Added From',
        
        // กลุ่มที่ 3 (Rewards): ดัชนี N-Q
        'Current Points', 'Lifetime Points', 'Total Spending', 'Level', 
        
        // ข้อมูลส่วนขยายอื่นๆ (ถ้ามี): ดัชนี R เป็นต้นไป
        'Expiring Points', 'Member Until', 'Avg Spending', 'Balance', 'LINE Name', 'Username', 'Address', 'Plastic Card', 'Referrer'
      ] 
    },
    { 
      name: CONFIG.SHEET_NAME.FOLLOWERS, 
      headers: ['User ID', 'Display Name', 'Picture URL', 'Language', 'Status Message', 'First Follow', 'Last Follow', 'Follow Count', 'Status', 'Source', 'Tags', 'Last Interaction', 'Total Messages'] 
    },
    { 
      name: CONFIG.SHEET_NAME.CONVERSATIONS, 
      headers: ['Timestamp', 'User ID', 'Display Name', 'User Message', 'Intent', 'Bot Reply'] 
    }
  ];

  sheetsToCreate.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
    }
    // อัปเดตหัวข้อคอลัมน์และจัดรูปแบบ
    sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers]);
    
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setBackground('#c54327') // Deep Red ตาม Brand Identity
               .setFontColor('#ffffff')
               .setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
}

// รักษา Behavior เดิมเพื่อไม่ให้กระทบฟังก์ชันอื่น
function findMemberById(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(row => row[0] === userId);
  if (rowIndex === -1) return null;
  return { userId: values[rowIndex][0], name: values[rowIndex][1] };
}

/**
 * 🛠️ ฟังก์ชันสร้าง Sheet 'Rewards' และเตรียมข้อมูลเบื้องต้น
 * รันฟังก์ชันนี้หนึ่งครั้งเพื่อเตรียมระบบ Phase 3 ครับ
 */
function setupRewardsSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Rewards");
  
  // 1. ถ้ายังไม่มี Sheet ให้สร้างใหม่
  if (!sheet) {
    sheet = ss.insertSheet("Rewards");
  } else {
    // ถ้ามีแล้วให้ล้างข้อมูลเก่าเพื่อตั้งค่าใหม่ (ระวัง: ข้อมูลเดิมจะหาย)
    sheet.clear();
  }

  // 2. กำหนดหัวข้อคอลัมน์ (Headers A-G)
  const headers = [
    'Reward ID',      // A
    'Title',          // B
    'Description',    // C
    'Points Needed',  // D
    'Stock',          // E
    'Image URL',      // F
    'Status'          // G (active / inactive)
  ];
  
  // 3. ข้อมูลตัวอย่างสำหรับ Daily Pet Shop
  const sampleData = [
    ['R001', 'ขนมแมวเลียพรีเมียม (Set 3 ซอง)', 'ขนมแมวเลียรสปลาโอจากญี่ปุ่น', 50, 20, 'https://via.placeholder.com/300', 'active'],
    ['R002', 'ส่วนลด 50 บาท (Shopee)', 'ใช้เป็นส่วนลดเมื่อซื้อครบ 500 บาท', 100, 50, 'https://via.placeholder.com/300', 'active'],
    ['R003', 'ตุ๊กตาแคทนิปน้องปลา', 'ของเล่นเสริมทักษะสำหรับเจ้าเหมียว', 150, 10, 'https://via.placeholder.com/300', 'active']
  ];

  // 4. บันทึกข้อมูลและจัดรูปแบบ
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
  
  // จัดรูปแบบ Header ให้สวยงามตามธีมร้าน
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#c54327') // แดงเบอร์กันดี
             .setFontColor('#ffffff')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
             
  sheet.setFrozenRows(1); // ตรึงแถวแรก
  console.log("✅ สร้าง Sheet 'Rewards' และใส่ข้อมูลตัวอย่างเรียบร้อยแล้ว!");
}