from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
import numpy as np
import cv2
import tempfile, os

from database import get_db
from models import Attendance, User, FaceEmbedding, Schedule, AttendanceStatus
from schemas import RecognizeResult
from face_service import (
    get_embeddings_from_image,
    get_embeddings_from_frame,
    recognize,
    str_to_embedding,
)

router = APIRouter(prefix="/camera", tags=["Camera"])


def _load_db_embeddings(db: Session) -> list[dict]:
    rows = db.query(FaceEmbedding).all()
    return [{"user_id": r.user_id, "embedding": str_to_embedding(r.embedding)} for r in rows]


def _get_schedule(db: Session) -> Schedule | None:
    """Lấy ca phù hợp với giờ hiện tại."""
    now = datetime.now()
    day = now.isoweekday()  # 1=Mon ... 7=Sun
    time_str = now.strftime("%H:%M")
    for s in db.query(Schedule).all():
        days = [int(d) for d in s.days_of_week.split(",")]
        if day in days and s.start_time <= time_str <= s.end_time:
            return s
    return None


def _record_attendance(user_id: int, schedule: Schedule | None, db: Session) -> tuple[str, Attendance]:
    """Ghi check-in hoặc check-out, trả về action và record."""
    now = datetime.now(timezone.utc)
    today = date.today().isoformat()
    schedule_id = schedule.id if schedule else None

    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == today,
        Attendance.schedule_id == schedule_id,
    ).first()

    if not existing:
        # Check-in lần đầu
        status = AttendanceStatus.present
        if schedule:
            now_local = datetime.now()
            start = datetime.strptime(f"{today} {schedule.start_time}", "%Y-%m-%d %H:%M")
            if (now_local - start).total_seconds() > schedule.late_threshold * 60:
                status = AttendanceStatus.late

        record = Attendance(
            user_id=user_id,
            date=today,
            schedule_id=schedule_id,
            check_in=now,
            status=status,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return "check_in", record

    if existing.check_out is None:
        # Check-out
        existing.check_out = now
        # Kiểm tra về sớm
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
async def recognize_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
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

    for emb in embeddings:
        user_id, score = recognize(emb, db_embs)
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            action, _ = _record_attendance(user_id, schedule, db)
            results.append(RecognizeResult(
                user_id=user_id,
                name=user.name,
                code=user.code,
                score=round(score, 3),
                action=action,
            ))
        else:
            results.append(RecognizeResult(
                user_id=None, name="Unknown", code="", score=round(score, 3), action="unknown"
            ))

    return results


# ── MJPEG stream từ camera server ─────────────────────
def _generate_frames(camera_id: int, db_embs: list[dict], schedule: Schedule | None, db: Session):
    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        return

    frame_count = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Chỉ nhận diện mỗi 10 frame để giảm tải
            if frame_count % 10 == 0:
                faces = get_embeddings_from_frame(frame)
                for face in faces:
                    emb = np.array(face["embedding"])
                    user_id, score = recognize(emb, db_embs)
                    region = face.get("facial_area", {})
                    x, y, w, h = region.get("x", 0), region.get("y", 0), region.get("w", 0), region.get("h", 0)

                    if user_id:
                        user = db.query(User).filter(User.id == user_id).first()
                        action, _ = _record_attendance(user_id, schedule, db)
                        label = f"{user.name} ({score:.2f}) [{action}]"
                        color = (0, 255, 0)
                    else:
                        label = f"Unknown ({score:.2f})"
                        color = (0, 0, 255)

                    cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                    cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            frame_count += 1
            _, buf = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")
    finally:
        cap.release()


@router.get("/stream/{camera_id}")
def video_stream(camera_id: int = 0, db: Session = Depends(get_db)):
    db_embs = _load_db_embeddings(db)
    schedule = _get_schedule(db)
    return StreamingResponse(
        _generate_frames(camera_id, db_embs, schedule, db),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
