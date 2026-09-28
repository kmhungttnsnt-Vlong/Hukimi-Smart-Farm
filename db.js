/**
 * DB.JS: Quản lý cơ sở dữ liệu IndexedDB của ứng dụng Hukimi Farm
 */
const DB_NAME = 'HukimiCoconutFarmDB';
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Kho 1: Danh bạ cây dừa
      if (!db.objectStoreNames.contains('trees')) {
        const treeStore = db.createObjectStore('trees', { keyPath: 'code' });
        treeStore.createIndex('plot', 'plot', { unique: false });
        treeStore.createIndex('health', 'health', { unique: false });
      }

      // Kho 2: Nhật ký sinh trưởng & ảnh thực địa
      if (!db.objectStoreNames.contains('logs')) {
        const logStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('treeCode', 'treeCode', { unique: false });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => reject('Lỗi mở IndexedDB: ' + e);
  });
}

// Khởi tạo 72 cây mặc định ban đầu nếu cơ sở dữ liệu trống
async function initSeedDataIfEmpty() {
  const db = await openDB();
  const tx = db.transaction('trees', 'readwrite');
  const store = tx.objectStore('trees');
  const countReq = store.count();

  return new Promise((resolve) => {
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        // Nạp 4 hàng x 18 cây = 72 cây của vườn Hukimi
        for (let r = 1; r <= 4; r++) {
          for (let c = 1; c <= 18; c++) {
            const padC = c < 10 ? '0' + c : c;
            const code = `HKM-H${r}-${padC}`;
            
            // Dữ liệu mẫu khớp với Sheet hiện tại
            let height = 2.0;
            let leaves = 14;
            let health = 'Rất tốt';
            let stage = '2 năm tuổi (chờ trổ bông)';

            if (r === 1 && c === 5) {
              height = 1.8;
              leaves = 12;
              health = 'Cần theo dõi';
            } else if (r === 1 && c === 8) {
              health = 'Kém ổn định';
            }

            store.add({
              code: code,
              plot: 'Khu A (Gốc)',
              row: r,
              col: c,
              height: height,
              leaves: leaves,
              health: health,
              stage: stage,
              variety: 'Cấy mô Viện Cây có dầu (IOOP)',
              plantDate: '2024-07-13',
              lastCare: '2026-09-01',
              pestStatus: (r === 1 && c === 5) ? 'Vết cắn bọ dừa nhẹ' : 'Bình thường'
            });
          }
        }
      }
      resolve();
    };
  });
}

// Lấy tất cả cây
async function getAllTrees() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('trees', 'readonly');
    const store = tx.objectStore('trees');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

// Lưu hoặc cập nhật 1 cây
async function saveTree(treeObj) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('trees', 'readwrite');
    tx.objectStore('trees').put(treeObj);
    tx.oncomplete = () => resolve(true);
  });
}

// Lưu bản ghi nhật ký sinh trưởng
async function addGrowthLog(logObj) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(['logs', 'trees'], 'readwrite');
    tx.objectStore('logs').add(logObj);

    // Cập nhật chỉ số mới nhất ngược lại vào hồ sơ cây
    const treeStore = tx.objectStore('trees');
    const getReq = treeStore.get(logObj.treeCode);
    getReq.onsuccess = () => {
      const tree = getReq.result;
      if (tree) {
        tree.height = logObj.height;
        tree.leaves = logObj.leaves;
        tree.health = logObj.health;
        tree.pestStatus = logObj.pestStatus;
        tree.lastCare = logObj.date;
        treeStore.put(tree);
      }
    };

    tx.oncomplete = () => resolve(true);
  });
}
