/**
 * ✨ ฟังก์ชันสร้างชีต Products และเตรียมข้อมูลเริ่มต้น
 * เพื่อรองรับระบบ Personalized Nutrition ของ Daily Pet Shop
 */
function createProductsSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); //[cite: 5, 11]
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME.PRODUCTS); //
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME.PRODUCTS);
    console.log("✅ สร้างชีต Products เรียบร้อยแล้ว");
  } else {
    sheet.clear(); // ล้างข้อมูลเก่าเพื่อจัด Format ใหม่
    console.log("📝 อัปเดตโครงสร้างชีต Products เดิม");
  }
  
  // 1. ตั้งค่า Header (คอลัมน์ที่ 8 คือ Tags_For_AI สำหรับใช้ Matching)
  const headers = [
    "Product_ID", "ProductName", "Category", "Target_Age", 
    "Special_Needs", "Food_Type", "Price", "Tags_For_AI", "Image_URL"
  ];
  
  sheet.getRange(1, 1, 1, headers.length)
       .setValues([headers])
       .setFontWeight("bold")
       .setBackground(CONFIG.COLORS.PRIMARY) // ใช้สีส้ม Terracotta จาก Config[cite: 5]
       .setFontColor("#ffffff");

  // 2. ข้อมูลสินค้า 5 รายการแรกที่โคจิแนะนำ (Batch แรกสำหรับ Daily Pet Shop)[cite: 4]
  const initialProducts = [
    ["P001", "Royal Canin Urinary Care", "อาหารเฉพาะทาง", "แมวโต, แมวสูงวัย", "สุขภาพไต/นิ่ว", "เม็ด, เปียก", 650, "Urinary, แมวโต, แมวสูงวัย, เม็ด, เปียก", "https://via.placeholder.com/300"],
    ["P002", "Nekko Gold ทูน่าหน้าไก่", "อาหารเปียกพรีเมียม", "ลูกแมว, แมวโต", "เลือกกิน/เบื่ออาหาร", "เปียก", 25, "เบื่ออาหาร, ลูกแมว, แมวโต, เปียก", "https://via.placeholder.com/300"],
    ["P003", "Buzz Netura Holistic Grain-Free", "อาหารโฮลิสติก", "แมวโต", "ดูแลผิวหนัง/ขน", "เม็ด", 380, "บำรุงขน, Grain, แมวโต, เม็ด", "https://via.placeholder.com/300"],
    ["P004", "Monchou บำรุงระบบขับถ่าย", "อาหารฟังก์ชัน", "แมวโต", "ขับถ่าย/ก้อนขน", "เปียก", 30, "ขับถ่าย, แมวโต, เปียก", "https://via.placeholder.com/300"],
    ["P005", "Jinny Vitamin Treats", "ขนมเสริมวิตามิน", "แมวโต, แมวสูงวัย", "เสริมภูมิคุ้มกัน", "ทานเล่น", 45, "None, แมวโต, แมวสูงวัย, ผสม", "https://via.placeholder.com/300"]
  ];

  sheet.getRange(2, 1, initialProducts.length, headers.length).setValues(initialProducts);
  sheet.autoResizeColumns(1, headers.length);
  
  SpreadsheetApp.getUi().alert("🐾 ชีต Products พร้อมใช้งานแล้วค่ะคุณ Pick! เริ่ม Test Run ได้เลย");
}