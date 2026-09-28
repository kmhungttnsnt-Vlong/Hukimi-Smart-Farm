/**
 * HUKIMI SMART FARM - TAB 6: SETTINGS, BATCH GENERATOR & EXCEL EXPORT (16 COLS)
 */

function renderTab6Content() {
  const container = document.getElementById('tab-settings');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Cấu hình & Mở rộng Lô</h2>
        <p class="text-xs text-slate-500">Quản lý Gemini AI, xuất dữ liệu và mở rộng vườn</p>
      </div>

      <!-- 1. CẤU HÌNH GOOGLE GEMINI VISION API KEY -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center space-x-2 text-emerald-700">
          <i class="fa-solid fa-key text-sm"></i>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">Google Gemini API Key</h3>
        </div>
        <p class="text-[11px] text-slate-500">
          Dùng để kích hoạt tính năng Gemini Vision tự động đếm bẹ lá và soi vết cắn bọ dừa ở Tab 4. Khóa được lưu an toàn trong IndexedDB của thiết bị này.
        </p>
        <div class="space-y-2">
          <input type="password" id="input-gemini-key" placeholder="Dán API Key (AI Studio)..." class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none font-mono focus:border-emerald-500" />
          <div class="flex space-x-2">
            <button onclick="saveGeminiApiKey()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm">
              Lưu API Key
            </button>
            <button onclick="testGeminiApiKey()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300">
              Kiểm tra
            </button>
          </div>
        </div>
      </div>

      <!-- 2. XUẤT BÁO CÁO DỮ LIỆU EXCEL / CSV CHUẨN 16 CỘT -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center space-x-2 text-emerald-700">
          <i class="fa-solid fa-file-excel text-sm"></i>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">Xuất dữ liệu thực địa (Master Sheet)</h3>
        </div>
        <p class="text-[11px] text-slate-500">
          Trích xuất đầy đủ 16 cột thông tin của toàn bộ cây dừa sang định dạng Excel (.xlsx) chuẩn UTF-8, đồng bộ trực tiếp với Google Sheets.
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="exportTreesToExcel()" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm">
            <i class="fa-solid fa-download"></i>
            <span>Xuất file Excel (.xlsx)</span>
          </button>
          <button onclick="exportTreesToCSV()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-lg text-xs border border-slate-300 flex items-center justify-center space-x-1.5">
            <i class="fa-solid fa-file-csv"></i>
            <span>Xuất file CSV</span>
          </button>
        </div>
      </div>

      <!-- 3. MỞ RỘNG QUY MÔ: SINH HÀNG LOẠT LÔ / KHU MỚI -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center space-x-2 text-emerald-700">
          <i class="fa-solid fa-layer-group text-sm"></i>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">Mở rộng Lô / Khu mới tự động</h3>
        </div>
        <p class="text-[11px] text-slate-500">
          Tạo đồng loạt hàng trăm cây mới theo lưới hàng - cây mà không cần nhập tay từng cây một.
        </p>
        
        <form onsubmit="generateBatchLot(event)" class="space-y-2.5 pt-1">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mã Khu / Lô</label>
              <input type="text" id="batch-lot-code" required placeholder="VD: B" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono uppercase focus:border-emerald-500" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Ngày trồng</label>
              <input type="date" id="batch-planting-date" required class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:border-emerald-500" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Số lượng hàng</label>
              <input type="number" id="batch-rows" min="1" max="50" required placeholder="VD: 5" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:border-emerald-500" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Số cây mỗi hàng</label>
              <input type="number" id="batch-cols" min="1" max="100" required placeholder="VD: 20" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:border-emerald-500" />
            </div>
          </div>

          <button type="submit" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs shadow transition-all flex items-center justify-center space-x-1.5">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>Sinh hàng loạt vào cơ sở dữ liệu</span>
          </button>
        </form>
      </div>

      <!-- 4. KHU VỰC QUẢN TRỊ DỮ LIỆU NGUY HIỂM -->
      <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
        <h4 class="text-xs font-bold text-rose-800 uppercase tracking-wider">Đặt lại cơ sở dữ liệu</h4>
        <p class="text-[11px] text-rose-700">Khôi phục 72 cây gốc ban đầu và xóa sạch toàn bộ lịch sử đo đạc, chăm sóc.</p>
        <button onclick="resetToDefaultData()" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm">
          Khôi phục 72 cây mặc định
        </button>
      </div>
    </div>
  `;
}

// 1. Quản lý Gemini API Key
async function loadStoredApiKey() {
  const record = await db.settings.get('gemini_api_key');
  if (record && record.value) {
    const input = document.getElementById('input-gemini-key');
    if (input) input.value = record.value;
  }
}

async function saveGeminiApiKey() {
  const key = document.getElementById('input-gemini-key').value.trim();
  if (!key) {
    alert("Vui lòng nhập API Key!");
    return;
  }
  await db.settings.put({ key: 'gemini_api_key', value: key });
  alert("Đã lưu Gemini API Key thành công vào IndexedDB!");
}

async function testGeminiApiKey() {
  const key = document.getElementById('input-gemini-key').value.trim();
  if (!key) {
    alert("Chưa có API Key để kiểm tra!");
    return;
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Trả lời ngắn gọn: OK" }] }]
      })
    });
    if (res.ok) {
      alert("Kết nối Gemini 1.5 Flash thành công! Tính năng AI sẵn sàng hoạt động.");
    } else {
      const err = await res.json();
      alert(`API Key không hợp lệ hoặc bị lỗi: ${err.error?.message || 'Lỗi không xác định'}`);
    }
  } catch (e) {
    alert("Lỗi kết nối đến Google AI Studio: " + e.message);
  }
}

// 2. Xuất dữ liệu chuẩn 16 thuộc tính Master Sheet (SheetJS)
async function getExportPayload() {
  const trees = await db.trees.toArray();
  return trees.map(t => ({
    "1. Mã định danh cây": t.code,
    "2. Thứ tự Hàng - Cây": t.order,
    "3. Tọa độ Vĩ độ (Lat)": t.latitude,
    "4. Tọa độ Kinh độ (Lng)": t.longitude,
    "5. Bản đồ vệ tinh (Google Maps)": t.googleMapsUrl,
    "6. Mã QR định danh": t.qrPayload,
    "7. Nguồn gốc giống": t.variety,
    "8. Ngày trồng": t.plantingDate,
    "9. Giai đoạn phát triển": t.growthStage,
    "10. Chiều cao ước tính (m)": t.estimatedHeight,
    "11. Số bẹ lá xanh": t.greenLeafCount,
    "12. Tình trạng sâu bệnh": t.pestStatus,
    "13. Chăm sóc gần nhất": t.lastCareAction,
    "14. Ngày chăm sóc": t.lastCareDate,
    "15. Đánh giá sức khỏe": t.healthStatus,
    "16. Ghi chú thực địa": t.fieldNotes
  }));
}

async function exportTreesToExcel() {
  if (typeof XLSX === 'undefined') {
    alert("Thư viện SheetJS chưa tải xong. Vui lòng kiểm tra lại mạng!");
    return;
  }
  const data = await getExportPayload();
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SoNhatKy_16Cot");
  
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Hukimi_Smart_Farm_MasterSheet_${today}.xlsx`);
}

async function exportTreesToCSV() {
  const data = await getExportPayload();
  if (typeof XLSX === 'undefined') {
    alert("Thư viện SheetJS chưa sẵn sàng!");
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob(["\uFEFF" + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Hukimi_Smart_Farm_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// 3. Sinh hàng loạt Lô mới tự động
async function generateBatchLot(e) {
  e.preventDefault();
  const lot = document.getElementById('batch-lot-code').value.trim().toUpperCase();
  const plantDate = document.getElementById('batch-planting-date').value;
  const numRows = parseInt(document.getElementById('batch-rows').value, 10);
  const numCols = parseInt(document.getElementById('batch-cols').value, 10);

  // Lấy tọa độ tham chiếu cây cuối cùng hiện có để nối tiếp
  const allTrees = await db.trees.toArray();
  const lastTree = allTrees[allTrees.length - 1] || { latitude: 9.922325, longitude: 106.012548 };
  const baseLat = lastTree.latitude + 0.000200; // Tách khu mới cách ~20m
  const baseLng = lastTree.longitude;

  const newTrees = [];
  for (let r = 1; r <= numRows; r++) {
    for (let c = 1; c <= numCols; c++) {
      const code = `HKM-${lot}${r}-${c.toString().padStart(2, "0")}`;
      const lat = (baseLat + (r - 1) * 0.000065).toFixed(6);
      const lng = (baseLng + (c - 1) * 0.000065).toFixed(6);

      newTrees.push({
        id: code,
        code: code,
        order: `Lô ${lot} - Hàng ${r} - Cây ${c.toString().padStart(2, "0")}`,
        row: r,
        treeNumber: c,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        qrPayload: `HUKIMI_TREE:${code}`,
        variety: "Dừa sáp cấy mô (Viện Cây có dầu IOOP)",
        plantingDate: plantDate,
        growthStage: "Mới trồng",
        estimatedHeight: 0.65,
        greenLeafCount: 4,
        pestStatus: "Bình thường (không bọ dừa)",
        lastCareAction: "Bón lót phân chuồng hoai mục + Trichoderma",
        lastCareDate: plantDate,
        healthStatus: "Rất tốt",
        fieldNotes: `Lô mới ${lot} khởi tạo tự động.`
      });
    }
  }

  await db.trees.bulkAdd(newTrees);
  alert(`Đã sinh thành công ${newTrees.length} cây cho Lô ${lot}! Bạn có thể xem trên Bản đồ GIS hoặc Lưới danh mục.`);
  loadDashboardData();
}

// 4. Khôi phục dữ liệu gốc
async function resetToDefaultData() {
  if (!confirm("Bạn có chắc chắn muốn xóa hết các bản ghi và đưa 72 cây về trạng thái mặc định ban đầu không?")) return;
  await db.trees.clear();
  await db.growth_logs.clear();
  await db.care_logs.clear();
  await seedDefaultTrees();
  alert("Đã đưa dữ liệu về 72 cây gốc thành công!");
  location.reload();
}
