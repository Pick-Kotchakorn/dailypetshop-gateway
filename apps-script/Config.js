// ไฟล์ Config.gs
const props = PropertiesService.getScriptProperties();

const CONFIG = {
  // ดึงค่าจาก Script Properties ที่เราตั้งไว้ในขั้นตอนที่ 1
  LINE_TOKEN: props.getProperty('LINE_CHANNEL_ACCESS_TOKEN'),
  SPREADSHEET_ID: props.getProperty('DB_SPREADSHEET_ID'),
  
  // ตั้งชื่อ Sheet ให้ตรงกับที่คุณสร้างไว้
  SHEET_NAME: {
    FOLLOWERS: "Followers",
    CONVERSATIONS: "Conversations",
    MEMBERS: "Sheet1" // ชีทเก็บข้อมูลสัตว์เลี้ยง
  }
};

/**
 * ฟังก์ชันสำหรับตรวจสอบความพร้อมของระบบ (ใช้ตอนทดสอบ)
 */
function checkConfig() {
  console.log("Spreadsheet ID:", CONFIG.SPREADSHEET_ID);
  console.log("LINE Token Starts with:", CONFIG.LINE_TOKEN ? CONFIG.LINE_TOKEN.substring(0, 10) + "..." : "Not Found");
}