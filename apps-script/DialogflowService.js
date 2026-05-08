/**
 * 🤖 DIALOGFLOWSERVICE.gs - Daily Pet Shop (AI Brain)
 * จัดการระบบ NLP: เพิ่มระบบ Retry Logic และ Error Handling ระดับ Production
 */

/**
 * 🧠 1. วิเคราะห์ข้อความด้วย Dialogflow ES
 * @param {string} userId - ID ของผู้ใช้ (Session ID)
 * @param {string} message - ข้อความจากลูกค้า
 * @param {number} retryCount - จำนวนครั้งที่ลองใหม่ (Default: 3)
 */
function detectIntent(userId, message, retryCount = 3) {
  try {
    const projectId = CONFIG.DF_PROJECT_ID; 
    const accessToken = getGoogleAccessToken();
    
    if (!accessToken) {
      throw new Error("ระบบไม่สามารถสร้าง Google Access Token ได้");
    }

    const url = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${userId}:detectIntent`;
    
    const payload = {
      "queryInput": {
        "text": {
          "text": message,
          "languageCode": "th"
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

    // ระบบประมวลผลพร้อม Retry Logic
    let response;
    let attempt = 0;
    
    while (attempt < retryCount) {
      response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) break; // สำเร็จ ให้หยุด Loop
      attempt++;
      Utilities.sleep(500); // พัก 0.5 วินาทีก่อนลองใหม่
    }

    const responseData = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      console.error(`❌ Dialogflow Error (Attempt ${attempt}):`, responseData);
      throw new Error("Dialogflow API ไม่ตอบสนองตามปกติ");
    }

    return responseData;

  } catch (e) {
    console.error("❌ detectIntent Critical Error: " + e.message);
    // ส่ง Fallback Response กรณี AI พังจริงๆ เพื่อไม่ให้ระบบหยุดทำงาน
    return {
      queryResult: {
        fulfillmentText: "ขออภัยค่ะ น้องแมวกำลังยุ่งอยู่นิดหน่อย รบกวนลองใหม่อีกครั้งนะคะ 🐾",
        intent: { displayName: "Fallback_Error" }
      }
    };
  }
}

/**
 * 🔑 2. สร้าง Access Token ผ่าน Service Account
 * (ต้องการ Library OAuth2: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF)
 */
function getGoogleAccessToken() {
  if (typeof OAuth2 === 'undefined') {
    console.error("❌ ลืมติดตั้ง Library OAuth2 หรือไม่?");
    return null;
  }

  try {
    const service = OAuth2.createService('Dialogflow')
      .setTokenUrl('https://oauth2.googleapis.com/token')
      .setPrivateKey(CONFIG.DF_PRIVATE_KEY)
      .setIssuer(CONFIG.DF_SERVICE_ACCOUNT_EMAIL)
      .setPropertyStore(PropertiesService.getScriptProperties())
      .setScope('https://www.googleapis.com/auth/dialogflow');

    if (service.hasAccess()) {
      return service.getAccessToken();
    } else {
      console.error('❌ OAuth2 Access Error: ' + service.getLastError());
      return null;
    }
  } catch (e) {
    console.error("❌ getGoogleAccessToken Error: " + e.message);
    return null;
  }
}

/**
 * 🧪 3. ฟังก์ชันสำหรับทดสอบการเชื่อมต่อ
 */
function testAIConnection() {
  const result = detectIntent("test_user", "สวัสดี");
  
  // พิมพ์ผลลัพธ์ทั้งหมดออกมาดูโครงสร้าง
  console.log("🔍 Full JSON Response:", JSON.stringify(result));

  if (result && result.queryResult) {
    const replyText = result.queryResult.fulfillmentText;
    console.log("🤖 AI Reply:", replyText || "⚠️ ไม่มีข้อความตอบกลับในระบบ Dialogflow");
    
    // ตรวจสอบชื่อ Intent ที่ตรวจพบ
    const intentName = result.queryResult.intent ? result.queryResult.intent.displayName : "ไม่พบ Intent";
    console.log("🎯 Matched Intent:", intentName);
  }
}