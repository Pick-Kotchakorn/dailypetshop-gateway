/**
 * บันทึกหรืออัปเดตข้อมูลผู้ติดตาม (Followers) - เวอร์ชั่นปลอดภัย (With Lock)
 */
function upsertFollower(data) {
  const lock = LockService.getScriptLock();
  try {
    // 🔐 ล็อกระบบ ป้องกันข้อมูลพังเมื่อมีคนทักมาพร้อมกัน
    lock.waitLock(10000); 

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);

    if (!sheet) {
      console.log(`System: Sheet "${CONFIG.SHEET_NAME.FOLLOWERS}" not found. Running setup...`);
      setupDatabase();updateFollowerInteraction
      sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
    }

    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < values.length; i++) {
      if (values[i][0] && values[i][0].toString() === data.userId.toString()) { 
        rowIndex = i + 1; 
        break; 
      }
    }

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

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      console.log(`✅ Updated follower: ${data.displayName} (Row: ${rowIndex})`);
    } else {
      sheet.appendRow(rowData);
      console.log(`✅ Added new follower: ${data.displayName}`);
    }

  } catch (error) {
    console.error("❌ Error in upsertFollower:", error.message);
    throw error;
  } finally {
    // 🔓 ปล่อยกุญแจให้คนในแถวถัดไป
    lock.releaseLock();
  }
}

/**
 * อัปเดตการปฏิสัมพันธ์ล่าสุด - เวอร์ชั่นปลอดภัย (With Lock)
 */
function updateFollowerInteraction(userId, profile = null) {
  // 🔐 เริ่มระบบล็อก
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // รอคิวสูงสุด 10 วินาที

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
    
    // ตรวจสอบว่ามีชีทหรือไม่ก่อนเริ่มงาน
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const colLastSeen = headers.indexOf('Last Interaction') + 1;
    const colTotalMsg = headers.indexOf('Total Messages') + 1;

    if (colLastSeen <= 0 || colTotalMsg <= 0) return;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === userId.toString().trim()) {
        const rowIndex = i + 1;
        
        // บันทึกเวลาปัจจุบัน
        sheet.getRange(rowIndex, colLastSeen).setValue(new Date());
        
        // บวกจำนวนข้อความเพิ่มขึ้น 1
        const currentMessages = Number(data[i][colTotalMsg - 1]) || 0;
        sheet.getRange(rowIndex, colTotalMsg).setValue(currentMessages + 1);
        
        // ถ้ามีข้อมูล Profile ส่งมาด้วย ให้เช็คและอัปเดตชื่อ/รูปที่ขาดไป
        if (profile) {
          if (!data[i][1]) sheet.getRange(rowIndex, 2).setValue(profile.displayName);
          if (!data[i][2]) sheet.getRange(rowIndex, 3).setValue(profile.pictureUrl);
        }
        return;
      }
    }
  } catch (e) {
    console.error("❌ Error in updateFollowerInteraction: " + e.message);
  } finally {
    // 🔓 ปล่อยล็อกเสมอ
    lock.releaseLock();
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