/**
 * 🚀 MAIN.gs - Daily Pet Shop (Production Version)
 * จุดรับข้อมูลหลัก (Entry Point) และระบบ Routing ของ Web App
 */

/**
 * GET Request: สำหรับแสดงหน้า Web App (รองรับ Multi-page และ Injection)
 */
function doGet(e) {
  try {
    console.log("✅ doGet started");
    
    // 1. ตรวจสอบความพร้อมของระบบ (Properties ต่างๆ)
    validateConfig();
    console.log("✅ Config validated");
    
    // 2. จัดการ Parameter 'page' (Default เป็น Index)
    let page = e.parameter.page || 'Index';
    page = page.charAt(0).toUpperCase() + page.slice(1).toLowerCase();
    console.log("✅ Page: " + page);
    
    // 3. รับค่า userId จาก URL (ถ้ามี)
    const userId = e.parameter.userId || '';
    console.log("✅ UserId: " + (userId || 'empty'));
    
    // 4. สร้าง HTML Template จากไฟล์ที่ระบุ
    console.log("✅ Loading template: " + page);
    const template = HtmlService.createTemplateFromFile(page);
    console.log("✅ Template loaded");
    
    // 5. ฉีดค่า userId เข้าไปใน Template
    template.userId = userId;
    
    // 6. ประมวลผลและแสดงผลหน้าเว็บ
    console.log("✅ Evaluating template");
    return template.evaluate()
      .setTitle(page === 'Index' ? 'Daily Pet Shop - Member Portal' : 'Daily Pet Shop - Member System')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    console.error("❌ doGet Error: " + error.message);
    console.error("❌ Stack: " + error.stack);
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
 * POST Request: รับข้อมูลจาก LINE Webhook
 */
function doPost(e) {
  try {
    validateConfig();
    if (!e.postData || !e.postData.contents) return createJsonResponse({ status: 'error', message: 'No post data' });

    const body = JSON.parse(e.postData.contents);
    const events = body.events || [];

    events.forEach(event => {
      try {
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
 * Helper: สร้าง JSON Response สำหรับ Webhook
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper: ดึง URL ของ Web App ปัจจุบัน (ใช้สำหรับ Redirect ภายใน)
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}