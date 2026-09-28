/**
 * HUKIMI SMART FARM - TAB 5: AGRI-CARE & PEST CONTROL (METARHIZIUM LOGS)
 */

function renderTab5Content() {
  const container = document.getElementById('tab-care');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Nhật ký Phân bón & Dịch hại</h2>
          <p class="text-xs text-slate-500">Quản lý dinh dưỡng hữu cơ và chế phẩm sinh học</p>
        </div>
        <button onclick="toggleCareFormModal()" class="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
          <i class="fa-solid fa-plus"></i>
          <span>Thêm đợt xử lý</span>
        </button>
      </div>

      <!-- THÔNG BÁO LỊCH NHẮC SINH HỌC TỰ ĐỘNG -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start space-x-3">
        <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 text-sm">
          <i class="fa-solid fa-bell"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-emerald-900 uppercase">Lịch nhắc định kỳ sinh học</h3>
            <span class="text-[10px] font-semibold bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded">Chu kỳ 20 ngày</span>
          </div>
          <p class="text-[11px] text-emerald-800 mt-1">Phun nấm ký sinh <strong>Metarhizium anisopliae</strong> phòng ngừa bọ cánh cứng cắn đọt non và bọ vòi voi.</p>
        </div>
      </div>

      <!-- BẢN GHI LỊCH SỬ CHĂM SÓC -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div class="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Nhật ký thực địa đã thực hiện</h3>
          <span id="care-logs-count" class="text-[11px] text-slate-400">0 bản ghi</span>
        </div>

        <div id="care-history-list" class="space-y-2.5">
          <!-- Render danh sách nhật ký -->
        </div>
      </div>
    </div>

    <!-- MODAL NHẬP ĐỢT CHĂM SÓC MỚI -->
    <div id="care-form-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl p-4 space-y-3">
        <div class="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 class="text-sm font-bold text-slate-900">Ghi nhận chăm sóc / Xử lý</h3>
          <button onclick="toggleCareFormModal()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="care-input-form" onsubmit="saveCareRecord(event)" class="space-y-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Mã cây hoặc Lô</label>
            <input type="text" id="care-tree-scope" required placeholder="Toàn vườn HOẶC mã cây (HKM-H1-01)" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 outline-none focus:border-emerald-500 uppercase font-mono" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Phân loại xử lý</label>
            <select id="care-action-type" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 outline-none focus:border-emerald-500">
              <option value="Phun nấm ký sinh Metarhizium">Phun nấm ký sinh Metarhizium (Trừ bọ dừa)</option>
              <option value="Bón phân hữu cơ vi sinh">Bón phân hữu cơ vi sinh (1.5 - 2kg/gốc)</option>
              <option value="Tưới đạm cá thủy phân">Tưới đạm cá thủy phân</option>
              <option value="Vun gốc bồi bùn">Vun gốc bồi bùn / Làm cỏ quanh tán</option>
              <option value="Xử lý cứu cây suy yếu">Xử lý cứu cây suy yếu / Vàng lá</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Chi tiết liều lượng & kỹ thuật</label>
            <textarea id="care-details" rows="2" placeholder="Liều lượng pha 50g/bình 16 lít, phun đẫm vào bẹ đọt non..." class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 outline-none focus:border-emerald-500"></textarea>
          </div>

          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow-md">
            Lưu vào sổ nhật ký
          </button>
        </form>
      </div>
    </div>
  `;
}

function toggleCareFormModal() {
  const modal = document.getElementById('care-form-modal');
  modal.classList.toggle('hidden');
}

// Lưu bản ghi chăm sóc vào IndexedDB
async function saveCareRecord(e) {
  e.preventDefault();
  const scope = document.getElementById('care-tree-scope').value.trim().toUpperCase();
  const actionType = document.getElementById('care-action-type').value;
  const details = document.getElementById('care-details').value.trim();
  const today = new Date().toISOString().split('T')[0];

  await db.care_logs.add({
    treeCode: scope,
    careDate: today,
    actionType: actionType,
    details: details,
    createdAt: new Date().toISOString()
  });

  // Nếu áp dụng cho 1 cây cụ thể, cập nhật thẳng vào thuộc tính 13 & 14 của cây đó
  if (scope !== 'TOÀN VƯỜN' && scope.startsWith('HKM-')) {
    const tree = await db.trees.get(scope);
    if (tree) {
      await db.trees.update(scope, {
        lastCareAction: `${actionType} (${details})`,
        lastCareDate: today
      });
    }
  }

  toggleCareFormModal();
  document.getElementById('care-input-form').reset();
  loadCareLogs();
  alert("Đã ghi nhận thành công đợt chăm sóc vào sổ số!");
}

// Đọc và render danh sách lịch sử chăm sóc
async function loadCareLogs() {
  const list = document.getElementById('care-history-list');
  if (!list) return;

  const logs = await db.care_logs.reverse().toArray();
  document.getElementById('care-logs-count').innerText = `${logs.length} bản ghi`;

  if (logs.length === 0) {
    list.innerHTML = `
      <div class="text-center py-6 text-slate-400 text-xs">
        <i class="fa-solid fa-leaf text-2xl text-slate-300 mb-1 block"></i>
        Chưa có bản ghi thực địa. Nhấn '+ Thêm đợt xử lý' để ghi nhật ký.
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  logs.forEach(item => {
    list.innerHTML += `
      <div class="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
        <div class="flex justify-between items-center">
          <span class="text-xs font-bold text-slate-900">${item.actionType}</span>
          <span class="text-[10px] font-semibold text-slate-500">${item.careDate}</span>
        </div>
        <div class="flex items-center space-x-2 text-[11px] text-emerald-700 font-semibold">
          <i class="fa-solid fa-tag text-[9px]"></i>
          <span>Áp dụng: ${item.treeCode}</span>
        </div>
        ${item.details ? `<p class="text-[11px] text-slate-600 pt-1 border-t border-slate-200/40">${item.details}</p>` : ''}
      </div>
    `;
  });
}
