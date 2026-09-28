/**
 * HUKIMI SMART FARM - TAB 2: GIS MAP & TREE DIRECTORY (PASSPORT 16 TRƯỜNG & QR)
 */

let mapInstance = null;
let markersLayer = null;

// Màu sắc đánh dấu theo tình trạng sức khỏe
const HEALTH_COLORS = {
  "Rất tốt": "#10b981",       // Emerald green
  "Tốt": "#22c55e",           // Green
  "Đang phục hồi": "#eab308",  // Yellow
  "Cần theo dõi": "#f97316",   // Orange
  "Kém ổn định": "#ef4444"    // Red
};

// 1. Khởi tạo giao diện Tab 2
function renderTab2Content() {
  const container = document.getElementById('tab-directory');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-3">
      <!-- THANH ĐIỀU KHIỂN & BỘ LỌC -->
      <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <button id="btn-view-map" onclick="toggleDirectoryView('map')" class="px-3 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition-all flex items-center space-x-1.5">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Bản đồ GIS</span>
            </button>
            <button id="btn-view-grid" onclick="toggleDirectoryView('grid')" class="px-3 py-1 text-xs font-bold rounded-md text-slate-500 hover:text-slate-800 transition-all flex items-center space-x-1.5">
              <i class="fa-solid fa-table-cells"></i>
              <span>Lưới 72 cây</span>
            </button>
          </div>
          <span id="directory-tree-count" class="text-xs font-semibold text-slate-500">72 cây</span>
        </div>

        <!-- Ô TÌM KIẾM VÀ LỌC THEO HÀNG -->
        <div class="grid grid-cols-2 gap-2">
          <div class="relative">
            <input type="text" id="tree-search-input" oninput="filterTreeDirectory()" placeholder="Mã cây (VD: H1-01)..." class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-2 py-1.5 outline-none focus:border-emerald-500 font-mono" />
            <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-[11px] text-slate-400"></i>
          </div>
          <select id="filter-row" onchange="filterTreeDirectory()" class="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500">
            <option value="all">Tất cả các hàng</option>
            <option value="1">Hàng 1 (H1)</option>
            <option value="2">Hàng 2 (H2)</option>
            <option value="3">Hàng 3 (H3)</option>
            <option value="4">Hàng 4 (H4)</option>
          </select>
        </div>
      </div>

      <!-- VIEW 1: BẢN ĐỒ SỐ GIS VỆ TINH -->
      <div id="gis-map-view" class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative">
        <div id="leaflet-map" class="w-full h-[62vh] z-10"></div>
        <div class="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] space-y-0.5 shadow-sm">
          <p class="font-bold text-slate-700 uppercase">Chú giải sức khỏe:</p>
          <div class="flex items-center space-x-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <span>Tốt/Rất tốt</span>
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span> <span>Cần theo dõi</span>
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span> <span>Kém</span>
          </div>
        </div>
      </div>

      <!-- VIEW 2: LƯỚI THẺ DANH SÁCH 72 CÂY (ẨN MẶC ĐỊNH) -->
      <div id="tree-grid-view" class="hidden grid grid-cols-2 gap-2.5">
        <!-- Render danh sách thẻ động -->
      </div>
    </div>

    <!-- MODAL PASSPORT 16 TRƯỜNG DỮ LIỆU & QR CODE -->
    <div id="passport-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        
        <!-- Header Passport -->
        <div class="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-id-card text-emerald-300 text-base"></i>
            <div>
              <h3 id="modal-tree-code" class="text-sm font-bold tracking-tight">HKM-H1-01</h3>
              <p id="modal-tree-order" class="text-[11px] text-emerald-100">Hàng 1 - Cây 01</p>
            </div>
          </div>
          <button onclick="closePassportModal()" class="text-white hover:text-emerald-200 text-lg w-8 h-8 flex items-center justify-center rounded-full bg-emerald-800/60">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Nội dung 16 thuộc tính cuộn dọc -->
        <div class="p-4 overflow-y-auto space-y-4 text-xs select-text">
          
          <!-- Hộp mã QR & Bản đồ dẫn đường -->
          <div class="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div id="passport-qr-code" class="bg-white p-1.5 rounded-lg border border-slate-300 shadow-sm shrink-0 flex items-center justify-center w-24 h-24"></div>
            <div class="space-y-1.5 flex-1">
              <span id="modal-health-badge" class="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                Rất tốt
              </span>
              <p class="text-slate-500 text-[11px]">Tọa độ GPS thực địa:</p>
              <p id="modal-gps-text" class="font-mono font-semibold text-slate-800 text-[11px]">9.922325, 106.012548</p>
              
              <div class="flex space-x-1.5 pt-1">
                <a id="modal-btn-gmaps" href="#" target="_blank" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1 px-2 rounded text-[11px] text-center flex items-center justify-center space-x-1">
                  <i class="fa-solid fa-location-arrow"></i>
                  <span>Dẫn đường Maps</span>
                </a>
                <button onclick="updateTreeCurrentGPS()" title="Cập nhật tọa độ thiết bị tại chỗ" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1">
                  <i class="fa-solid fa-crosshairs"></i>
                  <span>Lấy GPS</span>
                </button>
              </div>
            </div>
          </div>

          <!-- BẢNG CHI TIẾT 16 THUỘC TÍNH MASTER SHEET -->
          <div class="space-y-2">
            <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1 border-slate-200">
              Hồ sơ sinh trưởng & Chăm sóc gốc
            </h4>

            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="bg-slate-50 p-2 rounded border border-slate-200/80">
                <span class="text-slate-400 block text-[10px]">Nguồn gốc giống (7)</span>
                <span id="modal-variety" class="font-medium text-slate-800">--</span>
              </div>
              <div class="bg-slate-50 p-2 rounded border border-slate-200/80">
                <span class="text-slate-400 block text-[10px]">Ngày trồng (8)</span>
                <span id="modal-planting-date" class="font-medium text-slate-800">--</span>
              </div>
              <div class="bg-slate-50 p-2 rounded border border-slate-200/80">
                <span class="text-slate-400 block text-[10px]">Giai đoạn phát triển (9)</span>
                <span id="modal-growth-stage" class="font-medium text-slate-800">--</span>
              </div>
              <div class="bg-slate-50 p-2 rounded border border-slate-200/80">
                <span class="text-slate-400 block text-[10px]">Chiều cao ước tính (10)</span>
                <span id="modal-height" class="font-bold text-sky-700">-- m</span>
              </div>
              <div class="bg-slate-50 p-2 rounded border border-slate-200/80">
                <span class="text-slate-400 block text-[10px]">Số bẹ lá xanh (11)</span>
                <span id="modal-leaves" class="font-bold text-emerald-700">-- bẹ</span>
              </div>
              <div class="bg-slate-50 p-2 rounded border border-slate-200/80">
                <span class="text-slate-400 block text-[10px]">Ngày chăm sóc (14)</span>
                <span id="modal-care-date" class="font-medium text-slate-800">--</span>
              </div>
            </div>

            <div class="bg-slate-50 p-2 rounded border border-slate-200/80 text-[11px]">
              <span class="text-slate-400 block text-[10px]">Tình trạng bọ dừa & dịch hại (12)</span>
              <p id="modal-pest" class="font-semibold text-slate-800 mt-0.5">--</p>
            </div>

            <div class="bg-slate-50 p-2 rounded border border-slate-200/80 text-[11px]">
              <span class="text-slate-400 block text-[10px]">Chăm sóc/Phân bón gần nhất (13)</span>
              <p id="modal-care-action" class="font-semibold text-slate-800 mt-0.5">--</p>
            </div>

            <div class="bg-slate-50 p-2 rounded border border-slate-200/80 text-[11px]">
              <span class="text-slate-400 block text-[10px]">Ghi chú thực địa (16)</span>
              <p id="modal-notes" class="text-slate-700 italic mt-0.5">--</p>
            </div>
          </div>
        </div>

        <!-- Footer Modal -->
        <div class="bg-slate-100 p-3 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
          <button onclick="closePassportModal()" class="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg text-xs font-semibold">
            Đóng
          </button>
          <button onclick="goToFieldMeasure()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5">
            <i class="fa-solid fa-camera"></i>
            <span>Đo AR cây này</span>
          </button>
        </div>

      </div>
    </div>
  `;
}

// 2. Chuyển đổi giữa chế độ Bản đồ GIS và Danh sách Lưới
function toggleDirectoryView(viewType) {
  const mapBtn = document.getElementById('btn-view-map');
  const gridBtn = document.getElementById('btn-view-grid');
  const mapView = document.getElementById('gis-map-view');
  const gridView = document.getElementById('tree-grid-view');

  if (viewType === 'map') {
    mapBtn.className = "px-3 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition-all flex items-center space-x-1.5";
    gridBtn.className = "px-3 py-1 text-xs font-bold rounded-md text-slate-500 hover:text-slate-800 transition-all flex items-center space-x-1.5";
    mapView.classList.remove('hidden');
    gridView.classList.add('hidden');
    if (mapInstance) {
      setTimeout(() => mapInstance.invalidateSize(), 200);
    }
  } else {
    gridBtn.className = "px-3 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition-all flex items-center space-x-1.5";
    mapBtn.className = "px-3 py-1 text-xs font-bold rounded-md text-slate-500 hover:text-slate-800 transition-all flex items-center space-x-1.5";
    gridView.classList.remove('hidden');
    mapView.classList.add('hidden');
  }
}

// 3. Khởi tạo Bản đồ vệ tinh Leaflet.js
async function initLeafletMap() {
  if (mapInstance) return;

  const mapContainer = document.getElementById('leaflet-map');
  if (!mapContainer) return;

  // Lấy danh sách cây để tính tâm bản đồ
  const trees = await db.trees.toArray();
  const centerLat = trees.length ? trees[0].latitude : 9.922325;
  const centerLng = trees.length ? trees[0].longitude : 106.012548;

  // Khởi tạo Leaflet Map
  mapInstance = L.map('leaflet-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([centerLat, centerLng], 19);

  // Lớp bản đồ vệ tinh ESRI độ nét cao
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 20
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);
  renderMapMarkers(trees);
}

// 4. Vẽ các marker chấm tròn màu trên bản đồ
function renderMapMarkers(trees) {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  trees.forEach(tree => {
    const color = HEALTH_COLORS[tree.healthStatus] || "#10b981";

    const circleMarker = L.circleMarker([tree.latitude, tree.longitude], {
      radius: 6,
      fillColor: color,
      color: "#ffffff",
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.95
    });

    circleMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px; min-width: 130px;">
        <strong style="color: #0f172a; font-size: 12px;">${tree.code}</strong>
        <p style="margin: 2px 0; color: #64748b;">${tree.order}</p>
        <p style="margin: 2px 0;">Sức khỏe: <strong style="color:${color};">${tree.healthStatus}</strong></p>
        <p style="margin: 2px 0;">Cao: <b>${tree.estimatedHeight}m</b> • Lá: <b>${tree.greenLeafCount}</b></p>
        <button onclick="openTreePassport('${tree.code}')" style="margin-top: 6px; width: 100%; background: #059669; color: white; border: none; padding: 4px 6px; border-radius: 4px; font-weight: 600; cursor: pointer;">
          Xem Passport
        </button>
      </div>
    `);

    markersLayer.addLayer(circleMarker);
  });
}

// 5. Render danh sách lưới cây (Grid View)
function renderTreeGrid(trees) {
  const container = document.getElementById('tree-grid-view');
  if (!container) return;

  container.innerHTML = '';
  trees.forEach(tree => {
    const color = HEALTH_COLORS[tree.healthStatus] || "#10b981";
    container.innerHTML += `
      <div onclick="openTreePassport('${tree.code}')" class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-mono font-bold text-xs text-slate-900">${tree.code}</span>
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
        </div>
        <p class="text-[11px] text-slate-500">${tree.order}</p>
        <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[11px]">
          <span class="text-slate-600 font-medium">Cao: <strong class="text-slate-900">${tree.estimatedHeight}m</strong></span>
          <span class="text-slate-600 font-medium">Lá: <strong class="text-slate-900">${tree.greenLeafCount}</strong></span>
        </div>
      </div>
    `;
  });
}

// 6. Lọc và tìm kiếm cây
async function filterTreeDirectory() {
  const keyword = document.getElementById('tree-search-input').value.trim().toUpperCase();
  const selectedRow = document.getElementById('filter-row').value;

  let trees = await db.trees.toArray();

  if (keyword) {
    trees = trees.filter(t => t.code.includes(keyword) || t.order.toUpperCase().includes(keyword));
  }

  if (selectedRow !== 'all') {
    trees = trees.filter(t => t.row === parseInt(selectedRow, 10));
  }

  document.getElementById('directory-tree-count').innerText = `${trees.length} cây`;
  renderMapMarkers(trees);
  renderTreeGrid(trees);
}

// 7. Mở Modal Passport đầy đủ 16 thuộc tính & Sinh mã QR
let currentActiveTree = null;
async function openTreePassport(code) {
  const tree = await db.trees.get(code);
  if (!tree) return;
  currentActiveTree = tree;

  // Điền 16 trường vào modal
  document.getElementById('modal-tree-code').innerText = tree.code;
  document.getElementById('modal-tree-order').innerText = tree.order;
  document.getElementById('modal-gps-text').innerText = `${tree.latitude.toFixed(6)}, ${tree.longitude.toFixed(6)}`;
  document.getElementById('modal-btn-gmaps').href = tree.googleMapsUrl || `https://www.google.com/maps?q=${tree.latitude},${tree.longitude}`;
  
  const healthBadge = document.getElementById('modal-health-badge');
  healthBadge.innerText = tree.healthStatus;
  healthBadge.style.borderColor = HEALTH_COLORS[tree.healthStatus];
  healthBadge.style.color = HEALTH_COLORS[tree.healthStatus];

  document.getElementById('modal-variety').innerText = tree.variety;
  document.getElementById('modal-planting-date').innerText = tree.plantingDate;
  document.getElementById('modal-growth-stage').innerText = tree.growthStage;
  document.getElementById('modal-height').innerText = `${tree.estimatedHeight} m`;
  document.getElementById('modal-leaves').innerText = `${tree.greenLeafCount} bẹ`;
  document.getElementById('modal-pest').innerText = tree.pestStatus;
  document.getElementById('modal-care-action').innerText = tree.lastCareAction;
  document.getElementById('modal-care-date').innerText = tree.lastCareDate;
  document.getElementById('modal-notes').innerText = tree.fieldNotes || "Không có ghi chú thêm.";

  // Sinh mã QR vector sắc nét với qrcode.js
  const qrContainer = document.getElementById('passport-qr-code');
  qrContainer.innerHTML = '';
  new QRCode(qrContainer, {
    text: tree.qrPayload || `HUKIMI_TREE:${tree.code}`,
    width: 84,
    height: 84,
    colorDark: "#0f172a",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });

  document.getElementById('passport-modal').classList.remove('hidden');
}

function closePassportModal() {
  document.getElementById('passport-modal').classList.add('hidden');
}

// 8. Cập nhật GPS thực tế của thiết bị vào Cây đang xem
function updateTreeCurrentGPS() {
  if (!currentActiveTree) return;

  if (!navigator.geolocation) {
    alert("Thiết bị không hỗ trợ định vị GPS.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = parseFloat(position.coords.latitude.toFixed(6));
      const lng = parseFloat(position.coords.longitude.toFixed(6));

      await db.trees.update(currentActiveTree.code, {
        latitude: lat,
        longitude: lng,
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`
      });

      currentActiveTree.latitude = lat;
      currentActiveTree.longitude = lng;
      document.getElementById('modal-gps-text').innerText = `${lat}, ${lng}`;
      document.getElementById('modal-btn-gmaps').href = `https://www.google.com/maps?q=${lat},${lng}`;

      // Refresh bản đồ
      const trees = await db.trees.toArray();
      renderMapMarkers(trees);
      alert(`Đã cập nhật tọa độ thực tế vệ tinh cho cây ${currentActiveTree.code}!`);
    },
    (err) => {
      alert("Lỗi lấy tọa độ GPS thiết bị: " + err.message);
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// 9. Phím tắt từ Passport nhảy thẳng qua Tab 4 để đo AR
function goToFieldMeasure() {
  if (!currentActiveTree) return;
  closePassportModal();
  switchTab('tab-field-input');
  setTimeout(() => {
    const input = document.getElementById('field-tree-code');
    if (input) input.value = currentActiveTree.code;
  }, 150);
}
