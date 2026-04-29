/**
 * 👑 RICH MENU SYSTEM - Daily Pet Shop (Tabbed Version)
 */

const LIFF_URL = "https://liff.line.me/2009630242-iPO8WjV7";

// พิกัดสำหรับรูป 2500 x 1686 px
const TAB_HEIGHT = 250;
const CONTENT_START_Y = 250;
const BUTTON_WIDTH = 833;
const BUTTON_HEIGHT = 718;

/**
 * 1️⃣ สร้างเมนู Tab 1: My Member (พิกัด 6 ช่องแม่นยำ)
 */
function createTab1Member() {
  const richMenuData = {
    "size": { "width": 2500, "height": 1686 },
    "selected": false,
    "name": "Member_Tab_Home",
    "chatBarText": "เมนูสมาชิก 🐾",
    "areas": [
      ...getTabAreas(), // แถบ Tab บนสุด (Y: 0-250)
      
      // --- แถวที่ 1 (กลางรูป - Y: 250 ถึง 968) ---
      { "bounds": { "x": 0, "y": 250, "width": 833, "height": 718 }, "action": { "type": "uri", "uri": `${LIFF_URL}?page=Index` } },
      { "bounds": { "x": 833, "y": 250, "width": 833, "height": 718 }, "action": { "type": "message", "text": "สิทธิพิเศษสมาชิก" } },
      { "bounds": { "x": 1666, "y": 250, "width": 834, "height": 718 }, "action": { "type": "message", "text": "ข่าวสารล่าสุด" } },

      // --- แถวที่ 2 (ล่างสุด - Y: 968 ถึง 1686) ---
      { "bounds": { "x": 0, "y": 968, "width": 833, "height": 718 }, "action": { "type": "message", "text": "ประวัติแต้ม" } },
      { "bounds": { "x": 833, "y": 968, "width": 833, "height": 718 }, "action": { "type": "message", "text": "ตั้งค่าบัญชี" } },
      { "bounds": { "x": 1666, "y": 968, "width": 834, "height": 718 }, "action": { "type": "message", "text": "ติดต่อแอดมิน VIP" } }
    ]
  };
  const imageUrl = "https://i.postimg.cc/NFhX4yBr/Rich-Menu-04.jpg";
  return executeSetupFlow(richMenuData, imageUrl, "TAB_HOME");
}

/**
 * 2️⃣ สร้างเมนู Tab 2: Shopping (พิกัด 6 ช่องแม่นยำ)
 */
function createTab2Shopping() {
  const richMenuData = {
    "size": { "width": 2500, "height": 1686 },
    "selected": false,
    "name": "Member_Tab_Shop",
    "chatBarText": "ช้อปเพื่อแมว 🐾",
    "areas": [
      ...getTabAreas(),
      
      // --- แถวที่ 1 (กลางรูป - Y: 250 ถึง 968) ---
      { "bounds": { "x": 0, "y": 250, "width": 833, "height": 718 }, "action": { "type": "message", "text": "อาหารแมวพรีเมียม" } },
      { "bounds": { "x": 833, "y": 250, "width": 833, "height": 718 }, "action": { "type": "message", "text": "ทรายแมว" } },
      { "bounds": { "x": 1666, "y": 250, "width": 834, "height": 718 }, "action": { "type": "message", "text": "อุปกรณ์สัตว์เลี้ยง" } },

      // --- แถวที่ 2 (ล่างสุด - Y: 968 ถึง 1686) ---
      { "bounds": { "x": 0, "y": 968, "width": 833, "height": 718 }, "action": { "type": "uri", "uri": "https://shopee.co.th/dailypetshop" } },
      { "bounds": { "x": 833, "y": 968, "width": 833, "height": 718 }, "action": { "type": "message", "text": "โปรโมชั่นวันนี้" } },
      { "bounds": { "x": 1666, "y": 968, "width": 834, "height": 718 }, "action": { "type": "message", "text": "ติดตามสถานะสินค้า" } }
    ]
  };
  const imageUrl = "https://i.postimg.cc/hGzh5SCb/Rich-Menu-05.jpg";
  return executeSetupFlow(richMenuData, imageUrl, "TAB_SHOP");
}

/**
 * 3️⃣ สร้างเมนู Tab 3: Rewards
 */
/**
 * 3️⃣ สร้างเมนู Tab 3: Rewards (แก้ไขพิกัดให้ตรงกับรูป 6 ปุ่ม)
 */
function createTab3Rewards() {
  const richMenuData = {
    "size": { "width": 2500, "height": 1686 },
    "selected": false,
    "name": "Member_Tab_Reward",
    "chatBarText": "แลกรางวัล 🎁",
    "areas": [
      ...getTabAreas(), // แถบ Tab 3 ปุ่มบนสุด (ใช้ค่ามาตรฐานเดิม)

      // --- แถวที่ 1 (กลางรูป - Y เริ่มต้นที่ 250) ---
      { 
        "bounds": { "x": 0, "y": 250, "width": 833, "height": 718 }, 
        "action": { "type": "message", "text": "GIFT SELECTION" } 
      },
      { 
        "bounds": { "x": 833, "y": 250, "width": 833, "height": 718 }, 
        "action": { "type": "message", "text": "COLLECT TOKENS" } 
      },
      { 
        "bounds": { "x": 1666, "y": 250, "width": 834, "height": 718 }, 
        "action": { "type": "message", "text": "DISCOUNT VOUCHERS" } 
      },

      // --- แถวที่ 2 (ล่างสุด - Y เริ่มต้นที่ 968) ---
      { 
        "bounds": { "x": 0, "y": 968, "width": 833, "height": 718 }, 
        "action": { 
          "type": "uri", 
          "uri": `${LIFF_URL}?page=Reward` // 🚩 เชื่อมไปหน้าแลกของรางวัล Reward.html
        } 
      },
      { 
        "bounds": { "x": 833, "y": 968, "width": 833, "height": 718 }, 
        "action": { "type": "message", "text": "POINTS BALANCE" } 
      },
      { 
        "bounds": { "x": 1666, "y": 968, "width": 834, "height": 718 }, 
        "action": { "type": "message", "text": "PRIZE DRAWS" } 
      }
    ]
  };
  // ✅ ใช้ลิงก์รูปภาพ Tab 3 ล่าสุดที่คุณส่งมา
  const imageUrl = "https://i.postimg.cc/wxcMP4kf/Rich-Menu-06.jpg";
  return executeSetupFlow(richMenuData, imageUrl, "TAB_REWARD");
}

function getTabAreas() {
  return [
    { "bounds": { "x": 0, "y": 0, "width": 833, "height": TAB_HEIGHT }, "action": { "type": "richmenuswitch", "richMenuAliasId": "tab_home", "data": "tab=home" } },
    { "bounds": { "x": 833, "y": 0, "width": 833, "height": TAB_HEIGHT }, "action": { "type": "richmenuswitch", "richMenuAliasId": "tab_shop", "data": "tab=shop" } },
    { "bounds": { "x": 1666, "y": 0, "width": 834, "height": TAB_HEIGHT }, "action": { "type": "richmenuswitch", "richMenuAliasId": "tab_reward", "data": "tab=reward" } }
  ];
}

function executeSetupFlow(data, imageUrl, logLabel) {
  const token = CONFIG.LINE_ACCESS_TOKEN;
  try {
    const createRes = UrlFetchApp.fetch("https://api.line.me/v2/bot/richmenu", {
      "method": "post",
      "headers": { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      "payload": JSON.stringify(data)
    });
    const richMenuId = JSON.parse(createRes.getContentText()).richMenuId;
    
    const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
    UrlFetchApp.fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      "method": "post",
      "headers": { "Authorization": "Bearer " + token, "Content-Type": "image/png" },
      "payload": imageBlob
    });
    
    console.log(`✅ [${logLabel}] สำเร็จ! ID: ${richMenuId}`);
    return richMenuId;
  } catch (e) {
    console.error(`❌ [${logLabel}] Error: ${e.message}`);
    return null;
  }
}

/**
 * 🔑 หลังจากรัน createTab 1-3 แล้ว ให้นำ ID ใหม่มาใส่ที่นี่ครับ
 */
function updateRichMenuAliases() {
  const ids = {
    tab_home: "richmenu-a8ca5156afc1998337b1772d90d0e6e0",
    tab_shop: "richmenu-403951c474cf808bc807980b14715f47",
    tab_reward: "richmenu-e56d88fac2ffbe619d4dc40e2ca025bd"
  };

  const token = CONFIG.LINE_ACCESS_TOKEN;
  for (const alias in ids) {
    const url = `https://api.line.me/v2/bot/richmenu/alias/${alias}`;
    try {
      UrlFetchApp.fetch(url, {
        "method": "post",
        "headers": { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        "payload": JSON.stringify({ "richMenuId": ids[alias] }),
        "muteHttpExceptions": true
      });
      console.log(`✅ อัปเดต Alias '${alias}' เรียบร้อย`);
    } catch(e) {
      console.error(`❌ Error '${alias}': ` + e.message);
    }
  }
}

function forceSwitchToMyNewTabMenu() {
  const myUserId = "Ued028c7900a32cb361f5482fb2a513af"; 
  const tab1Id = "richmenu-1dd47f08b09b83933d996d1dec998d63"; 
  linkRichMenuToUser(myUserId, tab1Id);
  console.log("✅ บังคับสลับเมนูให้คุณ Pick เรียบร้อยแล้ว!");
}