/**
 * 🛠️ Membership.gs 
 * จัดการระบบสมาชิกสัตว์เลี้ยง: เลเวล, การสะสม XP (ใบบัก), และการใช้ Token
 * อ้างอิงการตั้งค่าจากไฟล์ Config.gs
 */

/**
 * ดึงข้อมูลโปรไฟล์สัตว์เลี้ยงของลูกค้าเพื่อนำไปแสดงบนหน้าจอ
 */
function getCustomerProfile(customerId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS); // จะดึงค่า "Sheet1" จาก Config
    const data = sheet.getDataRange().getValues();
    
    // ค้นหาแถวที่มี Customer ID ตรงกัน (คอลัมน์ A)
    const userRow = data.find(function(row) {
      return row[0] == customerId;
    });
    
    if (!userRow) return null;

    const totalSpending = Number(userRow[4]) || 0; // E: Total Spending [cite: 21, 27]
    
    // 🌿 Logic โจนสลัด: ทุก 50 บาท = 1 XP (ใบบัก)
    const totalXP = Math.floor(totalSpending / 50); 
    
    // 🆙 ระบบ Level: สะสมครบ 15 XP = 1 Level (สูงสุด 14 Level ตามโจทย์)
    const level = Math.min(Math.floor(totalXP / 15) + 1, 14); 
    const currentXPInLevel = totalXP % 15; // จำนวนใบบักที่จะโชว์ในช่อง 15 ช่อง (0-14)

    return {
      id: userRow[0],        // A: User ID
      type: userRow[1],      // B: Pet Type
      name: userRow[2],      // C: Pet Name
      level: level,          
      currentXP: currentXPInLevel, 
      spending: totalSpending, 
      tokens: userRow[5],    // F: Tokens
      tier: userRow[6]       // G: Tier Name
    };
  } catch (e) {
    console.error("Error in getCustomerProfile: " + e.message);
    return null;
  }
}

/**
 * อัปเดตยอดใช้จ่ายและคำนวณ XP/Level อัตโนมัติ
 */
function updateSpending(customerId, amount) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == customerId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) return "ไม่พบข้อมูลสมาชิก";

    const currentSpending = Number(data[rowIndex - 1][4]) || 0;
    const newTotal = currentSpending + amount;
    
    const totalXP = Math.floor(newTotal / 50);
    const newLevel = Math.min(Math.floor(totalXP / 15) + 1, 14);
    const newTokens = totalXP; 
    
    let newTier = "";
    if (newTotal >= 1000) {
      newTier = "Pet Legend 👑";
    } else if (newTotal >= 500) {
      newTier = "Bestie Friend 🦴";
    } else {
      newTier = "Newbie Paws 🐾";
    }

    // บันทึกค่าลง Sheet [cite: 32, 33]
    sheet.getRange(rowIndex, 4).setValue(newLevel);    // D: Level
    sheet.getRange(rowIndex, 5).setValue(newTotal);    // E: Spending
    sheet.getRange(rowIndex, 6).setValue(newTokens);   // F: Tokens
    sheet.getRange(rowIndex, 7).setValue(newTier);     // G: Tier

    return "อัปเดตยอดสำเร็จ! เลเวล " + newLevel + " (ยอดสะสม: " + newTotal + " บาท)";
  } catch (e) {
    return "เกิดข้อผิดพลาด: " + e.message;
  }
}

/**
 * ใช้ Token เพื่อให้อาหารสัตว์เลี้ยง (ใช้ 10 Tokens)
 */
function feedPet(customerId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == customerId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > -1) {
      let tokens = Number(data[rowIndex - 1][5]) || 0;
      if (tokens >= 10) {
        sheet.getRange(rowIndex, 6).setValue(tokens - 10);
        return { success: true, message: "ง่ำๆ! สัตว์เลี้ยงของคุณได้รับอาหารแล้ว" };
      } else {
        return { success: false, message: "เหรียญไม่พอ (ต้องใช้ 10 Tokens)" };
      }
    }
    return { success: false, message: "ไม่พบข้อมูลสมาชิก" };
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  }
}