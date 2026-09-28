/**
 * HUKIMI SMART FARM - DATABASE LAYER (IndexedDB via Dexie.js)
 * Quản lý dữ liệu offline: Cây (Master Trees), Sinh trưởng (Growth Logs), Nhật ký chăm sóc (Care Logs)
 */

// 1. Khởi tạo Database Dexie
const db = new Dexie("HukimiSmartFarmDB");

// 2. Khai báo Schema và đánh chỉ mục tìm kiếm
db.version(1).stores({
  trees: "id, code, row, treeNumber, healthStatus, plantingDate", // Bảng 16 thuộc tính master
  growth_logs: "++id, treeCode, recordDate, healthRating",       // Lịch sử đo đạc, ảnh AR
  care_logs: "++id, treeCode, careDate, actionType",            // Lịch sử bón phân, phòng trừ sâu bệnh
  settings: "key"                                               // Cấu hình app (Gemini API Key,...)
});

// 3. Hàm tự động khởi tạo dữ liệu mẫu cho 72 cây dừa sáp cấy mô ban đầu
async function seedDefaultTrees() {
  const count = await db.trees.count();
  if (count > 0) return; // Nếu đã có dữ liệu thì không ghi đè

  console.log("Đang khởi tạo dữ liệu 72 cây dừa sáp cấy mô Hukimi vào IndexedDB...");
  const defaultTrees = [];

  // Tọa độ tham chiếu khu vực vườn thực địa
  const baseLat = 9.922325;
  const baseLng = 106.012548;
  const spacingLat = 0.000065; // ~7m khoảng cách giữa các hàng
  const spacingLng = 0.000065; // ~7m khoảng cách giữa các cây

  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 18; c++) {
      const code = `HKM-H${r}-${c.toString().padStart(2, "0")}`;
      const lat = (baseLat + (r - 1) * spacingLat).toFixed(6);
      const lng = (baseLng + (c - 1) * spacingLng).toFixed(6);

      // Thiết lập thông số giả lập thực tế cho 72 cây
      let health = "Rất tốt";
      let pest = "Bình thường (không bọ dừa)";
      let height = (1.75 + Math.random() * 0.35).toFixed(2);
      let leafCount = Math.floor(11 + Math.random() * 5);

      if (r === 2 && c === 7) {
        health = "Cần theo dõi";
        pest = "Vết cắn bọ dừa nhẹ";
      } else if (r === 3 && c === 12) {
        health = "Đang phục hồi";
        pest = "Vết cắn bọ dừa cũ, đã xử lý";
      }

      defaultTrees.push({
        id: code,
        // --- ĐỦ 16 THUỘC TÍNH DỮ LIỆU CHUẨN MASTER SHEET ---
        code: code,                                                          // 1. Mã định danh
        order: `Hàng ${r} - Cây ${c.toString().padStart(2, "0")}`,           // 2. Thứ tự Hàng - Cây
        row: r,
        treeNumber: c,
        latitude: parseFloat(lat),                                          // 3. Tọa độ Vĩ độ (Lat)
        longitude: parseFloat(lng),                                         // 4. Tọa độ Kinh độ (Lng)
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,       // 5. Link Google Maps vệ tinh
        qrPayload: `HUKIMI_TREE:${code}`,                                   // 6. Mã QR định danh
        variety: "Dừa sáp cấy mô (Viện Cây có dầu IOOP)",                   // 7. Nguồn gốc giống
        plantingDate: "2024-07-13",                                          // 8. Ngày trồng
        growthStage: "2 năm tuổi (chờ trổ bông)",                            // 9. Giai đoạn sinh trưởng
        estimatedHeight: parseFloat(height),                                // 10. Chiều cao ước tính (m)
        greenLeafCount: leafCount,                                          // 11. Số bẹ lá xanh
        pestStatus: pest,                                                   // 12. Tình trạng sâu bệnh
        lastCareAction: "Hữu cơ vi sinh 1.5kg + Nấm Metarhizium",           // 13. Chăm sóc gần nhất
        lastCareDate: "2026-03-15",                                         // 14. Ngày chăm sóc
        healthStatus: health,                                               // 15. Đánh giá sức khỏe
        fieldNotes: "Cây phát triển rễ tốt, bẹ lá thẳng, gốc nở đều."       // 16. Ghi chú thực địa
      });
    }
  }

  await db.trees.bulkAdd(defaultTrees);
  console.log("Khởi tạo thành công 72 cây dừa sáp vào IndexedDB!");
}

// Chạy khởi tạo tự động khi tải file
seedDefaultTrees().catch(err => console.error("Lỗi khởi tạo IndexedDB:", err));
