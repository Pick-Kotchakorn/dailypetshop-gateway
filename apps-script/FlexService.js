/**
 * 🎫 FlexService.gs - Daily Pet Shop (Dialogflow Support Version)
 * หน้าที่: สร้างโครงสร้าง JSON ของ Flex Message เพื่อส่งกลับไปให้ Dialogflow
 */

/**
 * 🐾 1. ฟังก์ชันหลักสำหรับดึง Flex Message สมาชิก (ผ่านเบอร์โทรศัพท์)
 */
function getFlexMemberSummary(summary) {
  if (!summary) return null;

  const fmt = (num) => Number(num || 0).toLocaleString('th-TH');
  
  // ใช้สีตามระดับสมาชิกจาก Config
  let tierColor = CONFIG.COLORS.TIER.BRONZE;
  if (summary.tier.includes("Silver")) tierColor = CONFIG.COLORS.TIER.SILVER;
  if (summary.tier.includes("Gold")) tierColor = CONFIG.COLORS.TIER.GOLD;
  if (summary.tier.includes("Platinum")) tierColor = CONFIG.COLORS.TIER.PLATINUM;

  // ส่งคืนโครงสร้าง JSON ให้ Dialogflow นำไปตอบลูกค้า
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
                { "type": "text", "text": "ชื่อสมาชิก", "size": "sm", "color": "#555555" },
                { "type": "text", "text": summary.name, "size": "sm", "color": "#111111", "align": "end", "weight": "bold" }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "ระดับสมาชิก", "size": "sm", "color": "#555555" },
                { "type": "text", "text": summary.tier, "size": "sm", "color": tierColor, "align": "end", "weight": "bold" }
              ]
            },
            {
              "type": "separator",
              "margin": "md"
            },
            {
              "type": "box",
              "layout": "horizontal",
              "margin": "md",
              "contents": [
                { "type": "text", "text": "คะแนนปัจจุบัน", "size": "md", "weight": "bold" },
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
              "text": "อีกเพียง " + fmt(summary.pointsToNext) + " แต้ม เพื่อเป็น " + summary.nextTier,
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
                  "width": summary.progress + "%",
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

/**
 * 🔄 ฟังก์ชันสำหรับแทนที่ Placeholder ### ด้วยข้อมูลจริงจากฐานข้อมูล
 * รองรับการทำงานทั้งผ่าน userId และการค้นหาผ่าน parameters (เบอร์โทร)
 */
function createDynamicMemberCard(userId, flexJson, phoneFromDf = null) {
  // 1. ดึงข้อมูลสรุปสมาชิก 
  // หากมีเบอร์โทรส่งมาจาก Dialogflow ให้ใช้ getMemberSummaryByPhone
  // หากไม่มี ให้ใช้ getMemberSummary (ดึงตาม userId ปกติ)
  let summary;
  if (phoneFromDf) {
    summary = getMemberSummaryByPhone(phoneFromDf);
  } else {
    // หมายเหตุ: คุณต้องมีฟังก์ชัน getMemberSummary(userId) ใน Membership.gs ด้วย
    summary = typeof getMemberSummary === 'function' ? getMemberSummary(userId) : null;
  }

  // กรณีไม่พบข้อมูลสมาชิก ให้ส่ง Flex เดิมกลับไป (หรือจัดการตามความเหมาะสม)
  if (!summary) return flexJson;

  // 2. แปลง JSON เป็น String เพื่อทำการ Replace ตัวแปรทั้งหมด
  let jsonStr = JSON.stringify(flexJson);

  // 3. เริ่มการแทนที่ตัวแปร ### ตาม Key ที่คืนมาจาก getMemberSummaryByPhone
  jsonStr = jsonStr.replace(/###MEMBER_NAME###/g, summary.name || "คุณลูกค้า");
  jsonStr = jsonStr.replace(/###TEL###/g, summary.tel || "-");
  jsonStr = jsonStr.replace(/###TIER###/g, summary.tier || "Bronze Friend");
  jsonStr = jsonStr.replace(/###POINTS###/g, Number(summary.points).toLocaleString());
  jsonStr = jsonStr.replace(/###NEXT_TIER_POINTS###/g, Number(summary.pointsToNext).toLocaleString());
  jsonStr = jsonStr.replace(/###NEXT_TIER###/g, summary.nextTier || "-");
  jsonStr = jsonStr.replace(/###PROGRESS###/g, summary.progress || "0");
  jsonStr = jsonStr.replace(/###TODAY###/g, summary.today || "");

  // 4. แปลงกลับเป็น Object เพื่อส่งออกไปใช้งาน
  return JSON.parse(jsonStr);
}