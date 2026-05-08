/**
 * 📡 LineAPI.gs - จัดการการส่งข้อความและสถานะหน้าจอ LINE
 */

function sendMessage(userId, message) {
  if (!userId || !message) return false;
  
  try {
    const url = "https://api.line.me/v2/bot/message/push";
    let messages = Array.isArray(message) ? message : [message];

    // ตรวจสอบโครงสร้างข้อความพื้นฐานหากส่งมาเป็นเพียง String
    messages = messages.map(msg => typeof msg === 'string' ? { "type": "text", "text": msg } : msg);

    const payload = { "to": userId, "messages": messages.slice(0, 5) };
    const response = callLineApi(url, "post", payload);
    return response.getResponseCode() === 200;
  } catch (e) {
    console.error("❌ sendMessage Error: " + e.message);
    return false;
  }
}

function sendFlexMessage(userId, altText, flexContents) {
  return sendMessage(userId, { "type": "flex", "altText": altText, "contents": flexContents });
}

function getUserProfile(userId) {
  if (!userId) return null;
  const url = `https://api.line.me/v2/bot/profile/${userId}`;
  try {
    const response = callLineApi(url, "get");
    if (response.getResponseCode() === 200) return JSON.parse(response.getContentText());
  } catch (e) { console.error("❌ Profile Error: " + e.message); }
  return { displayName: "ลูกค้า", pictureUrl: "", language: "th" };
}

function sendLoadingAnimation(userId) {
  if (!userId) return;
  try {
    callLineApi("https://api.line.me/v2/bot/chat/loading/start", "post", { "chatId": userId, "loadingSeconds": 5 });
  } catch (e) { console.error("❌ Loading Error: " + e.message); }
}

function markAsRead(userId) {
  if (!userId) return;
  try {
    callLineApi("https://api.line.me/v2/bot/message/markAsRead", "post", { "chatId": userId });
  } catch (e) { }
}

function linkRichMenuToUser(userId, richMenuIdOrAlias) {
  const url = `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuIdOrAlias}`;
  try {
    return callLineApi(url, "post").getResponseCode() === 200;
  } catch (e) { return false; }
}

function callLineApi(url, method, payload = null) {
  const options = {
    "method": method,
    "headers": { "Content-Type": "application/json", "Authorization": "Bearer " + CONFIG.LINE_ACCESS_TOKEN },
    "muteHttpExceptions": true
  };
  if (payload) options.payload = JSON.stringify(payload);
  return UrlFetchApp.fetch(url, options);
}

// เพิ่มฟังก์ชันนี้ใน LineAPI.gs เพื่อใช้ส่งฟรีและลดความหน่วงครับ[cite: 8]
function replyMessage(replyToken, message) {
  const url = "https://api.line.me/v2/bot/message/reply";
  let messages = Array.isArray(message) ? message : [message];
  const payload = { "replyToken": replyToken, "messages": messages.slice(0, 5) };
  return callLineApi(url, "post", payload);
}