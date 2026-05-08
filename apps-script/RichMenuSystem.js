/**
 * 👑 RICHMENUSYSTEM.gs - Daily Pet Shop (Production Version 2.2)
 * แก้ไขปุ่ม MEMBER CARD ให้ส่งข้อความแทนการเปิด URI เพื่อรองรับ Dialogflow Workflow
 */

const RICH_CONFIG = {
  WIDTH: 2500,
  HEIGHT: 1686,
  TAB_HEIGHT: 250,
  BUTTON_WIDTH: 833, 
  BUTTON_HEIGHT: 718, 
  ROW1_Y: 250,
  ROW2_Y: 968, 
  // ดึงค่าจาก Config กลางเพื่อความแม่นยำ[cite: 2, 12, 18]
  LIFF_URL: (typeof CONFIG !== 'undefined' && CONFIG.LIFF_URL) ? CONFIG.LIFF_URL : "https://liff.line.me/2009630242-iPO8WjV7"
};

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
      
      // ปุ่ม Settings: ไปหน้าแก้ไขโปรไฟล์ (LIFF)[cite: 10, 12]
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW2_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri", "uri": `${RICH_CONFIG.LIFF_URL}?page=Registration` } },
      
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
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri", "uri": `${RICH_CONFIG.LIFF_URL}?page=Reward` } },
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW2_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "แต้มของฉัน" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ลุ้นรางวัล" } }
    ]
  };
  uploadRichMenu(rewardData, rewardImg, CONFIG.ALIAS.MEMBER.REWARD);
}

/** 
 * 🐾 2. VISITOR TABS (ศูนย์ลงทะเบียนสำหรับลูกค้าใหม่)
 */
function createVisitorMenus() {
  const regUrl = `${RICH_CONFIG.LIFF_URL}?page=Registration`;
  const homeImg = "https://i.postimg.cc/GmNPpHzR/1.png";

  const visitorHome = {
    "size": { "width": RICH_CONFIG.WIDTH, "height": RICH_CONFIG.HEIGHT },
    "selected": true, "name": "Visitor_Home", "chatBarText": "ยินดีต้อนรับ 🐾",
    "areas": [
      ...getTabAreas('visitor'),
      // ปุ่ม Hero สำหรับสมัครสมาชิก (ครอบคลุมแถวที่ 1 ทั้งหมด)
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW1_Y, "width": 2500, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "uri", "uri": regUrl } },
      { "bounds": { "x": 0, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "สิทธิพิเศษสมาชิก" } },
      { "bounds": { "x": 833, "y": RICH_CONFIG.ROW2_Y, "width": 834, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "วิธีสะสมแต้ม" } },
      { "bounds": { "x": 1667, "y": RICH_CONFIG.ROW2_Y, "width": 833, "height": RICH_CONFIG.BUTTON_HEIGHT }, "action": { "type": "message", "text": "ปรึกษาโภชนาการ" } }
    ]
  };
  uploadRichMenu(visitorHome, homeImg, CONFIG.ALIAS.VISITOR.HOME);
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