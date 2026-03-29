// ========================================
// 📱 LINEAPI.GS - LINE CONNECTOR (Full Version)
// ========================================

/**
 * แสดงสถานะ "บอทกำลังพิมพ์" (Loading Animation)
 */
function sendLoadingAnimation(userId) {
  try {
    const url = "https://api.line.me/v2/bot/chat/loading/start";
    const payload = {
      chatId: userId,
      loadingSeconds: 5
    };
    const options = {
      "method": "post",
      "contentType": "application/json",
      "headers": { "Authorization": "Bearer " + CONFIG.LINE_TOKEN },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log('⚠️ Loading Animation Error: ' + e.message);
  }
}

/**
 * ส่งข้อความตอบกลับ (Reply Message)
 */
function replyMessage(replyToken, messages) {
  try {
    const url = "https://api.line.me/v2/bot/message/reply";
    const payload = {
      "replyToken": replyToken,
      "messages": Array.isArray(messages) ? messages : [{ "type": "text", "text": messages }]
    };
    const options = {
      "method": "post",
      "contentType": "application/json",
      "headers": { "Authorization": "Bearer " + CONFIG.LINE_TOKEN },
      "payload": JSON.stringify(payload)
    };
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log('❌ replyMessage Error: ' + e.message);
  }
}

/**
 * ดึงโปรไฟล์จาก LINE API
 */
function getUserProfile(userId) {
  try {
    const url = "https://api.line.me/v2/bot/profile/" + userId;
    const options = {
      "method": "get",
      "headers": { "Authorization": "Bearer " + CONFIG.LINE_TOKEN }
    };
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log('❌ getUserProfile Error: ' + e.message);
    return { displayName: 'Customer' };
  }
}