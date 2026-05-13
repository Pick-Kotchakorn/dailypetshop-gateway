/**
 * 🐾 NUTRITIONSERVICE.js - Daily Pet Shop (AI Recommender V3.1)
 *
 * Fixes v3.1:
 *   [N1] replyToken misuse — เปลี่ยนทุกจุดจาก replyMessage(replyToken, ...) → sendMessage(userId, ...)
 *        เนื่องจาก EventHandler.js เรียก startNutritionConsultation(userId) โดยไม่ส่ง replyToken
 *        และ nutrition flow เป็น push-based อยู่แล้ว
 *   [N2] ลบ parameter replyToken ออกจาก signature ของทุกฟังก์ชันที่ไม่ได้ใช้งาน
 *   [N3] Column index ของ Products sheet ยืนยันแล้วว่าถูกต้องตาม setupDatabase() ใน SheetService.js
 *        (22 คอลัมน์: Tags_For_AI = p[19], Image_URL = p[20], Description = p[21])
 *        — ห้ามใช้ createProductsSheet() ใน Setup.js อีกต่อไป เพราะมีแค่ 9 คอลัมน์
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. ส่งคำถาม Quiz แบบ Premium Flex Message (push-based)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ส่ง Nutrition Quiz ขั้นตอนที่ step ไปให้ผู้ใช้
 * [N1] ใช้ sendMessage(userId, ...) แทน replyMessage(replyToken, ...)
 * [N2] ลบ parameter replyToken ออกจาก signature
 * @param {string} userId  - LINE User ID
 * @param {number} step    - ขั้นตอนปัจจุบัน (1–5)
 */
function sendNutritionQuestion(userId, step) {
  let questionText = "";
  let options = [];

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

  // Progress Bar แบบ Dynamic
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

  // [N1] push-based: ใช้ sendMessage แทน replyMessage เพราะ replyToken ไม่ถูกส่งมาใน flow นี้
  sendMessage(userId, {
    "type": "flex",
    "altText": "เดลี่มีแบบสอบถามโภชนาการมาฝากครับ",
    "contents": flexContents
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. Entry Point & Step Handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * เริ่มต้น Nutrition Consultation
 * [N2] ลบ parameter replyToken ออก — ใช้ sendMessage ภายใน
 * @param {string} userId - LINE User ID
 */
function startNutritionConsultation(userId) {
  try {
    sendLoadingAnimation(userId);
    const profile = getCustomerProfile(userId);
    // greeting ถูก build ไว้แต่ส่งแยก step แรกผ่าน sendNutritionQuestion
    if (profile && profile.name) {
      sendMessage(userId,
        `ยินดีที่ได้พบกันอีกนะครับคุณ ${profile.name} ` +
        `วันนี้ให้เดลี่ช่วยดูแลเรื่องโภชนาการน้องแมวส่วนไหนดีครับ?`
      );
    } else {
      sendMessage(userId,
        "สวัสดีครับคุณลูกค้า ผม 'เดลี่' พร้อมดูแลน้องแมวแล้วครับ 🐾"
      );
    }
    // [N1][N2] ส่ง step 1 โดยไม่ต้องการ replyToken
    sendNutritionQuestion(userId, 1);
  } catch (e) {
    console.error("❌ [startNutritionConsultation]", e.message);
  }
}

/**
 * จัดการแต่ละ step ของ Quiz
 * [N2] ลบ parameter replyToken ออก
 * @param {string} userId - LINE User ID
 * @param {number} step   - ขั้นตอนที่ตอบมา (1–5)
 * @param {string} value  - คำตอบที่เลือก
 */
function handleNutritionStep(userId, step, value) {
  logNutritionActivity(userId, `STEP_${step}`, value);
  if (step < CONFIG.NUTRITION.QUESTION_STEPS) {
    // [N1][N2] ต่อ step ถัดไปด้วย push message
    sendNutritionQuestion(userId, step + 1);
  } else {
    // [N1][N2] ครบ 5 ข้อ → วิเคราะห์และแนะนำสินค้า
    evaluateNutritionAndRecommend(userId);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 3. AI Recommendation Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * วิเคราะห์คำตอบ Quiz และแนะนำสินค้าที่เหมาะสม
 * [N1] ใช้ sendMessage(userId, ...) แทน replyMessage(replyToken, ...)
 * [N2] ลบ parameter replyToken ออก
 * [N3] Column indices ถูกต้องตาม setupDatabase() (22 คอลัมน์):
 *      p[0]=Product_ID  p[1]=Product_Name  p[2]=Category  p[13]=Price
 *      p[19]=Tags_For_AI  p[20]=Image_URL  p[21]=Description
 *      ** ต้องสร้าง sheet ด้วย setupDatabase() ใน SheetService.js เท่านั้น
 *         ห้ามใช้ createProductsSheet() ใน Setup.js (schema แค่ 9 คอลัมน์) **
 * @param {string} userId - LINE User ID
 */
function evaluateNutritionAndRecommend(userId) {
  try {
    const ss = getSS();
    const logSheet = ss.getSheetByName(CONFIG.NUTRITION.SHEET_NAME);
    const productSheet = ss.getSheetByName(CONFIG.SHEET_NAME.PRODUCTS);

    const logData = logSheet.getDataRange().getValues();

    // ดึงเฉพาะ 5 คำตอบล่าสุดของ userId นี้ (column 4 = User Answer, index 4)
    const userAnswers = logData
      .filter(row => row[1] === userId)
      .slice(-5)
      .map(row => row[4].toString().toLowerCase());

    const products = productSheet.getDataRange().getValues().slice(1); // ตัด header

    // 🧠 Smart Tag Matching กับ Tags_For_AI (p[19]) และ Category (p[2])
    let recommended = products.filter(p => {
      const aiTags  = p[19] ? p[19].toString().toLowerCase() : ""; // [N3] Tags_For_AI
      const category = p[2]  ? p[2].toString().toLowerCase()  : "";

      const matchCount = userAnswers.filter(
        ans => aiTags.includes(ans) || category.includes(ans)
      ).length;
      return matchCount >= 2; // ต้องตรงอย่างน้อย 2 จุด
    });

    // Fallback: ถ้าไม่มีสินค้าที่ตรง → ใช้ 3 รายการแรก (bestseller order)
    if (recommended.length === 0) recommended = products.slice(0, 3);

    // สร้าง Carousel (สูงสุด 3 ใบ)
    const carouselContents = recommended.slice(0, 3).map(p => ({
      "type": "bubble",
      "size": "mega",
      "hero": {
        "type": "image",
        "url": p[20] || "https://via.placeholder.com/300", // [N3] Image_URL
        "size": "full", "aspectMode": "cover", "aspectRatio": "4:3"
      },
      "body": {
        "type": "box", "layout": "vertical", "paddingAll": "16px", "spacing": "sm",
        "contents": [
          { "type": "text", "text": p[1],              "weight": "bold", "size": "lg",  "color": "#532f16" },  // Product_Name
          { "type": "text", "text": `ราคา ฿${p[13]}`, "weight": "bold",               "color": CONFIG.COLORS.PRIMARY }, // Price
          { "type": "text", "text": p[21] || "",       "size": "xs",                   "color": "#888888", "wrap": true } // Description
        ]
      },
      "footer": {
        "type": "box", "layout": "vertical", "contents": [
          {
            "type": "button", "style": "primary", "color": CONFIG.COLORS.PRIMARY,
            "action": { "type": "message", "label": "สั่งซื้อ", "text": `สนใจสั่งซื้อ ${p[1]} ครับ` }
          }
        ]
      }
    }));

    // [N1] push-based: ส่งผลลัพธ์ด้วย sendMessage แทน replyMessage
    sendMessage(userId, [
      { "type": "text", "text": "เดลี่วิเคราะห์ข้อมูลและเลือกสินค้าที่เหมาะที่สุดมาให้แล้วครับ 🐾" },
      {
        "type": "flex",
        "altText": "สินค้าแนะนำสำหรับน้องแมว",
        "contents": { "type": "carousel", "contents": carouselContents }
      }
    ]);
  } catch (e) {
    console.error("❌ [evaluateNutritionAndRecommend]", e.message);
    // Fallback message ถ้าเกิด error ระหว่างประมวลผล
    sendMessage(userId, "ขออภัยครับ ระบบวิเคราะห์โภชนาการขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะครับ 🙏");
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. Logging
// ─────────────────────────────────────────────────────────────────────────────

/**
 * บันทึก activity ของ Nutrition Quiz ลง Nutrition_Logs sheet
 * @param {string} userId - LINE User ID
 * @param {string} step   - ชื่อ step เช่น "STEP_1"
 * @param {string} value  - คำตอบที่เลือก
 */
function logNutritionActivity(userId, step, value) {
  try {
    const sheet = getSheet(CONFIG.NUTRITION.SHEET_NAME);
    sheet.appendRow([new Date(), userId, step, "Question Step", value, "Recorded"]);
  } catch (e) {
    console.error("❌ [logNutritionActivity]", e.message);
  }
}