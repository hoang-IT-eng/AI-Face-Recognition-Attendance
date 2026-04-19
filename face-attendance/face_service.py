import numpy as np
import json
import cv2
from deepface import DeepFace

MODEL_NAME = "Facenet512"
DETECTOR = "mtcnn"
THRESHOLD = 0.45


def get_embeddings_from_image(img_path: str) -> list[dict]:
    """Lấy tất cả embeddings từ file ảnh."""
    try:
        results = DeepFace.represent(
            img_path=img_path,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend=DETECTOR,
            anti_spoofing=False,
        )
        for r in results:
            r["is_real"] = True
            r["spoof_score"] = 1.0
        return results
    except Exception as e:
        raise ValueError(f"Không detect được mặt: {e}")


def get_embeddings_from_frame(frame: np.ndarray) -> list[dict]:
    """Lấy embeddings + bbox từ frame camera."""
    try:
        results = DeepFace.represent(
            img_path=frame,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend=DETECTOR,
            anti_spoofing=False,
        )
        for r in results:
            r["is_real"] = True
            r["spoof_score"] = 1.0
        return results
    except Exception:
        return []


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def recognize(embedding: np.ndarray, db_embeddings: list[dict], threshold: float = THRESHOLD):
    best_id, best_score = None, -1.0
    scores_by_user: dict[int, list[float]] = {}

    for item in db_embeddings:
        uid = item["user_id"]
        score = cosine_similarity(embedding, item["embedding"])
        scores_by_user.setdefault(uid, []).append(score)

    for uid, scores in scores_by_user.items():
        avg = float(np.mean(scores))
        if avg > best_score:
            best_score = avg
            best_id = uid

    if best_score < threshold:
        return None, best_score
    return best_id, best_score


def embedding_to_str(emb: np.ndarray) -> str:
    return json.dumps(emb.tolist())


def str_to_embedding(s: str) -> np.ndarray:
    return np.array(json.loads(s))
