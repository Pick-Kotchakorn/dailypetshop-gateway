/**
 * 🐾 MEMBERSHIP.gs
 * จัดการตรรกะเกี่ยวกับสมาชิก แต้มสะสม และการลงทะเบียน
 */

/**
 * 🆕 ฟังก์ชันลงทะเบียนสมาชิกใหม่ (รับข้อมูลจาก Registration.html)
 */
function registerNewMember(formData) {
  const lock = LockService.getScriptLock();
  try {
    // 🔐 ล็อกระบบ 10 วินาที ป้องกันการสมัครพร้อมกันจนแถวทับกัน
    lock.waitLock(10000); 

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    
    if (!sheet) {
      throw new Error("ไม่พบชีทระบบสมาชิก (Sheet1)");
    }

    const data = sheet.getDataRange().getValues();
    const userId = formData.userId;

    // 1. ตรวจสอบว่ามี User ID นี้ในระบบสมาชิกหรือยัง (ป้องกันสมัครซ้ำ)
    const isDuplicate = data.some(row => row[0] && row[0].toString() === userId.toString());
    if (isDuplicate) {
      throw new Error("คุณได้ลงทะเบียนสมาชิกเรียบร้อยแล้วค่ะ");
    }

    // 2. เตรียมข้อมูลให้ตรงตามโครงสร้าง Header ใน Sheet ของคุณ
    // ลำดับ: Customer ID, Remark, Available Coupon, Current Points, ..., Full Name, LINE Name, Email, Tel, Birthday, Address, ...
    const newRow = [
      userId,                   // Customer ID (A)
      "ลงทะเบียนผ่านระบบ",         // Remark (B)
      0,                        // Available Coupon (C)
      0,                        // Current Points (D)
      0,                        // Expiring Points (E)
      new Date(),               // Member Since (F)
      "",                       // Member Until (G)
      "LINE LIFF",              // Added From (H)
      new Date(),               // Last Access (I)
      1,                        // Total Visits (J)
      0,                        // Lifetime Points (K)
      0,                        // Total Spending (L)
      0,                        // Avg Spending (M)
      0,                        // Balance (N)
      formData.fullName,        // Full Name (O)
      formData.lineName,        // LINE Name (P)
      "",                       // Username (Q)
      formData.gender,          // Gender (R)
      formData.email,           // Email (S)
      formData.tel,             // Tel (T)
      formData.birthday,        // Birthday (U)
      formData.address,         // Address (V)
      "Friend",                 // Level (W)
      "",                       // Plastic Card (X)
      ""                        // Referrer (Y)
    ];

    // 3. บันทึกข้อมูลลงบรรทัดใหม่
    sheet.appendRow(newRow);
    
    return { status: "success", message: "บันทึกข้อมูลเรียบร้อย" };

  } catch (error) {
    console.error("❌ Registration Error: " + error.message);
    throw new Error(error.message); // ส่ง Error กลับไปที่หน้า HTML เพื่อแจ้งเตือน User
  } finally {
    // 🔓 ปล่อยล็อก
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