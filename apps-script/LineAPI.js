/**
 * 📡 LineAPI.js - จัดการการเชื่อมต่อกับ LINE Messaging API
 */

/**
 * 📨 ส่งข้อความไปยังผู้ใช้ LINE (Push Message)
 */
function sendMessage(userId, message) {
  if (!userId) return false;
  try {
    const url = "https://api.line.me/v2/bot/message/push";
    const payload = {
      "to": userId,
      "messages": Array.isArray(message) ? message : [{ "type": "text", "text": message }]
    };
    callLineApi(url, "post", payload);
    return true;
  } catch (e) {
    console.error("❌ Send Message Error: " + e.message);
    return false;
  }
}

/**
 * 👤 ดึงข้อมูลโปรไฟล์ผู้ใช้จาก LINE (จำเป็นสำหรับ 13 คอลัมน์)
 */
function getUserProfile(userId) {
  if (!userId) return null;
  const url = `https://api.line.me/v2/bot/profile/${userId}`;
  try {
    const options = {
      "method": "get",
      "headers": { "Authorization": "Bearer " + CONFIG.LINE_ACCESS_TOKEN }
    };
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (e) {
    console.error("❌ Get Profile Error: " + e.message);
    return { displayName: "ลูกค้า LINE", pictureUrl: "", statusMessage: "" };
  }
}

/**
 * ⏳ แสดง/หยุด Loading Animation
 */
function showLoading(userId) {
  if (!userId) return;
  try {
    callLineApi("https://api.line.me/v2/bot/chat/loading/start", "post", { "chatId": userId, "loadingSeconds": 10 });
  } catch (e) { console.error("❌ Loading Error: " + e.message); }
}

function hideLoading(userId) {
  if (!userId) return;
  try {
    callLineApi("https://api.line.me/v2/bot/chat/loading/stop", "post", { "chatId": userId });
  } catch (e) { console.error("❌ Hide Loading Error: " + e.message); }
}

/**
 * ✅ ตอบรับข้อความ (Mark as Read)
 */
function markAsRead(userId) {
  if (!userId) return false;
  try {
    const url = "https://api.line.me/v2/bot/message/markAsRead";
    callLineApi(url, "post", { "chatId": userId });
    return true;
  } catch (e) {
    console.error(`❌ markAsRead Error: ${e.message}`);
    return false;
  }
}

/**
 * 📞 เรียก LINE API หลัก (ใช้ CONFIG จาก Config.js)
 */
function callLineApi(url, method, payload) {
  const options = {
    "method": method,
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CONFIG.LINE_ACCESS_TOKEN 
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    console.error(`LINE API Error: ${response.getContentText()}`);
  }
  return response;
}