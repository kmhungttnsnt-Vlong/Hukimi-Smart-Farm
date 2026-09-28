/**
 * HUKIMI SMART FARM - TAB 4: FIELD INPUT & AR CAMERA & GEMINI VISION
 */

let videoStream = null;
let currentCapturedBlob = null;

// Biến điều khiển thước đo ảo AR
let arState = {
  active: false,
  baseY: 0.85, // Vị trí gốc cây (% chiều cao màn hình)
  topY: 0.25,  // Vị trí đọt cây (% chiều cao màn hình)
  distance: 3.5, // Cự ly đứng chụp (mặc định 3.5m)
  dragging: null
};

// 1. Gắn HTML của Tab 4 vào container
function renderTab4Content() {
  const container = document.getElementById('tab-field-input');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Thực địa: AR & Gemini AI</h2>
          <p class="text-xs text-slate-500">Đo chiều cao trực quan và chẩn đoán dịch hại</p>
        </div>
        <button onclick="openCameraModal()" class="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
          <i class="fa-solid fa-camera"></i>
          <span>Mở Camera AR</span>
        </button>
      </div>

      <!-- FORM NHẬP DỮ LIỆU ĐO ĐẠC -->
      <form id="field-record-form" onsubmit="saveFieldRecord(event)" class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3.5">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Mã định danh cây</label>
          <div class="flex space-x-2">
            <input type="text" id="field-tree-code" required placeholder="VD: HKM-H1-01" class="flex-1 text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 uppercase font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
            <button type="button" onclick="startQRScannerInline()" class="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 rounded-lg text-slate-700 text-xs font-medium flex items-center space-x-1">
              <i class="fa-solid fa-qrcode"></i>
              <span>Quét</span>
            </button>
          </div>
        </div>

        <!-- Khung quét QR Inline nếu mở -->
        <div id="qr-reader-container" class="hidden bg-slate-900 p-2 rounded-xl text-center">
          <div id="qr-reader" class="w-full"></div>
          <button type="button" onclick="stopQRScannerInline()" class="mt-2 text-xs text-rose-400 font-semibold py-1">Đóng quét QR</button>
        </div>

        <!-- ẢNH CHỤP XỬ LÝ (NẾU CÓ) -->
        <div id="preview-image-box" class="hidden relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          <img id="captured-img-preview" src="" alt="Ảnh chụp thực địa" class="w-full h-44 object-cover" />
          <div class="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded">
            Ảnh thước đo AR thực địa
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Chiều cao đo AR (m)</label>
            <div class="relative">
              <input type="number" step="0.01" id="field-height" required placeholder="1.85" class="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pr-8 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
              <span class="absolute right-3 top-2.5 text-xs text-slate-400">m</span>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Số bẹ lá xanh (AI đếm)</label>
            <input type="number" id="field-leaf-count" required placeholder="12" class="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Tình trạng bọ dừa & dịch hại</label>
          <input type="text" id="field-pest" placeholder="VD: Bình thường hoặc Vết khuyết lá hình tam giác" class="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Đánh giá sức khỏe</label>
            <select id="field-health" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="Rất tốt">Rất tốt</option>
              <option value="Tốt">Tốt</option>
              <option value="Đang phục hồi">Đang phục hồi</option>
              <option value="Cần theo dõi">Cần theo dõi</option>
              <option value="Kém ổn định">Kém ổn định</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Chăm sóc gần nhất</label>
            <input type="text" id="field-care" placeholder="Hữu cơ vi sinh 1.5kg" class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Ghi chú quan sát</label>
          <textarea id="field-notes" rows="2" placeholder="Ghi chú về đọt non, tán bẹ hoặc rễ..." class="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
        </div>

        <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-sm shadow-md transition-all flex items-center justify-center space-x-2">
          <i class="fa-solid fa-floppy-disk"></i>
          <span>Lưu bản ghi thực địa (IndexedDB)</span>
        </button>
      </form>
    </div>

    <!-- MODAL CAMERA AR & GEMINI AI LỚP PHỦ FULLSCREEN -->
    <div id="camera-modal" class="fixed inset-0 z-50 bg-black hidden flex flex-col">
      <!-- Top controls -->
      <div class="absolute top-0 left-0 right-0 p-3 z-30 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent text-white">
        <button onclick="closeCameraModal()" class="text-white text-base px-2 py-1 bg-black/40 rounded-full">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="text-center">
          <p class="text-xs font-bold text-emerald-400 tracking-wider uppercase">Thước Đo Ảo AR</p>
          <p class="text-[10px] text-slate-300">Cự ly đứng ~3.5m • Kéo 2 vạch đo</p>
        </div>
        <div class="w-6"></div>
      </div>

      <!-- Viewfinder Video & AR Canvas Overlay -->
      <div class="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video id="ar-video" playsinline autoplay muted class="w-full h-full object-cover"></video>
        <canvas id="ar-canvas" class="absolute inset-0 w-full h-full touch-none z-20"></canvas>
      </div>

      <!-- Bottom controls: Capture & Gemini Trigger -->
      <div class="bg-slate-950 p-4 z-30 flex flex-col items-center space-y-3">
        <div class="flex items-center justify-between w-full max-w-xs text-white text-xs px-2">
          <span>Chiều cao đo: <strong id="ar-live-height" class="text-emerald-400 text-sm">--</strong></span>
          <span class="text-slate-400 text-[11px]">(Gốc: vàng, Ngọn: xanh)</span>
        </div>

        <div class="flex items-center space-x-6">
          <button onclick="captureAndAnalyze()" id="btn-snap-ai" class="flex flex-col items-center group">
            <div class="w-16 h-16 rounded-full border-4 border-white bg-emerald-500 flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <i class="fa-solid fa-wand-magic-sparkles text-xl text-white"></i>
            </div>
            <span class="text-[10px] text-emerald-300 mt-1 font-semibold">Chụp & AI Soi</span>
          </button>
        </div>

        <div id="ai-analyzing-spinner" class="hidden text-xs text-emerald-400 flex items-center space-x-2">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Gemini Vision đang đếm bẹ và soi bọ dừa...</span>
        </div>
      </div>
    </div>
  `;
}

// 2. Xử lý mở Camera và luồng AR Ruler
async function openCameraModal() {
  const modal = document.getElementById('camera-modal');
  modal.classList.remove('hidden');

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    const video = document.getElementById('ar-video');
    video.srcObject = videoStream;
    await video.play();

    initARCanvas();
  } catch (err) {
    alert("Không thể mở camera thiết bị: " + err.message);
    closeCameraModal();
  }
}

function closeCameraModal() {
  const modal = document.getElementById('camera-modal');
  modal.classList.add('hidden');
  if (videoStream) {
    videoStream.getTracks().forEach(t => t.stop());
    videoStream = null;
  }
  arState.active = false;
}

// 3. Khởi tạo Canvas và thuật toán đo tương đối AR
function initARCanvas() {
  const canvas = document.getElementById('ar-canvas');
  const video = document.getElementById('ar-video');
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  arState.active = true;

  // Tính chiều cao dựa trên góc nhìn FOV camera di động trung bình (~60 độ) ở cự ly 3.5m
  function calculateHeight() {
    const pixelDiff = Math.abs(arState.baseY - arState.topY);
    // Hệ số căn chỉnh thực địa ở cự ly 3.5m
    const estimated = (pixelDiff * 3.4).toFixed(2);
    document.getElementById('ar-live-height').innerText = `${estimated} m`;
    return estimated;
  }

  function drawOverlay() {
    if (!arState.active) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const baseYPx = arState.baseY * h;
    const topYPx = arState.topY * h;
    const centerX = w / 2;

    // Đường dóng trục đứng
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, topYPx);
    ctx.lineTo(centerX, baseYPx);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vạch đo Ngọn (Xanh lá)
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 80, topYPx);
    ctx.lineTo(centerX + 80, topYPx);
    ctx.stroke();
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("NGỌN CÂY", centerX + 90, topYPx + 4);

    // Vạch đo Gốc (Vàng)
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 80, baseYPx);
    ctx.lineTo(centerX + 80, baseYPx);
    ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("GỐC CÂY (0.0m)", centerX + 90, baseYPx + 4);

    calculateHeight();
    requestAnimationFrame(drawOverlay);
  }

  drawOverlay();

  // Bắt sự kiện kéo thả Touch trên Canvas
  function getTouchY(e) {
    const rect = canvas.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return (clientY - rect.top) / rect.height;
  }

  canvas.addEventListener('touchstart', (e) => {
    const y = getTouchY(e);
    if (Math.abs(y - arState.baseY) < 0.08) arState.dragging = 'base';
    else if (Math.abs(y - arState.topY) < 0.08) arState.dragging = 'top';
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!arState.dragging) return;
    const y = Math.max(0.05, Math.min(0.95, getTouchY(e)));
    if (arState.dragging === 'base') arState.baseY = y;
    if (arState.dragging === 'top') arState.topY = y;
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', () => { arState.dragging = null; });
}

// 4. Chụp ảnh & Tích hợp Gemini 1.5 Flash Vision
async function captureAndAnalyze() {
  const video = document.getElementById('ar-video');
  const spinner = document.getElementById('ai-analyzing-spinner');
  const btn = document.getElementById('btn-snap-ai');

  // Ghi nhận khung hình chụp
  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = video.videoWidth || 1280;
  captureCanvas.height = video.videoHeight || 720;
  const ctx = captureCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const base64Data = captureCanvas.toDataURL('image/jpeg', 0.85);
  const base64Raw = base64Data.split(',')[1];

  // Cập nhật giá trị chiều cao từ thước AR vào form
  const measuredHeight = (Math.abs(arState.baseY - arState.topY) * 3.4).toFixed(2);
  document.getElementById('field-height').value = measuredHeight;

  // Hiển thị ảnh chụp xem trước
  document.getElementById('captured-img-preview').src = base64Data;
  document.getElementById('preview-image-box').classList.remove('hidden');

  // Lấy API Key từ bảng Settings (IndexedDB)
  const apiKeyRecord = await db.settings.get('gemini_api_key');
  const apiKey = apiKeyRecord ? apiKeyRecord.value : null;

  if (!apiKey) {
    alert(`Đã lưu chiều cao ${measuredHeight}m từ thước AR!\n\nLưu ý: Bạn chưa cài đặt Gemini API Key trong Tab 'Cài đặt', nên hệ thống sẽ bỏ qua bước tự phân tích hình ảnh.`);
    closeCameraModal();
    return;
  }

  // Gọi Gemini 1.5 Flash Vision
  spinner.classList.remove('hidden');
  btn.classList.add('opacity-50', 'pointer-events-none');

  try {
    const prompt = `Bạn là chuyên gia nông nghiệp phân tích dừa sáp. Hãy phân tích hình ảnh chụp cây dừa này và trả về JSON thuần túy (không bọc trong \`\`\`json) với cấu trúc:
{
  "leafCount": (số nguyên đếm các bẹ lá xanh đang có),
  "pestStatus": "Bình thường (không bọ dừa)" HOẶC "Phát hiện vết cắn khuyết lá hình tam giác của bọ dừa/sâu hại",
  "healthRating": "Rất tốt" HOẶC "Tốt" HOẶC "Cần theo dõi" HOẶC "Kém ổn định",
  "notes": "Nhận xét ngắn về tình trạng tán lá, sức sống của đọt non"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Raw } }
          ]
        }]
      })
    });

    const result = await response.json();
    const textOutput = result.candidates[0].content.parts[0].text.trim();
    const cleanedJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(cleanedJson);

    // Tự động điền dữ liệu AI phân tích vào Form
    document.getElementById('field-leaf-count').value = aiData.leafCount || 12;
    document.getElementById('field-pest').value = aiData.pestStatus || "Bình thường";
    document.getElementById('field-health').value = aiData.healthRating || "Tốt";
    document.getElementById('field-notes').value = `[AI Vision]: ${aiData.notes}`;

    alert("Gemini AI đã hoàn thành phân tích ảnh và tự động điền các trường!");
  } catch (error) {
    console.error("Lỗi AI Vision:", error);
    alert("Không thể phân tích ảnh bằng Gemini AI. Vui lòng kiểm tra lại Key hoặc kết nối mạng.");
  } finally {
    spinner.classList.add('hidden');
    btn.classList.remove('opacity-50', 'pointer-events-none');
    closeCameraModal();
  }
}

// 5. Lưu bản ghi thực địa vào IndexedDB
async function saveFieldRecord(event) {
  event.preventDefault();

  const code = document.getElementById('field-tree-code').value.trim().toUpperCase();
  const height = parseFloat(document.getElementById('field-height').value);
  const leafCount = parseInt(document.getElementById('field-leaf-count').value, 10);
  const pest = document.getElementById('field-pest').value;
  const health = document.getElementById('field-health').value;
  const care = document.getElementById('field-care').value;
  const notes = document.getElementById('field-notes').value;
  const today = new Date().toISOString().split('T')[0];

  const tree = await db.trees.get(code);
  if (!tree) {
    alert(`Không tìm thấy mã cây '${code}' trong danh mục 72 cây. Vui lòng kiểm tra lại mã!`);
    return;
  }

  // 1. Lưu vào bảng lịch sử sinh trưởng (growth_logs)
  await db.growth_logs.add({
    treeCode: code,
    recordDate: today,
    height: height,
    leafCount: leafCount,
    healthRating: health,
    pestStatus: pest,
    notes: notes,
    createdAt: new Date().toISOString()
  });

  // 2. Cập nhật trạng thái mới nhất cho cây trong bảng Master (trees)
  await db.trees.update(code, {
    estimatedHeight: height,
    greenLeafCount: leafCount,
    pestStatus: pest || tree.pestStatus,
    healthStatus: health,
    lastCareAction: care || tree.lastCareAction,
    lastCareDate: today,
    fieldNotes: notes || tree.fieldNotes
  });

  alert(`Đã lưu thành công bản ghi sinh trưởng cho cây ${code}!`);
  document.getElementById('field-record-form').reset();
  document.getElementById('preview-image-box').classList.add('hidden');
}

// 6. Quét QR Code thực địa
let html5QrScanner = null;
function startQRScannerInline() {
  const container = document.getElementById('qr-reader-container');
  container.classList.remove('hidden');

  if (typeof Html5Qrcode === 'undefined') {
    alert("Thư viện quét QR chưa tải xong. Bạn có thể nhập mã thủ công vào ô.");
    return;
  }

  html5QrScanner = new Html5Qrcode("qr-reader");
  html5QrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    (decodedText) => {
      // Xử lý mã QR Hukimi (Ví dụ HUKIMI_TREE:HKM-H1-01 hoặc HKM-H1-01)
      const cleanCode = decodedText.replace("HUKIMI_TREE:", "").trim();
      document.getElementById('field-tree-code').value = cleanCode;
      stopQRScannerInline();
    },
    (err) => {}
  );
}

function stopQRScannerInline() {
  if (html5QrScanner) {
    html5QrScanner.stop().then(() => {
      document.getElementById('qr-reader-container').classList.add('hidden');
    });
  } else {
    document.getElementById('qr-reader-container').classList.add('hidden');
  }
}
