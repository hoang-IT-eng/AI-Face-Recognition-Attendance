# AI Face Recognition Attendance System

> **Cho người clone từ GitHub:** xem chi tiết thư viện, file cần push và cách chạy từ đầu trong **[HUONG_DAN_CAI_DAT.md](./HUONG_DAN_CAI_DAT.md)**.

## Push lên GitHub — tóm tắt

| Push | Không push |
|------|------------|
| `face-attendance/` (mã nguồn + `requirements.txt`) | `venv/`, `node_modules/`, `attendance.db` |
| `face-attendance-ui/` + `package-lock.json` | `.deepface/`, `.env`, `face_landmarker.task`, `silent_fas/` |
| `README.md`, `HUONG_DAN_CAI_DAT.md`, `.gitignore` | Log tạm (`eror.txt`, `loi..txt`) |

## Cấu trúc project

```
NhanDienKhuonMat/
├── face-attendance/        # Backend (FastAPI + Python)
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── face_service.py     # DeepFace logic
│   ├── liveness.py         # MediaPipe blink detection
│   ├── requirements.txt
│   └── routes/
│       ├── users.py
│       ├── attendance.py
│       ├── schedules.py
│       └── camera.py
└── face-attendance-ui/     # Frontend (React + Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Users.jsx
    │       ├── Camera.jsx
    │       └── Attendance.jsx
    └── package.json
```

---

## Cài đặt lần đầu

### Backend

```bash
cd face-attendance

# Tạo virtual environment Python 3.11
py -3.11 -m venv venv

# Activate venv
venv\Scripts\activate

# Cài dependencies (đã gồm mediapipe, websockets)
pip install -r requirements.txt
```

### Frontend

```bash
cd face-attendance-ui

# Cài dependencies
npm install
```

---

## Chạy chương trình

### Terminal 1 — Backend

```bash
cd face-attendance
venv\Scripts\activate
uvicorn main:app --reload
```

Backend chạy tại: http://localhost:8000
API docs: http://localhost:8000/docs

### Terminal 2 — Frontend

```bash
cd face-attendance-ui
npm run dev
```

Frontend chạy tại: http://localhost:5173

---

## Lần đầu chạy

1. Mở http://localhost:5173
2. Vào **Người dùng** → Thêm người dùng mới
3. Nhấn **📷 Chụp mặt** → chụp 5+ ảnh với các góc khác nhau
4. Vào **Điểm danh** → chọn tab **👁 Liveness** → nhấn Start → chớp mắt 2 lần

---

## Các lệnh hữu ích

```bash
# Kiểm tra môi trường
venv\Scripts\python.exe -c "import deepface, mediapipe, websockets; print('OK')"

# Kiểm tra GPU
venv\Scripts\python.exe -c "import onnxruntime as ort; print(ort.get_available_providers())"

# Xem database
venv\Scripts\python.exe -c "from database import SessionLocal; from models import User; db=SessionLocal(); print([u.name for u in db.query(User).all()])"

# Reset database (xóa toàn bộ)
del face-attendance\attendance.db

# Build frontend production
cd face-attendance-ui && npm run build
```

---

## Models sử dụng

| Model | Dùng cho | Kích thước | Download |
|---|---|---|---|
| Facenet512 | Face embedding | ~95MB | Tự động khi chạy lần đầu |
| MTCNN | Face detection (chụp ảnh) | ~2MB | Tự động |
| OpenCV Haar | Face detection (stream) | ~1MB | Tự động |
| MediaPipe FaceLandmarker | Liveness detection | ~6MB | Tự động khi chạy liveness |

---

## Chế độ điểm danh

| Chế độ | Mô tả | Chống giả mạo |
|---|---|---|
| 🎥 Stream | Camera server nhận diện liên tục | Không |
| 📷 Chụp | Chụp ảnh từ browser rồi nhận diện | Không |
| 👁 Liveness | Yêu cầu chớp mắt 2 lần trước khi nhận diện | Có |

---

## Troubleshooting

**Backend không khởi động được**
```bash
# Kiểm tra Python version (cần 3.11)
python --version

# Đảm bảo đã activate venv
venv\Scripts\activate
```

**Webcam đen ở tab Chụp**
- Đảm bảo tab Stream đã Stop trước khi sang tab Chụp
- Stream backend chiếm camera → phải dừng trước

**Liveness bị tắt ngay**
```bash
pip install websockets mediapipe
uvicorn main:app --reload
```

**Stream bị lag**
- Detector đã được đổi sang `opencv` cho stream (nhanh hơn)
- Nếu vẫn lag: tăng interval trong `camera.py` từ 0.5s lên 1.0s
