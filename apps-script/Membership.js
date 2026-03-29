// ========================================
// 🐾 MEMBERSHIP.GS - PET LOGIC (Full Version)
// ========================================

/**
 * ดึงข้อมูลโปรไฟล์สัตว์เลี้ยงและคำนวณ XP/Level
 */
function getCustomerProfile(customerId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    
    // ค้นหาแถวที่มี User ID ตรงกัน (คอลัมน์ A)
    const userRow = data.find(row => row[0] == customerId);
    
    if (!userRow) return null;

    const totalSpending = Number(userRow[4]) || 0; // คอลัมน์ E: Spending
    
    // 🌿 คำนวณ XP: ทุก 50 บาท = 1 XP
    const totalXP = Math.floor(totalSpending / 50); 
    
    // 🆙 คำนวณ Level: 15 XP = 1 Level (เริ่มที่ Level 1, สูงสุด 14)
    const level = Math.min(Math.floor(totalXP / 15) + 1, 14);
    
    // 🍃 XP ปัจจุบันในเลเวลนั้น (สำหรับโชว์ช่อง 15 ช่องบนหน้าจอ)
    const currentXPInLevel = totalXP % 15; 

    return {
      id: userRow[0],
      type: userRow[1],      // B: Pet Type
      name: userRow[2],      // C: Pet Name
      level: level,          // คำนวณใหม่จากยอดเงิน
      xp: currentXPInLevel,  // XP ส่วนเกินที่จะไปโชว์ในช่อง
      spending: totalSpending,
      tokens: userRow[5],    // F: Tokens
      tier: userRow[6]       // G: Tier
    };
  } catch (e) {
    console.error("❌ getCustomerProfile Error: " + e.message);
    return null;
  }
}

/**
 * อัปเดตยอดใช้จ่าย (ใช้ตอนบันทึกบิล)
 */
function updateSpending(customerId, amount) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
  const data = sheet.getDataRange().getValues();
  
  let rowIndex = data.findIndex(row => row[0] == customerId);
  
  if (rowIndex !== -1) {
    const currentSpending = Number(data[rowIndex][4]) || 0;
    const newSpending = currentSpending + amount;
    sheet.getRange(rowIndex + 1, 5).setValue(newSpending); // อัปเดตช่อง E
    return true;
  }
  return false;
}