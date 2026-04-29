/**
 * 🚀 MAIN.gs - Daily Pet Shop (Production Version)
 * จุดรับข้อมูลหลัก (Entry Point) และระบบ Routing ของ Web App
 */

/**
 * GET Request: สำหรับแสดงหน้า Web App (รองรับ Multi-page และ Injection)
 */
function doGet(e) {
  try {
    validateConfig();
    
    // รับค่า page (Default เป็น Index)
    let page = e.parameter.page || 'Index';
    
    // ปรับชื่อไฟล์ให้ถูกต้อง (เช่น admin -> Admin)
    page = page.charAt(0).toUpperCase() + page.slice(1).toLowerCase();
    
    // สร้าง Template จากชื่อไฟล์
    const template = HtmlService.createTemplateFromFile(page);
    
    return template.evaluate()
      .setTitle('Daily Pet Shop - Member System')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    return HtmlService.createHtmlOutput("❌ ไม่พบหน้าที่คุณต้องการ หรือระบบขัดข้อง");
  }
}

/**
 * POST Request: รับข้อมูลจาก LINE Webhook (จุดเดียวของทั้งระบบ)
 */
function doPost(e) {
  try {
    // 1. ตรวจสอบเบื้องต้น
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No post data' });
    }

    // 2. ตรวจสอบ Config ก่อนประมวลผล
    validateConfig();

    const body = JSON.parse(e.postData.contents);
    const events = body.events || [];

    // 3. วนลูปจัดการแต่ละ Event ผ่าน EventHandler.js
    events.forEach(event => {
      try {
        // handleEvent คือฟังก์ชันหลักใน EventHandler.js ที่คุณมีอยู่แล้ว
        handleEvent(event); 
      } catch (err) {
        console.error("❌ Event Error:", err.message);
      }
    });

    return createJsonResponse({ status: 'ok' });
  } catch (error) {
    console.error("❌ doPost Global Error:", error.message);
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

/**
 * Helper: สร้าง JSON Response สำหรับ Webhook (DRY Principle)
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper: ดึง URL ของ Web App ปัจจุบัน
 */
function getWebAppUrl() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (e) {
    return "";
  }
}