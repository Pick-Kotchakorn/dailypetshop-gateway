/**
 * 👤 MEMBERSHIP.gs - Daily Pet Shop (Verified CRM)
 * ระบบจัดการสมาชิกและคะแนนสะสม (Phase 3: Reward System Ready)
 */

// Mapping คอลัมน์ตามลำดับฐานข้อมูล (ตรวจสอบแล้ว: ถูกต้องตาม CRM Analytics)
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
 * 🔍 ตรวจสอบสมาชิกรายเดิม (Robust Comparison)
 */
function isExistingMember(userId) {
  if (!userId) return false;
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    if (!sheet) return false;
    const data = sheet.getDataRange().getValues();
    return data.some(row => row[COL.USER_ID - 1] && row[COL.USER_ID - 1].toString() === userId.toString());
  } catch (e) {
    return false;
  }
}

/**
 * 👤 ดึงข้อมูลโปรไฟล์สมาชิก (สำหรับหน้า Index)
 */
function getCustomerProfile(userId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();

    const idx = data.findIndex((row, i) => 
      i > 0 && row[COL.USER_ID - 1] && row[COL.USER_ID - 1].toString() === userId.toString()
    );

    if (idx === -1) return null;

    const row = data[idx];
    return {
      name: row[COL.NICKNAME - 1] || "สมาชิก",
      level: row[COL.LEVEL - 1] || "Bronze Friend",
      points: Number(row[COL.CURRENT_POINTS - 1] || 0),
      totalSpending: Number(row[COL.TOTAL_SPENDING - 1] || 0),
      memberSince: row[COL.MEMBER_SINCE - 1] ? Utilities.formatDate(new Date(row[COL.MEMBER_SINCE - 1]), "GMT+7", "dd/MM/yyyy") : "-"
    };
  } catch (e) {
    console.error("getCustomerProfile Error: " + e.message);
    return null;
  }
}

/**
 * 🎁 รวมข้อมูลสำหรับหน้าแลกรางวัล
 */
function getRewardPageData(userId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    
    const memberRow = data.find(row => 
      row[COL.USER_ID - 1] && row[COL.USER_ID - 1].toString() === userId.toString()
    );
    
    const points = memberRow ? Number(memberRow[COL.CURRENT_POINTS - 1]) : 0;
    
    return {
      points: points,
      rewards: getRewardsList()
    };
  } catch (e) {
    console.error("getRewardPageData Error: " + e.message);
    return null;
  }
}

/**
 * 📜 ดึงรายการของรางวัลจาก Sheet 'Rewards'
 */
function getRewardsList() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Rewards");
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    data.shift(); // ลบหัวตาราง
    
    return data
      .filter(row => row[6] === "active")
      .map(row => ({
        id: row[0],
        title: row[1],
        description: row[2],
        points: Number(row[3]),
        stock: Number(row[4]),
        image: row[5]
      }));
  } catch (e) {
    return [];
  }
}

/**
 * 🛒 ฟังก์ชันสำหรับกดแลกของรางวัล (Safety Enhanced)
 */
function redeemReward(userId, rewardId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const memberSheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const rewardSheet = ss.getSheetByName("Rewards");

    const memberData = memberSheet.getDataRange().getValues();
    const mIdx = memberData.findIndex(row => row[COL.USER_ID - 1] && row[COL.USER_ID - 1].toString() === userId.toString());
    
    const rewardData = rewardSheet.getDataRange().getValues();
    // ✅ เพิ่มความปลอดภัย: เช็ค row[0] ก่อนเรียก .toString()
    const rIdx = rewardData.findIndex(row => row[0] && row[0].toString() === rewardId.toString());

    if (mIdx === -1 || rIdx === -1) throw new Error("ไม่พบข้อมูลสมาชิกหรือของรางวัล");

    const currentPoints = Number(memberData[mIdx][COL.CURRENT_POINTS - 1]);
    const pointsNeeded = Number(rewardData[rIdx][3]);
    const stock = Number(rewardData[rIdx][4]);

    if (stock <= 0) throw new Error("ขออภัย ของรางวัลหมดแล้วค่ะ");
    if (currentPoints < pointsNeeded) throw new Error("แต้มของคุณไม่เพียงพอ");

    memberSheet.getRange(mIdx + 1, COL.CURRENT_POINTS).setValue(currentPoints - pointsNeeded);
    rewardSheet.getRange(rIdx + 1, 5).setValue(stock - 1);

    sendMessage(userId, `🎊 แลกสำเร็จ!\nคุณได้แลก: ${rewardData[rIdx][1]}\nหักแต้ม: -${pointsNeeded}\nแต้มคงเหลือ: ${currentPoints - pointsNeeded} แต้ม 🐾`);

    return { status: "success", message: "แลกรางวัลเรียบร้อยแล้วค่ะ" };
  } catch (e) {
    return { status: "error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 📝 ลงทะเบียนสมาชิกใหม่
 */
function registerNewMember(formData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    
    if (isExistingMember(formData.userId)) return "คุณเป็นสมาชิกอยู่แล้วค่ะ";

    const initialPoints = 10;
    const now = new Date();
    
    const newRow = new Array(25).fill("");
    newRow[COL.USER_ID - 1] = formData.userId;
    newRow[COL.FULL_NAME - 1] = formData.fullName;
    newRow[COL.NICKNAME - 1] = formData.nickname;
    newRow[COL.GENDER - 1] = formData.gender;
    newRow[COL.TEL - 1] = formData.phone;
    newRow[COL.PROVINCE - 1] = formData.province;
    newRow[COL.MEMBER_SINCE - 1] = now;
    newRow[COL.LAST_ACCESS - 1] = now;
    newRow[COL.TOTAL_VISITS - 1] = 1;
    newRow[COL.STATUS - 1] = "active";
    newRow[COL.CURRENT_POINTS - 1] = initialPoints;
    newRow[COL.LIFETIME_POINTS - 1] = initialPoints;
    newRow[COL.TOTAL_SPENDING - 1] = 0;
    newRow[COL.LEVEL - 1] = "Bronze Friend";

    sheet.appendRow(newRow);
    
    // เชื่อมต่อ Rich Menu สำหรับสมาชิก
    linkRichMenuToUser(formData.userId, "richmenu-a8ca5156afc1998337b1772d90d0e6e0");

    return { status: "Success", name: formData.nickname, points: initialPoints, level: "Bronze Friend" };
  } catch (e) {
    return "Error: " + e.message;
  } finally {
    lock.releaseLock();
  }
}