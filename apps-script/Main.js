/**
 * 🚀 MAIN.gs - Daily Pet Shop (Production Version)
 * จุดรับข้อมูลหลัก (Entry Point) และระบบ Routing ของ Web App
 */

/**
 * GET Request: สำหรับแสดงหน้า Web App (รองรับ Multi-page และ Injection)
 */
function doGet(e) {
  try {
    // 1. ตรวจสอบความพร้อมของระบบ (Properties ต่างๆ)
    validateConfig();
    
    // 2. จัดการ Parameter 'page' (Default เป็น Index)
    let page = e.parameter.page || 'Index';
    // ปรับ Format ชื่อไฟล์ให้ขึ้นต้นด้วยตัวใหญ่ (เช่น index -> Index)
    page = page.charAt(0).toUpperCase() + page.slice(1).toLowerCase();
    
    // 3. รับค่า userId จาก URL (ถ้ามี)
    const userId = e.parameter.userId || '';
    
    // 4. สร้าง HTML Template จากไฟล์ที่ระบุ
    const template = HtmlService.createTemplateFromFile(page);
    
    // 5. ฉีดค่า userId เข้าไปใน Template เพื่อให้ฝั่ง Client (JS) เรียกใช้งานได้
    template.userId = userId;
    
    // 6. ประมวลผลและแสดงผลหน้าเว็บ
    return template.evaluate()
      .setTitle(page === 'Index' ? 'Daily Pet Shop - Member Portal' : 'Daily Pet Shop - Member System')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    console.error("❌ doGet Error: " + error.message);
    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif; padding:20px; text-align:center;'>" +
      "<h3>⚠️ ขออภัย ระบบขัดข้องชั่วคราว</h3>" +
      "<p>ไม่พบหน้าเว็บที่คุณต้องการ หรืออาจมีการสะกดชื่อไฟล์ไม่ถูกต้อง</p>" +
      "<small style='color:red;'>Error: " + error.message + "</small>" +
      "<p style='margin-top:20px; font-size:0.8rem;'><strong>Debug Info:</strong></p>" +
      "<pre style='background:#f5f5f5; padding:10px; text-align:left; overflow:auto;'>" + error.stack + "</pre>" +
      "</div>"
    );
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