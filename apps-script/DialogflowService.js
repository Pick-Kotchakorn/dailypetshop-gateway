/**
 * 🤖 DIALOGFLOWSERVICE.gs - Daily Pet Shop (AI Brain V2.5)
 * เพิ่มระบบ Smart Context: ส่งข้อมูล Profile เข้า Session Parameters
 */

function detectIntent(userId, message, retryCount = 3) {
  // ดึงข้อมูล Context มาเตรียมไว้ (ถ้าเป็นสมาชิก)
  const profile = getCustomerProfile(userId);
  let contexts = [];

  if (profile) {
    contexts.push({
      "name": `projects/${CONFIG.DF_PROJECT_ID}/agent/sessions/${userId}/contexts/user_profile`,
      "lifespanCount": 5,
      "parameters": {
        "user_name": profile.name,
        "pet_info": profile.petInfo || "ไม่ระบุ",
        "membership_tier": profile.tier,
        "current_points": profile.points
      }
    });
  }

  try {
    const projectId = CONFIG.DF_PROJECT_ID; 
    const accessToken = getGoogleAccessToken();
    if (!accessToken) throw new Error("Google Access Token Error");

    const url = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${userId}:detectIntent`;
    
    const payload = {
      "queryInput": {
        "text": {
          "text": message,
          "languageCode": "th"
        }
      },
      "queryParams": {
        "contexts": contexts
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

    let response;
    let attempt = 0;
    while (attempt < retryCount) {
      response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) break;
      attempt++;
      Utilities.sleep(500); 
    }

    return JSON.parse(response.getContentText());
  } catch (e) {
    console.error("❌ Dialogflow Error: " + e.message);
    return null;
  }
}

/**
 * 🔑 สร้าง Access Token สำหรับ Google Cloud
 */
function getGoogleAccessToken() {
  if (typeof OAuth2 === 'undefined') return null;
  try {
    const service = OAuth2.createService('Dialogflow')
      .setTokenUrl('https://oauth2.googleapis.com/token')
      .setPrivateKey(CONFIG.DF_PRIVATE_KEY)
      .setIssuer(CONFIG.DF_SERVICE_ACCOUNT_EMAIL)
      .setPropertyStore(PropertiesService.getScriptProperties())
      .setScope('https://www.googleapis.com/auth/dialogflow');

    return service.hasAccess() ? service.getAccessToken() : null;
  } catch (e) { return null; }
}