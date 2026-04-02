// ========================================
// 🚀 MAIN.GS - ENTRY POINT (Full Version)
// ========================================

/**
 * GET Request: สำหรับแสดงหน้าจอสมาชิก (Web App)
 * URL นี้จะถูกนำไปใส่ใน Rich Menu ของ LINE
 */
function doGet(e) {
  try {
    const userId = e.parameter.userId;
    
    // ⚠️ ดักเฉพาะกรณีที่ 'ไม่มี userId ส่งมาเลย' (เช่น กดลิงก์ตรงๆ จาก Browser)
    if (!userId || userId === "") {
      return HtmlService.createHtmlOutput("<h2 style='font-family: Kanit; text-align: center; color: #4A3F35; margin-top: 50px;'>❌ กรุณาเข้าใช้งานผ่าน LINE Official Account เท่านั้น</h2>");
    }

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    
    // ตรวจสอบว่าเป็นสมาชิกหรือยัง
    const isMember = data.slice(1).some(row => {
      const cellValue = row[0] ? row[0].toString().trim() : "";
      return cellValue !== "" && cellValue === userId.toString().trim();
    });
    
    // 🎯 หัวใจสำคัญ: ถ้าไม่เป็นสมาชิก ให้ไปหน้า 'Registration' (สมัครสมาชิก)
    // ถ้าเป็นสมาชิกแล้ว ให้ไปหน้า 'Index' (บัตรสมาชิก)
    let page = isMember ? 'Index' : 'Registration'; 
    
    const template = HtmlService.createTemplateFromFile(page);
    template.userId = userId;
    
    return template.evaluate()
      .setTitle('Daily Pet Shop - CRM')
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