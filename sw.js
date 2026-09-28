/**
 * HUKIMI SMART FARM - SERVICE WORKER (OFFLINE FIRST CACHE ENGINE)
 * Đảm bảo ứng dụng chạy mượt mà trên GitHub Pages và khi mất sóng 4G ngoài vườn.
 */

const CACHE_NAME = 'hukimi-smart-farm-v1.1';

// Danh sách các tài nguyên tĩnh nội bộ và thư viện CDN thiết yếu cần lưu Cache
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  
  // Toàn bộ logic dữ liệu và 6 màn hình
  './js/db.js',
  './js/screens/tab1-dashboard.js',
  './js/screens/tab2-directory.js',
  './js/screens/tab3-growth.js',
  './js/screens/tab4-field-input.js',
  './js/screens/tab5-care-log.js',
  './js/screens/tab6-settings.js',

  // Các CDN thư viện giao diện và tính năng
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://unpkg.com/html5-qrcode',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

// 1. Cài đặt Service Worker và nạp toàn bộ tài nguyên vào Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Đang lưu trước tài nguyên tĩnh Hukimi Farm vào Cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Kích hoạt và dọn dẹp các phiên bản cache cũ nếu có cập nhật mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Đang xóa bộ nhớ cache phiên bản cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Đón và xử lý các yêu cầu mạng (Chiến lược: Cache First, fallback Network)
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // Bỏ qua các cuộc gọi API trực tiếp tới Google AI Studio (Gemini Vision)
  if (requestUrl.includes('generativelanguage.googleapis.com')) {
    return; // Để mạng xử lý trực tiếp, không can thiệp cache
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Nếu đã có sẵn trong Cache thì trả về ngay lập tức (cực nhanh, không cần mạng)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Nếu chưa có, lấy từ mạng và tự động lưu bổ sung vào Cache
      return fetch(event.request).then((networkResponse) => {
        // Chỉ cache những phản hồi hợp lệ
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Dự phòng khi mất mạng hoàn toàn và yêu cầu mở trang chính
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
