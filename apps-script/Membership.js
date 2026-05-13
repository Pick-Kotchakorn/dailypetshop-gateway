/**
 * 👤 MEMBERSHIP.js - Daily Pet Shop (Production Ready — v3.1)
 * Fixes: [F1] removed duplicate addAdminTransaction & getMemberSummary
 *        [F2] fixed getCustomerProfile strict equality → toString comparison
 *        [F3] added getMemberSummaryByPhone wrapper (required by Main.js & FlexService.js)
 *        [F4] added welcome push + rich menu link in registerNewMember
 *        [F5] batched setValue calls in addAdminTransaction → single setValues
 *        [F6] added progress % to getMemberSummary return value (required by FlexService.js)
 *        [F7] fixed redeemReward memberIdx strict equality → toString comparison
 */

// ── Column Index Map (1-based, matches Membership sheet) ──────────────────────
const COL = {
  USER_ID: 1, FULL_NAME: 2, NICKNAME: 3, GENDER: 4, BIRTHDAY: 5,
  TEL: 6, PROVINCE: 7, PET_INFO: 8, MEMBER_SINCE: 9, LAST_ACCESS: 10,
  TOTAL_VISITS: 11, STATUS: 12, ADDED_FROM: 13, CURRENT_POINTS: 14,
  LIFETIME_POINTS: 15, TOTAL_SPENDING: 16, LEVEL: 17
};

// ── Internal: Auto-Tier calculation ───────────────────────────────────────────
function _calcTier(lifetimePoints) {
  const t = getConfig().LOYALTY.TIERS;
  if (lifetimePoints >= t.PLATINUM.THRESHOLD) return t.PLATINUM.NAME;
  if (lifetimePoints >= t.GOLD.THRESHOLD)     return t.GOLD.NAME;
  if (lifetimePoints >= t.SILVER.THRESHOLD)   return t.SILVER.NAME;
  return t.BRONZE.NAME;
}

// ── Internal: Next-tier calculation ───────────────────────────────────────────
function _calcNextTier(points) {
  const t = getConfig().LOYALTY.TIERS;
  if (points < t.SILVER.THRESHOLD)   return { pointsToNextTier: t.SILVER.THRESHOLD - points,   nextTierName: t.SILVER.NAME,   progress: Math.floor((points / t.SILVER.THRESHOLD) * 100) };
  if (points < t.GOLD.THRESHOLD)     return { pointsToNextTier: t.GOLD.THRESHOLD - points,     nextTierName: t.GOLD.NAME,     progress: Math.floor(((points - t.SILVER.THRESHOLD) / (t.GOLD.THRESHOLD - t.SILVER.THRESHOLD)) * 100) };
  if (points < t.PLATINUM.THRESHOLD) return { pointsToNextTier: t.PLATINUM.THRESHOLD - points, nextTierName: t.PLATINUM.NAME, progress: Math.floor(((points - t.GOLD.THRESHOLD) / (t.PLATINUM.THRESHOLD - t.GOLD.THRESHOLD)) * 100) };
  return { pointsToNextTier: 0, nextTierName: t.PLATINUM.NAME, progress: 100 };
}


// ═════════════════════════════════════════════════════════════════════════════
// 1. READ FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

function getCustomerProfile(userId) {
  if (!userId) return null;
  return getCachedData(`profile_${userId}`, () => {
    try {
      const data = getSheet(CONFIG.SHEET_NAME.MEMBERS).getDataRange().getValues();
      // [F2] toString comparison — prevents Sheets number-type mismatch
      const idx = data.findIndex(r => r[0] && r[0].toString().trim() === userId.toString().trim());
      if (idx === -1) return null;
      const r = data[idx];
      return {
        userId:  r[COL.USER_ID - 1].toString().trim(),
        name:    r[COL.NICKNAME - 1] || r[COL.FULL_NAME - 1] || 'สมาชิก',
        points:  Number(r[COL.CURRENT_POINTS - 1] || 0),
        tier:    r[COL.LEVEL - 1] || CONFIG.LOYALTY.TIERS.BRONZE.NAME,
        petInfo: r[COL.PET_INFO - 1] || ''
      };
    } catch (e) {
      console.error('❌ [getCustomerProfile]', e.message);
      return null;
    }
  });
}

function getCustomerProfileByPhone(phone) {
  if (!phone) return null;
  try {
    const sheet = getSheet(CONFIG.SHEET_NAME.MEMBERS);
    const cleanPhone = phone.toString().replace(/[^0-9]/g, '').trim();
    const result = sheet.getRange('F:F').createTextFinder(cleanPhone).matchEntireCell(true).findNext();
    if (!result || result.getRow() === 1) return null;
    const rowIndex = result.getRow();
    const r = sheet.getRange(rowIndex, 1, 1, 17).getValues()[0];
    return {
      userId:   r[COL.USER_ID - 1].toString().trim(),
      name:     r[COL.NICKNAME - 1] || r[COL.FULL_NAME - 1] || 'สมาชิก',
      tel:      r[COL.TEL - 1] || '',
      points:   Number(r[COL.CURRENT_POINTS - 1] || 0),
      tier:     r[COL.LEVEL - 1] || CONFIG.LOYALTY.TIERS.BRONZE.NAME,
      petInfo:  r[COL.PET_INFO - 1] || '',
      rowIndex: rowIndex
    };
  } catch (e) {
    console.error('❌ [getCustomerProfileByPhone]', e.message);
    return null;
  }
}

// [F3] Wrapper required by Main.js (_handleCheckPointsIntent) & FlexService.js
function getMemberSummaryByPhone(phone) {
  const profile = getCustomerProfileByPhone(phone);
  if (!profile) return null;
  return _buildSummary(profile);
}

function getMemberSummary(userId) {
  // [F1] Single declaration — duplicate removed
  if (!userId) return null;
  return getCachedData(`summary_${userId}`, () => {
    const profile = getCustomerProfile(userId);
    if (!profile) return null;
    return _buildSummary(profile);
  });
}

// Internal: build summary object shared by getMemberSummary & getMemberSummaryByPhone
function _buildSummary(profile) {
  const { pointsToNextTier, nextTierName, progress } = _calcNextTier(profile.points);
  return {
    name:           profile.name,
    tel:            profile.tel || '',
    points:         profile.points,
    tier:           profile.tier,
    pointsToNext:   pointsToNextTier,   // alias used by FlexService.js getFlexMemberSummary
    pointsToNextTier: pointsToNextTier, // canonical key used by getMemberSummary callers
    nextTier:       nextTierName,        // alias used by FlexService.js
    nextTierName:   nextTierName,        // canonical key
    progress:       progress,            // [F6] required by FlexService.js progress bar
    today:          Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy')
  };
}


// ═════════════════════════════════════════════════════════════════════════════
// 2. WRITE FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

function registerNewMember(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(CONFIG.SHEET_NAME.MEMBERS);
    const existing = getCustomerProfileByPhone(data.phone);
    if (existing && existing.userId !== data.userId) {
      return { status: 'Error', message: 'เบอร์โทรนี้ถูกใช้งานแล้ว' };
    }
    const now = new Date();
    const cfg = getConfig();
    sheet.appendRow([
      data.userId, data.fullname, data.nickname, data.gender, data.birthday,
      data.phone, data.province, data.petinfo, now, now, 1, 'active', 'LIFF',
      cfg.LOYALTY.WELCOME_POINTS, cfg.LOYALTY.WELCOME_POINTS, 0, cfg.LOYALTY.TIERS.BRONZE.NAME
    ]);
    clearUserCache(data.userId);

    // [F4] Send welcome message + link member rich menu
    try {
      sendMessage(data.userId,
        `🎉 ยินดีต้อนรับสู่ Daily Pet Club!\n` +
        `คุณได้รับแต้มต้อนรับ ${cfg.LOYALTY.WELCOME_POINTS} แต้มทันที 🐾\n` +
        `สะสมแต้มเพื่อแลกรับของรางวัลสุดพิเศษได้เลยค่ะ`
      );
    } catch (e) { console.warn('⚠️ [registerNewMember] sendMessage failed:', e.message); }
    try {
      linkRichMenuToUser(data.userId, cfg.ALIAS.MEMBER.HOME);
    } catch (e) { console.warn('⚠️ [registerNewMember] linkRichMenu failed:', e.message); }

    return { status: 'Success' };
  } catch (e) {
    console.error('❌ [registerNewMember]', e.message);
    return { status: 'Error', message: e.message };
  } finally {
    lock.releaseLock();
  }
}

// [F1] Single declaration — duplicate removed. [F5] Batched setValues.
function addAdminTransaction(adminId, targetUid, amount, note) {
  const cfg = getConfig();
  if (!cfg.ADMIN_WHITELIST.includes(adminId)) {
    return { status: 'error', message: 'คุณไม่มีสิทธิ์ดำเนินการ' };
  }
  if (!targetUid || !amount || amount <= 0) {
    return { status: 'error', message: 'ข้อมูลไม่ถูกต้อง' };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheet(cfg.SHEET_NAME.MEMBERS);
    const data  = sheet.getDataRange().getValues();
    const idx   = data.findIndex(r => r[0] && r[0].toString().trim() === targetUid.toString().trim());
    if (idx === -1) return { status: 'error', message: 'ไม่พบข้อมูลสมาชิก' };

    const row             = idx + 1;
    const currentPoints   = Number(data[idx][COL.CURRENT_POINTS - 1]  || 0);
    const currentLifetime = Number(data[idx][COL.LIFETIME_POINTS - 1] || 0);
    const currentSpending = Number(data[idx][COL.TOTAL_SPENDING - 1]  || 0);
    const newPoints       = Math.floor(amount / cfg.LOYALTY.THB_PER_TOKEN);
    const finalLifetime   = currentLifetime + newPoints;
    const newLevel        = _calcTier(finalLifetime);
    const now             = new Date();

    // [F5] Batch: write all 5 fields in one setValues call
    sheet.getRange(row, COL.CURRENT_POINTS, 1, 4).setValues([[
      currentPoints + newPoints,
      finalLifetime,
      currentSpending + amount,
      now
    ]]);
    sheet.getRange(row, COL.LEVEL).setValue(newLevel);

    clearUserCache(targetUid);
    try {
      sendMessage(targetUid,
        `✨ ขอบคุณที่อุดหนุนนะคะ!\n` +
        `💰 ยอดซื้อ: ฿${amount.toLocaleString()}\n` +
        `🎁 ได้แต้มเพิ่ม: +${newPoints} แต้ม\n` +
        `🌟 ระดับสมาชิก: ${newLevel}`
      );
    } catch (e) { console.warn('⚠️ [addAdminTransaction] sendMessage failed:', e.message); }

    return { status: 'success', newLevel: newLevel, pointsEarned: newPoints };
  } catch (e) {
    console.error('❌ [addAdminTransaction]', e.message);
    return { status: 'error', message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function redeemReward(userId, rewardId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const cfg         = getConfig();
    const ss          = getSS();
    const rewardSheet = ss.getSheetByName(cfg.SHEET_NAME.REWARDS);
    const rewardData  = rewardSheet.getDataRange().getValues();

    // skip header row in search
    const rewardIdx = rewardData.slice(1).findIndex(r => r[0].toString() === rewardId.toString());
    if (rewardIdx === -1) return { status: 'Error', message: 'ไม่พบของรางวัล' };
    const rewardRow    = rewardIdx + 2; // +2: slice(1) offset + 1-based row
    const pointsNeeded = Number(rewardData[rewardIdx + 1][3]);
    const currentStock = Number(rewardData[rewardIdx + 1][4]);
    const rewardTitle  = rewardData[rewardIdx + 1][1];

    if (currentStock <= 0) return { status: 'Error', message: 'ของรางวัลหมดแล้ว' };

    const memberSheet = ss.getSheetByName(cfg.SHEET_NAME.MEMBERS);
    const memberData  = memberSheet.getDataRange().getValues();
    // [F7] toString comparison
    const memberIdx = memberData.findIndex(r => r[0] && r[0].toString().trim() === userId.toString().trim());
    if (memberIdx === -1) return { status: 'Error', message: 'ไม่พบสมาชิก' };

    const userPoints = Number(memberData[memberIdx][COL.CURRENT_POINTS - 1]);
    if (userPoints < pointsNeeded) return { status: 'Error', message: 'แต้มไม่พอ' };

    // Deduct points + reduce stock
    memberSheet.getRange(memberIdx + 1, COL.CURRENT_POINTS).setValue(userPoints - pointsNeeded);
    rewardSheet.getRange(rewardRow, 5).setValue(currentStock - 1);

    // Low stock alert
    if (currentStock - 1 <= cfg.INVENTORY.LOW_STOCK_THRESHOLD) {
      sendAdminAlert(`⚠️ ของรางวัลใกล้หมด: ${rewardTitle} (เหลือ ${currentStock - 1} ชิ้น)`);
    }

    // Log order
    const orderId = 'REDEEM-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd-HHmmss');
    ss.getSheetByName(cfg.SHEET_NAME.ORDERS).appendRow([
      orderId, userId, rewardTitle, pointsNeeded, 'Pending', '-', new Date()
    ]);

    clearUserCache(userId);
    return { status: 'Success', message: 'แลกรางวัลสำเร็จแล้วค่ะ!' };
  } catch (e) {
    console.error('❌ [redeemReward]', e.message);
    return { status: 'Error', message: e.message };
  } finally {
    lock.releaseLock();
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 3. HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function sendAdminAlert(text) {
  const adminGroupId = getConfig().INVENTORY.ADMIN_GROUP_ID;
  if (adminGroupId) {
    try { sendMessage(adminGroupId, text); } catch (e) { /* non-critical */ }
  }
  console.warn('ADMIN ALERT: ' + text);
}