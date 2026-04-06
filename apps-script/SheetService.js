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
 * 🏗️ ตั้งค่า Database เริ่มต้น
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  const sheetsToCreate = [
    { name: CONFIG.SHEET_NAME.FOLLOWERS, headers: ['User ID', 'Display Name', 'Picture URL', 'Language', 'Status Message', 'First Follow', 'Last Follow', 'Follow Count', 'Status', 'Source', 'Tags', 'Last Interaction', 'Total Messages'] },
    { name: CONFIG.SHEET_NAME.MEMBERS, headers: ['Customer ID', 'Remark', 'Available Coupon', 'Current Points', 'Expiring Points', 'Member Since', 'Member Until', 'Added From', 'Last Access', 'Total Visits', 'Lifetime Points', 'Total Spending', 'Avg Spending', 'Balance', 'Full Name', 'LINE Name', 'Username', 'Gender', 'Email', 'Tel', 'Birthday', 'Address', 'Level', 'Plastic Card', 'Referrer'] },
    { name: CONFIG.SHEET_NAME.CONVERSATIONS, headers: ['Timestamp', 'User ID', 'Display Name', 'User Message', 'Intent', 'Bot Reply'] } // แก้ไขจุดที่ 1: เพิ่ม Conversations
  ];

  sheetsToCreate.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
    }
    
    // แก้ไขจุดที่ 3: ปรับแต่งรูปแบบ Header (#c54327, ฟ้อนต์ขาว, ตัวหนา, Freeze Row 1)
    const headerRange = sheet.getRange(1, 1, 1, s.headers.length);
    headerRange.setBackground('#c54327')
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