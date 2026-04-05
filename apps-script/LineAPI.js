/**
 * 📡 LineAPI.js - จัดการการเชื่อมต่อกับ LINE Messaging API
 * จัดการการส่งข้อความ, การแสดง Loading Animation, และการจัดการ Webhook
 */

/**
 * 📨 ส่งข้อความไปยังผู้ใช้ LINE
 * @param {string} userId - รหัสผู้ใช้ LINE
 * @param {string|object} message - ข้อความหรือออบเจ็กต์ข้อความ
 * @returns {boolean} ผลลัพธ์การส่ง
 */
function sendMessage(userId, message) {
  if (!userId) return false;

  try {
    const url = "https://api.line.me/v2/bot/message/push";
    const payload = {
      "to": userId,
      "messages": Array.isArray(message) ? message : [message]
    };
    callLineApi(url, "post", payload);
    return true;
  } catch (e) {
    console.error("❌ Send Message Error: " + e.message);
    return false;
  }
}

/**
 * ⏳ แสดง Loading Animation
 * @param {string} userId - รหัสผู้ใช้ LINE
 */
function showLoading(userId) {
  if (!userId) return;
  try {
    const url = "https://api.line.me/v2/bot/chat/loading/start";
    // ปรับเวลาเป็น 10 วินาที เพื่อความเสถียรในการแสดงผล
    const payload = { "chatId": userId, "loadingSeconds": 10 }; 
    callLineApi(url, "post", payload);
  } catch (e) {
    console.error("❌ Loading Animation Error: " + e.message);
  }
}

/**
 * 🛑 หยุด Loading Animation
 * @param {string} userId - รหัสผู้ใช้ LINE
 */
function hideLoading(userId) {
  if (!userId) return;
  try {
    const url = "https://api.line.me/v2/bot/chat/loading/stop";
    const payload = { "chatId": userId };
    callLineApi(url, "post", payload);
  } catch (e) {
    console.error("❌ Hide Loading Error: " + e.message);
  }
}

/**
 * 📞 เรียก LINE API หลัก
 * แก้ไข: ปรับชื่อตัวแปร CONFIG ให้ตรงตาม Config.js
 */
function callLineApi(url, method, payload) {
  const options = {
    "method": method,
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CONFIG.LINE_ACCESS_TOKEN // ✅ แก้ไขจากเดิมที่เป็นชื่อยาวๆ
    },
    "payload": JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error(`LINE API Error: ${responseCode} - ${response.getContentText()}`);
  }
}

/**
 * 📱 จัดการ Webhook จาก LINE
 * @param {object} e - ข้อมูลจาก Webhook
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const events = data.events;

    for (let event of events) {
      if (event.type === "message" && event.message.type === "text") {
        handleMessage(event);
      } else if (event.type === "follow") {
        handleFollow(event);
      } else if (event.type === "unfollow") {
        handleUnfollow(event);
      }
    }

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    console.error("❌ Webhook Error: " + error.message);
    return ContentService.createTextOutput("Error").setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * 💬 จัดการข้อความที่ได้รับ
 * @param {object} event - ข้อมูล Event จาก LINE
 */
function handleMessage(event) {
  const userId = event.source.userId;
  const messageText = event.message.text;

  // ตัวอย่างการตอบกลับอัตโนมัติ
  if (messageText.includes("แต้ม")) {
    const profile = getCustomerProfile(userId);
    if (profile) {
      sendMessage(userId, `แต้มปัจจุบันของคุณ: ${profile.points} แต้ม`);
    } else {
      sendMessage(userId, "กรุณาสมัครสมาชิกก่อนค่ะ");
    }
  } else {
    sendMessage(userId, "สวัสดีค่ะ! พิมพ์ 'แต้ม' เพื่อดูแต้มสะสม");
  }
}

/**
 * ➕ จัดการการ Follow
 * @param {object} event - ข้อมูล Event จาก LINE
 */
function handleFollow(event) {
  const userId = event.source.userId;
  // อาจเพิ่ม Logic สำหรับการ Follow ใหม่
  console.log(`User ${userId} followed`);
}

/**
 * ➖ จัดการการ Unfollow
 * @param {object} event - ข้อมูล Event จาก LINE
 */
function handleUnfollow(event) {
  const userId = event.source.userId;
  // อาจเพิ่ม Logic สำหรับการ Unfollow
  console.log(`User ${userId} unfollowed`);
}

/**
 * ✅ ตอบรับข้อความ (Mark as Read)
 * @param {string} userId - รหัสผู้ใช้ LINE
 * @returns {boolean} ผลลัพธ์การ mark
 */
function markAsRead(userId) {
  if (!userId) return false;
  try {
    const url = "https://api.line.me/v2/bot/message/markAsRead";
    const payload = { "chatId": userId };
    callLineApi(url, "post", payload);
    return true;
  } catch (error) {
    console.error(`❌ markAsRead Error: ${error.message}`);
    return false;
  }
}