/**
 * 📊 SheetService.js - Daily Pet Shop (Database Engine V2.6)
 * ระบบจัดการฐานข้อมูลอัตโนมัติ และ Caching Layer
 */

let _ss_cache = null;

function getSS() {
  if (!_ss_cache) {
    _ss_cache = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return _ss_cache;
}

function getSheet(name) {
  return getSS().getSheetByName(name);
}

/**
 * 🛠️ 1. ฟังก์ชันสร้างฐานข้อมูลเริ่มต้น (Run Once)
 * สร้างชีทและตั้งค่า Header อัตโนมัติสำหรับทุกระบบ
 */
function setupDatabase() {
  const ss = getSS();
  const HEADER_COLOR = CONFIG.COLORS.PRIMARY; // สีส้ม Terracotta
  const TEXT_COLOR = "#ffffff";

  // นิยามโครงสร้างของแต่ละชีทตามข้อกำหนด
  const sheetsDefinition = [
    {
      name: CONFIG.SHEET_NAME.MEMBERS, // Membership
      headers: ['User ID', 'Full Name', 'Nickname', 'Gender', 'Birthday', 'Telephone', 'Province', 'Pet Info', 'Member Since', 'Last Access', 'Total Visits', 'Status', 'Added From', 'Current Points', 'Lifetime Points', 'Total Spending', 'Level']
    },
    {
      name: CONFIG.SHEET_NAME.FOLLOWERS, // Followers (13 คอลัมน์)
      headers: ['User ID', 'Display Name', 'Picture URL', 'Language', 'Status Message', 'First Follow', 'Last Follow', 'Follow Count', 'Status', 'Source', 'Tags', 'Last Interaction', 'Total Messages']
    },
    {
      name: CONFIG.SHEET_NAME.CONVERSATIONS, // Conversations (6 คอลัมน์)
      headers: ['Timestamp', 'User ID', 'Display Name', 'User Message', 'Intent', 'Bot Reply']
    },
    {
      name: CONFIG.SHEET_NAME.REWARDS, // Rewards
      headers: ['Reward ID', 'Title', 'Description', 'Points Needed', 'Stock', 'Image URL', 'Status']
    },
    {
      name: CONFIG.SHEET_NAME.ORDERS, // Orders
      headers: ['Order ID', 'User ID', 'Item Name', 'Points Used', 'Order Status', 'Tracking No', 'Timestamp']
    },
    {
      name: CONFIG.SHEET_NAME.PRODUCTS, // ชีทสินค้า
      headers: [
        'Product_ID', 'Product_Name', 'Category', 'Sub_Category', 'Food_Type', 
        'Target_Age', 'Breed', 'Hair_Type', 'Weight_Control', 'Special_Needs', 
        'Health_Function', 'Protein_Level', 'Grain_Type', 'Price', 'Cost', 
        'Margin_%', 'Price_Tier', 'Bestseller', 'Recommend_Score', 'Tags_For_AI', 
        'Image_URL', 'Description']
    },
    {
      name: CONFIG.SHEET_NAME.NUTRITION, // Nutrition
      headers: ['Timestamp', 'User ID', 'Step', 'Question', 'User Answer', 'Result/Action']
    },
    {
      name: CONFIG.SHEET_NAME.CRM_BENEFITS, // CRM_Benefits
      headers: ['Benefit ID', 'Tier', 'Benefit Name', 'Description', 'Status', 'Expiry Date']
    }
  ];

  sheetsDefinition.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      console.log(`✅ สร้างชีท: ${def.name} เรียบร้อยแล้ว`);
    }

    // ตั้งค่า Header
    sheet.getRange(1, 1, 1, def.headers.length)
         .setValues([def.headers])
         .setBackground(HEADER_COLOR)
         .setFontColor(TEXT_COLOR)
         .setFontWeight("bold")
         .setHorizontalAlignment("center");

         sheet.setFrozenRows(1);

         // หากเป็นชีท Products ให้ลองใส่ข้อมูลตัวอย่างที่คุณให้มา
    if (def.name === CONFIG.SHEET_NAME.PRODUCTS) {
      sheet.appendRow([
        "P001", "Royal Canin Urinary Care", "อาหารแมว", "อาหารเม็ด", "dry", 
        "adult", "All", "all", "no", "urinary", 
        "kidney", "medium", "normal", 650, 500, 
        "23%", "mid", "yes", 5, "urinary|adult|dry", 
        "https://i.postimg.cc/sX8MRNrS/01-plath-n-ahn-a-pla-sae-lm-xn-nin-a-kerw.webp", 
        "บำรุงทางเดินปัสสาวะและลดการเกิดนิ่วในแมวโต"
      ]);
    }
  });

  return "✅ อัปเดตโครงสร้างชีท Products (22 คอลัมน์) และชีทอื่นๆ เรียบร้อยแล้ว!";
}

/**
 * 🚀 2. ดึงข้อมูลแบบ Cached (Performance)
 */
function getCachedData(cacheKey, fetchFunction) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { }
  }
  const data = fetchFunction();
  if (data) cache.put(cacheKey, JSON.stringify(data), CONFIG.CACHE_TTL);
  return data;
}

function clearUserCache(userId) {
  const cache = CacheService.getScriptCache();
  cache.remove(`profile_${userId}`);
  cache.remove(`summary_${userId}`);
}

/**
 * 👤 3. บันทึกข้อมูลผู้ติดตาม (Followers)
 */
function saveFollowerData(data) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const rawData = sheet.getDataRange().getValues();
  const idx = rawData.findIndex(row => row[0] === data.userId);
  const now = new Date();

  if (idx === -1) {
    sheet.appendRow([
      data.userId, data.displayName, data.pictureUrl, data.language, data.statusMessage, 
      now, now, 1, 'following', data.source, '', now, 0
    ]);
  } else {
    const row = idx + 1;
    const currentFollowCount = Number(rawData[idx][7]) || 0;
    sheet.getRange(row, 7).setValue(now); // Last Follow
    sheet.getRange(row, 8).setValue(currentFollowCount + 1);
    sheet.getRange(row, 9).setValue('following');
    sheet.getRange(row, 12).setValue(now);
  }
  clearUserCache(data.userId);
}

/**
 * 📝 4. บันทึกประวัติการคุย (Conversations)
 */
function saveLog(logData) {
  try {
    const sheet = getSheet(CONFIG.SHEET_NAME.CONVERSATIONS);
    sheet.appendRow([
      new Date(), logData.userId, logData.displayName || "Unknown", 
      logData.userMessage || "", logData.intent || "", logData.botReply || "" 
    ]);
  } catch (e) { console.error("❌ saveLog Error: " + e.message); }
}

/**
 * 🔄 5. อัปเดต Interaction และนับจำนวนข้อความ
 */
function updateFollowerInteraction(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === userId);
  if (idx !== -1) {
    const row = idx + 1;
    const currentMsgs = Number(data[idx][12]) || 0;
    sheet.getRange(row, 12).setValue(new Date()); // Last Interaction
    sheet.getRange(row, 13).setValue(currentMsgs + 1); // Total Messages
  }
}

/**
 * 🚫 6. อัปเดตสถานะเมื่อ Block (blocked)
 */
function updateUnfollowStatus(userId) {
  const sheet = getSheet(CONFIG.SHEET_NAME.FOLLOWERS);
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === userId);
  if (idx !== -1) {
    sheet.getRange(idx + 1, 9).setValue('blocked');
    sheet.getRange(idx + 1, 7).setValue(new Date());
  }
  clearUserCache(userId);
}