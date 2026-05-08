/**
 * 🐾 NUTRITIONSERVICE.gs - Daily Pet Shop (Version: Daily ครับ)
 */

function startNutritionConsultation(userId, replyToken) {
  try {
    sendLoadingAnimation(userId); 
    
    const profile = typeof getCustomerProfile === 'function' ? getCustomerProfile(userId) : null; 
    let greeting = "สวัสดีครับคุณลูกค้า ผม 'เดลี่' พร้อมดูแลน้องแมวแล้วครับ 🐾";
    
    if (profile && profile.name) {
      greeting = `ยินดีที่ได้พบกันอีกนะครับคุณ ${profile.name} วันนี้ให้เดลี่ช่วยดูแลเรื่องโภชนาการน้องแมวส่วนไหนดีครับ?`;
    }

    // บันทึกกิจกรรมลง Log
    logNutritionActivity(userId, "START", greeting); 
    
    // ✨ ส่งต่อ replyToken ไปยังฟังก์ชันส่งคำถามข้อที่ 1
    sendNutritionQuestion(userId, 1, replyToken);
    
  } catch (e) {
    console.error("❌ startNutritionConsultation Error: " + e.message);
  }
}

/**
 * 🎨 ฟังก์ชันส่งคำถามรูปแบบ Premium Flex Message (ใช้ replyToken เพื่อส่งฟรี)
 */
function sendNutritionQuestion(userId, step, replyToken) {
  let questionText = "";
  let options = [];

  // กำหนดคำถามและคำลงท้าย "ครับ"
  switch (step) {
    case 1:
      questionText = "น้องแมวอยู่ในช่วงวัยไหนครับ? 🐱";
      options = [
        { label: "ลูกแมว (< 1 ปี)", value: "ลูกแมว" },
        { label: "แมวโต (1-7 ปี)", value: "แมวโต" },
        { label: "แมวสูงวัย (7 ปี+)", value: "แมวสูงวัย" }
      ];
      break;
    case 2:
      questionText = "อยากให้ดูแลเรื่องไหนเป็นพิเศษครับ? ✨";
      options = [
        { label: "เบื่ออาหาร", value: "เบื่ออาหาร" },
        { label: "บำรุงขน", value: "บำรุงขน" },
        { label: "สุขภาพไต", value: "Urinary" },
        { label: "คุมน้ำหนัก", value: "คุมน้ำหนัก" }
      ];
      break;
    case 3:
      questionText = "ปกติชอบทานแบบไหนครับ? 🍱";
      options = [
        { label: "เม็ดกรอบ", value: "เม็ด" },
        { label: "อาหารเปียก", value: "เปียก" },
        { label: "ทานผสมกัน", value: "ผสม" }
      ];
      break;
    case 4:
      questionText = "มีประวัติแพ้อาหารไหมครับ? 🚫";
      options = [
        { label: "แพ้ไก่", value: "แพ้ไก่" },
        { label: "แพ้ธัญพืช", value: "Grain" },
        { label: "ไม่มีประวัติแพ้", value: "None" }
      ];
      break;
    case 5:
      questionText = "ระดับกิจกรรมเป็นอย่างไรครับ? 🏃‍♂️";
      options = [
        { label: "Indoor (นอนเยอะ)", value: "Indoor" },
        { label: "Active (เล่นบ่อย)", value: "Active" }
      ];
      break;
  }

  // สร้างแถบ Progress Bar แบบ Dynamic
  const progressBar = [];
  for (let i = 1; i <= 5; i++) {
    progressBar.push({
      "type": "box",
      "layout": "vertical",
      "flex": 1,
      "height": "4px",
      "cornerRadius": "99px",
      "backgroundColor": i <= step ? "#ffffff" : "#ffffff40",
      "contents": []
    });
  }

  const flexContents = {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "paddingAll": "16px",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "DAILY PET CLUB", "size": "xxs", "color": "#c9956e", "flex": 1 },
            { "type": "text", "text": `${step} / 5`, "size": "xxs", "color": "#c9956e", "align": "end" }
          ]
        },
        { "type": "box", "layout": "horizontal", "margin": "sm", "spacing": "xs", "contents": progressBar },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "backgroundColor": CONFIG.COLORS.PRIMARY,
          "cornerRadius": "10px",
          "paddingAll": "14px",
          "contents": [
            {
              "type": "box",
              "layout": "vertical",
              "backgroundColor": "#ffffff26",
              "cornerRadius": "99px",
              "paddingTop": "3px", "paddingBottom": "3px", "paddingStart": "10px", "paddingEnd": "10px",
              "contents": [
                { "type": "text", "text": "Nutrition Quiz · แมว", "size": "xxs", "color": "#FFD0BC", "align": "center" }
              ]
            },
            { "type": "text", "text": questionText, "weight": "bold", "size": "md", "color": "#ffffff", "wrap": true, "margin": "sm" }
          ]
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "paddingTop": "10px", "paddingBottom": "6px", "paddingStart": "16px", "paddingEnd": "16px",
      "contents": [{ "type": "text", "text": "เลือก 1 คำตอบ", "size": "xxs", "color": "#a07060" }]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "paddingAll": "14px",
      "contents": options.map(opt => ({
        "type": "button",
        "style": "primary",
        "color": CONFIG.COLORS.PRIMARY,
        "action": {
          "type": "postback",
          "label": opt.label,
          "data": `action=nutrition&step=${step}&value=${opt.value}`,
          "displayText": opt.label
        }
      }))
    },
    "styles": {
      "header": { "backgroundColor": "#532f16" },
      "body": { "backgroundColor": "#FFF8F4" },
      "footer": { "backgroundColor": "#ffffff" }
    }
  };

  // ใช้ replyMessage แทน sendMessage เพื่อความเร็วและประหยัดโควต้า
  replyMessage(replyToken, {
    "type": "flex",
    "altText": "เดลี่มีแบบสอบถามโภชนาการมาฝากครับ",
    "contents": flexContents
  });
}

/**
 * 🛠️ จัดการข้อมูลเมื่อลูกค้าตอบคำถาม (แบบลด Latency)
 */
function handleNutritionStep(userId, step, value, replyToken) {

  logNutritionActivity(userId, `STEP_${step}`, value); 
  
  if (step < CONFIG.NUTRITION.QUESTION_STEPS) {
    sendNutritionQuestion(userId, step + 1, replyToken);
  } else {
    evaluateNutritionAndRecommend(userId, replyToken);
  }
}

/**
 * 🎯 วิเคราะห์และแนะนำสินค้า (เวอร์ชัน "เดลี่" ครับ)
 */
function evaluateNutritionAndRecommend(userId, replyToken) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const logSheet = ss.getSheetByName(CONFIG.NUTRITION.SHEET_NAME);
  const productSheet = ss.getSheetByName(CONFIG.SHEET_NAME.PRODUCTS);
  
  const logData = logSheet.getDataRange().getValues();
  const userAnswers = logData
    .filter(row => row[1] === userId && row[2].startsWith("STEP_"))
    .slice(-5)
    .map(row => row[3]);

  const products = productSheet.getDataRange().getValues().slice(1);
  let recommended = products.filter(p => {
    const tags = p[7].toString().toLowerCase();
    return userAnswers.some(ans => tags.includes(ans.toLowerCase()));
  });

  if (recommended.length === 0) recommended = products.slice(0, 3);

  // 1. สร้างการ์ดสินค้าแนะนำ (ขนาด Mega) ตามดีไซน์ใหม่
  const carouselContents = recommended.slice(0, 3).map(p => ({
    "type": "bubble",
    "size": "mega",
    "hero": {
      "type": "image",
      "url": p[8] || "https://via.placeholder.com/300",
      "size": "full",
      "aspectMode": "cover",
      "aspectRatio": "4:3"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "paddingAll": "16px",
      "spacing": "sm",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "box",
              "layout": "vertical",
              "cornerRadius": "99px",
              "backgroundColor": "#c84528",
              "paddingTop": "3px",
              "paddingBottom": "3px",
              "paddingStart": "10px",
              "paddingEnd": "10px",
              "contents": [
                {
                  "type": "text",
                  "text": "แนะนำ",
                  "size": "xxs",
                  "weight": "bold",
                  "color": "#f4f0e5"
                }
              ],
              "flex": 0
            },
            { "type": "filler" }
          ]
        },
        {
          "type": "text",
          "text": p[1],
          "weight": "bold",
          "size": "lg",
          "wrap": true,
          "color": "#532f16",
          "margin": "sm"
        },
        {
          "type": "text",
          "text": `ราคา ${p[6]} บาท`,
          "color": "#C84528",
          "weight": "bold",
          "margin": "none",
          "size": "md"
        },
        {
          "type": "text",
          "text": `เหมาะสำหรับ: ${p[4]}`,
          "size": "sm",
          "color": "#888888",
          "wrap": true,
          "margin": "xs"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "paddingAll": "14px",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "color": "#C84528",
          "action": {
            "type": "message",
            "label": "สั่งซื้อ",
            "text": `สนใจสั่งซื้อ ${p[1]} ครับ`
          }
        }
      ]
    },
    "styles": {
      "body": { "backgroundColor": "#ffffff" },
      "footer": { "backgroundColor": "#ffffff" }
    }
  }));

  // 2. เพิ่มการ์ดใบสุดท้าย (Contact/CTA) ตามดีไซน์ใหม่
  carouselContents.push({
    "type": "bubble",
    "size": "mega",
    "body": {
      "type": "box",
      "layout": "vertical",
      "paddingTop": "14px",
      "paddingBottom": "0px",
      "paddingStart": "18px",
      "paddingEnd": "18px",
      "spacing": "sm",
      "contents": [
        {
          "type": "text",
          "text": "สนใจสั่งซื้อ\nหรือปรึกษาเพิ่มเติม?",
          "weight": "bold",
          "size": "lg",
          "wrap": true,
          "align": "center",
          "color": "#532f16",
          "margin": "xxl"
        },
        {
          "type": "text",
          "text": "เดลี่รวบรวมช่องทางติดต่อ\nและสั่งซื้อออนไลน์ไว้ที่นี่",
          "size": "sm",
          "color": "#888888",
          "wrap": true,
          "align": "center"
        },
        { "type": "separator", "margin": "lg", "color": "#F0E0D8" },
        {
          "type": "box",
          "layout": "horizontal",
          "margin": "lg",
          "contents": [
            {
              "type": "box",
              "layout": "vertical", "flex": 1, "spacing": "xs",
              "contents": [
                { "type": "text", "text": "🚚", "align": "center", "size": "lg" },
                { "type": "text", "text": "จัดส่งด่วน", "align": "center", "size": "xxs", "color": "#C84528", "weight": "bold" }
              ]
            },
            {
              "type": "box",
              "layout": "vertical", "flex": 1, "spacing": "xs",
              "contents": [
                { "type": "text", "text": "💬", "align": "center", "size": "lg" },
                { "type": "text", "text": "ปรึกษาฟรี", "align": "center", "size": "xxs", "color": "#C84528", "weight": "bold" }
              ]
            },
            {
              "type": "box",
              "layout": "vertical", "flex": 1, "spacing": "xs",
              "contents": [
                { "type": "text", "text": "✅", "align": "center", "size": "lg" },
                { "type": "text", "text": "ของแท้ 100%", "align": "center", "size": "xxs", "color": "#C84528", "weight": "bold" }
              ]
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "paddingAll": "14px",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "color": "#C84528",
          "action": {
            "type": "uri",
            "label": "ไปที่ร้านค้าออนไลน์",
            "uri": "https://linktr.ee/daily.pet.shop.shop.online"
          }
        }
      ]
    },
    "styles": {
      "footer": { "backgroundColor": "#FFF8F4" }
    }
  });

  // 3. ส่งคำตอบกลับแบบ Flex Carousel
  replyMessage(replyToken, [
    { "type": "text", "text": "วิเคราะห์เรียบร้อยครับ! จากข้อมูลที่คุณให้มา เดลี่เลือกอาหารที่เหมาะกับน้องแมวที่สุดมาให้แล้วครับ 🐾" },
    {
      "type": "flex",
      "altText": "เดลี่แนะนำสินค้าสำหรับน้องแมวครับ",
      "contents": { "type": "carousel", "contents": carouselContents }
    }
  ]);
  
  logNutritionActivity(userId, "COMPLETED", `Recommended ${recommended.length} items`);
}

/**
 * 5. ฟังก์ชันบันทึกกิจกรรมลงชีต (Helper)
 */
function logNutritionActivity(userId, step, value) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.NUTRITION.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.NUTRITION.SHEET_NAME);
    sheet.appendRow(["Timestamp", "UserID", "Step", "Value"]);
  }
  
  sheet.appendRow([new Date(), userId, step, value]);
}