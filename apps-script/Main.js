// ========================================
// 🚀 MAIN.GS - ENTRY POINT (Full Version)
// ========================================

/**
 * GET Request: สำหรับแสดงหน้าจอสมาชิก (Web App)
 * URL นี้จะถูกนำไปใส่ใน Rich Menu ของ LINE
 */
function doGet(e) {
  try {
    const userId = e.parameter.userId || "";
    const template = HtmlService.createTemplateFromFile('Index');
    template.userId = userId;
    
    return template.evaluate()
      .setTitle('Daily Pet Shop - Member')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput("<b>Error:</b> " + error.message);
  }
}

/**
 * POST Request: รับข้อมูลจาก Cloudflare Gateway / LINE Webhook
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'ok', message: 'No data' });
    }

    const body = JSON.parse(e.postData.contents);
    const events = body.events || [];

    // จัดการแต่ละ Event (เรียกใช้จาก EventHandler.gs)
    events.forEach(event => {
      handleEvent(event); 
    });

    return createJsonResponse({ status: 'ok' });
  } catch (error) {
    console.error("❌ Error in doPost:", error);
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}