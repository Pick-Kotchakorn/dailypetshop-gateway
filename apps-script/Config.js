const props = PropertiesService.getScriptProperties();

const CONFIG = {
  // ดึงค่าให้รองรับทั้งชื่อเก่าและชื่อที่ copy มาจาก unabot
  LINE_TOKEN: props.getProperty('LINE_CHANNEL_ACCESS_TOKEN'),
  LINE_ACCESS_TOKEN: props.getProperty('LINE_CHANNEL_ACCESS_TOKEN'), 
  SPREADSHEET_ID: props.getProperty('DB_SPREADSHEET_ID'),
  
  SHEET_NAME: {
    FOLLOWERS: "Followers",
    CONVERSATIONS: "Conversations",
    MEMBERS: "Sheet1" 
  }
};

/**
 * ฟังก์ชันสำหรับตรวจสอบความพร้อมของระบบ (ใช้ตอนทดสอบ)
 */
function checkConfig() {
  console.log("Spreadsheet ID:", CONFIG.SPREADSHEET_ID);
  console.log("LINE Token Starts with:", CONFIG.LINE_TOKEN ? CONFIG.LINE_TOKEN.substring(0, 10) + "..." : "Not Found");
}