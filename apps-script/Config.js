/**
 * ⚙️ CONFIG.gs
 * จัดการค่าคงที่และการตั้งค่าระบบทั้งหมด (รองรับ Dialogflow)
 */

const props = PropertiesService.getScriptProperties();

const CONFIG = {
  // --- LINE Settings ---
  LINE_ACCESS_TOKEN: props.getProperty('LINE_CHANNEL_ACCESS_TOKEN'), 
  
  // --- Google Sheets Settings ---
  SPREADSHEET_ID: props.getProperty('DB_SPREADSHEET_ID'),
  SHEET_NAME: {
    FOLLOWERS: "Followers",
    CONVERSATIONS: "Conversations",
    MEMBERS: "Sheet1" // ตรวจสอบให้ตรงกับชื่อ Tab ใน Google Sheets ของคุณ
  },

  // --- Dialogflow Settings (Added) ---
  DF_PROJECT_ID: props.getProperty('DF_PROJECT_ID') || "dailypetshop-dailogflow-eayr",
  DF_SERVICE_ACCOUNT_EMAIL: props.getProperty('DF_SERVICE_ACCOUNT_EMAIL'),
  // จัดการเรื่อง Private Key ให้รองรับการขึ้นบรรทัดใหม่ที่ถูกต้อง
  DF_PRIVATE_KEY: props.getProperty('DF_PRIVATE_KEY') ? props.getProperty('DF_PRIVATE_KEY').replace(/\\n/g, '\n') : null
};

/**
 * ✅ ฟังก์ชันตรวจสอบความพร้อมของระบบ
 * ปรับปรุงให้ตรวจสอบค่า Dialogflow ด้วย
 */
function validateConfig() {
  const missing = [];
  
  // ตรวจสอบค่าพื้นฐาน
  if (!CONFIG.LINE_ACCESS_TOKEN) missing.push("LINE_CHANNEL_ACCESS_TOKEN");
  if (!CONFIG.SPREADSHEET_ID) missing.push("DB_SPREADSHEET_ID");
  
  // ตรวจสอบค่า Dialogflow
  if (!CONFIG.DF_PROJECT_ID) missing.push("DF_PROJECT_ID");
  if (!CONFIG.DF_SERVICE_ACCOUNT_EMAIL) missing.push("DF_SERVICE_ACCOUNT_EMAIL");
  if (!CONFIG.DF_PRIVATE_KEY) missing.push("DF_PRIVATE_KEY");

  if (missing.length > 0) {
    const errorMsg = "❌ Missing Script Properties: " + missing.join(", ");
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return true;
}

/**
 * 🔍 ฟังก์ชัน Debug (สำหรับรันด้วยมือเพื่อเช็คค่า)
 */
function checkConfig() {
  console.log("Line Token:", CONFIG.LINE_ACCESS_TOKEN ? "✅ Set" : "❌ Not Set");
  console.log("Sheet ID:", CONFIG.SPREADSHEET_ID ? "✅ Set" : "❌ Not Set");
  console.log("DF Project ID:", CONFIG.DF_PROJECT_ID);
  console.log("DF Email:", CONFIG.DF_SERVICE_ACCOUNT_EMAIL ? "✅ Set" : "❌ Not Set");
}