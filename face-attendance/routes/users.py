from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
import tempfile, os

from database import get_db
from models import User, FaceEmbedding
from schemas import UserCreate, UserUpdate, UserOut
from face_service import get_embeddings_from_image, embedding_to_str

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        out = UserOut.model_validate(u)
        out.face_count = len(u.face_embeddings)
        result.append(out)
    return result


@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.code == data.code).first():
        raise HTTPException(400, f"Mã '{data.code}' đã tồn tại")
    user = User(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")
    out = UserOut.model_validate(user)
    out.face_count = len(user.face_embeddings)
    return out


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")
    db.delete(user)
    db.commit()
    return {"message": f"Đã xóa người dùng {user_id}"}


# ── Đăng ký khuôn mặt ────────────────────────────────
@router.post("/{user_id}/faces")
async def register_face(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")

    # Lưu ảnh tạm
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

    for emb in embeddings:
        db.add(FaceEmbedding(user_id=user_id, embedding=embedding_to_str(emb)))
    db.commit()

    return {"message": f"Đã thêm {len(embeddings)} khuôn mặt cho '{user.name}'"}


@router.delete("/{user_id}/faces")
def clear_faces(user_id: int, db: Session = Depends(get_db)):
    db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user_id).delete()
    db.commit()
    return {"message": "Đã xóa toàn bộ khuôn mặt"}


# ── Import từ Excel/CSV ───────────────────────────────
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

    # Cột bắt buộc: name, code
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
            email=str(row.get("email", "") or ""),
            phone=str(row.get("phone", "") or ""),
        ))
        added += 1
    db.commit()
    return {"added": added, "skipped": skipped}
