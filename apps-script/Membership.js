/**
 * 🐾 MEMBERSHIP.gs
 * จัดการตรรกะเกี่ยวกับสมาชิก แต้มสะสม และการลงทะเบียน
 */

/**
 * 🆕 ฟังก์ชันลงทะเบียนสมาชิกใหม่ (ปรับปรุงตามโครงสร้าง Sheet1 ล่าสุด)
 */
function registerNewMember(formData) {
  const lock = LockService.getScriptLock();
  try {
    // 🔐 ล็อกระบบ 10 วินาที ป้องกันแถวทับกัน
    lock.waitLock(10000); 

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    
    if (!sheet) throw new Error("ไม่พบชีทระบบสมาชิก (Sheet1)");

    const data = sheet.getDataRange().getValues();
    const userId = formData.userId;

    // 1. ตรวจสอบการสมัครซ้ำ
    const isDuplicate = data.some(row => row[0] && row[0].toString() === userId.toString());
    if (isDuplicate) throw new Error("คุณได้ลงทะเบียนสมาชิกเรียบร้อยแล้วค่ะ");

    // 2. เตรียมข้อมูล 25 คอลัมน์ ตามลำดับที่คุณระบุ
    const now = new Date();
    const newRow = [
      userId,                   // Customer ID
      "สมัครสมาชิกใหม่",           // Remark
      0,                        // Available Coupon
      50,                       // Current Points (ให้ 50 แต้มแรกเข้า)
      0,                        // Expiring Points
      now,                      // Member Since
      "",                       // Member Until
      "LIFF Registration",      // Added From
      now,                      // Last Access
      1,                        // Total Visits
      50,                       // Lifetime Points
      0,                        // Total Spending
      0,                        // Avg Spending
      0,                        // Balance (เงิน)
      formData.fullName,        // Full Name
      formData.lineName,        // LINE Name
      "PET-" + userId.substring(1, 6), // Username (Gen เบื้องต้น)
      formData.gender,          // Gender
      formData.email,           // Email
      formData.tel,             // Tel
      formData.birthday,        // Birthday
      formData.address,         // Address
      "Friend",                 // Level
      "-",                      // Plastic Card
      ""                        // Referrer
    ];

    // 3. บันทึกลง Sheet
    sheet.appendRow(newRow);
    
    return { status: "success", message: "ลงทะเบียนสำเร็จ" };

  } catch (e) {
    throw new Error(e.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * ดึงข้อมูลโปรไฟล์เพื่อแสดงผลบนหน้า Card
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
      memberId: getValue('Username') || "PET-" + customerId.substring(1, 6),
      level: getValue('Level') || "Friend",
      points: Number(getValue('Current Points')) || 0,
      pointsExpiring: getValue('Expiring Points') || 0,
      expiringDate: formatSimpleDate(getValue('Member Until')),
      totalSpending: Number(getValue('Total Spending')) || 0,
      nextLevelTarget: 5000,
      couponCount: Number(getValue('Available Coupon')) || 0
    };
  } catch (e) {
    console.error("❌ Error: " + e.message);
    return null;
  }
}

/**
 * Helper: จัดรูปแบบวันที่ (DD/MM/YYYY)
 */
function formatSimpleDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "-";
  return Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy");
}