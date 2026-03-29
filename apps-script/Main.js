// ไฟล์ Main.gs

/**
 * GET Request: สำหรับแสดงหน้าจอเกม Tamagotchi (Web App)
 * ดึง Logic จากการจัดการหน้าจอของ unabot-gateway
 */
function doGet(e) {
  try {
    // รับ userId จาก URL parameter (เช่น ?userId=U123456)
    // หากไม่มีให้ใช้ค่าว่าง เพื่อไปรอรับการระบุตัวตนในหน้า Index
    const userId = e.parameter.userId || "";
    
    const template = HtmlService.createTemplateFromFile('Index');
    template.userId = userId;
    
    return template.evaluate()
      .setTitle('Petshop Tamagotchi')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput("<b>Error:</b> " + error.message);
  }
}

/**
 * POST Request: จุดรับ Webhook จาก Cloudflare / LINE
 * เลียนแบบโครงสร้างจาก Main.js ใน unabot-gateway
 */
function doPost(e) {
  try {
    // 1. ตรวจสอบข้อมูลที่ส่งมา
    if (!e.postData || !e.postData.contents) {
      return makeJsonResponse({ status: 'error', message: 'No post data' });
    }

    const contents = JSON.parse(e.postData.contents);
    const events = contents.events;

    // 2. วนลูปจัดการแต่ละ Event (เช่น Follow หรือ Message)
    events.forEach(event => {
      // ส่งต่อไปยัง EventHandler.gs เพื่อแยกแยะการทำงาน
      handleEvent(event); 
    });

    return makeJsonResponse({ status: 'ok' });

  } catch (error) {
    console.error("❌ Critical Error in doPost:", error);
    return makeJsonResponse({ status: 'error', message: error.message });
  }
}

/**
 * ฟังก์ชันช่วยสร้าง Response แบบ JSON
 */
function makeJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}