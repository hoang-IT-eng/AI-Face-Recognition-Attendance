# Hướng dẫn cài đặt — Hệ thống điểm danh khuôn mặt

Tài liệu này dành cho người **clone repo từ GitHub** và chạy trên máy mới.

---

## 1. Nên push lên GitHub những gì?

### Push (bắt buộc — để người khác chạy được)

| Thư mục / file | Mô tả |
|----------------|--------|
| `face-attendance/` | Backend FastAPI (mã nguồn Python) |
| `face-attendance/requirements.txt` | Danh sách thư viện Python |
| `face-attendance-ui/` | Frontend React + Vite |
| `face-attendance-ui/package.json` | Dependencies Node |
| `face-attendance-ui/package-lock.json` | Khóa phiên bản npm (nên có) |
| `README.md` | Tổng quan project |
| `HUONG_DAN_CAI_DAT.md` | File này |
| `.gitignore` | Loại trừ file nhạy cảm / nặng |

### Không push (đã có trong `.gitignore` hoặc nên bỏ khỏi Git)

| Loại | Ví dụ | Lý do |
|------|--------|--------|
| Virtual env | `venv/`, `.venv/` | Mỗi máy tự tạo, rất nặng |
| Node modules | `node_modules/` | Chạy `npm install` |
| Database | `attendance.db`, `*.sqlite3` | Dữ liệu riêng từng máy |
| Cache model DeepFace | `.deepface/` | Tự tải khi chạy lần đầu (~100MB+) |
| File model lớn | `face_landmarker.task`, `silent_fas/` | Tự tải / clone riêng (xem mục 5) |
| Biến môi trường | `.env` | Không lộ cấu hình riêng |
| Log / lỗi tạm | `*.log`, `eror.txt`, `loi..txt` | Chỉ để debug cá nhân |
| Build frontend | `face-attendance-ui/dist/` | Tạo bằng `npm run build` |
| Ảnh thử nghiệm cá nhân | (tùy chọn) `face-recognition/*.jpg` | Không cần cho app chính |

### Tùy chọn push

| Thư mục | Ghi chú |
|---------|---------|
| `face-recognition/` | Script demo cũ (DeepFace đơn giản), **không bắt buộc** để chạy app chính |

---

## 2. Yêu cầu hệ thống

| Thành phần | Phiên bản khuyến nghị |
|------------|------------------------|
| **Python** | 3.11 (3.10–3.12 thường ổn; tránh 3.14 nếu pip báo lỗi wheel) |
| **Node.js** | 18+ hoặc 20 LTS |
| **npm** | Đi kèm Node |
| **Webcam** | Cần cho đăng ký mặt / stream / liveness |
| **RAM** | ≥ 8 GB (DeepFace + TensorFlow tốn RAM) |
| **Ổ đĩa trống** | ~2 GB cho venv + model tải lần đầu |
| **GPU** | Không bắt buộc; có GPU thì cài `onnxruntime-gpu`, không có thì dùng `onnxruntime` (CPU) |

---

## 3. Thư viện sử dụng

### 3.1 Backend (`face-attendance/requirements.txt`)

| Thư viện | Vai trò |
|----------|---------|
| **fastapi** | API REST, WebSocket |
| **uvicorn** | Server chạy FastAPI |
| **sqlalchemy** | ORM, SQLite `attendance.db` |
| **python-multipart** | Upload ảnh / file Excel |
| **deepface** | Nhận diện khuôn mặt (Facenet512) |
| **opencv-python** | Xử lý ảnh, camera stream |
| **numpy** | Tính toán vector embedding |
| **tf-keras** | Backend cho DeepFace / TensorFlow |
| **pandas**, **openpyxl** | Import/export Excel |
| **mediapipe** | Liveness (chớp mắt) |
| **websockets** | WebSocket liveness |
| **python-jose**, **passlib** | (Dự phòng auth — chưa dùng đầy đủ) |
| **onnxruntime** hoặc **onnxruntime-gpu** | Anti-spoof tùy chọn |

### 3.2 Frontend (`face-attendance-ui/package.json`)

| Thư viện | Vai trò |
|----------|---------|
| **react**, **react-dom** | Giao diện |
| **react-router-dom** | Điều hướng (Giám sát / Đăng ký) |
| **axios** | Gọi API backend |
| **react-webcam** | Chụp ảnh đăng ký mặt |
| **recharts** | Biểu đồ (trang legacy) |
| **vite**, **tailwindcss** | Build & CSS |

### 3.3 Model AI (không nằm trong Git — tự tải)

| Model | Khi nào tải | Kích thước (ước lượng) |
|-------|-------------|-------------------------|
| **Facenet512** + detector | Lần đầu gọi DeepFace | ~95 MB (cache `.deepface/`) |
| **MTCNN** / **OpenCV Haar** | Cùng DeepFace | Vài MB |
| **face_landmarker.task** | Lần đầu bật Liveness | ~6 MB (script tự tải) |
| **Silent-Face-Anti-Spoofing** | Chỉ khi bật anti-spoof | Clone repo riêng (xem mục 5) |

---

## 4. Cách chạy từ đầu (Windows)

### Bước 1 — Clone repo

```powershell
git clone <URL-repo-cua-ban>
cd NhanDienKhuonMat
```

### Bước 2 — Backend

```powershell
cd face-attendance
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

**Máy không có GPU NVIDIA:** mở `requirements.txt`, thay dòng `onnxruntime-gpu` bằng:

```
onnxruntime>=1.16.0
```

rồi chạy lại `pip install -r requirements.txt`.

**Chạy server:**

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Swagger: http://localhost:8000/docs  

Lần đầu chạy sẽ tạo file `attendance.db` trong thư mục `face-attendance/` (không commit file này).

### Bước 3 — Frontend

Mở terminal mới:

```powershell
cd face-attendance-ui
npm install
npm run dev
```

- Giao diện: http://localhost:5173  

Frontend mặc định gọi API tại `http://localhost:8000` (file `src/api.js`). Nếu backend chạy máy/port khác, sửa `baseURL` trong `api.js` hoặc dùng biến môi trường (xem mục 6).

### Bước 4 — Sử dụng lần đầu

1. Mở http://localhost:5173  
2. **Đăng ký** → thêm người dùng → chụp nhiều góc mặt (5+ ảnh khuyến nghị)  
3. **Giám sát** → bật stream / liveness để điểm danh  

---

## 5. Tính năng tùy chọn

### Liveness (chớp mắt)

Cần `mediapipe` và `websockets` (đã có trong `requirements.txt`).  
Model `face_landmarker.task` được tải tự động vào `face-attendance/` khi dùng lần đầu (file này **không** push lên Git).

### Anti-spoof (chống ảnh/video giả)

Trong thư mục `face-attendance`:

```powershell
git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing.git silent_fas
```

Thư mục `silent_fas/` đã được `.gitignore` — mỗi người clone riêng.

---

## 6. Cấu hình (tùy chọn)

Tạo file `face-attendance-ui/.env` (không commit):

```env
VITE_API_URL=http://localhost:8000
```

Hiện tại `src/api.js` dùng URL cố định; có thể đổi thành:

```js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });
```

---

## 7. Kiểm tra cài đặt

```powershell
# Trong venv backend
python -c "import fastapi, deepface, cv2, mediapipe; print('Backend OK')"
```

```powershell
# Frontend
cd face-attendance-ui
npm run build
```

Nếu `npm run build` thành công → frontend cài đúng.

---

## 8. Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|------------|
| `pip install` lỗi với Python 3.14 | Dùng Python **3.11** |
| Liveness không chạy | `pip install mediapipe websockets`, khởi động lại uvicorn |
| Webcam đen | Tắt stream trước khi chuyển tab chụp ảnh |
| Tải model DeepFace chậm | Bình thường lần đầu; đợi hoặc kiểm tra mạng |
| Frontend không gọi được API | Backend đã chạy port 8000? CORS đã mở `*` trong `main.py` |
| `onnxruntime-gpu` cài lỗi | Đổi sang `onnxruntime` (CPU) |

---

## 9. Checklist trước khi push GitHub

- [ ] Đã commit `face-attendance/` và `face-attendance-ui/` (trừ `node_modules`, `venv`, `dist`)
- [ ] Đã có `requirements.txt` và `package-lock.json`
- [ ] Không commit `attendance.db`, `.env`, `.deepface/`
- [ ] Không commit log cá nhân (`eror.txt`, `loi..txt`)
- [ ] Đã đọc lại `README.md` và file này
- [ ] (Khuyến nghị) Ghi rõ URL repo và nhánh mặc định (`main` / `feature/...`)

---

## 10. Cấu trúc repo (app chính)

```
NhanDienKhuonMat/
├── face-attendance/          # Backend — chạy uvicorn
│   ├── main.py
│   ├── requirements.txt
│   └── routes/
├── face-attendance-ui/       # Frontend — npm run dev
│   ├── package.json
│   └── src/
├── README.md
├── HUONG_DAN_CAI_DAT.md      # File này
└── .gitignore
```

Nếu cần hỗ trợ thêm, mở issue trên GitHub kèm: phiên bản Python/Node, lỗi terminal, và ảnh chụp màn hình (nếu có).
