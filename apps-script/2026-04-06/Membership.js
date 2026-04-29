/**
 * 👤 ฟังก์ชันสำหรับดึงข้อมูลสมาชิกมาโชว์บนหน้าบัตรสมาชิก (Index.html)
 * @param {string} userId - ID ของผู้ใช้ LINE
 */
function getCustomerProfile(userId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    
    // 1. ค้นหาแถวของลูกค้าโดยใช้ User ID (เช็คที่คอลัมน์ A หรือ index 0)
    const rowIndex = data.findIndex(row => row[0] && row[0].toString() === userId.toString());
    
    // ถ้าไม่พบข้อมูลสมาชิก
    if (rowIndex === -1) return null;

    const rowData = data[rowIndex];

    // 2. ส่งค่ากลับไปที่หน้าจอโทรศัพท์ (ดึงตามลำดับ index ที่เราตั้งไว้ 0-24)
    return {
      name: rowData[14] || rowData[15] || "สมาชิก", // ดึงจาก Full Name (O) หรือ LINE Name (P)
      level: rowData[22] || "Bronze Friend",      // ดึงจาก Level (V)
      points: Number(rowData[3]) || 0,            // ดึงจาก Current Points (D)
      lifetimePoints: Number(rowData[10]) || 0,   // ดึงจาก Lifetime Points (K)
      memberSince: formatSimpleDate(rowData[5]),  // ดึงจาก Member Since (F)
      couponCount: Number(rowData[2]) || 0        // ดึงจาก Available Coupon (C)
    };
    
  } catch (e) {
    console.error("❌ getCustomerProfile Error: " + e.message);
    return null;
  }
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

    // 1. 🌟 ส่วนที่เพิ่มเข้ามา: ถ้าไม่มีชีท ให้สร้างใหม่พร้อมหัวข้อ A-Y
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME.MEMBERS);
      const headers = [
        'Customer ID', 'Remark', 'Available Coupon', 'Current Points', 'Expiring Points', 
        'Member Since', 'Member Until', 'Added From', 'Last Access', 'Total Visits', 
        'Lifetime Points', 'Total Spending', 'Avg Spending', 'Balance', 'Full Name', 
        'LINE Name', 'Username', 'Gender', 'Email', 'Tel', 
        'Birthday', 'Address', 'Level', 'Plastic Card', 'Referrer'
      ];
      sheet.appendRow(headers);
      // ตกแต่งหัวตารางให้ดูง่าย (ตัวหนา + พื้นหลังเทา)
      sheet.getRange(1, 1, 1, 25).setFontWeight("bold").setBackground("#f3f3f3");
    }

    // 2. ตรวจสอบสมาชิกซ้ำ (ตามโค้ดเดิม)
    const data = sheet.getDataRange().getValues();
    const exists = data.some(row => row[0] && row[0].toString() === formData.userId.toString());
    if (exists) return "คุณเป็นสมาชิกอยู่แล้วค่ะ ✨";

    const fullAddress = `${formData.addressDetail} แขวง/ตำบล.${formData.district} เขต/อำเภอ.${formData.amphure} จังหวัด.${formData.province}`;

    // 3. เตรียมแถวข้อมูล 25 ช่อง (ตามจุดที่ 1 ที่เราแก้ไป)
    const newRow = new Array(25).fill(""); 
    newRow[0]  = formData.userId;                             // (A)
    newRow[1]  = "ลงทะเบียนผ่านระบบ LIFF";                      // (B)
    newRow[3]  = 50;                                          // (D) แต้มแรกเข้า
    newRow[5]  = new Date();                                  // (F)
    newRow[7]  = "LINE OA";                                   // (H)
    newRow[8]  = new Date();                                  // (I)
    newRow[9]  = 1;                                           // (J)
    newRow[10] = 50;                                          // (K) Lifetime Points
    newRow[11] = 0;                                           // (L)
    newRow[14] = formData.firstName + " " + formData.lastName; // (O)
    newRow[15] = formData.displayName;                        // (P)
    newRow[17] = formData.gender;                             // (R)
    newRow[19] = formData.phone;                              // (T)
    newRow[20] = formData.birthday;                           // (U)
    newRow[21] = fullAddress;                                 // (W)
    newRow[22] = calculateLevel(newRow[10]);                  // (V) เรียกฟังก์ชันจากจุดที่ 2

    // 4. บันทึกข้อมูล
    sheet.appendRow(newRow);
    return "Success";

  } catch (e) {
    return "Error: " + e.message;
  } finally {
    lock.releaseLock();
  }
}

/**
 * 🏆 ฟังก์ชันสำหรับตัดสินระดับสมาชิก (Membership Tier)
 * @param {number} lifetimePoints - แต้มสะสมทั้งหมดที่เคยได้รับ
 * @return {string} - ชื่อระดับสมาชิก
 */
function calculateLevel(lifetimePoints) {
  // ตรวจสอบจากแต้มสูงสุดลงมา
  if (lifetimePoints >= 2000) {
    return "Gold Family";
  } else if (lifetimePoints >= 500) {
    return "Silver Member";
  } else {
    return "Bronze Friend";
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