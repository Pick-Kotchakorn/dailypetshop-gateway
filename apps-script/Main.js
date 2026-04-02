/**
 * 🚀 MAIN.gs
 * จุดรับข้อมูลหลัก (Entry Point) ของระบบ
 */

/**
 * POST Request: รับข้อมูลจาก Cloudflare Gateway / LINE Webhook
 */
function doPost(e) {
  try {
    // 1. ตรวจสอบความพร้อมของ Config ก่อนเริ่มงาน
    validateConfig();

    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No data received' });
    }

    const body = JSON.parse(e.postData.contents);
    const events = body.events || [];

    // 2. จัดการแต่ละ Event แยกกัน (ส่งไป EventHandler.js)
    events.forEach(event => {
      try {
        handleEvent(event); 
      } catch (eventError) {
        console.error("❌ Event Processing Error:", eventError.message);
      }
    });

    return createJsonResponse({ status: 'ok' });

  } catch (error) {
    console.error("❌ Critical Error in doPost:", error);
    return createJsonResponse({ 
      status: 'error', 
      message: error.message 
    });
  }
}

/**
 * GET Request: สำหรับแสดงหน้า Web App (Member Card / Registration)
 */
function doGet(e) {
  try {
    validateConfig();
    
    // ดึง userId จาก parameter (ถ้ามี)
    const userId = e.parameter.userId;
    
    // สร้าง Template โดยเลือกหน้า Index เป็นหน้าหลัก
    // (เราจะไปเช็คสถานะสมาชิกด้วย JavaScript ในหน้า Index แทน เพื่อความลื่นไหล)
    const template = HtmlService.createTemplateFromFile('Index');
    
    // ส่งค่าไปที่หน้า HTML (ถ้าไม่มีจะเป็น undefined ซึ่ง JavaScript ในหน้าเว็บจะจัดการต่อเอง)
    template.userId = userId || ""; 
    
    return template.evaluate()
      .setTitle('Daily Pet Shop - Member')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    return HtmlService.createHtmlOutput("<b>System Error:</b> " + error.message);
  }
}

/**
 * ฟังก์ชันช่วยสร้าง JSON Response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}