/**
 * 👤 MEMBERSHIP.gs - Daily Pet Shop (Verified CRM Engine - Phone Search Version)
 */

// Mapping columns A-Q (คงเดิม)
const COL = {
  USER_ID: 1, FULL_NAME: 2, NICKNAME: 3, GENDER: 4, BIRTHDAY: 5,
  TEL: 6, PROVINCE: 7, PET_INFO: 8, MEMBER_SINCE: 9, LAST_ACCESS: 10,
  TOTAL_VISITS: 11, STATUS: 12, ADDED_FROM: 13, CURRENT_POINTS: 14,
  LIFETIME_POINTS: 15, TOTAL_SPENDING: 16, LEVEL: 17
};

/**
 * 🔍 1. ค้นหาโปรไฟล์จากเบอร์โทรศัพท์ (New Search Logic)
 */
function getCustomerProfileByPhone(phone) {
  try {
    if (!phone) return null;
    const sheet = getSheet(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    const cleanPhone = phone.toString().replace(/[^0-9]/g, "").trim();

    // ค้นหาในคอลัมน์ F (TEL)
    const idx = data.findIndex((row, i) => 
      i > 0 && row[COL.TEL - 1] && row[COL.TEL - 1].toString().trim() === cleanPhone
    );

    if (idx === -1) return null;
    const row = data[idx];

    return {
      userId: String(row[COL.USER_ID - 1]).trim(),
      name: String(row[COL.NICKNAME - 1] || row[COL.FULL_NAME - 1] || "สมาชิก"),
      level: String(row[COL.LEVEL - 1] || CONFIG.LOYALTY.TIERS.BRONZE.NAME),
      points: Number(row[COL.CURRENT_POINTS - 1] || 0),
      lifetimePoints: Number(row[COL.LIFETIME_POINTS - 1] || 0),
      totalSpending: Number(row[COL.TOTAL_SPENDING - 1] || 0),
      memberSince: (row[COL.MEMBER_SINCE - 1] instanceof Date) 
        ? Utilities.formatDate(row[COL.MEMBER_SINCE - 1], "GMT+7", "dd/MM/yyyy") 
        : String(row[COL.MEMBER_SINCE - 1] || "-")
    };
  } catch (e) {
    console.error("getCustomerProfileByPhone Error: " + e.message);
    return null;
  }
}

/**
 * 🐾 สรุปข้อมูลสมาชิกสำหรับ Flex Message (ค้นหาด้วยเบอร์โทร) - เวอร์ชันอัปเดตตัวแปรใหม่
 */
function getMemberSummaryByPhone(phone) {
  const profile = getCustomerProfileByPhone(phone);
  if (!profile) return null;

  const currentLifetime = Number(profile.lifetimePoints) || 0;
  const level = profile.level || CONFIG.LOYALTY.TIERS.BRONZE.NAME;
  
  const thresholds = CONFIG.LOYALTY.TIERS;
  let nextTierPoints = 0;
  let nextTierName = "MAX LEVEL"; // กรณีเป็นระดับสูงสุดแล้ว

  // Logic การหาระดับถัดไป (Next Tier)
  if (level === thresholds.BRONZE.NAME) {
    nextTierPoints = thresholds.SILVER.THRESHOLD;
    nextTierName = thresholds.SILVER.NAME;
  } else if (level === thresholds.SILVER.NAME) {
    nextTierPoints = thresholds.GOLD.THRESHOLD;
    nextTierName = thresholds.GOLD.NAME;
  } else if (level === thresholds.GOLD.NAME) {
    nextTierPoints = thresholds.PLATINUM.THRESHOLD;
    nextTierName = thresholds.PLATINUM.NAME;
  }

  // คำนวณส่วนต่างและ % ความคืบหน้า
  const pointsToNextTier = nextTierPoints > 0 ? Math.max(0, nextTierPoints - currentLifetime) : 0;
  const progressPercent = nextTierPoints > 0 ? Math.min(100, (currentLifetime / nextTierPoints) * 100) : 100;

  // ส่งคืน Object พร้อมตัวแปรที่ตรงกับ JSON Placeholder
  return {
    name: profile.name || "คุณลูกค้า",
    tel: phone, // ส่งเบอร์โทรกลับไปที่ Flex
    tier: level,
    points: Number(profile.points) || 0,
    pointsToNext: pointsToNextTier,
    progress: progressPercent.toFixed(0),
    nextTier: nextTierName,
    today: Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm"), // วันเวลาที่ตอบกลับ
    lastAccess: profile.memberSince || "-"
  };
}

/**
 * 📝 3. ฟังก์ชันสมัครสมาชิก (คงเดิมจากเวอร์ชันเช็คเบอร์โทรซ้ำ)
 */
function registerNewMember(formData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // ป้องกันการเขียนข้อมูลทับซ้อนกัน[cite: 9]
    
    const sheet = getSheet(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    const cleanPhone = formData.phone.toString().replace(/[^0-9]/g, "").trim();
    const currentUserId = String(formData.userId || "").trim();
    
    // 🔍 ค้นหาแถวเดิมจากเบอร์โทรศัพท์ (Column F)[cite: 9]
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][COL.TEL - 1] && data[i][COL.TEL - 1].toString().trim() === cleanPhone) {
        rowIndex = i + 1; // พบเบอร์โทรเดิมในระบบ
        break;
      }
    }

    const now = new Date();

    if (rowIndex !== -1) {
      // 🔄 CASE 1: อัปเดตข้อมูลสมาชิกเดิม (Update)
      // อัปเดตข้อมูลส่วนตัว แต่คงค่าแต้มและวันที่เริ่มเป็นสมาชิกไว้[cite: 9]
      if (currentUserId) {
        sheet.getRange(rowIndex, COL.USER_ID).setValue(currentUserId);
      }
      sheet.getRange(rowIndex, COL.FULL_NAME).setValue(formData.fullname);
      sheet.getRange(rowIndex, COL.NICKNAME).setValue(formData.nickname || "สมาชิก");
      sheet.getRange(rowIndex, COL.GENDER).setValue(formData.gender || "-");
      sheet.getRange(rowIndex, COL.BIRTHDAY).setValue(formData.birthday || "-");
      sheet.getRange(rowIndex, COL.PROVINCE).setValue(formData.province || "-");
      sheet.getRange(rowIndex, COL.PET_INFO).setValue(formData.petinfo || "-");
      sheet.getRange(rowIndex, COL.LAST_ACCESS).setValue(now);
      
      // ผูก Rich Menu ใหม่เพื่อให้แน่ใจว่าสถานะบน LINE ถูกต้อง[cite: 12]
      if (currentUserId) {
        linkRichMenuToUser(currentUserId, CONFIG.ALIAS.MEMBER.HOME);
      }

      return { 
        status: "Success", 
        message: "อัปเดตข้อมูลสมาชิกเรียบร้อยแล้วค่ะ 🐾", 
        name: formData.nickname,
        isUpdate: true 
      };

    } else {
      // ✨ CASE 2: สมัครสมาชิกใหม่ (Append Row)[cite: 9, 13]
      const initialPoints = CONFIG.LOYALTY.WELCOME_POINTS;
      const newMemberRow = new Array(17).fill("");
      
      newMemberRow[COL.USER_ID - 1] = currentUserId;
      newMemberRow[COL.FULL_NAME - 1] = formData.fullname;
      newMemberRow[COL.NICKNAME - 1] = formData.nickname || "สมาชิก";
      newMemberRow[COL.GENDER - 1] = formData.gender || "-";
      newMemberRow[COL.BIRTHDAY - 1] = formData.birthday || "-";
      newMemberRow[COL.TEL - 1] = cleanPhone;
      newMemberRow[COL.PROVINCE - 1] = formData.province || "-";
      newMemberRow[COL.PET_INFO - 1] = formData.petinfo || "-";
      newMemberRow[COL.MEMBER_SINCE - 1] = now;
      newMemberRow[COL.LAST_ACCESS - 1] = now;
      newMemberRow[COL.TOTAL_VISITS - 1] = 1;
      newMemberRow[COL.STATUS - 1] = "active";
      newMemberRow[COL.ADDED_FROM - 1] = "LIFF_REGISTRATION";
      newMemberRow[COL.CURRENT_POINTS - 1] = initialPoints;
      newMemberRow[COL.LIFETIME_POINTS - 1] = initialPoints;
      newMemberRow[COL.TOTAL_SPENDING - 1] = 0;
      newMemberRow[COL.LEVEL - 1] = CONFIG.LOYALTY.TIERS.BRONZE.NAME;

      sheet.appendRow(newMemberRow);
      
      if (currentUserId) {
        linkRichMenuToUser(currentUserId, CONFIG.ALIAS.MEMBER.HOME);
        sendMessage(currentUserId, `🎊 ยินดีด้วยค่ะคุณ ${formData.nickname}! สมัครสำเร็จแล้ว รับฟรี ${initialPoints} แต้มค่ะ 🐾`);
      }

      return { status: "Success", name: formData.nickname, points: initialPoints, isUpdate: false };
    }
  } catch (e) {
    return { status: "Error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 💰 4. บันทึกยอดการใช้จ่ายและคำนวณระดับสมาชิก (Admin Only)
 */
function addAdminTransaction(adminId, targetUid, amount, note) {
  if (!CONFIG.ADMIN_WHITELIST.includes(adminId)) {
    return { status: "error", message: "คุณไม่มีสิทธิ์ดำเนินการ" };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(r => r[COL.USER_ID - 1] && r[COL.USER_ID - 1].toString().trim() === targetUid.toString().trim());

    if (idx === -1) return { status: "error", message: "ไม่พบข้อมูลสมาชิก" };

    const row = idx + 1;
    const currentPoints = Number(data[idx][COL.CURRENT_POINTS - 1] || 0);
    const currentLifetime = Number(data[idx][COL.LIFETIME_POINTS - 1] || 0);
    const currentSpending = Number(data[idx][COL.TOTAL_SPENDING - 1] || 0);
    
    const newPointsEarned = Math.floor(amount / CONFIG.LOYALTY.THB_PER_TOKEN); 
    const finalLifetimePoints = currentLifetime + newPointsEarned;
    const finalSpending = currentSpending + amount;

    let newLevel = CONFIG.LOYALTY.TIERS.BRONZE.NAME;
    if (finalLifetimePoints >= CONFIG.LOYALTY.TIERS.GOLD.THRESHOLD) {
      newLevel = CONFIG.LOYALTY.TIERS.GOLD.NAME;
    } else if (finalLifetimePoints >= CONFIG.LOYALTY.TIERS.SILVER.THRESHOLD) {
      newLevel = CONFIG.LOYALTY.TIERS.SILVER.NAME;
    }

    sheet.getRange(row, COL.CURRENT_POINTS).setValue(currentPoints + newPointsEarned);
    sheet.getRange(row, COL.LIFETIME_POINTS).setValue(finalLifetimePoints);
    sheet.getRange(row, COL.TOTAL_SPENDING).setValue(finalSpending);
    sheet.getRange(row, COL.LEVEL).setValue(newLevel);
    sheet.getRange(row, COL.LAST_ACCESS).setValue(new Date());

    sendMessage(targetUid, `✨ ขอบคุณที่อุดหนุนนะคะ!\n💰 ยอดซื้อ: ฿${amount.toLocaleString()}\n🎁 ได้รับเพิ่ม: +${newPointsEarned} แต้ม\n🌟 ระดับปัจจุบัน: ${newLevel}`);

    return { status: "success", customerName: String(data[idx][COL.NICKNAME - 1]), newLevel: newLevel };
  } catch (e) {
    return { status: "error", message: e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 🐾 5. สรุปข้อมูลสมาชิกสำหรับ Flex Message
 */
function getMemberSummary(userId) {
  const profile = getCustomerProfile(userId);
  if (!profile) return null;

  const currentLifetime = Number(profile.lifetimePoints) || 0;
  const level = profile.level || CONFIG.LOYALTY.TIERS.BRONZE.NAME;
  
  const thresholds = CONFIG.LOYALTY.TIERS;
  let nextTierPoints = thresholds.SILVER.THRESHOLD;
  let nextTierName = thresholds.SILVER.NAME;

  if (level === thresholds.SILVER.NAME) {
    nextTierPoints = thresholds.GOLD.THRESHOLD;
    nextTierName = thresholds.GOLD.NAME;
  } else if (level === thresholds.GOLD.NAME) {
    nextTierPoints = thresholds.PLATINUM.THRESHOLD;
    nextTierName = thresholds.PLATINUM.NAME;
  }

  const pointsToNextTier = Math.max(0, nextTierPoints - currentLifetime);
  const progressPercent = nextTierPoints > 0 ? Math.min(100, (currentLifetime / nextTierPoints) * 100) : 0;

  return {
    name: profile.name || "คุณลูกค้า",
    tier: level,
    points: Number(profile.points) || 0,
    pointsToNext: pointsToNextTier,
    progress: progressPercent.toFixed(0),
    nextTier: nextTierName,
    lastAccess: profile.memberSince || "-"
  };
}

/**
 * 🔍 ฟังก์ชันเสริมสำหรับดึงโปรไฟล์ลูกค้าจาก User ID (เพิ่มเข้าไปใน Membership.gs)
 */
function getCustomerProfile(userId) {
  try {
    if (!userId) return null;
    const sheet = getSheet(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();

    // ค้นหาในคอลัมน์ A (USER_ID)
    const idx = data.findIndex((row, i) => 
      i > 0 && row[COL.USER_ID - 1] && row[COL.USER_ID - 1].toString().trim() === userId.toString().trim()
    );

    if (idx === -1) return null;
    const row = data[idx];

    return {
      userId: String(row[COL.USER_ID - 1]).trim(),
      name: String(row[COL.NICKNAME - 1] || row[COL.FULL_NAME - 1] || "สมาชิก"),
      level: String(row[COL.LEVEL - 1] || CONFIG.LOYALTY.TIERS.BRONZE.NAME),
      points: Number(row[COL.CURRENT_POINTS - 1] || 0),
      lifetimePoints: Number(row[COL.LIFETIME_POINTS - 1] || 0),
      totalSpending: Number(row[COL.TOTAL_SPENDING - 1] || 0),
      memberSince: (row[COL.MEMBER_SINCE - 1] instanceof Date) 
        ? Utilities.formatDate(row[COL.MEMBER_SINCE - 1], "GMT+7", "dd/MM/yyyy") 
        : String(row[COL.MEMBER_SINCE - 1] || "-")
    };
  } catch (e) {
    console.error("getCustomerProfile Error: " + e.message);
    return null;
  }
}

/**
 * 🎁 redeemReward - Securely handles point deduction and stock management.
 * @param {string} userId - The LINE User ID of the member.
 * @param {string} rewardId - The unique ID of the reward item.
 * @returns {object} Status message and transaction details.
 */
function redeemReward(userId, rewardId) {
  const lock = LockService.getScriptLock();
  try {
    // 1. Atomic Lock: Wait up to 10 seconds for other processes to finish
    lock.waitLock(10000);

    const ss = getSS();
    const memberSheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const rewardSheet = ss.getSheetByName(CONFIG.SHEET_NAME.REWARDS);

    // 🔍 2. Double Check Reward Stock
    const rewardData = rewardSheet.getDataRange().getValues();
    const rewardIdx = rewardData.findIndex(row => row[0].toString() === rewardId.toString());

    if (rewardIdx === -1) throw new Error("ไม่พบข้อมูลของรางวัลในระบบ");

    const rewardRow = rewardIdx + 1;
    const rewardTitle = rewardData[rewardIdx][1];
    const pointsNeeded = Number(rewardData[rewardIdx][3]);
    const currentStock = Number(rewardData[rewardIdx][4]);

    if (currentStock <= 0) {
      return { status: "Error", message: `ขออภัยค่ะ "${rewardTitle}" หมดแล้ว` };
    }

    // 🔍 3. Double Check Member Points
    const memberData = memberSheet.getDataRange().getValues();
    const memberIdx = memberData.findIndex(row => row[COL.USER_ID - 1] === userId);

    if (memberIdx === -1) throw new Error("ไม่พบข้อมูลสมาชิกของคุณ");

    const memberRow = memberIdx + 1;
    const userPoints = Number(memberData[memberIdx][COL.CURRENT_POINTS - 1]);

    if (userPoints < pointsNeeded) {
      return { status: "Error", message: `แต้มของคุณไม่พอ (ขาดอีก ${pointsNeeded - userPoints} แต้ม)` };
    }

    // 🚀 4. Execute Transaction (Atomic Operations)
    // A. Deduct Points from Member[cite: 9]
    memberSheet.getRange(memberRow, COL.CURRENT_POINTS).setValue(userPoints - pointsNeeded);
    
    // B. Decrease Stock by 1
    rewardSheet.getRange(rewardRow, 5).setValue(currentStock - 1);

    // C. Record the Order in 'Orders' Sheet[cite: 13]
    const orderSheet = ss.getSheetByName(CONFIG.SHEET_NAME.ORDERS);
    const orderId = "REDEEM-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
    orderSheet.appendRow([
      orderId, 
      userId, 
      rewardTitle, 
      pointsNeeded, 
      "Pending", 
      "-", 
      new Date()
    ]);

    // 5. Notify User via LINE[cite: 7]
    sendMessage(userId, `🎁 แลกรับ "${rewardTitle}" สำเร็จ!\nใช้ไป ${pointsNeeded} แต้ม\nคงเหลือ ${userPoints - pointsNeeded} แต้มค่ะ`);

    return { 
      status: "Success", 
      message: `แลก "${rewardTitle}" สำเร็จแล้วค่ะ! เจ้าหน้าที่จะดำเนินการจัดส่งให้โดยเร็วที่สุด`,
      orderId: orderId
    };

  } catch (e) {
    console.error("Redeem Error: " + e.message);
    return { status: "Error", message: "ระบบขัดข้อง: " + e.message };
  } finally {
    // 🔓 Release lock so other users can redeem
    lock.releaseLock();
  }
}