/**
 * 🚀 MAIN.gs - Daily Pet Shop (Production Entry Point - Phone Search Version)
 */

/**
 * 🌐 1. จัดการการเข้าถึงผ่าน Browser (LIFF / Web Page)
 */
function doGet(e) {
  let page = e.parameter.page || 'Registration';
  page = page.replace(/\.html$/i, '');

  try {
    validateConfig();
    const targetFile = findFileIgnoreSense(page);
    const template = HtmlService.createTemplateFromFile(targetFile);
    template.queryParameters = e.parameter;
    
    return template.evaluate()
      .setTitle('Daily Pet Shop | Digital Member')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    console.error(`❌ Route Error [${page}]: ` + error.toString());
    return HtmlService.createHtmlOutput(`
      <div style="padding:30px; font-family:sans-serif; text-align:center; background:#FFF4EF;">
        <h2 style="color:#C84528;">🐾 ขออภัย ระบบหลงทาง</h2>
        <p>ไม่พบหน้า <b>"${page}"</b> ที่คุณต้องการ</p>
      </div>
    `);
  }
}

/**
 * 📡 2. ปรับปรุง doPost เพื่อรองรับ Dialogflow Webhook และค้นหาด้วยเบอร์โทร
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return createJsonResponse({ status: 'error' });

    validateConfig();
    const body = JSON.parse(e.postData.contents);

    // 🛠️ ตรวจสอบว่าเป็น Request จาก Dialogflow หรือไม่
    if (body.queryResult) {
      return handleDialogflowFulfillment(body);
    }

    // หากไม่ใช่ ให้จัดการแบบ LINE Event ปกติ
    const events = body.events || [];
    events.forEach(event => {
      try {
        handleEvent(event);
      } catch (err) {
        console.error("❌ Event Error:", err.message);
      }
    });

    return createJsonResponse({ status: 'ok' });
  } catch (error) {
    console.error("❌ Global Error:", error.message);
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

/**
 * 🤖 3. จัดการ Fulfillment สำหรับ Dialogflow (Phone Search Logic)
 */
function handleDialogflowFulfillment(body) {
  const intentName = body.queryResult.intent.displayName;
  const parameters = body.queryResult.parameters;
  const userId = body.originalDetectIntentRequest.payload.data.source.userId;

  // กรณีลูกค้าต้องการ "เช็คแต้มสะสม" หรือ "ข้อมูลสมาชิก"
  if (intentName === "Check Points" || intentName === "CheckMemberInfo") {
    
    // ดึงค่าเบอร์โทรศัพท์ที่ลูกค้าพิมพ์เข้ามา
    const phone = parameters['phone-number'] || parameters['phone'];

    if (!phone) {
      // หากยังไม่มีเบอร์โทร ให้บอทตอบกลับเพื่อขอเบอร์โทรศัพท์
      return createDialogflowResponse("กรุณาพิมพ์เบอร์โทรศัพท์ 10 หลักเพื่อเช็คแต้มสะสมค่ะ 🐾");
    }

    // เรียกใช้ฟังก์ชันค้นหาจากเบอร์โทรศัพท์ใน Membership.gs
    const summary = getMemberSummaryByPhone(phone);

    if (summary) {
      // หากพบข้อมูล ให้ส่ง Flex Message ข้อมูลสมาชิกกลับไป
      // หมายเหตุ: ฟังก์ชัน sendFlexMemberSummary ต้องอยู่ใน FlexService.gs ของคุณ
      const flexMessage = getFlexMemberSummary(summary); 
      return createDialogflowFlexResponse(flexMessage);
    } else {
      // หากไม่พบข้อมูลสมาชิก
      return createDialogflowResponse("ขออภัยค่ะ ไม่พบข้อมูลสมาชิกที่ลงทะเบียนด้วยเบอร์โทรนี้ " + phone + " กรุณาตรวจสอบเบอร์โทรหรือสมัครสมาชิกก่อนนะคะ");
    }
  }

  return createDialogflowResponse("รับทราบค่ะ มีอะไรให้ช่วยเพิ่มเติมไหมคะ?");
}

/**
 * 🛠️ 4. Helper: สร้างคำตอบสำหรับ Dialogflow (Text Only)
 */
function createDialogflowResponse(text) {
  return createJsonResponse({
    "fulfillmentMessages": [{ "text": { "text": [text] } }]
  });
}

/**
 * 🛠️ 5. Helper: สร้างคำตอบสำหรับ Dialogflow (Flex Message)
 */
function createDialogflowFlexResponse(flexData) {
  return createJsonResponse({
    "fulfillmentMessages": [{
      "payload": {
        "line": {
          "type": "flex",
          "altText": "ข้อมูลคะแนนสะสมของคุณ",
          "contents": flexData
        }
      }
    }]
  });
}

/**
 * 🛠️ 6. Helper: ค้นหาชื่อไฟล์ในโปรเจกต์
 */
function findFileIgnoreSense(filename) {
  const validPages = ['Admin', 'Registration', 'Reward']; 
  const found = validPages.find(p => p.toLowerCase() === filename.toLowerCase());
  return found || 'Registration'; 
}

/**
 * 🛠️ 7. Helper: สร้าง JSON Response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ฟังก์ชันส่ง LIFF ID กลับไปให้หน้า HTML (เพื่อรองรับการย้ายค่าไปไว้ใน Config.js)
 */
function getLiffIdConfig() {
  // ดึงค่ามาจาก Config.js หรือ PropertiesService
  return "2009630242-iPO8WjV7"; 
}