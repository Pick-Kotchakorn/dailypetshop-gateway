/**
 * ⚙️ CONFIG.gs
 * จัดการค่าคงที่และการตั้งค่าระบบทั้งหมด
 */

const props = PropertiesService.getScriptProperties();

const CONFIG = {
  // ดึงค่าจาก Script Properties (ต้องตั้งค่าใน Project Settings ของ GAS ก่อน)
  LINE_ACCESS_TOKEN: props.getProperty('LINE_CHANNEL_ACCESS_TOKEN'), 
  SPREADSHEET_ID: props.getProperty('DB_SPREADSHEET_ID'),
  
  // ชื่อแผ่นงาน (Sheet Names)
  SHEET_NAME: {
    FOLLOWERS: "Followers",
    CONVERSATIONS: "Conversations",
    MEMBERS: "Sheet1" // ตรวจสอบให้ตรงกับชื่อ Tab ใน Google Sheets ของคุณ
  }
};

/**
 * ✅ ฟังก์ชันตรวจสอบความพร้อมของระบบ
 * ใช้เรียกใน doGet/doPost เพื่อป้องกัน Error เมื่อลืมตั้งค่า Properties
 */
function validateConfig() {
  const missing = [];
  if (!CONFIG.LINE_ACCESS_TOKEN) missing.push("LINE_CHANNEL_ACCESS_TOKEN");
  if (!CONFIG.SPREADSHEET_ID) missing.push("DB_SPREADSHEET_ID");

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
  try {
    validateConfig();
    console.log("✅ Configuration is valid.");
    console.log("Spreadsheet ID:", CONFIG.SPREADSHEET_ID);
  } catch (e) {
    console.error(e.message);
  }
}