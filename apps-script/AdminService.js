/**
 * 🛠️ ฟังก์ชันสำหรับดึงข้อมูลของรางวัลทั้งหมดสำหรับ Admin
 * @returns {Array} รายการของรางวัลพร้อมรายละเอียด
 */
function getAdminRewardList() {
  const ss = getSS(); // เรียกใช้งาน Singleton Spreadsheet
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.REWARDS);
  const data = sheet.getDataRange().getValues();
  
  // ตัดแถว Header ออกและเปลี่ยนเป็น Array of Objects เพื่อให้ฝั่ง HTML ใช้งานง่าย[cite: 13]
  return data.slice(1).map(row => ({
    id: row[0],
    title: row[1],
    description: row[2],
    points: row[3],
    stock: row[4],
    image: row[5],
    status: row[6]
  }));
}

/**
 * 📦 ฟังก์ชันสำหรับอัปเดตจำนวนสต็อกของรางวัล
 * @param {string} rewardId - ID ของรางวัล
 * @param {number} newStock - จำนวนสต็อกใหม่
 */
function updateRewardStock(rewardId, newStock) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // ป้องกันข้อมูลทับซ้อน[cite: 9]
    const sheet = getSheet(CONFIG.SHEET_NAME.REWARDS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(row => row[0].toString() === rewardId.toString());
    
    if (idx !== -1) {
      sheet.getRange(idx + 1, 5).setValue(newStock); // คอลัมน์ Stock คือคอลัมน์ที่ 5[cite: 13]
      return { status: "Success", message: "อัปเดตสต็อกเรียบร้อยแล้ว" };
    }
    throw new Error("ไม่พบไอดีของรางวัล");
  } catch (e) {
    return { status: "Error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}