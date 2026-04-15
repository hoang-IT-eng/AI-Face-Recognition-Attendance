"""
Face Recognition với DeepFace
Sử dụng:
  python main.py register --name "Nguyen Van A" --image path/to/image.jpg
  python main.py webcam
  python main.py list
  python main.py remove --name "Nguyen Van A"
"""

import argparse
import cv2
import os
import pickle
import numpy as np
from deepface import DeepFace

DB_FILE = "face_db.pkl"
MODEL_NAME = "Facenet512"  # ArcFace, Facenet, Facenet512, VGG-Face
DETECTOR = "mtcnn"        # mtcnn chịu che khuất tốt hơn retinaface


def load_db() -> dict:
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "rb") as f:
            return pickle.load(f)
    return {}


def save_db(db: dict):
    with open(DB_FILE, "wb") as f:
        pickle.dump(db, f)


def get_embedding(image_path: str) -> np.ndarray | None:
    try:
        result = DeepFace.represent(
            img_path=image_path,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend=DETECTOR,
        )
        return np.array(result[0]["embedding"])
    except Exception as e:
        print(f"[!] Không lấy được embedding: {e}")
        return None


def get_embedding_from_frame(frame: np.ndarray) -> list[dict]:
    """Trả về list các face với embedding và bbox từ frame."""
    try:
        results = DeepFace.represent(
            img_path=frame,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend=DETECTOR,
        )
        return results
    except Exception:
        return []


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def recognize(embedding: np.ndarray, db: dict, threshold: float = 0.6) -> tuple[str, float]:
    best_name, best_score = "Unknown", -1.0
    for name, embeddings in db.items():
        scores = [cosine_similarity(embedding, e) for e in embeddings]
        avg = float(np.mean(scores))
        if avg > best_score:
            best_score = avg
            best_name = name
    if best_score < threshold:
        return "Unknown", best_score
    return best_name, best_score


def cmd_register(name: str, image_path: str):
    db = load_db()
    emb = get_embedding(image_path)
    if emb is None:
        return
    if name not in db:
        db[name] = []
    db[name].append(emb)
    save_db(db)
    print(f"[+] Đã đăng ký '{name}' ({len(db[name])} ảnh)")


def cmd_webcam(threshold: float, camera_id: int):
    db = load_db()
    if not db:
        print("[!] Database trống. Hãy đăng ký khuôn mặt trước.")
        return

    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        print(f"[!] Không mở được camera {camera_id}")
        return

    print("[*] Nhấn 'q' để thoát")
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        faces = get_embedding_from_frame(frame)
        for face in faces:
            emb = np.array(face["embedding"])
            name, score = recognize(emb, db, threshold)
            region = face.get("facial_area", {})
            x = region.get("x", 0)
            y = region.get("y", 0)
            w = region.get("w", 0)
            h = region.get("h", 0)
            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            cv2.putText(frame, f"{name} ({score:.2f})", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        cv2.imshow("Face Recognition - DeepFace", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="Face Recognition với DeepFace")
    parser.add_argument("--threshold", type=float, default=0.6,
                        help="Ngưỡng nhận diện (mặc định 0.6)")
    sub = parser.add_subparsers(dest="command")

    reg = sub.add_parser("register", help="Đăng ký khuôn mặt từ ảnh")
    reg.add_argument("--name", required=True)
    reg.add_argument("--image", required=True)

    cam = sub.add_parser("webcam", help="Nhận diện realtime qua webcam")
    cam.add_argument("--camera", type=int, default=0)

    sub.add_parser("list", help="Liệt kê người đã đăng ký")

    rm = sub.add_parser("remove", help="Xóa người khỏi database")
    rm.add_argument("--name", required=True)

    args = parser.parse_args()
    if args.command is None:
        parser.print_help()
        return

    if args.command == "register":
        cmd_register(args.name, args.image)
    elif args.command == "webcam":
        cmd_webcam(args.threshold, args.camera)
    elif args.command == "list":
        db = load_db()
        if db:
            for name, embs in db.items():
                print(f"  - {name} ({len(embs)} ảnh)")
        else:
            print("[DB] Database trống.")
    elif args.command == "remove":
        db = load_db()
        if args.name in db:
            del db[args.name]
            save_db(db)
            print(f"[+] Đã xóa '{args.name}'")
        else:
            print(f"[!] Không tìm thấy '{args.name}'")


if __name__ == "__main__":
    main()
