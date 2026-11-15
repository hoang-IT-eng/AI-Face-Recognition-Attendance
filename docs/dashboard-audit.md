# Báo cáo audit: Dashboard & Face Recognition pipeline

> Ngày xuất: 2026-11-15  
> Phạm vi: `face-attendance-ui` (React) ↔ `face-attendance` (FastAPI + DeepFace)  
> Mục đích: phân biệt UI mock / API thật, và trạng thái nối model nhận diện vào giao diện

---

## Tóm tắt

- **Dashboard `/dashboard`** vẫn “trông live” nhờ nhiều **fallback demo / hardcode** khi API trống hoặc khi thiếu field.
- **DeepFace Facenet512 đã được wire** qua FastAPI cho: đăng ký mặt, Kiosk (khi bật Live), Monitoring stream.
- Dashboard **không chạy model** — chỉ đọc kết quả điểm danh sau khi Kiosk/Monitoring đã nhận diện.
- Anti-spoof gần như **tắt**; một số nút UI (auto check-in, PIN/QR kiosk) **chưa nối đúng** end-to-end.

---

## A. Dashboard `/dashboard` vs Backend

Nguồn chính: `face-attendance-ui/src/pages/Dashboard.jsx`, `face-attendance-ui/src/api.js`.

| UI feature | API gọi | Backend | Status |
|---|---|---|---|
| KPI Có mặt / Muộn / Vắng / Tổng NV | `GET /attendance/today`, `GET /users/` | Có | **Partial** — có data thì dùng API; không có thì fallback **150 / 142 / 6 / 2** |
| Sub-text KPI (“+8 người”, “1 phép năm”, “4 phòng ban”) | Không | Không | **Mock UI** |
| Biểu đồ 7 ngày | `GET /attendance/?date_from&date_to` ×7 | Có | **Partial** — rỗng → `DEFAULT_TREND`; footer **93.8% / A+** hardcode |
| Donut “Phân bố trạng thái” | Dùng `presentRatio` từ KPI | — | **Partial** — `% muộn 4.0%`, `% vắng 1.3%`, `strokeDasharray` hardcode |
| Bảng 8 lượt gần nhất | `GET /attendance/today` | Có `confidence` trong `AttendanceOut` | **Partial** — live map được, nhưng **confidence luôn `"99.2%"`** (bỏ qua `r.confidence`); không data → `DEMO_LOGS` |
| Avatar khuôn mặt | — | — | **Missing** khi live (`avatar: null`) |
| “Live Ping: 18ms”, “WebRTC & Edge TPU”, “NTP” | Không | Không | **Mock copy** |
| Xuất Excel hôm nay | `GET /attendance/export/excel` | Có (`routes/attendance.py`) | **Done** — lưu ý: `catch` vẫn `alert("Đã xuất...")` → có thể báo thành công giả khi fail |
| Nút “Xem giám sát” | Navigate `/monitoring` | — | UI only |
| `GET /attendance/stats/summary` | Có trong `api.js` | Có | **Không dùng** trên Dashboard |

### AdminLayout / nav

| Feature | API | Status |
|---|---|---|
| Badge cảnh báo | `GET /alerts/stats` | **Done** |
| Avatar / tên HR sidebar | Không dùng `getMe` / `sf_admin_name` | **Mock** (`/auth/me` có nhưng UI không gọi) |
| “Hệ thống hoạt động” | Không health API | **Mock** |
| Logout | `navigate("/login")` | **Partial** — không clear token |

### Các trang admin liên quan

| Trang | Wired thật | Gap chính |
|---|---|---|
| `/employees` (`Users.jsx`) | CRUD `/users/*` | Fallback `DEMO_USERS`; sidebar stats hardcode |
| `/monitoring` | `GET /camera/stream/{id}`, SSE `/camera/stream-results` | Events seed `INITIAL_EVENTS`; autoCheckin chỉ UI; snapshot fake |
| `/schedules` | CRUD `/schedules/` | Fallback `DEMO_SHIFTS` |
| `/edit-attendance` | `POST /attendance/manual`, `GET /attendance/adjustments` | **Done** (chủ yếu) |
| `/backup-attendance` | `POST /attendance/backup`, `GET .../backup/recent` | **Done** (PIN thật ở đây) |
| `/reports` | attendance / payroll / export | **Done** (chủ yếu) |
| `/alerts` | `/alerts/*` | **Done** |
| `/privacy-settings` | `/privacy/*` | **Done** |
| `/register-face` | `POST /users/{id}/faces` | **Partial** — xem mục B |
| `/kiosk` | WS liveness + PIN | **Partial** — xem mục B |

---

## B. Face recognition pipeline (UI → API → model)

```
[UI Webcam / Upload / OpenCV]
        │
        ▼
 FastAPI face-attendance (main.py → routes/camera.py, users.py)
        │
        ▼
 face_service.py → DeepFace.represent(Facenet512)
        │
        ▼
 FaceEmbedding DB → cosine match (threshold ~0.45)
        │
        ▼
 Attendance / Alerts (tùy endpoint)
```

### 1) Đăng ký khuôn mặt — có nối model

- **UI:** `RegisterFace.jsx` → `registerFace()` → `POST /users/{user_id}/faces`
- **Backend:** `routes/users.py` → `get_embeddings_from_image()` → DeepFace Facenet512 → lưu `FaceEmbedding`
- **Works khi:** bật webcam thật hoặc upload file
- **Incomplete:**
  - Chế độ không webcam: có thể gắn ảnh demo, không gọi API
  - `consent` UI không luôn truyền vào API (backend có `Form(consent)`)
  - Badge “ĐẠT (99.x%)” có thể hardcode, không phải score model

### 2) Kiosk chấm công — có nối khi bật Live

- **UI:** `Kiosk.jsx` → WebSocket `ws://localhost:8000/camera/ws/liveness?mode=checkin`
- **Backend:** `routes/camera.py` `/camera/ws/liveness` → MediaPipe blink → embedding → `recognize` → ghi `Attendance`
- **Mặc định:** có thể ở chế độ demo UI nếu Live OFF
- **Gaps:**
  - Anti-spoof không chạy trên path này
  - PIN: frontend có thể gọi `manualAttendance` thay vì endpoint PIN thật `/attendance/backup`
  - Tab QR: mô phỏng, không API QR

### 3) Giám sát Monitoring — stream + nhận diện có; không ghi công

- **UI:** `<img src={API_BASE}/camera/stream/{camId}>` + `EventSource(.../camera/stream-results)`
- **Backend:** OpenCV `VideoCapture` + DeepFace worker; push SSE / alert người lạ
- Toggle **“Tự động điểm danh”** (`autoCheckin`) **không gửi lên backend**
- Snapshot thường là fake timeout
- Camera là **camera máy server**, không phải webcam browser

### 4) `POST /camera/recognize` — backend đầy đủ; UI admin lệch route

- Backend: DeepFace → match → `_record_attendance` + spoof/unknown alerts
- Client: `recognizeImage` trong `api.js`; dùng trong `Camera.jsx`
- `App.jsx`: `/camera` → **redirect `/monitoring`** → trang upload nhận diện có thể không còn expose trong admin

### 5) Liveness / Anti-spoof — một phần / gần như tắt

| Module | File | Thực tế |
|---|---|---|
| Blink liveness | `liveness.py` + WS | **Wired** (Kiosk khi Live) |
| Silent-Face Anti-spoof | `anti_spoof.py` | **Không được import** từ pipeline chính |
| DeepFace `anti_spoofing` | `face_service.py` | Thường `anti_spoofing=False`; `is_real` luôn True |
| Spoof alerts trong `/recognize` | `camera.py` | Logic có, nhưng path spoof gần như dead |

### 6) CLI cũ — không nối UI

- `face-recognition/main.py`: DeepFace + `face_db.pkl` standalone — **không** gọi FastAPI, không dùng DB SQLAlchemy

### Bảng tóm tắt “model có vào UI không?”

| Luồng | Nối DeepFace qua FastAPI? | Ghi điểm danh? |
|---|---|---|
| RegisterFace (webcam/upload) | Có | N/A (lưu embedding) |
| Kiosk Live ON | Có (+ MediaPipe) | Có (WS) |
| Kiosk Live OFF / demo | Không | Không |
| Monitoring stream | Có (server cam) | **Không** |
| Camera.jsx upload/recognize | Có (có thể orphan) | Có |
| Anti-spoof model | Không (tắt) | — |
| Dashboard | Không (chỉ đọc attendance) | Chỉ hiển thị kết quả |

---

## C. Ưu tiên xử lý

1. **Làm sạch Dashboard** — bỏ/giảm mock KPI, trend, logs; map `r.confidence` thật; bỏ telemetry giả (Live Ping, WebRTC, Edge TPU).
2. **Bật / nối anti-spoof** — `anti_spoof.py` + nhánh `spoof_detected` hiện gần như dead.
3. **Monitoring auto check-in** — hoặc implement ghi công thật, hoặc bỏ toggle gây hiểu nhầm.
4. **Kiosk mặc định Live + PIN/QR đúng API** — PIN nên dùng `/attendance/backup`; QR cần API hoặc ẩn.
5. **RegisterFace** — luôn lưu embedding khi user “đăng ký”; gửi `consent` đúng.
6. **Dùng `/attendance/stats/summary`** trên Dashboard thay vì tự tính + fallback cứng.
7. **Quyết định lại trang `Camera.jsx`** — expose lại hoặc gộp vào Monitoring.

---

## Verdict

DeepFace **đã được wire** qua FastAPI cho đăng ký, kiosk (khi Live), và MJPEG monitoring. Nhiều bề mặt Dashboard/nav vẫn là **UI demo + fallback mock**. Anti-spoof và vài đường điểm danh (auto-checkin, PIN/QR kiosk, confidence KPI) **chưa nối đủ end-to-end**.

---

## File tham chiếu nhanh

| Thành phần | Đường dẫn |
|---|---|
| Dashboard UI | `face-attendance-ui/src/pages/Dashboard.jsx` |
| API client | `face-attendance-ui/src/api.js` |
| Kiosk | `face-attendance-ui/src/pages/Kiosk.jsx` |
| Monitoring | `face-attendance-ui/src/pages/Monitoring.jsx` |
| Register face | `face-attendance-ui/src/pages/RegisterFace.jsx` |
| Face service | `face-attendance/face_service.py` |
| Camera routes | `face-attendance/routes/camera.py` |
| Users / faces | `face-attendance/routes/users.py` |
| Attendance | `face-attendance/routes/attendance.py` |
| Anti-spoof | `face-attendance/anti_spoof.py` |
| Liveness | `face-attendance/liveness.py` |
