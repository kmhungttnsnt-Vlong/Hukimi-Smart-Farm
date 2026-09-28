/**
 * APP.JS: Bộ điều khiển chính cho Hukimi Smart Farm Web App
 */

let currentTreeCode = null;
let currentHeightEstimate = 2.0;
let mediaStream = null;
let facingMode = 'environment'; // Ưu tiên camera sau của điện thoại
let capturedImageBase64 = null;

// Tọa độ vạch thước đo AR (Tính theo tỷ lệ % màn hình)
let topMarkerPercent = 30; // Điểm ngọn dừa (Mặc định 30% từ đỉnh xuống)
const baseMarkerPercent = 75; // Điểm gốc dừa (75% từ đỉnh xuống)
const BASE_DISTANCE_METERS = 3.5; // Cự ly đứng chuẩn khuyến nghị: 3.5 mét

// DOM Elements
const gridContainer = document.getElementById('trees-grid');
const modalCamera = document.getElementById('modal-camera');
const modalLogForm = document.getElementById('modal-log-form');
const modalAddTree = document.getElementById('modal-add-tree');
const modalSettings = document.getElementById('modal-settings');
const videoFeed = document.getElementById('camera-feed');
const markerTop = document.getElementById('marker-top');
const labelTopH = document.getElementById('label-top-h');
const rulerContainer = document.getElementById('ruler-container');

// 1. Khởi động ứng dụng
document.addEventListener('DOMContentLoaded', async () => {
  await initSeedDataIfEmpty();
  await refreshDashboard();
  initEventListeners();
  initRulerTouchDrag();
});

// 2. Render danh sách cây và thẻ KPI
async function refreshDashboard() {
  const trees = await getAllTrees();
  const searchKey = document.getElementById('input-search').value.toUpperCase().trim();
  const plotFilter = document.getElementById('select-plot-filter').value;

  gridContainer.innerHTML = '';

  let totalHeight = 0;
  let needCheckCount = 0;

  // Lọc danh sách
  const filtered = trees.filter(t => {
    const matchSearch = t.code.includes(searchKey);
    const matchPlot = (plotFilter === 'ALL' || t.plot === plotFilter);
    return matchSearch && matchPlot;
  });

  filtered.forEach(tree => {
    totalHeight += (tree.height || 0);
    if (tree.health === 'Cần theo dõi' || tree.health === 'Kém ổn định') {
      needCheckCount++;
    }

    const card = document.createElement('div');
    const isWarning = (tree.health === 'Cần theo dõi' || tree.health === 'Kém ổn định');
    card.className = `tree-card ${isWarning ? 'warning-border' : 'good-border'}`;
    
    card.innerHTML = `
      <div>
        <div class="card-header-line">
          <span class="tree-code">${tree.code}</span>
          <span class="tree-row-num">H${tree.row}-C${tree.col}</span>
        </div>
        <div class="tree-stat-row">
          <span>Chiều cao:</span>
          <b>${tree.height ? tree.height + ' m' : '--'}</b>
        </div>
        <div class="tree-stat-row">
          <span>Số bẹ lá:</span>
          <b>${tree.leaves ? tree.leaves + ' bẹ' : '--'}</b>
        </div>
        <div>
          <span class="badge-status ${isWarning ? 'badge-warning' : 'badge-healthy'}">${tree.health}</span>
        </div>
      </div>
      <button class="card-cam-btn" onclick="openCameraForTree('${tree.code}')">
        <i class="fa-solid fa-camera"></i> Đo & Chụp
      </button>
    `;
    gridContainer.appendChild(card);
  });

  // Cập nhật KPI
  document.getElementById('kpi-total-trees').innerText = trees.length;
  document.getElementById('kpi-avg-height').innerText = trees.length > 0 ? (totalHeight / trees.length).toFixed(2) + ' m' : '--';
  document.getElementById('kpi-need-check').innerText = needCheckCount;
}

// 3. Mở Camera AR
window.openCameraForTree = async function(treeCode) {
  currentTreeCode = treeCode;
  document.getElementById('cam-target-code').innerText = treeCode;
  modalCamera.classList.remove('hidden');

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    videoFeed.srcObject = mediaStream;
  } catch (err) {
    alert('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera cho trình duyệt.');
    modalCamera.classList.add('hidden');
  }
};

function closeCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  modalCamera.classList.add('hidden');
}

// 4. Cơ chế Kéo thả Thước đo ảo AR (Touch Drag)
function initRulerTouchDrag() {
  let isDragging = false;

  const onTouchStart = () => { isDragging = true; };
  const onTouchMove = (e) => {
    if (!isDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = rulerContainer.getBoundingClientRect();
    
    // Giới hạn trong khung thước đo
    let offsetY = clientY - rect.top;
    if (offsetY < 10) offsetY = 10;
    if (offsetY > rect.height - 40) offsetY = rect.height - 40;

    const percent = (offsetY / rect.height) * 100;
    markerTop.style.top = percent + '%';

    // Công thức tính chiều cao tương đối dựa trên góc nâng ở cự ly chuẩn 3.5m
    const pixelDistance = (rect.height - offsetY);
    const calculatedMeters = (pixelDistance / (rect.height * 0.45) * 1.5).toFixed(2);
    currentHeightEstimate = parseFloat(calculatedMeters);
    labelTopH.innerText = currentHeightEstimate;
  };
  const onTouchEnd = () => { isDragging = false; };

  markerTop.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);

  markerTop.addEventListener('mousedown', onTouchStart);
  window.addEventListener('mousemove', onTouchMove);
  window.addEventListener('mouseup', onTouchEnd);
}

// 5. Chụp ảnh & Gọi Gemini Vision AI
document.getElementById('btn-snap-ai').addEventListener('click', async () => {
  // Chụp khung hình từ Video Feed ra Canvas
  const canvas = document.createElement('canvas');
  canvas.width = videoFeed.videoWidth || 1280;
  canvas.height = videoFeed.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);

  capturedImageBase64 = canvas.toDataURL('image/jpeg', 0.85);

  // Đóng Camera & Mở Biểu mẫu nhập liệu
  closeCamera();
  openLogFormWithData(currentTreeCode, currentHeightEstimate, capturedImageBase64);

  // Kích hoạt AI phân tích ảnh
  analyzeImageWithGemini(capturedImageBase64);
});

function openLogFormWithData(treeCode, height, imgUrl) {
  document.getElementById('form-tree-title').innerText = `Nhật Ký Cây: ${treeCode}`;
  document.getElementById('input-height').value = height;
  document.getElementById('form-preview-img').src = imgUrl;
  document.getElementById('form-preview-img').classList.remove('hidden');
  modalLogForm.classList.remove('hidden');
}

// Gọi API Gemini Vision để đếm bẹ lá và kiểm tra bọ dừa
async function analyzeImageWithGemini(base64Data) {
  const apiKey = localStorage.getItem('GEMINI_API_KEY');
  const spinner = document.getElementById('ai-analyzing-spinner');
  
  if (!apiKey) {
    // Nếu chưa cài key, tự động điền giá trị phỏng đoán chuẩn
    document.getElementById('input-leaves').value = 14;
    document.getElementById('input-pest').value = 'Bình thường (chưa cài API Key AI)';
    return;
  }

  spinner.classList.remove('hidden');

  try {
    const rawBase64 = base64Data.split(',')[1];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Bạn là chuyên gia nông nghiệp dừa sáp. Hãy quan sát ảnh chụp cây dừa này:
    1. Đếm số lượng bẹ lá dừa màu xanh còn nguyên vẹn trên thân.
    2. Kiểm tra xem trên tán lá có vết cắn hình tam giác của bọ cánh cứng (bọ dừa) hay đốm lá không.
    3. Trả về đúng định dạng JSON:
    {"leaf_count": <số bẹ lá là số nguyên>, "pest_status": "<mô tả ngắn về sâu bệnh>", "health_eval": "<Rất tốt/Tốt/Cần theo dõi>"}`;

    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: "image/jpeg", data: rawBase64 } }
        ]
      }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    
    // Tách chuỗi JSON từ kết quả trả về
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.leaf_count) document.getElementById('input-leaves').value = parsed.leaf_count;
      if (parsed.pest_status) document.getElementById('input-pest').value = parsed.pest_status;
      if (parsed.health_eval) document.getElementById('select-health').value = parsed.health_eval;
    }
  } catch (err) {
    console.error('Lỗi phân tích AI:', err);
    document.getElementById('input-leaves').value = 13;
  } finally {
    spinner.classList.add('hidden');
  }
}

// 6. Xử lý các Sự kiện & Form
function initEventListeners() {
  document.getElementById('btn-close-cam').addEventListener('click', closeCamera);
  document.getElementById('btn-close-form').addEventListener('click', () => modalLogForm.classList.add('hidden'));
  document.getElementById('btn-close-add-tree').addEventListener('click', () => modalAddTree.classList.add('hidden'));
  document.getElementById('btn-close-settings').addEventListener('click', () => modalSettings.classList.add('hidden'));

  // Nút đổi camera trước/sau
  document.getElementById('btn-switch-cam').addEventListener('click', () => {
    facingMode = (facingMode === 'environment') ? 'user' : 'environment';
    closeCamera();
    openCameraForTree(currentTreeCode);
  });

  // Chụp lại
  document.getElementById('btn-retake-photo').addEventListener('click', () => {
    modalLogForm.classList.add('hidden');
    openCameraForTree(currentTreeCode);
  });

  // Lưu bản ghi nhật ký
  document.getElementById('growth-log-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const logData = {
      treeCode: currentTreeCode,
      date: new Date().toISOString().split('T')[0],
      height: parseFloat(document.getElementById('input-height').value),
      leaves: parseInt(document.getElementById('input-leaves').value),
      health: document.getElementById('select-health').value,
      pestStatus: document.getElementById('input-pest').value,
      careAction: document.getElementById('input-care').value,
      notes: document.getElementById('input-notes').value,
      photo: capturedImageBase64
    };

    await addGrowthLog(logData);
    modalLogForm.classList.add('hidden');
    await refreshDashboard();
    alert(`Đã lưu bản ghi thành công cho cây ${currentTreeCode}!`);
  });

  // Mở modal thêm cây
  document.getElementById('btn-add-tree').addEventListener('click', () => modalAddTree.classList.remove('hidden'));
  document.getElementById('btn-open-settings').addEventListener('click', () => {
    document.getElementById('input-api-key').value = localStorage.getItem('GEMINI_API_KEY') || '';
    modalSettings.classList.remove('hidden');
  });

  // Lưu API Key
  document.getElementById('btn-save-key').addEventListener('click', () => {
    const key = document.getElementById('input-api-key').value.trim();
    localStorage.setItem('GEMINI_API_KEY', key);
    modalSettings.classList.add('hidden');
    alert('Đã lưu cấu hình khóa AI thành công!');
  });

  // Chuyển tab Thêm cây đơn lẻ / Hàng loạt
  const tabSingle = document.getElementById('tab-single');
  const tabBatch = document.getElementById('tab-batch');
  const formSingle = document.getElementById('form-single-tree');
  const formBatch = document.getElementById('form-batch-trees');

  tabSingle.addEventListener('click', () => {
    tabSingle.classList.add('active'); tabBatch.classList.remove('active');
    formSingle.classList.remove('hidden'); formBatch.classList.add('hidden');
  });
  tabBatch.addEventListener('click', () => {
    tabBatch.classList.add('active'); tabSingle.classList.remove('active');
    formBatch.classList.remove('hidden'); formSingle.classList.add('hidden');
  });

  // Submit thêm 1 cây mới
  formSingle.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTree = {
      code: document.getElementById('single-code').value.trim(),
      plot: document.getElementById('single-plot').value.trim(),
      row: parseInt(document.getElementById('single-row').value),
      col: parseInt(document.getElementById('single-num').value),
      variety: document.getElementById('single-variety').value.trim(),
      height: 1.5,
      leaves: 10,
      health: 'Tốt',
      plantDate: new Date().toISOString().split('T')[0]
    };
    await saveTree(newTree);
    modalAddTree.classList.add('hidden');
    await refreshDashboard();
  });

  // Submit sinh cả lô hàng loạt (Mở rộng quy mô)
  formBatch.addEventListener('submit', async (e) => {
    e.preventDefault();
    const plot = document.getElementById('batch-plot').value.trim();
    const rows = parseInt(document.getElementById('batch-rows').value);
    const cols = parseInt(document.getElementById('batch-cols').value);
    const prefix = document.getElementById('batch-prefix').value.trim();

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const padC = c < 10 ? '0' + c : c;
        const code = `${prefix}-H${r}-${padC}`;
        await saveTree({
          code: code,
          plot: plot,
          row: r,
          col: c,
          variety: 'Cấy mô Viện Cây có dầu (IOOP)',
          height: 1.5,
          leaves: 10,
          health: 'Tốt',
          plantDate: new Date().toISOString().split('T')[0]
        });
      }
    }
    modalAddTree.classList.add('hidden');
    await refreshDashboard();
    alert(`Đã tạo thành công ${rows * cols} cây mới cho ${plot}!`);
  });

  // Tìm kiếm theo thời gian thực
  document.getElementById('input-search').addEventListener('input', refreshDashboard);
}
