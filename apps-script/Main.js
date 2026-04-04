/**
 * 🚀 MAIN.gs (Production API Routing)
 */

function doPost(e) {
  try {
    validateConfig();

    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No data' });
    }

    const payload = JSON.parse(e.postData.contents);

    // 🛣️ Route 1: มาจาก LINE Webhook (โครงสร้างปกติ)
    if (payload.events) {
      payload.events.forEach(event => handleEvent(event));
      return createJsonResponse({ status: 'ok' });
    }

    // 🛣️ Route 2: มาจาก LIFF หรือ Internal Call (โครงสร้าง Path) [cite: 14]
    switch (payload.path) {
      case "user/check": // [cite: 15]
        return createJsonResponse(checkUserStatus(payload.userId));
      
      case "user/register": // [cite: 15]
        return createJsonResponse(registerNewMember(payload));

      default:
        return createJsonResponse({ status: 'error', message: 'Unknown path' });
    }

  } catch (error) {
    console.error("❌ API Error:", error.message);
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

/**
 * เช็คสถานะสมาชิกเบื้องต้น (กันซ้ำระดับ DB) [cite: 16, 17]
 */
function checkUserStatus(userId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
  // ดึงเฉพาะคอลัมน์ A (User ID) มาเช็คเพื่อความเร็ว [cite: 16]
  const ids = sheet.getRange("A:A").getValues().flat();
  const exists = ids.indexOf(userId) > -1;
  
  return { exists: exists, userId: userId }; // [cite: 17]
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}