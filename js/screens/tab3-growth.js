/**
 * HUKIMI SMART FARM - TAB 3: GROWTH TIMELINE & ANALYTICS
 */

function renderTab3Content() {
  const container = document.getElementById('tab-growth');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Sinh trưởng & Biến động (Δ)</h2>
          <p class="text-xs text-slate-500">Phân tích tốc độ vươn đọt và bung bẹ lá</p>
        </div>
      </div>

      <!-- BỘ CHỌN CÂY THEO DÕI -->
      <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <label class="block text-xs font-semibold text-slate-700">Chọn cây kiểm tra dòng thời gian:</label>
        <select id="growth-tree-select" onchange="loadGrowthAnalytics()" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-semibold text-slate-800 outline-none focus:border-emerald-500">
          <!-- Render danh sách cây tự động -->
        </select>
      </div>

      <!-- THẺ SO SÁNH BIẾN ĐỘNG CHỈ SỐ (DELTA Δ) -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Biến động chiều cao (Δ)</span>
          <div class="flex items-baseline space-x-1.5 mt-1">
            <span id="delta-height" class="text-xl font-extrabold text-emerald-600">+0.00</span>
            <span class="text-xs text-slate-500 font-medium">m</span>
          </div>
          <p id="delta-height-sub" class="text-[10px] text-slate-400 mt-0.5">So với lần đo trước</p>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Bẹ lá mới bung (Δ)</span>
          <div class="flex items-baseline space-x-1.5 mt-1">
            <span id="delta-leaves" class="text-xl font-extrabold text-emerald-600">+0</span>
            <span class="text-xs text-slate-500 font-medium">bẹ lá</span>
          </div>
          <p id="delta-leaves-sub" class="text-[10px] text-slate-400 mt-0.5">Tán lá xanh mở rộng</p>
        </div>
      </div>

      <!-- DÒNG THỜI GIAN KIỂM TRA THỰC ĐỊA -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div class="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Lịch sử kiểm tra thực địa</h3>
          <span id="growth-log-count" class="text-[11px] text-slate-400">0 bản ghi</span>
        </div>

        <div id="growth-timeline-list" class="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          <!-- Render danh sách sự kiện dòng thời gian -->
        </div>
      </div>
    </div>
  `;
}

// Tải danh sách cây vào dropdown
async function populateGrowthTreeSelector() {
  const select = document.getElementById('growth-tree-select');
  if (!select) return;

  const trees = await db.trees.toArray();
  select.innerHTML = trees.map(t => `<option value="${t.code}">${t.code} - ${t.order}</option>`).join('');
  
  if (trees.length > 0) {
    loadGrowthAnalytics();
  }
}

// Phân tích và render biến động sinh trưởng
async function loadGrowthAnalytics() {
  const select = document.getElementById('growth-tree-select');
  if (!select) return;
  const treeCode = select.value;

  const tree = await db.trees.get(treeCode);
  if (!tree) return;

  // Lấy các bản ghi đo đạc của cây này
  let logs = await db.growth_logs.where('treeCode').equals(treeCode).sortBy('recordDate');

  // Nếu chưa có lịch sử, khởi tạo mốc cơ sở ngày trồng làm mốc 0
  const baselineRecord = {
    recordDate: tree.plantingDate,
    height: 0.65, // Chiều cao cây giống lúc mới cấy
    leafCount: 4,
    healthRating: "Rất tốt",
    pestStatus: "Cây giống khỏe, sạch sâu bệnh",
    notes: "Mốc trồng ban đầu (Viện Cây có dầu IOOP)"
  };

  const fullRecords = [baselineRecord, ...logs];
  
  // Tính biến động so với bản ghi liền kề trước đó
  const latest = {
    height: tree.estimatedHeight,
    leafCount: tree.greenLeafCount
  };

  const prev = fullRecords.length > 1 ? fullRecords[fullRecords.length - 1] : baselineRecord;
  const diffH = (latest.height - prev.height).toFixed(2);
  const diffL = latest.leafCount - prev.leafCount;

  const deltaHeightEl = document.getElementById('delta-height');
  const deltaLeavesEl = document.getElementById('delta-leaves');

  deltaHeightEl.innerText = (diffH >= 0 ? `+${diffH}` : diffH);
  deltaHeightEl.className = diffH >= 0 ? "text-xl font-extrabold text-emerald-600" : "text-xl font-extrabold text-amber-600";

  deltaLeavesEl.innerText = (diffL >= 0 ? `+${diffL}` : diffL);
  deltaLeavesEl.className = diffL >= 0 ? "text-xl font-extrabold text-emerald-600" : "text-xl font-extrabold text-amber-600";

  // Render Timeline
  const list = document.getElementById('growth-timeline-list');
  list.innerHTML = '';
  document.getElementById('growth-log-count').innerText = `${fullRecords.length} mốc ghi`;

  fullRecords.slice().reverse().forEach((rec, idx) => {
    const isLatest = idx === 0;
    list.innerHTML += `
      <div class="relative">
        <span class="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isLatest ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-300'}"></span>
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
          <div class="flex justify-between items-center">
            <span class="font-bold text-xs text-slate-800">${rec.recordDate}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">${rec.healthRating || 'Ổn định'}</span>
          </div>
          <div class="flex items-center space-x-3 text-xs text-slate-600 pt-0.5">
            <span>Cao: <strong class="text-slate-900">${rec.height}m</strong></span>
            <span>Lá xanh: <strong class="text-slate-900">${rec.leafCount} bẹ</strong></span>
          </div>
          <p class="text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 mt-1">${rec.pestStatus || 'Bình thường'}</p>
          ${rec.notes ? `<p class="text-[10px] text-slate-400 italic">${rec.notes}</p>` : ''}
        </div>
      </div>
    `;
  });
}
