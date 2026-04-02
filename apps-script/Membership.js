/**
 * 🐾 MEMBERSHIP.gs
 * จัดการตรรกะเกี่ยวกับสมาชิก แต้มสะสม และสัตว์เลี้ยง
 */

/**
 * ดึงข้อมูลโปรไฟล์และคำนวณค่าต่างๆ เพื่อแสดงผลบนหน้า Card
 */
function getCustomerProfile(customerId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const userRow = data.find(row => row[0] && row[0].toString() === customerId.toString());
    if (!userRow) return null;

    const getValue = (headerName) => {
      const index = headers.indexOf(headerName);
      return index > -1 ? userRow[index] : "";
    };

    return {
      name: getValue('Full Name'),
      memberId: getValue('Username'), // หรือใช้รหัส Plastic Card ตามต้องการ
      level: getValue('Level') || "Friend", // ปรับชื่อ Level ให้เหมือนตัวอย่าง
      points: Number(getValue('Current Points')) || 0,
      pointsExpiring: getValue('Expiring Points'), // 🆕 เพิ่มข้อมูลวันหมดอายุคะแนน
      expiringDate: formatSimpleDate(getValue('Member Until')), // 🆕 วันที่คะแนนจะหมดอายุ
      totalSpending: Number(getValue('Total Spending')) || 0,
      nextLevelTarget: 5000, // ตัวอย่าง: ยอดสะสมที่ต้องถึงเพื่อปรับระดับถัดไป
      couponCount: Number(getValue('Available Coupon')) || 0 // 🆕 จำนวนคูปองที่มี
    };
  } catch (e) {
    console.error("❌ Error: " + e.message);
    return null;
  }
}

/**
 * ฟังก์ชันคำนวณระยะเวลาการเป็นสมาชิก
 */
function calculateDuration(startDate) {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return "New Member";
  }
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return diffDays + " วัน";
  
  const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  if (months < 12) return months + " เดือน";
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} ปี ${remainingMonths} เดือน`;
}

/**
 * Helper: จัดรูปแบบวันที่ให้ดูง่าย (DD/MM/YYYY)
 */
function formatSimpleDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return date || "-";
  return Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy");
}

/**
 * 🍖 ฟังก์ชันประมวลผลการให้อาหารสัตว์เลี้ยง
 */
function processFeed(userId) {
  try {
    const profileData = getCustomerProfile(userId);
    if (!profileData) return { status: "error", message: "ไม่พบข้อมูลสมาชิก" };

    const points = profileData.membership.currentPoints;
    if (points < 5) {
      return { status: "error", message: "แต้มไม่พอ! สะสมยอดซื้อเพิ่มอีกนิดนะ 🐾" };
    }

    // [TODO]: เพิ่ม Logic การหักแต้มจริงใน Sheet ที่นี่
    // เช่น updateSpending หรือลด Current Points ลง
    
    return { 
      status: "success", 
      message: "หม่ำๆ! ขอบคุณสำหรับอาหารครับ 🍖 (XP +1)",
      newData: getCustomerProfile(userId) 
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
}