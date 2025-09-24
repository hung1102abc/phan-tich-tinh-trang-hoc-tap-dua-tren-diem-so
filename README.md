## Giới thiệu
Đây là hệ thống web giúp nhập điểm sinh viên từ file Excel, phân tích kết quả học tập và nhận xét AI chi tiết cho từng sinh viên hoặc cả lớp. Ứng dụng sử dụng Node.js (Express) cho backend và HTML/CSS/JS cho frontend.

## Tính năng chính
- Nhập dữ liệu sinh viên từ file Excel.
- Hiển thị bảng điểm, thống kê lớp (tổng số sinh viên, điểm cao/thấp nhất, top 5, 5 sinh viên cần hỗ trợ).
- Phân tích AI chi tiết cho từng sinh viên hoặc toàn bộ lớp (sử dụng Gemini AI).
- Gợi ý cải thiện học tập, kỹ năng mềm, tài liệu hữu ích.

## Công nghệ sử dụng
- Frontend: HTML, Tailwind CSS, Chart.js, Font Awesome, xlsx.js
- Backend: Node.js, Express, Multer, XLSX, Google Gemini AI

## Hướng dẫn sử dụng
1. Cài đặt các package:
   ```bash
   npm install
   ```
2. Khởi động backend:
   ```bash
   node server.js
   ```
3. Mở file `Home (3).html` bằng trình duyệt.
4. Nhấn nút để upload file Excel điểm sinh viên.
5. Xem bảng điểm, thống kê và nhận xét AI.

## Cấu trúc file Excel mẫu
- Các cột cần có: Họ và tên, Lớp, Xếp loại, TBCHT H10, Điểm RL, Kì 1 Năm I, Kì 2 Năm I, Kì 3 Năm I, Kì 1 Năm II, Kì 2 Năm II, Kì 3 Năm II

## Thiết lập API Key
- Tạo file `.env` và thêm khóa API Gemini:
  ```env
  GEMINI_API_KEY=your_google_gemini_api_key
  ```
