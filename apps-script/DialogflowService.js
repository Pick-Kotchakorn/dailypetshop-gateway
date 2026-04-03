/**
 * 🤖 DIALOGFLOWSERVICE.gs
 * จัดการการส่งข้อความไปวิเคราะห์ที่ Dialogflow ES
 */

/**
 * ส่งข้อความผู้ใช้ไปหา Dialogflow เพื่อระบุ Intent
 * @param {string} userId - ID ของผู้ใช้ LINE (ใช้เป็น Session ID)
 * @param {string} message - ข้อความที่ผู้ใช้พิมพ์ส่งมา
 * @return {object} - ผลลัพธ์จาก Dialogflow API
 */
function detectIntent(userId, message) {
  const projectId = CONFIG.DF_PROJECT_ID; // ดึงจาก Config.js
  const accessToken = getGoogleAccessToken(); // ฟังก์ชันแลก Token
  
  if (!accessToken) {
    throw new Error("Cannot get Google Access Token");
  }

  // API Endpoint สำหรับ Dialogflow ES
  const url = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${userId}:detectIntent`;
  
  const payload = {
    "queryInput": {
      "text": {
        "text": message,
        "languageCode": "th" // รองรับภาษาไทย
      }
    }
  };

  const options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseData = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    console.error("❌ Dialogflow API Error:", responseData);
    throw new Error("Dialogflow API returned error: " + response.getResponseCode());
  }

  return responseData;
}

/**
 * 🔑 ฟังก์ชันสำหรับสร้าง Access Token จาก Service Account
 * (ต้องติดตั้ง Library OAuth2 ก่อน)
 */
function getGoogleAccessToken() {
  // ตรวจสอบว่ามีการติดตั้ง Library OAuth2 หรือไม่
  if (typeof OAuth2 === 'undefined') {
    console.error("❌ กรุณาติดตั้ง Library OAuth2 (Project ID: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF)");
    return null;
  }

  const service = OAuth2.createService('Dialogflow')
    .setTokenUrl('https://oauth2.googleapis.com/token')
    .setPrivateKey(CONFIG.DF_PRIVATE_KEY) // ดึงจาก Config.js ที่จัดการ \n แล้ว
    .setIssuer(CONFIG.DF_SERVICE_ACCOUNT_EMAIL) // ดึงจาก Config.js
    .setPropertyStore(PropertiesService.getScriptProperties())
    .setScope('https://www.googleapis.com/auth/dialogflow');

  if (service.hasAccess()) {
    return service.getAccessToken();
  } else {
    console.error('❌ OAuth2 Error: ' + service.getLastError());
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับทดสอบการเชื่อมต่อ Dialogflow โดยเฉพาะ
 */
function testDialogflowConnection() {
  const testUserId = "test-user-123";
  const testMessage = "สวัสดี";
  
  try {
    console.log("🔍 เริ่มการทดสอบ...");
    const response = detectIntent(testUserId, testMessage);
    console.log("✅ เชื่อมต่อสำเร็จ!");
    console.log("ตอบกลับจาก AI: " + response.queryResult.fulfillmentText);
  } catch (err) {
    console.error("❌ การเชื่อมต่อล้มเหลว!");
    console.error("สาเหตุ: " + err.message);
    // ตรวจสอบว่าลืมเปิด API หรือ Project ID ผิดหรือไม่
  }
}