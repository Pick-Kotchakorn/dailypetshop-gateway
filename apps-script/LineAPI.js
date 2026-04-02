/**
 * 📱 LINEAPI.gs
 * จัดการการเชื่อมต่อกับ LINE Messaging API ทั้งหมด
 */

/**
 * แสดงสถานะ "บอทกำลังพิมพ์" (Loading Animation)
 */
function sendLoadingAnimation(userId) {
  if (!userId) return;
  try {
    const url = "https://api.line.me/v2/bot/chat/loading/start";
    const payload = { "chatId": userId, "loadingSeconds": 5 };
    callLineApi(url, "post", payload);
  } catch (e) {
    console.error("❌ Loading Animation Error: " + e.message);
  }
}

/**
 * ส่งข้อความตอบกลับ (Reply Message)
 */
function replyMessage(replyToken, messages) {
  if (!replyToken) return;
  try {
    const url = "https://api.line.me/v2/bot/message/reply";
    const payload = {
      "replyToken": replyToken,
      "messages": Array.isArray(messages) ? messages : [{ "type": "text", "text": messages }]
    };
    callLineApi(url, "post", payload);
  } catch (e) {
    console.error("❌ replyMessage Error: " + e.message);
  }
}

/**
 * ดึงโปรไฟล์ผู้ใช้จาก LINE API
 */
function getUserProfile(userId) {
  if (!userId) return null;
  try {
    const url = "https://api.line.me/v2/bot/profile/" + userId;
    const response = callLineApi(url, "get");
    return JSON.parse(response.getContentText());
  } catch (e) {
    console.error('❌ getUserProfile Error: ' + e.message);
    return { displayName: 'Customer', pictureUrl: '' }; // ค่า Default กรณีดึงโปรไฟล์ไม่ได้
  }
}

/**
 * 🛠️ Helper Function: สำหรับเรียก LINE API แบบมีมาตรฐาน
 */
function callLineApi(url, method, payload = null) {
  const options = {
    "method": method,
    "headers": {
      "Authorization": "Bearer " + CONFIG.LINE_ACCESS_TOKEN,
      "Content-Type": "application/json"
    },
    "muteHttpExceptions": true // เพื่อให้เราอ่าน Error จาก LINE ได้เอง
  };

  if (payload) options.payload = JSON.stringify(payload);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    console.error(`⚠️ LINE API Error (${responseCode}): ${response.getContentText()}`);
  }

  return response;
}