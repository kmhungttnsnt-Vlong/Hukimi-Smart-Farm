# 🌴 Hukimi Smart Farm - Hệ Thống Quản Lý Vườn Dừa Sáp Thông Minh

Ứng dụng Web App di động chuyên dụng để thay thế Google Sheets trong công tác quản lý thực địa, giám sát sinh trưởng và nhật ký chăm sóc vườn dừa sáp Hukimi. Hệ thống tích hợp **Thước đo ảo AR (Camera Overlay)** và **Trí tuệ nhân tạo (Gemini Vision AI)** giúp tự động hóa khâu đo chiều cao, đếm bẹ lá và phát hiện sâu bệnh.

---

## 🚀 Tính Năng Nổi Bật

1. **Khả năng mở rộng quy mô không giới hạn:**
   - Khởi tạo sẵn **72 cây dừa** hiện hữu (4 hàng × 18 cây) khớp với Master Sheet gốc.
   - Hỗ trợ thêm từng cây đơn lẻ hoặc **sinh tự động cả lô/khu mới hàng loạt** (VD: Khu B, Khu C với hàng trăm cây chỉ sau 1 click).

2. **Thước đo định lượng AR trên Camera (Touch-Drag Ruler):**
   - Hiển thị thước đo ảo ngay trên luồng camera thời gian thực của điện thoại.
   - Người dùng đứng ở cự ly chuẩn (~3.5m), chạm kéo vạch vàng vào chóp đọt dừa, căn đáy về gốc (0.0m) ➔ Web App tự động quy đổi ra chiều cao tương đối của cây (đơn vị mét).

3. **Tự động đếm bẹ lá & bắt sâu bệnh bằng Vision AI:**
   - Tích hợp trực tiếp **Google Gemini 1.5 Flash Vision API**.
   - Phân tích ảnh chụp thực địa ngay lập tức: tự động đếm số lượng bẹ lá xanh nguyên vẹn, nhận diện vết cắn hình tam giác của bọ dừa/sâu bệnh và đề xuất đánh giá sức khỏe cây.

4. **Hoạt động Offline & Lưu trữ CSDL Trực Tiếp (IndexedDB):**
   - Toàn bộ hồ sơ cây và hình ảnh thực địa được lưu trữ trực tiếp trong cơ sở dữ liệu `IndexedDB` của trình duyệt.
   - Thao tác ghi chép ngoài vườn hoàn toàn không phụ thuộc vào kết nối mạng 4G/Wifi.

---

## 📁 Cấu Trúc Dự Án

```text
├── index.html   # Giao diện ứng dụng, màn hình Camera AR, Form nhập liệu & Lưới cây
├── style.css    # Giao diện Mobile-First, thiết kế vạch thước đo AR & trạng thái sức khỏe
├── db.js        # Cơ sở dữ liệu IndexedDB (Khởi tạo 72 cây gốc & quản lý nhật ký)
├── app.js       # Logic Camera, sự kiện kéo vạch AR, kết nối Gemini AI & CRUD cây
└── README.md    # Tài liệu hướng dẫn sử dụng và triển khai dự án
