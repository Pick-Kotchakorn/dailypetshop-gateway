/**
 * 👥 Membership.js - จัดการระบบสมาชิกและแต้มสะสม
 * จัดการการสมัครสมาชิกใหม่ และการคำนวณแต้มจากการซื้อสินค้า
 */

/**
 * 📊 รับข้อมูลโปรไฟล์สมาชิก
 * @param {string} userId - รหัสผู้ใช้ LINE
 * @returns {object|null} ข้อมูลสมาชิก หรือ null ถ้าไม่พบ
 */
function getCustomerProfile(userId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString() === userId.toString()) {
      const data = values[i];
      return {
        userId: data[0],
        name: data[1] || '',
        points: Number(data[2]) || 0,
        totalSpending: Number(data[3]) || 0,
        level: data[4] || 'Bronze',
        memberSince: data[5] ? new Date(data[5]).toLocaleDateString('th-TH') : '',
        lastAccess: data[6] ? new Date(data[6]).toLocaleDateString('th-TH') : '',
        totalVisits: Number(data[7]) || 0,
        lifetimePoints: Number(data[8]) || 0
      };
    }
  }
  return null;
}

/**
 * 📝 สมัครสมาชิกใหม่ (เวอร์ชันอัปเกรดเก็บข้อมูลละเอียด)
 * บันทึกลงชีท Membership
 */
function registerNewMember(formData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);

    // 1. ถ้าไม่มีชีท ให้สร้างพร้อมหัวข้อตามไฟล์ตัวอย่างที่คุณต้องการ
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME.MEMBERS);
      const headers = [
        'LINE User ID', 'LINE Name', 'First name', 'Last name', 'Tel', 
        'Birthday', 'Gender', 'Address', 'Subscribed Date', 'Status', 
        'Level', 'Current points', 'Total spending', 'Last access'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    }

    // 2. ตรวจสอบสมาชิกซ้ำ
    const data = sheet.getDataRange().getValues();
    const exists = data.some(row => row[0] === formData.userId);
    if (exists) return "คุณเป็นสมาชิกอยู่แล้วค่ะ";

    // 3. เตรียมที่อยู่แบบรวมข้อความ (Concatenate Address)
    const fullAddress = `${formData.addressDetail} ต.${formData.district} อ.${formData.amphure} จ.${formData.province}`;

    // 4. บันทึกข้อมูล
    const newRow = [
      formData.userId,        // LINE User ID
      formData.displayName,   // LINE Name
      formData.firstName,     // First name
      formData.lastName,      // Last name
      formData.phone,         // Tel
      formData.birthday,      // Birthday
      formData.gender,        // Gender
      fullAddress,            // Address
      new Date(),             // Subscribed Date
      'Active',               // Status
      'Bronze',               // Level
      50,                     // Current points (แต้มฟรี)
      0,                      // Total spending
      new Date()              // Last access
    ];

    sheet.appendRow(newRow);
    return "Success";

  } catch (e) {
    return "Error: " + e.message;
  } finally {
    lock.releaseLock();
  }
}

/**
 * 💰 เพิ่มธุรกรรมการซื้อสินค้า (คำนวณแต้มอัตโนมัติ)
 * @param {string} userId - รหัสผู้ใช้ LINE
 * @param {number} amount - ยอดซื้อในครั้งนี้ (บาท)
 * @returns {object} ผลลัพธ์การเพิ่มธุรกรรม
 */
function addTransaction(userId, amount) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const rowIndex = data.findIndex(row => row[0] && row[0].toString() === userId.toString());
    if (rowIndex === -1) throw new Error("ไม่พบข้อมูลสมาชิก");

    // ระบุตำแหน่ง Column ที่สำคัญ
    const colCurrentPoints = headers.indexOf('Current Points') + 1;
    const colLifetimePoints = headers.indexOf('Lifetime Points') + 1;
    const colTotalSpending = headers.indexOf('Total Spending') + 1;
    const colLevel = headers.indexOf('Level') + 1;
    const colTotalVisits = headers.indexOf('Total Visits') + 1;
    const colLastAccess = headers.indexOf('Last Access') + 1;

    // Validate required columns
    if (colCurrentPoints <= 0) throw new Error("Missing 'Current Points' column");
    if (colLifetimePoints <= 0) throw new Error("Missing 'Lifetime Points' column");
    if (colTotalSpending <= 0) throw new Error("Missing 'Total Spending' column");
    if (colLevel <= 0) throw new Error("Missing 'Level' column");
    if (colTotalVisits <= 0) throw new Error("Missing 'Total Visits' column");
    if (colLastAccess <= 0) throw new Error("Missing 'Last Access' column");

    // 1. ดึงข้อมูลเก่า
    const currentData = data[rowIndex];
    const oldSpending = Number(currentData[colTotalSpending - 1]) || 0;
    const oldPoints = Number(currentData[colCurrentPoints - 1]) || 0;
    const oldLifetimePoints = Number(currentData[colLifetimePoints - 1]) || 0;
    const oldVisits = Number(currentData[colTotalVisits - 1]) || 0;

    // 2. คำนวณค่าใหม่ (สูตร: 10 บาท = 1 แต้ม)
    const newSpending = oldSpending + amount;
    const earnedPoints = Math.floor(amount / 10); 
    const newPoints = oldPoints + earnedPoints;
    const newLifetimePoints = oldLifetimePoints + earnedPoints;
    const newLevel = calculateLevel(newSpending); // คำนวณเลเวลใหม่ทันที

    // 3. บันทึกลง Sheet
    const targetRow = rowIndex + 1;
    sheet.getRange(targetRow, colTotalSpending).setValue(newSpending);
    sheet.getRange(targetRow, colCurrentPoints).setValue(newPoints);
    sheet.getRange(targetRow, colLifetimePoints).setValue(newLifetimePoints);
    sheet.getRange(targetRow, colLevel).setValue(newLevel);
    sheet.getRange(targetRow, colTotalVisits).setValue(oldVisits + 1);
    sheet.getRange(targetRow, colLastAccess).setValue(new Date());

    return {
      status: "success",
      earnedPoints,
      newLevel,
      totalPoints: newPoints
    };

  } catch (e) {
    console.error("❌ addTransaction Error: " + e.message);
    return { status: "error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 🏆 คำนวณเลเวลสมาชิกตามยอดซื้อสะสม
 * @param {number} totalSpending - ยอดซื้อสะสมทั้งหมด
 * @returns {string} เลเวลที่คำนวณได้
 */
function calculateLevel(totalSpending) {
  if (totalSpending >= 10000) return "Gold (VIP)";
  if (totalSpending >= 2000) return "Silver (Member)";
  return "Bronze";
}