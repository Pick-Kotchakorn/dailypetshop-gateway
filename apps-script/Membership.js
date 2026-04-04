/**
 * 🆕 ฟังก์ชันลงทะเบียนสมาชิกใหม่ (Production Version)
 */
function registerNewMember(formData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    
    const data = sheet.getDataRange().getValues();
    const userId = formData.userId;

    // 1. ตรวจสอบการสมัครซ้ำระดับ Database [cite: 18, 19]
    const isDuplicate = data.some(row => row[0] && row[0].toString() === userId.toString());
    if (isDuplicate) return { success: false, message: "DUPLICATE" };

    // 2. เตรียมข้อมูลบันทึกลง Sheet (แมพตามฟิลด์จาก HTML) [cite: 20]
    const now = new Date();
    const fullAddress = `${formData.addressDetail} ${formData.subdistrict} ${formData.district} ${formData.province} ${formData.zipcode}`;
    
    const newRow = [
      userId,                   // Customer ID
      "สมัครสมาชิกใหม่",           // Remark
      0,                        // Available Coupon
      50,                       // Current Points (แรกเข้า)
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
      formData.name,            // Full Name (จากฟิลด์ name ใน HTML)
      formData.lineName,        // LINE Name
      formData.username,        // Username
      formData.gender,          // Gender
      formData.email,           // Email
      formData.tel,             // Tel
      formData.birthday,        // Birthday
      fullAddress,              // Address (ที่อยู่แบบรวมร่าง)
      "Friend",                 // Level
      "-",                      // Plastic Card
      ""                        // Referrer
    ];

    sheet.appendRow(newRow);

    // 3. 🚀 ส่งสัญญาณอัปเดต Cache ไปยัง Cloudflare Worker (สำคัญมาก) [cite: 26]
    // หมายเหตุ: ฟังก์ชันนี้จะถูกเขียนเพิ่มในขั้นตอนถัดไป
    updateWorkerCache(userId, "REGISTERED");
    
    return { success: true, message: "Registration successful" };

  } catch (e) {
    console.error("Error:", e.message);
    return { success: false, message: e.message };
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