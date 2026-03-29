const LINE_ACCESS_TOKEN = "CZz0R1xNLrIT+B4PHh2O5JSHGhLkvFZNhL61lPtQd9U/EwJqdQnEeahdiZHmjto8S/Wl5KGBnl+blF3aV6A8PtFkf7AvjEr1ESLUU9YvalGLaR6ZPBlIYFyxmWwC51Kp4+GVIxHT4gr+rdYf6kYG3AdB04t89/1O/w1cDnyilFU=";

/**
 * ส่งข้อความตอบกลับ (Reply)
 */
function replyMessage(replyToken, text) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + LINE_ACCESS_TOKEN
    },
    "payload": JSON.stringify({
      "replyToken": replyToken,
      "messages": [{ "type": "text", "text": text }]
    })
  };
  UrlFetchApp.fetch(url, options);
}

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้จาก LINE
 */
function getUserProfile(userId) {
  const url = "https://api.line.me/v2/bot/profile/" + userId;
  const options = {
    "method": "get",
    "headers": { "Authorization": "Bearer " + LINE_ACCESS_TOKEN }
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (e) {
    return { displayName: 'Unknown' };
  }
}