"""
Liveness detection dùng MediaPipe Face Landmarker (API mới >= 0.10).
Yêu cầu người dùng chớp mắt để xác nhận là người thật.
"""

import numpy as np
import cv2
import os
import urllib.request

_AVAILABLE = False
_FaceLandmarker = None
_BaseOptions = None
_FaceLandmarkerOptions = None
_VisionRunningMode = None

try:
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    from mediapipe.tasks.python.core.base_options import BaseOptions

    _FaceLandmarker = mp_vision.FaceLandmarker
    _FaceLandmarkerOptions = mp_vision.FaceLandmarkerOptions
    _VisionRunningMode = mp_vision.RunningMode
    _BaseOptions = BaseOptions
    _AVAILABLE = True
except Exception as e:
    print(f"[Liveness] mediapipe import lỗi: {e}")

# Model file
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

# Landmark indices mắt trái/phải (MediaPipe 478 points)
LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]

EAR_THRESHOLD  = 0.22
BLINK_FRAMES   = 2
REQUIRED_BLINKS = 2


def _download_model():
    if os.path.exists(_MODEL_PATH):
        return True
    print("[Liveness] Đang tải model face_landmarker.task (~6MB)...")
    try:
        urllib.request.urlretrieve(_MODEL_URL, _MODEL_PATH)
        print("[Liveness] Tải model xong")
        return True
    except Exception as e:
        print(f"[Liveness] Tải model thất bại: {e}")
        return False


def _ear(landmarks, eye_indices, w, h) -> float:
    pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_indices]
    v1 = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    v2 = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    h1 = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (v1 + v2) / (2.0 * h1 + 1e-6)


class LivenessChecker:
    def __init__(self, required_blinks: int = REQUIRED_BLINKS):
        self.required_blinks = required_blinks
        self.blink_count = 0
        self.closed_frames = 0
        self.passed = False
        self._landmarker = None

        if _AVAILABLE and _download_model():
            try:
                options = _FaceLandmarkerOptions(
                    base_options=_BaseOptions(model_asset_path=_MODEL_PATH),
                    running_mode=_VisionRunningMode.IMAGE,
                    num_faces=1,
                )
                self._landmarker = _FaceLandmarker.create_from_options(options)
                print("[Liveness] FaceLandmarker OK")
            except Exception as e:
                print(f"[Liveness] Khởi tạo landmarker lỗi: {e}")

    def process(self, frame: np.ndarray) -> dict:
        base = {"blink_count": self.blink_count, "required": self.required_blinks,
                "ear": 1.0, "eyes_closed": False}

        if not _AVAILABLE or self._landmarker is None:
            return {**base, "passed": False, "available": False,
                    "error": "mediapipe chưa sẵn sàng"}

        if self.passed:
            return {**base, "passed": True, "available": True,
                    "blink_count": int(self.blink_count)}

        h, w = frame.shape[:2]
        import mediapipe as mp
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB,
                            data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        result = self._landmarker.detect(mp_image)

        if not result.face_landmarks:
            return {**base, "passed": False, "available": True}

        lms = result.face_landmarks[0]
        left_ear  = _ear(lms, LEFT_EYE,  w, h)
        right_ear = _ear(lms, RIGHT_EYE, w, h)
        avg_ear   = (left_ear + right_ear) / 2.0
        eyes_closed = avg_ear < EAR_THRESHOLD

        if eyes_closed:
            self.closed_frames += 1
        else:
            if self.closed_frames >= BLINK_FRAMES:
                self.blink_count += 1
            self.closed_frames = 0

        if self.blink_count >= self.required_blinks:
            self.passed = True

        return {**base, "passed": bool(self.passed), "available": True,
                "blink_count": int(self.blink_count), "ear": round(float(avg_ear), 3),
                "eyes_closed": bool(eyes_closed)}

    def reset(self):
        self.blink_count = 0
        self.closed_frames = 0
        self.passed = False

    def close(self):
        if self._landmarker:
            self._landmarker.close()


def is_available() -> bool:
    return _AVAILABLE
