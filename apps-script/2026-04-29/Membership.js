/**
 * 👤 MEMBERSHIP.gs - Daily Pet Shop (Unified CRM)
 */

// Mapping คอลัมน์ตามลำดับ Data Analytics
const COL = {
  USER_ID: 1,        // A
  FULL_NAME: 2,      // B
  NICKNAME: 3,       // C
  GENDER: 4,         // D
  BIRTHDAY: 5,       // E
  TEL: 6,            // F
  PROVINCE: 7,       // G
  PET_INFO: 8,       // H
  MEMBER_SINCE: 9,   // I
  LAST_ACCESS: 10,   // J
  TOTAL_VISITS: 11,  // K
  STATUS: 12,        // L
  ADDED_FROM: 13,    // M
  CURRENT_POINTS: 14,   // N
  LIFETIME_POINTS: 15,  // O
  TOTAL_SPENDING: 16,   // P
  LEVEL: 17             // Q
};

/**
 * 🔍 ตรวจสอบว่ามี User ID นี้ในระบบแล้วหรือไม่
 */
function isExistingMember(userId) {
  if (!userId) return false;

  try {

    const ss =
      SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    const sheet =
      ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);

    if (!sheet) return false;

    const data =
      sheet.getDataRange().getValues();

    if (data.length <= 1) return false;

    // ตรวจสอบในคอลัมน์ A (User ID)

    return data.some((row, idx) =>

      idx > 0 &&
      row[COL.USER_ID - 1] &&
      row[COL.USER_ID - 1].toString() === userId.toString()

    );

  } catch (e) {

    console.error("isExistingMember Error: " + e.message);

    return false;
  }
}

/**
 * 📝 ลงทะเบียนสมาชิกใหม่
 */
function registerNewMember(formData) {

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(10000);

    // ดักจับชั้นสุดท้ายบน Server

    if (isExistingMember(formData.userId)) {

      return "ลูกค้าเป็นสมาชิก Daily Pet Shop อยู่แล้วค่ะ ✨";
    }

    const ss =
      SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    const memberSheet =
      ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);

    const now = new Date();

    const newRow =
      new Array(25).fill('');

    newRow[COL.USER_ID - 1] =
      formData.userId;

    newRow[COL.NICKNAME - 1] =
      formData.nickname;

    newRow[COL.GENDER - 1] =
      formData.gender;

    newRow[COL.BIRTHDAY - 1] =
      formData.birthday;

    newRow[COL.TEL - 1] =
      formData.phone;

    newRow[COL.PROVINCE - 1] =
      formData.province;

    newRow[COL.PET_INFO - 1] =
      "";

    newRow[COL.MEMBER_SINCE - 1] =
      now;

    newRow[COL.LAST_ACCESS - 1] =
      now;

    newRow[COL.TOTAL_VISITS - 1] =
      1;

    newRow[COL.STATUS - 1] =
      'active';

    newRow[COL.ADDED_FROM - 1] =
      'LIFF Registration';

    newRow[COL.CURRENT_POINTS - 1] =
      50; // Welcome Points

    newRow[COL.LIFETIME_POINTS - 1] =
      50;

    newRow[COL.TOTAL_SPENDING - 1] =
      0;

    newRow[COL.LEVEL - 1] =
      'Bronze Friend';

    memberSheet.appendRow(newRow);

    // อัปเดตสถานะในชีท Followers (ถ้ามี)

    updateFollowerToMember(formData.userId);

    // ✅ เพิ่มการสลับ Rich Menu ทันทีหลังสมัครสำเร็จ

    linkRichMenuToUser(
      formData.userId,
      CONFIG.RICH_MENU_ID_MEMBER
    );

    return {
      status: "Success",
      name: formData.nickname,
      points: 50,
      level: "Bronze Friend"
    };

  } catch (e) {

    return "เกิดข้อผิดพลาด: " + e.message;

  } finally {

    lock.releaseLock();
  }
}

/**
 * 💰 บันทึกยอดซื้อ
 */
function addTransaction(userId, amount) {

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(10000);

    const ss =
      SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    const sheet =
      ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);

    const data =
      sheet.getDataRange().getValues();

    const rowIndex =
      data.findIndex((row, idx) =>

        idx > 0 &&
        row[COL.USER_ID - 1].toString() === userId.toString()

      );

    if (rowIndex === -1)
      throw new Error("ไม่พบข้อมูลสมาชิก");

    const targetRow =
      rowIndex + 1;

    const currentData =
      data[rowIndex];

    const oldSpending =
      Number(currentData[COL.TOTAL_SPENDING - 1]) || 0;

    const oldPoints =
      Number(currentData[COL.CURRENT_POINTS - 1]) || 0;

    const oldLifetime =
      Number(currentData[COL.LIFETIME_POINTS - 1]) || 0;

    const oldVisits =
      Number(currentData[COL.TOTAL_VISITS - 1]) || 0;

    const newSpending =
      oldSpending + amount;

    const earned =
      Math.floor(amount / 10);

    const newPoints =
      oldPoints + earned;

    const newLifetime =
      oldLifetime + earned;

    const newLevel =
      calculateLevel(newSpending);

    sheet.getRange(targetRow, COL.TOTAL_SPENDING)
      .setValue(newSpending);

    sheet.getRange(targetRow, COL.CURRENT_POINTS)
      .setValue(newPoints);

    sheet.getRange(targetRow, COL.LIFETIME_POINTS)
      .setValue(newLifetime);

    sheet.getRange(targetRow, COL.LEVEL)
      .setValue(newLevel);

    sheet.getRange(targetRow, COL.TOTAL_VISITS)
      .setValue(oldVisits + 1);

    sheet.getRange(targetRow, COL.LAST_ACCESS)
      .setValue(new Date());

    return {
      status: "success",
      earnedPoints: earned,
      newLevel: newLevel
    };

  } catch (e) {

    return {
      status: "error",
      message: e.message
    };

  } finally {

    lock.releaseLock();
  }
}

function calculateLevel(spending) {

  if (spending >= 10001)
    return "Gold (VIP)";

  if (spending >= 2001)
    return "Silver (Member)";

  return "Bronze Friend";
}

function updateFollowerToMember(userId) {

  try {

    const ss =
      SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    const sheet =
      ss.getSheetByName(CONFIG.SHEET_NAME.FOLLOWERS);

    const data =
      sheet.getDataRange().getValues();

    const idx =
      data.findIndex((row, i) =>

        i > 0 &&
        row[0].toString() === userId.toString()

      );

    if (idx !== -1) {

      // คอลัมน์ Status ในชีท Followers

      sheet.getRange(idx + 1, 9)
        .setValue('member');
    }

  } catch (e) {}
}

function getCustomerProfile(userId) {

  try {

    const ss =
      SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    const sheet =
      ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);

    const data =
      sheet.getDataRange().getValues();

    const idx =
      data.findIndex((row, i) =>

        i > 0 &&
        row[COL.USER_ID - 1].toString() === userId.toString()

      );

    if (idx === -1)
      return null;

    const row =
      data[idx];

    return {

      name:
        row[COL.NICKNAME - 1] || "สมาชิก",

      level:
        row[COL.LEVEL - 1],

      points:
        row[COL.CURRENT_POINTS - 1],

      totalSpending:
        row[COL.TOTAL_SPENDING - 1],

      memberSince:
        Utilities.formatDate(
          new Date(row[COL.MEMBER_SINCE - 1]),
          "GMT+7",
          "dd/MM/yyyy"
        )
    };

  } catch (e) {

    return null;
  }
}

/**
 * 👑 ฟังก์ชันสำหรับ Admin: เพิ่มยอดซื้อและส่งการแจ้งเตือนหาลูกค้า (Push Message)
 * @param {string} userId - ID ของลูกค้า
 * @param {number} amount - ยอดเงินที่ซื้อ (บาท)
 * @param {string} note - เลขคำสั่งซื้อหรือหมายเหตุ
 */
function addAdminTransaction(userId, amount, note) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
    
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();

    const rowIndex = data.findIndex((row, idx) => idx > 0 && row[COL.USER_ID - 1] && row[COL.USER_ID - 1].toString() === userId.toString());
    
    if (rowIndex === -1) throw new Error("ไม่พบข้อมูลสมาชิกในระบบ");

    const targetRow = rowIndex + 1;
    const currentData = data[rowIndex];

    // 1. ดึงข้อมูลเดิมและคำนวณ
    const oldSpending = Number(currentData[COL.TOTAL_SPENDING - 1]) || 0;
    const oldPoints = Number(currentData[COL.CURRENT_POINTS - 1]) || 0;
    const oldLifetime = Number(currentData[COL.LIFETIME_POINTS - 1]) || 0;
    const oldVisits = Number(currentData[COL.TOTAL_VISITS - 1]) || 0;
    const oldLevel = currentData[COL.LEVEL - 1] || "Bronze Friend";

    const newSpending = oldSpending + amount;
    const earnedPoints = Math.floor(amount / 10);
    const newPoints = oldPoints + earnedPoints;
    const newLifetime = oldLifetime + earnedPoints;
    const newLevel = calculateLevel(newSpending);

    // 2. บันทึกข้อมูลลง Sheet
    sheet.getRange(targetRow, COL.TOTAL_SPENDING).setValue(newSpending);
    sheet.getRange(targetRow, COL.CURRENT_POINTS).setValue(newPoints);
    sheet.getRange(targetRow, COL.LIFETIME_POINTS).setValue(newLifetime);
    sheet.getRange(targetRow, COL.LEVEL).setValue(newLevel);
    sheet.getRange(targetRow, COL.TOTAL_VISITS).setValue(oldVisits + 1);
    sheet.getRange(targetRow, COL.LAST_ACCESS).setValue(new Date());

    // 3. 💌 ส่งข้อความแจ้งเตือนหาลูกค้าทันที
    let alertMsg = `✨ คุณได้รับแต้มใหม่จาก Daily Pet Shop!\n\n` +
                   `💰 ยอดซื้อ: ฿${amount.toLocaleString()}\n` +
                   `🎁 ได้รับแต้ม: +${earnedPoints} แต้ม\n` +
                   `⭐ แต้มสะสมปัจจุบัน: ${newPoints} แต้ม`;
    
    if (newLevel !== oldLevel) {
      alertMsg += `\n\n🎊 ยินดีด้วยค่ะ! คุณได้เลื่อนระดับเป็น ${newLevel} เรียบร้อยแล้ว 🐾`;
    }

    sendMessage(userId, alertMsg); // เรียกฟังก์ชันส่งข้อความจาก LineAPI.js

    return {
      status: "success",
      customerName: currentData[COL.NICKNAME - 1] || "ลูกค้า",
      newPoints: newPoints,
      newLevel: newLevel
    };

  } catch (e) {
    console.error("❌ addAdminTransaction Error: " + e.message);
    return { status: "error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * รวมข้อมูลสำหรับหน้าแลกรางวัล (คะแนนผู้ใช้ + รายการของรางวัล)
 */
function getRewardPageData(userId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
  const data = sheet.getDataRange().getValues();
  
  const memberRow = data.find(row => row[COL.USER_ID - 1] === userId);
  const points = memberRow ? Number(memberRow[COL.CURRENT_POINTS - 1]) : 0;
  
  return {
    points: points,
    rewards: getRewardsList() // ฟังก์ชันเดิมที่เราสร้างไว้ก่อนหน้านี้
  };
}