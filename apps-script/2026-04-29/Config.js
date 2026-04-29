/**
 * ⚙️ CONFIG.gs
 * จัดการค่าคงที่และการตั้งค่าระบบทั้งหมด
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
    MEMBERS: "Membership" 
  },

  // --- Dialogflow Settings ---
  DF_PROJECT_ID: props.getProperty('DF_PROJECT_ID') || "dailypetshop-dailogflow-eayr",
  DF_SERVICE_ACCOUNT_EMAIL: props.getProperty('DF_SERVICE_ACCOUNT_EMAIL'),
  DF_PRIVATE_KEY: props.getProperty('DF_PRIVATE_KEY') ? props.getProperty('DF_PRIVATE_KEY').replace(/\\n/g, '\n') : null,

  // --- Endpoints (ย้ายมารวมที่นี่เพื่อความง่าย) ---
  // หากต้องการเปลี่ยน URL ในอนาคต ให้แก้ที่นี่ได้เลยครับ
  DIALOGFLOW_WEBHOOK: 'https://dialogflow.cloud.google.com/v1/integrations/line/webhook/a0ab3d28-5a9a-4234-a76a-ba77b0bd197e',
  DEBUG_WEBHOOK: 'https://webhook.site/d5cc4ad6-7286-4879-ba7a-0455d0a53d2b'
};

/**
 * ✅ ฟังก์ชันตรวจสอบความพร้อมของระบบ
 */
function validateConfig() {
  const missing = [];
  
  // ตรวจสอบเฉพาะ ID หลัก (ไม่บังคับ Dialogflow/LINE ในตอนนี้)
  if (!CONFIG.SPREADSHEET_ID) missing.push("DB_SPREADSHEET_ID");

  if (missing.length > 0) {
    const errorMsg = "❌ Missing Script Properties: " + missing.join(", ");
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return true;
}