/**
 * 👑 RICHMENUSYSTEM.gs - Daily Pet Shop (Production Version 3.1)
 * แก้ไขปุ่ม MEMBER CARD ให้ส่งข้อความแทนการเปิด URI เพื่อรองรับ Dialogflow Workflow
 *
 * Fixes v3.1:
 *   [R1] RICH_CONFIG — ย้าย LIFF_URL ออกจาก top-level const เพราะ GAS evaluate
 *        object literal ตอน script load (ก่อน getConfig() ถูกเรียก) ทำให้
 *        CONFIG.LIFF_URL ยัง undefined → fallback เป็น hardcoded URL เสมอ
 *        แก้ไข: คง RICH_CONFIG ไว้เป็นค่า layout คงที่เท่านั้น และเพิ่ม
 *        getLiffUrl() ที่อ่าน getConfig().LIFF_URL แบบ lazy ตอนถูกเรียกจริง
 *   [R2] createVisitorMenus() — สร้างแค่ Home tab เดียว แต่ getTabAreas('visitor')
 *        อ้าง ALIAS.VISITOR.SHOP และ ALIAS.VISITOR.REWARD ซึ่งยังไม่มี rich menu
 *        จริง → LINE richmenuswitch fail silently ทุกครั้งที่ visitor แตะแท็บ
 *        แก้ไข: สร้าง Visitor_Shop และ Visitor_Reward ให้ครบทั้ง 3 tabs
 */

// ── Layout constants only — ห้ามอ่าน CONFIG ที่นี่ (eval ตอน script load) ──
const RICH_CONFIG = {
  WIDTH: 2500,
  HEIGHT: 1686,
  TAB_HEIGHT: 250,
  BUTTON_WIDTH: 833,
  BUTTON_HEIGHT: 718,
  ROW1_Y: 250,
  ROW2_Y: 968
};

/**
 * [R1] Lazy LIFF URL reader — เรียกตอนที่ฟังก์ชัน upload ทำงานจริง
 * เพื่อให้ getConfig() โหลด Script Properties แล้วก่อนเสมอ
 * @returns {string} LIFF base URL
 */
function getLiffUrl() {
  return getConfig().LIFF_URL || '';
}

/**
 * 🛠️ Helper: สร้างพื้นที่สำหรับ Tab ด้านบน (Home, Shop, Reward)
 */
function getTabAreas(status) {
  const aliases = status === 'member' ? CONFIG.ALIAS.MEMBER : CONFIG.ALIAS.VISITOR;
  return [
    { "bounds": { "x": 0, "y": 0, "width": 833, "height": RICH_CONFIG.TAB_HEIGHT }, "action": { "type": "richmenuswitch", "richMenuAliasId": aliases.HOME, "data": "tab=home" } },
    { "bounds": { "x": 833, "y": 0, "width": 834, "height": RICH_CONFIG.TAB_HEIGHT }, "action": { "type": "richmenuswitch", "richMenuAliasId": aliases.SHOP, "data": "tab=shop" } },
    { "bounds": { "x": 1667, "y": 0, "width": 833, "height": RICH_CONFIG.TAB_HEIGHT }, "action": { "type": "richmenuswitch", "richMenuAliasId": aliases.REWARD, "data": "tab=reward" } }
  ];
}

/** 
 * 🐾 1. MEMBER TABS (ปรับปรุง Action ปุ่ม Member Card)
 */
function createMemberMenus() {
  const homeImg = "https://i.postimg.cc/GmNPpHzR/1.png";
  const shopImg = "https://i.postimg.cc/x8bvhkPy/2.png";
  const rewardImg = "https://i.postimg.cc/zBy2DGjS/3.png";

  // Tab Home: ข้อมูลสมาชิก
  const homeData = {
    "size": { "width": RICH_CONFIG.WIDTH, "height": RICH_CONFIG.HEIGHT },
    "selected": true, "name": "Member_Home", "chatBarText": "เมนูสมาชิก 🐾",
    "areas": [
      ...getTabAreas('member'),
      // ✅ แก้ไข: ปุ่ม Member Card (แถว 1 ซ้าย) ให้เป็น type: "message"
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW1_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ข้อมูลสมาชิก" } },
      
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW1_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "สิทธิพิเศษสมาชิก" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW1_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ข่าวสาร" } },
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "เช็คแต้มสะสม" } },
      
      // ปุ่ม Settings: ไปหน้าแก้ไขโปรไฟล์ (LIFF) — [R1] ใช้ getLiffUrl() แทน RICH_CONFIG.LIFF_URL
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW2_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri", "uri": `${getLiffUrl()}?page=Registration` } },
      
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ปรึกษาโภชนาการ" } }
    ]
  };
  uploadRichMenu(homeData, homeImg, CONFIG.ALIAS.MEMBER.HOME);

  // Tab Shop: เลือกซื้อสินค้า (คงเดิมตามมาตรฐาน Workflow)
  const shopData = {
    "size": { "width": RICH_CONFIG.WIDTH, "height": RICH_CONFIG.HEIGHT },
    "selected": false, "name": "Member_Shop", "chatBarText": "เลือกช้อปสินค้า 🛒",
    "areas": [
      ...getTabAreas('member'),
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW1_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "อาหารแมว" } },
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW1_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ทรายแมว" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW1_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "อุปกรณ์สัตว์เลี้ยง" } },
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ช่องทางสั่งซื้อ" } },
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW2_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "โปรโมชั่น" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ติดตามคำสั่งซื้อ" } }
    ]
  };
  uploadRichMenu(shopData, shopImg, CONFIG.ALIAS.MEMBER.SHOP);

  // Tab Reward: แลกรางวัล (คงเดิมตามมาตรฐาน Workflow)
  const rewardData = {
    "size": { "width": RICH_CONFIG.WIDTH, "height": RICH_CONFIG.HEIGHT },
    "selected": false, "name": "Member_Reward", "chatBarText": "แลกรางวัล 🎁",
    "areas": [
      ...getTabAreas('member'),
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW1_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ของรางวัล" } },
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW1_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "วิธีสะสมแต้ม" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW1_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "คูปองส่วนลด" } },
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri", "uri": `${getLiffUrl()}?page=Reward` } },
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW2_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "แต้มของฉัน" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ลุ้นรางวัล" } }
    ]
  };
  uploadRichMenu(rewardData, rewardImg, CONFIG.ALIAS.MEMBER.REWARD);
}

/** 
 * 🐾 2. VISITOR TABS
 * [R2] เพิ่ม Visitor_Shop และ Visitor_Reward ให้ครบ 3 tabs
 *      เดิมมีแค่ Visitor_Home แต่ getTabAreas('visitor') อ้าง ALIAS.VISITOR.SHOP
 *      และ ALIAS.VISITOR.REWARD ซึ่งยังไม่มี rich menu จริง → richmenuswitch fail
 *
 *      Visitor tabs ทำหน้าที่เชิญชวนให้สมัครสมาชิก จึงใช้ภาพเดิม (homeImg)
 *      และทุกปุ่มหลักชี้ไปที่หน้า Registration เพื่อ conversion
 */
function createVisitorMenus() {
  const liffUrl = getLiffUrl(); // [R1] lazy read
  const regUrl  = `${liffUrl}?page=Registration`;
  const homeImg = "https://i.postimg.cc/GmNPpHzR/1.png";

  // ── Tab Home: Hero banner สมัครสมาชิก ────────────────────────────────────
  const visitorHome = {
    "size": { "width": RICH_CONFIG.WIDTH, "height": RICH_CONFIG.HEIGHT },
    "selected": true, "name": "Visitor_Home", "chatBarText": "ยินดีต้อนรับ 🐾",
    "areas": [
      ...getTabAreas('visitor'),
      // ปุ่ม Hero ครอบคลุมแถวที่ 1 ทั้งหมด
      { "bounds": { "x": 0,    "y": RICH_CONFIG.ROW1_Y, "width": 2500, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri",     "uri":  regUrl } },
      { "bounds": { "x": 0,    "y": RICH_CONFIG.ROW2_Y, "width": 833,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "สิทธิพิเศษสมาชิก" } },
      { "bounds": { "x": 833,  "y": RICH_CONFIG.ROW2_Y, "width": 834,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "วิธีสะสมแต้ม" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW2_Y, "width": 833,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ปรึกษาโภชนาการ" } }
    ]
  };
  uploadRichMenu(visitorHome, homeImg, CONFIG.ALIAS.VISITOR.HOME);

  // ── Tab Shop: แสดงสินค้าเบื้องต้น + เชิญสมัครสมาชิกเพื่อรับสิทธิ์ ──────
  // [R2] สร้าง Visitor_Shop ให้ ALIAS.VISITOR.SHOP มี rich menu จริง
  const visitorShop = {
    "size": { "width": RICH_CONFIG.WIDTH, "height": RICH_CONFIG.HEIGHT },
    "selected": false, "name": "Visitor_Shop", "chatBarText": "สินค้าของเรา 🛒",
    "areas": [
      ...getTabAreas('visitor'),
      { "bounds": { "x": 0,    "y": RICH_CONFIG.ROW1_Y, "width": 833,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "อาหารแมว" } },
      { "bounds": { "x": 833,  "y": RICH_CONFIG.ROW1_Y, "width": 834,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ทรายแมว" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW1_Y, "width": 833,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "อุปกรณ์สัตว์เลี้ยง" } },
      // แถว 2: เชิญชวนสมัครสมาชิก
      { "bounds": { "x": 0,    "y": RICH_CONFIG.ROW2_Y, "width": 2500, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri",     "uri":  regUrl } }
    ]
  };
  uploadRichMenu(visitorShop, homeImg, CONFIG.ALIAS.VISITOR.SHOP);

  // ── Tab Reward: ตัวอย่างของรางวัล + เชิญสมัครสมาชิกเพื่อแลกรางวัล ───────
  // [R2] สร้าง Visitor_Reward ให้ ALIAS.VISITOR.REWARD มี rich menu จริง
  const visitorReward = {
    "size": { "width": RICH_CONFIG.WIDTH, "height": RICH_CONFIG.HEIGHT },
    "selected": false, "name": "Visitor_Reward", "chatBarText": "ของรางวัล 🎁",
    "areas": [
      ...getTabAreas('visitor'),
      { "bounds": { "x": 0,    "y": RICH_CONFIG.ROW1_Y, "width": 833,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "สิทธิพิเศษสมาชิก" } },
      { "bounds": { "x": 833,  "y": RICH_CONFIG.ROW1_Y, "width": 834,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "วิธีสะสมแต้ม" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW1_Y, "width": 833,  "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ของรางวัล" } },
      // แถว 2: Hero CTA สมัครสมาชิกเพื่อแลกของรางวัล
      { "bounds": { "x": 0,    "y": RICH_CONFIG.ROW2_Y, "width": 2500, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri",     "uri":  regUrl } }
    ]
  };
  uploadRichMenu(visitorReward, homeImg, CONFIG.ALIAS.VISITOR.REWARD);
}

/**
 * 📞 3. Core API Engine
 */
function uploadRichMenu(data, imageUrl, aliasId) {
  const token = CONFIG.LINE_ACCESS_TOKEN;
  const res = UrlFetchApp.fetch("https://api.line.me/v2/bot/richmenu", {
    "method": "post",
    "headers": { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    "payload": JSON.stringify(data),
    "muteHttpExceptions": true
  });
  
  const richMenuId = JSON.parse(res.getContentText()).richMenuId;
  if (!richMenuId) throw new Error("Create Failed: " + res.getContentText());

  const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
  UrlFetchApp.fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    "method": "post",
    "headers": { "Authorization": "Bearer " + token, "Content-Type": "image/png" },
    "payload": imageBlob
  });
  
  UrlFetchApp.fetch(`https://api.line.me/v2/bot/richmenu/alias/${aliasId}`, {
    "method": "delete", "headers": { "Authorization": "Bearer " + token }, "muteHttpExceptions": true
  });

  UrlFetchApp.fetch(`https://api.line.me/v2/bot/richmenu/alias`, {
    "method": "post",
    "headers": { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    "payload": JSON.stringify({ "richMenuAliasId": aliasId, "richMenuId": richMenuId })
  });
  
  console.log(`✅ Rich Menu '${aliasId}' Updated`);
  return richMenuId;
}

/**
 * 🧪 ฟังก์ชันรันเพื่ออัปเดตระบบ Rich Menu ทั้งหมด
 */
function initSystemRichMenus() {
  validateConfig();
  createMemberMenus();
  createVisitorMenus();
}