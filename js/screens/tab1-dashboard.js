/**
 * HUKIMI SMART FARM - TAB 1: DASHBOARD (TỔNG QUAN & CẢNH BÁO)
 */

function renderTab1Content() {
  const container = document.getElementById('tab-dashboard');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Tổng quan tình trạng vườn</h2>
          <p class="text-xs text-slate-500">Giám sát sức khỏe 72 cây dừa sáp</p>
        </div>
        <span id="quick-date" class="text-xs text-slate-500 font-medium"></span>
      </div>

      <!-- KPI CARDS -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 text-xs">
            <span>Tổng quy mô</span>
            <i class="fa-solid fa-tree text-emerald-600"></i>
          </div>
          <p id="kpi-total-trees" class="text-2xl font-extrabold text-slate-900 mt-1">--</p>
          <span class="text-[11px] text-emerald-600 font-medium">4 hàng × 18 cây</span>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 text-xs">
            <span>Chiều cao TB</span>
            <i class="fa-solid fa-ruler-vertical text-sky-600"></i>
          </div>
          <p id="kpi-avg-height" class="text-2xl font-extrabold text-slate-900 mt-1">-- <span class="text-sm font-normal text-slate-500">m</span></p>
          <span class="text-[11px] text-sky-600 font-medium">Đo bằng AR Cam</span>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 text-xs">
            <span>Bẹ lá xanh TB</span>
            <i class="fa-solid fa-leaf text-green-600"></i>
          </div>
          <p id="kpi-avg-leaves" class="text-2xl font-extrabold text-slate-900 mt-1">--</p>
          <span class="text-[11px] text-green-600 font-medium">Gemini AI đếm</span>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 text-xs">
            <span>Cảnh báo sâu bệnh</span>
            <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
          </div>
          <p id="kpi-warning-trees" class="text-2xl font-extrabold text-amber-600 mt-1">--</p>
          <span class="text-[11px] text-amber-600 font-medium">Cần theo dõi / Xử lý</span>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
        <h3 class="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">Thao tác nhanh thực địa</h3>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="switchTab('tab-field-input')" class="flex items-center justify-center space-x-2 bg-emerald-600 active:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-lg text-xs shadow-sm">
            <i class="fa-solid fa-camera"></i>
            <span>Đo AR & Soi AI</span>
          </button>
          <button onclick="switchTab('tab-field-input'); setTimeout(startQRScannerInline, 200);" class="flex items-center justify-center space-x-2 bg-white active:bg-slate-100 text-emerald-800 border border-emerald-300 font-medium py-2.5 px-3 rounded-lg text-xs shadow-sm">
            <i class="fa-solid fa-qrcode"></i>
            <span>Quét nhanh mã QR</span>
          </button>
        </div>
      </div>

      <!-- DANH SÁCH CẦN THEO DÕI ĐẶC BIỆT -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-sm font-bold text-slate-900">Cây cần theo dõi đặc biệt</h3>
          <span class="text-[11px] text-slate-500">Lọc tự động</span>
        </div>
        <div id="attention-list" class="space-y-2">
          <!-- Render danh sách cảnh báo từ db -->
        </div>
      </div>
    </div>
  `;
}

// Cập nhật số liệu KPI động từ IndexedDB
async function loadDashboardData() {
  try {
    const trees = await db.trees.toArray();
    if (!trees.length) return;

    const totalTreesEl = document.getElementById('kpi-total-trees');
    if (totalTreesEl) totalTreesEl.innerText = trees.length;

    const totalHeight = trees.reduce((sum, t) => sum + (t.estimatedHeight || 0), 0);
    const avgHeightEl = document.getElementById('kpi-avg-height');
    if (avgHeightEl) avgHeightEl.innerHTML = `${(totalHeight / trees.length).toFixed(2)} <span class="text-sm font-normal text-slate-500">m</span>`;

    const totalLeaves = trees.reduce((sum, t) => sum + (t.greenLeafCount || 0), 0);
    const avgLeavesEl = document.getElementById('kpi-avg-leaves');
    if (avgLeavesEl) avgLeavesEl.innerText = (totalLeaves / trees.length).toFixed(1);

    const warningTrees = trees.filter(t => t.healthStatus === 'Cần theo dõi' || t.healthStatus === 'Kém ổn định' || t.healthStatus === 'Đang phục hồi');
    const warningTreesEl = document.getElementById('kpi-warning-trees');
    if (warningTreesEl) warningTreesEl.innerText = warningTrees.length;

    const listContainer = document.getElementById('attention-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (warningTrees.length === 0) {
      listContainer.innerHTML = `<div class="text-xs text-emerald-600 py-2">Tất cả các cây đều đang phát triển rất tốt.</div>`;
    } else {
      warningTrees.forEach(t => {
        listContainer.innerHTML += `
          <div onclick="switchTab('tab-directory'); setTimeout(() => openTreePassport('${t.code}'), 200);" class="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 cursor-pointer active:scale-[0.99] transition-transform">
            <div class="flex items-center space-x-2.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <div>
                <p class="text-xs font-bold text-slate-900">${t.code} (${t.order})</p>
                <p class="text-[11px] text-amber-700 font-medium">${t.pestStatus}</p>
              </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded font-semibold bg-white text-amber-800 border border-amber-300">
              ${t.healthStatus}
            </span>
          </div>
        `;
      });
    }
  } catch (e) {
    console.error("Lỗi cập nhật dashboard:", e);
  }
}
