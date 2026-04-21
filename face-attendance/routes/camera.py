from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
import numpy as np
import cv2
import tempfile, os
import threading
import time
import base64
import json

from database import get_db, SessionLocal
from models import Attendance, User, FaceEmbedding, Schedule, AttendanceStatus
from schemas import RecognizeResult
from face_service import (
    get_embeddings_from_image,
    get_embeddings_from_frame,
    recognize,
    str_to_embedding,
)
from liveness import LivenessChecker, is_available as liveness_available

router = APIRouter(prefix="/camera", tags=["Camera"])


def _load_db_embeddings(db: Session) -> list[dict]:
    rows = db.query(FaceEmbedding).all()
    return [{"user_id": r.user_id, "embedding": str_to_embedding(r.embedding)} for r in rows]


def _get_schedule(db: Session) -> Schedule | None:
    now = datetime.now()
    day = now.isoweekday()
    time_str = now.strftime("%H:%M")
    for s in db.query(Schedule).all():
        days = [int(d) for d in s.days_of_week.split(",")]
        if day in days and s.start_time <= time_str <= s.end_time:
            return s
    return None


def _record_attendance(user_id: int, schedule: Schedule | None, db: Session) -> tuple[str, Attendance]:
    now = datetime.now(timezone.utc)
    today = date.today().isoformat()
    schedule_id = schedule.id if schedule else None

    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == today,
        Attendance.schedule_id == schedule_id,
    ).first()

    if not existing:
        status = AttendanceStatus.present
        if schedule:
            now_local = datetime.now()
            start = datetime.strptime(f"{today} {schedule.start_time}", "%Y-%m-%d %H:%M")
            if (now_local - start).total_seconds() > schedule.late_threshold * 60:
                status = AttendanceStatus.late
        record = Attendance(
            user_id=user_id, date=today,
            schedule_id=schedule_id, check_in=now, status=status,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return "check_in", record

    if existing.check_out is None:
        existing.check_out = now
        if schedule:
            now_local = datetime.now()
            end = datetime.strptime(f"{today} {schedule.end_time}", "%Y-%m-%d %H:%M")
            if (end - now_local).total_seconds() > 10 * 60:
                existing.status = AttendanceStatus.early_leave
        db.commit()
        db.refresh(existing)
        return "check_out", existing

    return "already_checked", existing


# ── Nhận diện từ ảnh upload ───────────────────────────
@router.post("/recognize", response_model=list[RecognizeResult])
async def recognize_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    suffix = os.path.splitext(file.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        embeddings = get_embeddings_from_image(tmp_path)
    except ValueError as e:
        raise HTTPException(400, str(e))
    finally:
        os.unlink(tmp_path)

    db_embs = _load_db_embeddings(db)
    schedule = _get_schedule(db)
    results = []
    for face in embeddings:
        is_real = face.get("is_real", True)
        spoof_score = face.get("spoof_score", 1.0)

        if not is_real:
            results.append(RecognizeResult(
                user_id=None, name="FAKE", code="",
                score=round(spoof_score, 3), action="spoof_detected"
            ))
            continue

        emb = np.array(face["embedding"])
        user_id, score = recognize(emb, db_embs)
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            action, _ = _record_attendance(user_id, schedule, db)
            results.append(RecognizeResult(
                user_id=user_id, name=user.name, code=user.code,
                score=round(score, 3), action=action,
            ))
        else:
            results.append(RecognizeResult(
                user_id=None, name="Unknown", code="", score=round(score, 3), action="unknown"
            ))
    return results


# ── MJPEG stream — tách thread nhận diện để không block video ──
def _generate_frames(camera_id: int):
    cap = cv2.VideoCapture(camera_id, cv2.CAP_DSHOW)  # CAP_DSHOW nhanh hơn trên Windows
    if not cap.isOpened():
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # giảm buffer lag

    # State chia sẻ giữa thread đọc frame và thread nhận diện
    latest_frame = [None]
    latest_labels = [[]]
    lock = threading.Lock()
    running = [True]

    def recognition_worker():
        """Thread riêng chạy nhận diện, không block video stream."""
        db = SessionLocal()
        try:
            db_embs = _load_db_embeddings(db)
            schedule = _get_schedule(db)
            last_reload = time.time()
            while running[0]:
                with lock:
                    frame = latest_frame[0]
                if frame is None:
                    time.sleep(0.01)
                    continue

                faces = get_embeddings_from_frame(frame)
                labels = []
                for face in faces:
                    emb = np.array(face["embedding"])
                    region = face.get("facial_area", {})
                    x, y, w, h = region.get("x",0), region.get("y",0), region.get("w",0), region.get("h",0)
                    user_id, score = recognize(emb, db_embs)
                    if user_id:
                        user = db.query(User).filter(User.id == user_id).first()
                        _record_attendance(user_id, schedule, db)
                        labels.append((x, y, w, h, f"{user.name} ({score:.0%})", (0, 255, 0)))
                    else:
                        labels.append((x, y, w, h, "Unknown", (0, 165, 255)))

                with lock:
                    latest_labels[0] = labels

                # Reload embeddings mỗi 30 giây
                if time.time() - last_reload > 30:
                    db_embs = _load_db_embeddings(db)
                    last_reload = time.time()

                time.sleep(0.5)  # nhận diện 2 lần/giây, đủ cho điểm danh
        finally:
            db.close()

    t = threading.Thread(target=recognition_worker, daemon=True)
    t.start()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Cập nhật frame mới nhất cho thread nhận diện
            with lock:
                latest_frame[0] = frame.copy()
                labels = latest_labels[0]

            # Vẽ kết quả nhận diện lên frame
            for (x, y, w, h, label, color) in labels:
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, label, (x, max(y - 10, 10)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")

    except GeneratorExit:
        pass
    finally:
        running[0] = False
        cap.release()  # Giải phóng camera khi client ngắt kết nối


@router.get("/stream/{camera_id}")
def video_stream(camera_id: int = 0, db: Session = Depends(get_db)):
    return StreamingResponse(
        _generate_frames(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# ── WebSocket liveness + nhận diện ───────────────────
@router.websocket("/ws/liveness")
async def liveness_ws(websocket: WebSocket):
    """
    WebSocket cho chế độ điểm danh có liveness check.
    Client gửi: { "frame": "<base64 jpg>" }
    Server trả: {
        "liveness": { "passed": bool, "blink_count": int, "required": int },
        "result": null | { "user_id", "name", "code", "score", "action" }
    }
    """
    await websocket.accept()
    checker = LivenessChecker(required_blinks=2)
    db = SessionLocal()

    try:
        db_embs = _load_db_embeddings(db)
        schedule = _get_schedule(db)
        recognized = False  # chỉ nhận diện 1 lần sau khi pass liveness

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            frame_b64 = msg.get("frame", "")

            if not frame_b64:
                continue

            # Decode base64 → numpy frame
            img_bytes = base64.b64decode(frame_b64)
            arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                continue

            # Kiểm tra liveness
            liveness_result = checker.process(frame)

            result = None
            if liveness_result["passed"] and not recognized:
                # Liveness passed → nhận diện khuôn mặt
                faces = get_embeddings_from_frame(frame)
                if faces:
                    emb = np.array(faces[0]["embedding"])
                    user_id, score = recognize(emb, db_embs)
                    if user_id:
                        user = db.query(User).filter(User.id == user_id).first()
                        action, _ = _record_attendance(user_id, schedule, db)
                        result = {
                            "user_id": user_id,
                            "name": user.name,
                            "code": user.code,
                            "score": round(score, 3),
                            "action": action,
                        }
                        recognized = True
                    else:
                        result = {"user_id": None, "name": "Unknown",
                                  "code": "", "score": round(score, 3), "action": "unknown"}
                        recognized = True

            await websocket.send_text(json.dumps({
                "liveness": liveness_result,
                "result": result,
            }))

    except WebSocketDisconnect:
        pass
    finally:
        checker.close()
        db.close()
