from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import tempfile, os

from database import get_db
from models import User, FaceEmbedding, ConsentLog
from schemas import UserCreate, UserUpdate, UserOut
from face_service import get_embeddings_from_image, embedding_to_str
from security import hash_pin

router = APIRouter(prefix="/users", tags=["Users"])


def _user_out(u: User) -> UserOut:
    out = UserOut.model_validate(u)
    out.face_count = len(u.face_embeddings) if u.face_embeddings is not None else 0
    out.has_pin = bool(u.pin_hash)
    return out


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return [_user_out(u) for u in db.query(User).all()]


@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.code == data.code).first():
        raise HTTPException(400, f"Mã '{data.code}' đã tồn tại")
    payload = data.model_dump(exclude={"pin"})
    user = User(**payload)
    if data.pin:
        if len(data.pin) != 4 or not data.pin.isdigit():
            raise HTTPException(400, "PIN phải gồm đúng 4 chữ số")
        user.pin_hash = hash_pin(data.pin)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")
    return _user_out(user)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")
    payload = data.model_dump(exclude_none=True, exclude={"pin"})
    for k, v in payload.items():
        setattr(user, k, v)
    if data.pin is not None:
        if len(data.pin) != 4 or not data.pin.isdigit():
            raise HTTPException(400, "PIN phải gồm đúng 4 chữ số")
        user.pin_hash = hash_pin(data.pin)
    if data.consent_status:
        user.consent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")
    db.delete(user)
    db.commit()
    return {"message": f"Đã xóa người dùng {user_id}"}


@router.post("/{user_id}/faces")
async def register_face(
    user_id: int,
    file: UploadFile = File(...),
    consent: bool = Form(False),
    source: str = Form("Web Admin HR"),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")

    suffix = os.path.splitext(file.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        faces = get_embeddings_from_image(tmp_path)
    except ValueError as e:
        raise HTTPException(400, str(e))
    finally:
        os.unlink(tmp_path)

    count = 0
    for face in faces:
        if not face.get("is_real", True):
            continue
        emb = np.array(face["embedding"])
        db.add(FaceEmbedding(user_id=user_id, embedding=embedding_to_str(emb)))
        count += 1

    if consent:
        user.consent_status = "signed"
        user.consent_at = datetime.now(timezone.utc)
        db.add(ConsentLog(
            user_id=user.id,
            code=user.code,
            name=user.name,
            version="Consent Form v2.1",
            source=source,
            status="signed",
        ))

    db.commit()

    if count == 0:
        raise HTTPException(400, "Không tìm thấy khuôn mặt thật trong ảnh")
    return {"message": f"Đã thêm {count} khuôn mặt cho '{user.name}'", "consent": bool(consent)}


@router.delete("/{user_id}/faces")
def clear_faces(user_id: int, db: Session = Depends(get_db)):
    db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user_id).delete()
    db.commit()
    return {"message": "Đã xóa toàn bộ khuôn mặt"}


@router.post("/import/excel")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    suffix = os.path.splitext(file.filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        df = pd.read_excel(tmp_path) if suffix in (".xlsx", ".xls") else pd.read_csv(tmp_path)
    except Exception as e:
        raise HTTPException(400, f"Không đọc được file: {e}")
    finally:
        os.unlink(tmp_path)

    required = {"name", "code"}
    if not required.issubset(set(df.columns.str.lower())):
        raise HTTPException(400, "File cần có cột 'name' và 'code'")

    df.columns = df.columns.str.lower()
    added, skipped = 0, 0
    for _, row in df.iterrows():
        if db.query(User).filter(User.code == str(row["code"])).first():
            skipped += 1
            continue
        db.add(User(
            name=str(row["name"]),
            code=str(row["code"]),
            group=str(row.get("group", "") or ""),
            role=str(row.get("role", "") or ""),
            email=str(row.get("email", "") or ""),
            phone=str(row.get("phone", "") or ""),
        ))
        added += 1
    db.commit()
    return {"added": added, "skipped": skipped}
