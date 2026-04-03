/**
 * 📊 SHEETSERVICE.gs
 * จัดการการอ่าน/เขียน ข้อมูลลงใน Google Sheets
 */

/**
 * บันทึกหรืออัปเดตข้อมูลผู้ติดตาม (Followers)
 */
function upsertFollower(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);

    // 1. ถ้าหาชีทไม่เจอ ให้รัน Setup เพื่อสร้างชีทและ Header ทันที
    if (!sheet) {
      console.log(`System: Sheet "${CONFIG.SHEET_NAME.FOLLOWERS}" not found. Running setup...`);
      setupDatabase();
      sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
    }

    // 2. ดึงข้อมูลทั้งหมดเพื่อค้นหา UserId เดิม
    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // ค้นหา UserId ใน Column A (Index 0)
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] && values[i][0].toString() === data.userId.toString()) { 
        rowIndex = i + 1; 
        break; 
      }
    }

    // 3. เตรียมโครงสร้างข้อมูลให้ตรงกับ Header ใน setupDatabase
    const rowData = [
      data.userId || "",
      data.displayName || "Unknown",
      data.pictureUrl || "",
      data.language || "th",
      data.statusMessage || "",
      data.firstFollowDate || new Date(),
      data.lastFollowDate || new Date(),
      data.followCount || 1,
      data.status || "active",
      data.sourceChannel || "LINE",
      data.tags || "",
      data.lastInteraction || new Date(),
      data.totalMessages || 0
    ];

    // 4. บันทึกข้อมูล
    if (rowIndex > 0) {
      // กรณีพบข้อมูลเดิม: อัปเดตเฉพาะแถวนั้น
      // หมายเหตุ: ถ้าต้องการสะสมค่า เช่น followCount สามารถดึงค่าเก่ามาบวกเพิ่มตรงนี้ได้
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      console.log(`✅ Updated follower: ${data.displayName} (Row: ${rowIndex})`);
    } else {
      // กรณีไม่พบข้อมูล: เพิ่มแถวใหม่ต่อท้าย
      sheet.appendRow(rowData);
      console.log(`✅ Added new follower: ${data.displayName}`);
    }

  } catch (error) {
    console.error("❌ Error in upsertFollower:", error.message);
    throw error; // ส่ง Error ต่อไปให้ Handler หลักบันทึก Log
  }
}

/**
 * อัปเดตการปฏิสัมพันธ์ล่าสุด (เวลา และ จำนวนข้อความ)
 */
function updateFollowerInteraction(userId, profile = null) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const colLastSeen = headers.indexOf('Last Interaction') + 1;
  const colTotalMsg = headers.indexOf('Total Messages') + 1;

  if (colLastSeen <= 0 || colTotalMsg <= 0) return; // ป้องกัน Error ถ้าหาคอลัมน์ไม่เจอ

  for (let i = 1; i < data.length; i++) {
    // ✅ แก้ไข: ใช้ toString() และ trim() เพื่อการเปรียบเทียบที่แม่นยำ 100%
    if (data[i][0] && data[i][0].toString().trim() === userId.toString().trim()) {
      const rowIndex = i + 1;
      
      sheet.getRange(rowIndex, colLastSeen).setValue(new Date());
      
      const currentMessages = Number(data[i][colTotalMsg - 1]) || 0;
      sheet.getRange(rowIndex, colTotalMsg).setValue(currentMessages + 1);
      
      if (profile) {
        if (!data[i][1]) sheet.getRange(rowIndex, 2).setValue(profile.displayName);
        if (!data[i][2]) sheet.getRange(rowIndex, 3).setValue(profile.pictureUrl);
      }
      return;
    }
  }
}

/**
 * บันทึกประวัติการสนทนา (Log)
 */
function saveLog(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.CONVERSATIONS);
    sheet.appendRow([
      new Date(), 
      data.userId, 
      data.displayName || 'Unknown', 
      data.userMessage || '', 
      data.botReply || '', 
      data.intent || ''
    ]);
  } catch (e) {
    console.error("❌ saveLog Error: " + e.message);
  }
}

/**
 * 🛠️ setupDatabase
 * ฟังก์ชันสำหรับสร้างชีทและหัวตารางเริ่มต้นให้ครบถ้วนตามโครงสร้างที่ออกแบบไว้
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // 1. รายการชีทและ Header ที่ต้องมี (อัปเดตให้รองรับหน้า Card แบบละเอียด)
  const requiredSheets = [
    {
      name: CONFIG.SHEET_NAME.FOLLOWERS,
      headers: [
        "User ID", "Display Name", "Picture URL", "Language", "Status Message",
        "First Follow", "Last Follow", "Follow Count", "Status", 
        "Source", "Tags", "Last Interaction", "Total Messages"
      ],
      color: "#4a86e8" // สีน้ำเงินสำหรับงานระบบ
    },
    {
      name: CONFIG.SHEET_NAME.CONVERSATIONS,
      headers: ["Timestamp", "User ID", "Display Name", "User Message", "Bot Reply", "Intent"],
      color: "#673ab7" // สีม่วงสำหรับ Log
    },
    {
      name: CONFIG.SHEET_NAME.MEMBERS, // หรือ "Sheet1"
      headers: [
        "Customer ID", "Remark", "Available Coupon", "Current Points", "Expiring Points", 
        "Member Since", "Member Until", "Added From", "Last Access", "Total Visits", 
        "Lifetime Points", "Total Spending", "Avg Spending", "Balance (เงิน)",
        "Full Name", "LINE Name", "Username", "Gender", "Email", "Tel", "Birthday", 
        "Address", "Level", "Plastic Card", "Referrer"
      ],
      color: "#f36f21" // สีส้มทองธีม Member
    }
  ];

  requiredSheets.forEach(sheetInfo => {
    let sheet = ss.getSheetByName(sheetInfo.name);
    
    if (!sheet) {
      // กรณีไม่มีชีท: สร้างใหม่และใส่ Header
      sheet = ss.insertSheet(sheetInfo.name);
      sheet.getRange(1, 1, 1, sheetInfo.headers.length)
           .setValues([sheetInfo.headers])
           .setBackground(sheetInfo.color)
           .setFontColor("#ffffff")
           .setFontWeight("bold")
           .setHorizontalAlignment("center");
      
      // Freeze แถวแรกเพื่อให้ดูง่ายเวลาเลื่อนลง
      sheet.setFrozenRows(1);
      
      // ปรับขนาดคอลัมน์อัตโนมัติเบื้องต้น
      sheet.autoResizeColumns(1, sheetInfo.headers.length);
      
      console.log(`✅ สร้างชีทเรียบร้อย: ${sheetInfo.name}`);
    } else {
      // กรณีมีชีทอยู่แล้ว: ตรวจสอบเผื่อคุณต้องการอัปเดต Header ใหม่
      // (Optional) sheet.getRange(1, 1, 1, sheetInfo.headers.length).setValues([sheetInfo.headers]);
      console.log(`ℹ️ ชีท ${sheetInfo.name} มีอยู่ในระบบแล้ว`);
    }
  });
  
  return "🚀 การตั้งค่าฐานข้อมูลเสร็จสมบูรณ์!";
}

/**
 * ใหม่: อัปเดตสถานะของผู้ติดตาม (เช่น active -> blocked)
 */
function updateFollowerStatus(userId, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // ค้นหาตำแหน่งคอลัมน์ "Status" (ปกติคือคอลัมน์ที่ 9 หรือ Index 8)
    const colStatus = headers.indexOf('Status') + 1;
    
    if (colStatus <= 0) {
      console.error("❌ ไม่พบหัวตาราง 'Status' ในชีท Followers");
      return;
    }

    // วนลูปหาแถวที่มี User ID ตรงกัน
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString() === userId.toString()) {
        const rowIndex = i + 1;
        // อัปเดตค่าสถานะใหม่ลงใน Cell
        sheet.getRange(rowIndex, colStatus).setValue(newStatus);
        console.log(`✅ Updated status for ${userId} to ${newStatus}`);
        return;
      }
    }
    console.warn(`⚠️ ไม่พบ User ID ${userId} ในระบบเพื่ออัปเดตสถานะ`);
  } catch (e) {
    console.error("❌ updateFollowerStatus Error: " + e.message);
  }
}