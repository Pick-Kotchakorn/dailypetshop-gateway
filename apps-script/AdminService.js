/**
 * 🛠️ ADMINSERVICE.js - Daily Pet Shop (Production Ready — v3.1)
 *
 * Fixes v3.1:
 *   [A1] updateRewardStock() — off-by-one bug: findIndex ครอบคลุม header row ทำให้
 *        idx=0 ชี้ไปที่ header → เขียนทับ header แถวที่ 1
 *        แก้ไข: data.slice(1).findIndex(...) แล้วใช้ idx + 2
 *   [A2] เพิ่ม getRewardList(userId) — ถูกเรียกใน Reward.html แต่ไม่มีใน codebase
 *        return { userPoints: number, rewards: Array } ตามที่ Reward.html คาดหวัง
 */


// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🛠️ ดึงรายการของรางวัลทั้งหมดสำหรับ Admin Dashboard
 * @returns {Array} รายการของรางวัลพร้อมรายละเอียด
 */
function getAdminRewardList() {
  const ss    = getSS();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.REWARDS);
  const data  = sheet.getDataRange().getValues();

  // slice(1) ตัด header row ออกก่อนแปลงเป็น Array of Objects
  return data.slice(1).map(row => ({
    id:          row[0],
    title:       row[1],
    description: row[2],
    points:      row[3],
    stock:       row[4],
    image:       row[5],
    status:      row[6]
  }));
}

/**
 * 📦 อัปเดตจำนวนสต็อกของรางวัล
 * [A1] แก้ off-by-one: ใช้ data.slice(1).findIndex() แล้วบวก 2 เพื่อให้ได้ row จริงใน sheet
 *      (slice(1) offset +1, 1-based row index +1 = +2)
 * @param {string} rewardId - ID ของรางวัล
 * @param {number} newStock - จำนวนสต็อกใหม่
 * @returns {{ status: string, message: string }}
 */
function updateRewardStock(rewardId, newStock) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(CONFIG.SHEET_NAME.REWARDS);
    const data  = sheet.getDataRange().getValues();

    // [A1] slice(1) เพื่อข้าม header → idx ชี้ใน data array ที่ไม่มี header
    //      row จริงใน sheet = idx + 2  (offset ที่ slice ตัดออก 1 + 1-based index 1 = 2)
    const idx = data.slice(1).findIndex(row => row[0].toString() === rewardId.toString());

    if (idx !== -1) {
      sheet.getRange(idx + 2, 5).setValue(newStock); // คอลัมน์ 5 = Stock
      return { status: "Success", message: "อัปเดตสต็อกเรียบร้อยแล้ว" };
    }
    throw new Error("ไม่พบไอดีของรางวัล");
  } catch (e) {
    return { status: "Error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. Member-Facing Functions (called from Reward.html)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🎁 ดึงรายการของรางวัลพร้อมคะแนนปัจจุบันของสมาชิก
 * [A2] ฟังก์ชันนี้ถูกเรียกใน Reward.html: google.script.run.getRewardList(userId)
 *      แต่ไม่เคยมีการนิยามไว้ใน codebase → เพิ่มให้ครบ
 *
 * @param {string} userId - LINE User ID ของสมาชิก
 * @returns {{ userPoints: number, rewards: Array }} คะแนนและรายการของรางวัลที่ active
 */
function getRewardList(userId) {
  try {
    // ดึงคะแนนปัจจุบันของสมาชิก (0 ถ้าไม่พบหรือยังไม่ได้สมัคร)
    const profile   = userId ? getCustomerProfile(userId) : null;
    const userPoints = profile ? Number(profile.points) : 0;

    // ดึงรายการของรางวัลเฉพาะที่ status = 'active'
    const sheet  = getSheet(CONFIG.SHEET_NAME.REWARDS);
    const data   = sheet.getDataRange().getValues();
    const rewards = data.slice(1)
      .filter(row => row[6] && row[6].toString().toLowerCase() === 'active')
      .map(row => ({
        id:          row[0],
        title:       row[1],
        description: row[2],
        points:      row[3],
        stock:       row[4],
        image:       row[5],
        status:      row[6]
      }));

    return { userPoints, rewards };
  } catch (e) {
    console.error("❌ [getRewardList]", e.message);
    return { userPoints: 0, rewards: [] };
  }
}

/**
 * ⚙️ คืนค่า LIFF ID จาก Config สำหรับใช้ init LIFF ฝั่ง HTML
 * ถูกเรียกจาก Admin.html, Reward.html: google.script.run.getLiffIdConfig()
 * @returns {string} LIFF ID
 */
function getLiffIdConfig() {
  return getConfig().LIFF_ID || '';
}