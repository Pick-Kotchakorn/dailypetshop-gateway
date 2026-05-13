/**
 * 🎫 FLEXSERVICE.js - Daily Pet Shop (Dialogflow Support Version — v3.1)
 * หน้าที่: สร้างโครงสร้าง JSON ของ Flex Message เพื่อส่งกลับไปให้ Dialogflow
 *
 * Fixes v3.1:
 *   [F1] getFlexMemberSummary() — property mismatch:
 *        summary.pointsToNext  → summary.pointsToNextTier  (canonical key จาก _buildSummary)
 *        summary.nextTier      → summary.nextTierName       (canonical key จาก _buildSummary)
 *        ก่อนแก้: แสดง "undefined แต้ม เพื่อเป็น undefined" ใน Flex body ทุกครั้ง
 *   [F2] createDynamicMemberCard() — แก้ key ให้ตรงกันทั้ง ### placeholder replacements
 *        (pointsToNext → pointsToNextTier, nextTier → nextTierName)
 *        และลบ defensive check `typeof getMemberSummary === 'function'` ออก
 *        เพราะ Membership.js compile อยู่ใน project เดียวกันเสมอ
 */


// ─────────────────────────────────────────────────────────────────────────────
// 1. Member Summary Flex Card
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🐾 สร้าง Flex Message แสดงข้อมูลสมาชิก (ใช้ส่งตอบ Dialogflow)
 * รับ summary object จาก getMemberSummary() หรือ getMemberSummaryByPhone()
 *
 * Keys ที่ใช้จาก summary (_buildSummary ใน Membership.js):
 *   .name, .tier, .points, .pointsToNextTier [F1], .nextTierName [F1], .progress
 *
 * @param {Object} summary - object จาก _buildSummary()
 * @returns {Object|null}  - Flex bubble JSON หรือ null ถ้าไม่มีข้อมูล
 */
function getFlexMemberSummary(summary) {
  if (!summary) return null;

  const fmt = (num) => Number(num || 0).toLocaleString('th-TH');

  // สีตามระดับสมาชิกจาก Config
  let tierColor = CONFIG.COLORS.TIER.BRONZE;
  if (summary.tier.includes("Silver"))   tierColor = CONFIG.COLORS.TIER.SILVER;
  if (summary.tier.includes("Gold"))     tierColor = CONFIG.COLORS.TIER.GOLD;
  if (summary.tier.includes("Platinum")) tierColor = CONFIG.COLORS.TIER.PLATINUM;

  return {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "DAILY PET CLUB",
          "weight": "bold",
          "color": "#ffffff",
          "size": "sm"
        }
      ],
      "backgroundColor": CONFIG.COLORS.PRIMARY
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "ข้อมูลสมาชิกของคุณ",
          "weight": "bold",
          "size": "md",
          "color": CONFIG.COLORS.PRIMARY
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "spacing": "sm",
          "contents": [
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "ชื่อสมาชิก",  "size": "sm", "color": "#555555" },
                { "type": "text", "text": summary.name,  "size": "sm", "color": "#111111", "align": "end", "weight": "bold" }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "ระดับสมาชิก", "size": "sm", "color": "#555555" },
                { "type": "text", "text": summary.tier,  "size": "sm", "color": tierColor,  "align": "end", "weight": "bold" }
              ]
            },
            { "type": "separator", "margin": "md" },
            {
              "type": "box",
              "layout": "horizontal",
              "margin": "md",
              "contents": [
                { "type": "text", "text": "คะแนนปัจจุบัน",                    "size": "md", "weight": "bold" },
                { "type": "text", "text": fmt(summary.points) + " แต้ม", "size": "md", "color": CONFIG.COLORS.PRIMARY, "align": "end", "weight": "bold" }
              ]
            }
          ]
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "contents": [
            {
              "type": "text",
              // [F1] ใช้ canonical keys: pointsToNextTier และ nextTierName
              "text": "อีกเพียง " + fmt(summary.pointsToNextTier) + " แต้ม เพื่อเป็น " + summary.nextTierName,
              "size": "xs",
              "color": "#888888",
              "margin": "xs"
            },
            {
              "type": "box",
              "layout": "vertical",
              "backgroundColor": "#eeeeee",
              "height": "6px",
              "margin": "sm",
              "cornerRadius": "sm",
              "contents": [
                {
                  "type": "box",
                  "layout": "vertical",
                  // progress คืนมาจาก _buildSummary() เสมอ (0–100)
                  "width": (summary.progress || 0) + "%",
                  "backgroundColor": CONFIG.COLORS.SECONDARY,
                  "height": "6px",
                  "cornerRadius": "sm"
                }
              ]
            }
          ]
        }
      ],
      "backgroundColor": CONFIG.COLORS.BG_CREAM
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": { "type": "uri", "label": "แลกของรางวัล", "uri": CONFIG.LIFF_URL + "?page=Reward" },
          "style": "primary",
          "color": CONFIG.COLORS.PRIMARY
        }
      ]
    }
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. Dynamic Member Card (Placeholder Replacement)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🔄 แทนที่ Placeholder ### ด้วยข้อมูลจริงจากฐานข้อมูล
 * รองรับการทำงานทั้งผ่าน userId และการค้นหาผ่าน phone (จาก Dialogflow parameters)
 *
 * [F2] แก้ key ให้ตรงกับ canonical keys จาก _buildSummary():
 *      ###NEXT_TIER_POINTS### → summary.pointsToNextTier (เดิมใช้ summary.pointsToNext)
 *      ###NEXT_TIER###        → summary.nextTierName      (เดิมใช้ summary.nextTier)
 *
 * @param {string}      userId      - LINE User ID
 * @param {Object}      flexJson    - Flex JSON template ที่มี ### placeholders
 * @param {string|null} phoneFromDf - เบอร์โทรที่ Dialogflow ส่งมา (optional)
 * @returns {Object} Flex JSON ที่แทนที่ค่าแล้ว หรือ flexJson เดิมถ้าไม่พบสมาชิก
 */
function createDynamicMemberCard(userId, flexJson, phoneFromDf = null) {
  // 1. ดึงข้อมูลสรุปสมาชิก
  //    ถ้ามีเบอร์โทรจาก Dialogflow → ค้นหาผ่านเบอร์
  //    ถ้าไม่มี → ดึงตาม userId ปกติ
  const summary = phoneFromDf
    ? getMemberSummaryByPhone(phoneFromDf)
    : getMemberSummary(userId); // [F2] ลบ defensive typeof check — function อยู่ใน project เดียวกัน

  // ถ้าไม่พบสมาชิก ส่ง template เดิมกลับโดยไม่แก้ไข
  if (!summary) return flexJson;

  // 2. แปลงเป็น String เพื่อ replace
  let jsonStr = JSON.stringify(flexJson);

  // 3. แทนที่ ### placeholders ทั้งหมด
  jsonStr = jsonStr.replace(/###MEMBER_NAME###/g,    summary.name              || "คุณลูกค้า");
  jsonStr = jsonStr.replace(/###TEL###/g,            summary.tel               || "-");
  jsonStr = jsonStr.replace(/###TIER###/g,           summary.tier              || "Bronze Friend");
  jsonStr = jsonStr.replace(/###POINTS###/g,         Number(summary.points).toLocaleString());
  // [F2] canonical key: pointsToNextTier แทน pointsToNext
  jsonStr = jsonStr.replace(/###NEXT_TIER_POINTS###/g, Number(summary.pointsToNextTier).toLocaleString());
  // [F2] canonical key: nextTierName แทน nextTier
  jsonStr = jsonStr.replace(/###NEXT_TIER###/g,      summary.nextTierName      || "-");
  jsonStr = jsonStr.replace(/###PROGRESS###/g,       summary.progress          || "0");
  jsonStr = jsonStr.replace(/###TODAY###/g,          summary.today             || "");

  // 4. แปลงกลับเป็น Object
  return JSON.parse(jsonStr);
}