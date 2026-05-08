function listAllRichMenus() {
  const token = CONFIG.LINE_ACCESS_TOKEN; 
  const url = "https://api.line.me/v2/bot/richmenu/list";
  const response = UrlFetchApp.fetch(url, {
    "headers": { "Authorization": "Bearer " + token }
  });
  console.log(response.getContentText());
}