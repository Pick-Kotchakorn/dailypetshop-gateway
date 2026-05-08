const props = PropertiesService.getScriptProperties();

const CONFIG = {
  // --- LINE Settings ---
  LINE_ACCESS_TOKEN: props.getProperty('LINE_CHANNEL_ACCESS_TOKEN'), 
  
  // --- Google Sheets Settings ---
  SPREADSHEET_ID: props.getProperty('DB_SPREADSHEET_ID'),
  SHEET_NAME: {
    FOLLOWERS: "Followers",
    CONVERSATIONS: "Conversations",
    MEMBERS: "Membership",
    REWARDS: "Rewards",
    ORDERS: "Orders",
    LOGS: "Logs",
    PRODUCTS: "Products" // สำหรับฐานข้อมูลสินค้าที่โคจิแนะนำ
  },

  // --- Brand Theme Colors ---
  COLORS: {
    PRIMARY: "#C84528",    // Terracotta Orange
    SECONDARY: "#FDB814",  // Mustard Yellow
    BG_CREAM: "#FFF4EF",   // Warm Cream
    TEXT_MAIN: "#4A3F35",  
    TIER: {
      BRONZE: "#C84528",   
      SILVER: "#95A5A6",   
      GOLD: "#D4AF37",     
      PLATINUM: "#2C3E50"  
    }
  },

  // --- Loyalty & Membership System Settings ---
  LOYALTY: {
    WELCOME_POINTS: 50,    
    THB_PER_TOKEN: 25,     
    TIERS: {
      BRONZE: { NAME: "Bronze Friend", THRESHOLD: 0 },
      SILVER: { NAME: "Silver Member", THRESHOLD: 500 }, 
      GOLD: { NAME: "Gold Family", THRESHOLD: 2000 },    
      PLATINUM: { NAME: "Platinum Family", THRESHOLD: 5000 }
    }
  },

  // --- Validation Rules ---
  VALIDATION: {
    PHONE_REGEX: /^0[0-9]{8,9}$/, 
    NAME_MIN_LENGTH: 2
  },

  // --- Rich Menu Aliases ---
  ALIAS: {
    VISITOR: {
      HOME: "visitor_tab_home",
      SHOP: "visitor_tab_shop",
      REWARD: "visitor_tab_reward"
    },
    MEMBER: {
      HOME: "member_tab_home",
      SHOP: "member_tab_shop",
      REWARD: "member_tab_reward"
    }
  },

  // --- Endpoints & URLs ---
  LIFF_URL: "https://liff.line.me/2009630242-iPO8WjV7", 
  DIALOGFLOW_WEBHOOK: 'https://dialogflow.cloud.google.com/v1/integrations/line/webhook/a0ab3d28-5a9a-4234-a76a-ba77b0bd197e',

  // --- Dialogflow Settings ---
  DF_PROJECT_ID: props.getProperty('DF_PROJECT_ID') || "dailypetshop-dailogflow-eayr",
  DF_SERVICE_ACCOUNT_EMAIL: props.getProperty('DF_SERVICE_ACCOUNT_EMAIL'),
  DF_PRIVATE_KEY: props.getProperty('DF_PRIVATE_KEY') ? props.getProperty('DF_PRIVATE_KEY').replace(/\\n/g, '\n') : null,

  // --- Security & Admin ---
  ADMIN_WHITELIST: (props.getProperty('ADMIN_WHITELIST') || "Ued028c7900a32cb361f5482fb2a513af").split(","),

  // --- Nutrition System Settings (Step 1: เพิ่มส่วนนี้เข้าไปครับ) ---
  NUTRITION: {
    TRIGGER_TEXT: "ปรึกษาโภชนาการ", // คำสั่งจากปุ่ม Rich Menu[cite: 7]
    TRIAL_SET_POINTS: 0,           
    QUESTION_STEPS: 5,             
    SHEET_NAME: "Nutrition_Logs"    // ชีตสำหรับบันทึกประวัติการปรึกษา
  }
};

/**
 * 🛠️ ฟังก์ชันตรวจสอบความพร้อมของระบบ (คงไว้ตามต้นฉบับ)
 */
function validateConfig() {
  const required = ['LINE_CHANNEL_ACCESS_TOKEN', 'DB_SPREADSHEET_ID'];
  required.forEach(key => {
    if (!props.getProperty(key)) {
      throw new Error(`❌ Missing Script Property: ${key}`);
    }
  });
}

/**
 * ฟังก์ชันสำหรับเช็คว่า UserID นี้เป็น Admin หรือไม่ (คงไว้ตามต้นฉบับ)
 */
function checkIsAdmin(userId) {
  const adminList = CONFIG.ADMIN_WHITELIST || []; 
  return adminList.includes(userId);
}