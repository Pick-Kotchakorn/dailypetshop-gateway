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
    // ปรับเวลาเป็น 20 วินาที เพื่อความเสถียรในการแสดงผล
    const payload = { "chatId": userId, "loadingSeconds": 20 }; 
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
    "muteHttpExceptions": true 
  };

  if (payload) options.payload = JSON.stringify(payload);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  // 💡 ต้องยอมรับ Status 200 (ทั่วไป) และ 202 (สำหรับ Loading API)
  if (responseCode !== 200 && responseCode !== 202) {
    console.error(`⚠️ LINE API Error (${responseCode}): ${response.getContentText()}`);
  }

  return response;
}

/**
 * 🌟 ฟังก์ชันระบบขึ้นสถานะ "อ่านแล้ว" (Instant Read)
 */
function markAsRead(readToken) {
  if (!readToken) return false;
  
  try {
    const url = "https://api.line.me/v2/bot/v2/operator/markAsRead";
    const payload = { markAsReadToken: readToken };

    // ใช้ callLineApi ที่สร้างไว้เพื่อความเร็วและมาตรฐาน Header
    const response = callLineApi(url, "post", payload);
    
    if (response.getResponseCode() === 200) {
      console.log('✅ MarkAsRead successful.');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ markAsRead Error: ${error.message}`);
    return false;
  }
}

/**
 * 🌟 ใหม่: Helper function สำหรับลองทำงานซ้ำกรณี API ขัดข้อง
 */
function retry(fn, maxRetries, delay) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (e) {
      lastError = e;
      if (i < maxRetries - 1) Utilities.sleep(delay);
    }
  }
  throw lastError;
}