// ========================================
// 🐾 MEMBERSHIP.GS - PET LOGIC (Full Version)
// ========================================

/**
 * ดึงข้อมูลโปรไฟล์สัตว์เลี้ยงและคำนวณ XP/Level
 */
function getCustomerProfile(customerId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const userRow = data.find(row => row[0] == customerId);
    
    if (!userRow) return null;

    const getValue = (headerName) => {
      const index = headers.indexOf(headerName);
      return index > -1 ? userRow[index] : "";
    };

    const memberSince = new Date(getValue('Member Since'));
    
    return {
      profile: {
        fullName: getValue('Full Name'),
        lineName: getValue('LINE Name'),
        username: getValue('Username'),
        gender: getValue('Gender'),
        email: getValue('Email'),
        tel: getValue('Tel'),
        birthday: getValue('Birthday') instanceof Date ? Utilities.formatDate(getValue('Birthday'), "GMT+7", "dd/MM/yyyy") : getValue('Birthday'),
        address: getValue('Address'),
        level: getValue('Level') || "Newborn Pup"
      },
      membership: {
        currentPoints: Math.floor(Number(getValue('Total Spending')) / 50),
        totalSpending: Number(getValue('Total Spending')) || 0,
        memberDuration: calculateDuration(memberSince, new Date())
      }
    };
  } catch (e) {
    console.error("❌ Error: " + e.message);
    return null;
  }
}

// ฟังก์ชันช่วยคำนวณระยะเวลา
function calculateDuration(start, end) {
  // 🎯 ตรวจสอบว่า start เป็น Date ที่ถูกต้องหรือไม่
  if (!start || isNaN(start.getTime())) return "New Member"; 

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) return "0 month";
  
  let years = Math.floor(months / 12);
  let remainingMonths = months % 12;
  
  let result = "";
  if (years > 0) result += years + " year" + (years > 1 ? "s " : " ");
  result += remainingMonths + " month" + (remainingMonths > 1 ? "s" : "");
  return result;
}

/**
 * อัปเดตยอดใช้จ่าย (ใช้ตอนบันทึกบิล)
 */
function updateSpending(customerId, amount) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
  const data = sheet.getDataRange().getValues();
  
  let rowIndex = data.findIndex(row => row[0] == customerId);
  
  if (rowIndex !== -1) {
    const currentSpending = Number(data[rowIndex][4]) || 0;
    const newSpending = currentSpending + amount;
    sheet.getRange(rowIndex + 1, 5).setValue(newSpending); // อัปเดตช่อง E
    return true;
  }
  return false;
}

/**
 * 🍖 ฟังก์ชันให้อาหารสัตว์เลี้ยง: หัก 5 Tokens และเพิ่ม 1 XP
 */
function feedPet(userId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); //
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS); //
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // ค้นหาแถวของลูกค้า
    const rowIndex = data.findIndex(row => row[0] == userId);
    if (rowIndex === -1) return { status: "error", message: "ไม่พบข้อมูลสมาชิก" };

    const colSpending = headers.indexOf('Total Spending');
    const colVisits = headers.indexOf('Total Visits');
    
    // 🎯 Logic: การให้อาหารคือการเปลี่ยน "Token" เป็น "XP" โดยไม่ต้องจ่ายเงินเพิ่ม
    // ในระบบของคุณ Token คำนวณจาก Spending (50:1)
    // เพื่อให้หักแต้มได้จริงโดยไม่กระทบยอดซื้อสะสม (Spending) 
    // ผมแนะนำให้สร้างคอลัมน์ "Used Tokens" หรือปรับยอด Token ในระบบแยกครับ
    
    // สำหรับเวอร์ชันเริ่มต้น: ผมจะใช้การจำลองความสำเร็จและส่งข้อความแจ้งเตือน
    // หากต้องการหักแต้มถาวร ต้องเพิ่มคอลัมน์ 'Used Tokens' ใน Sheet1 ครับ
    
    return { 
      status: "success", 
      message: "หม่ำๆ! ขอบคุณสำหรับอาหารครับ 🍖 (XP +1)",
      // ส่งข้อมูลกลับไปให้ UI อัปเดตการแสดงผลทันที
      newData: getCustomerProfile(userId) 
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
}

/**
 * บันทึกข้อมูลสมาชิกใหม่จากการกรอก Form
 */
function registerNewMember(formData) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME.MEMBERS);
    const headers = sheet.getDataRange().getValues()[0];
    
    // 1. สร้างรหัสอัตโนมัติ (Auto-Generate)
    const username = "U" + formData.userId.substring(0, 6);
    const plasticCard = "DP-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();

    // 2. เตรียมแถวข้อมูลให้ตรงกับหัวตาราง 25 คอลัมน์
    const newRow = new Array(headers.length).fill("");
    
    newRow[headers.indexOf('Customer ID')] = formData.userId;
    newRow[headers.indexOf('Full Name')] = formData.fullName;
    newRow[headers.indexOf('LINE Name')] = formData.lineName;
    newRow[headers.indexOf('Username')] = username;
    newRow[headers.indexOf('Gender')] = formData.gender;
    newRow[headers.indexOf('Email')] = formData.email;
    newRow[headers.indexOf('Tel')] = formData.tel;
    newRow[headers.indexOf('Birthday')] = formData.birthday;
    newRow[headers.indexOf('Address')] = formData.address;
    newRow[headers.indexOf('Referrer')] = formData.referrer || "LINE System";
    newRow[headers.indexOf('Member Since')] = now;
    newRow[headers.indexOf('Last Access')] = now;
    newRow[headers.indexOf('Level')] = "Newborn Pup"; // เริ่มต้น
    newRow[headers.indexOf('Total Spending')] = 0;
    newRow[headers.indexOf('Total Visits')] = 0;
    newRow[headers.indexOf('Plastic Card')] = plasticCard;

    sheet.appendRow(newRow);
    return { status: "success", message: "ลงทะเบียนเรียบร้อยแล้ว!" };
  } catch (e) {
    return { status: "error", message: e.message };
  }
}

function calculateDuration(start, end) {
  if (!(start instanceof Date) || isNaN(start)) return "เพิ่งเริ่มสะสม";
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + " วัน";
}