"""
Anti-Spoofing wrapper dùng Silent-Face-Anti-Spoofing (MiniFASNet).
Phát hiện: ảnh in, ảnh từ điện thoại, video replay.

Yêu cầu:
  git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing.git silent_fas
  pip install torch torchvision
"""

import os
import sys
import cv2
import numpy as np

# Thêm thư mục silent_fas vào path
_FAS_DIR = os.path.join(os.path.dirname(__file__), "silent_fas")
if os.path.exists(_FAS_DIR) and _FAS_DIR not in sys.path:
    sys.path.insert(0, _FAS_DIR)

_model = None
_available = False


def _load_model():
    global _model, _available
    if _model is not None:
        return _available
    try:
        from src.anti_spoof_predict import AntiSpoofPredict
        from src.generate_patches import CropImage
        import torch

        model_dir = os.path.join(_FAS_DIR, "resources", "anti_spoof_models")
        device_id = 0 if _has_cuda() else -1
        _model = {
            "predictor": AntiSpoofPredict(device_id),
            "cropper": CropImage(),
            "model_dir": model_dir,
        }
        _available = True
        print("[AntiSpoof] Model loaded OK")
    except Exception as e:
        print(f"[AntiSpoof] Không load được model: {e}")
        print("[AntiSpoof] Chạy: git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing.git silent_fas")
        _available = False
    return _available


def _has_cuda() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


def check_liveness(frame: np.ndarray, bbox: dict) -> tuple[bool, float]:
    """
    Kiểm tra khuôn mặt có phải người thật không.

    Args:
        frame: BGR frame từ camera
        bbox: {"x": int, "y": int, "w": int, "h": int}

    Returns:
        (is_real, confidence)
        is_real=True  → người thật
        is_real=False → giả mạo (ảnh in / điện thoại / video)
    """
    if not _load_model():
        # Nếu chưa cài model, mặc định cho qua
        return True, 1.0

    try:
        from src.anti_spoof_predict import AntiSpoofPredict
        import torch

        predictor: AntiSpoofPredict = _model["predictor"]
        cropper = _model["cropper"]
        model_dir: str = _model["model_dir"]

        x, y, w, h = bbox["x"], bbox["y"], bbox["w"], bbox["h"]
        # Convert bbox sang format [x1,y1,x2,y2,score] mà model cần
        image_bbox = [x, y, x + w, y + h]

        prediction = np.zeros((1, 3))
        test_speed = 0

        for model_name in os.listdir(model_dir):
            h_input, w_input, model_type, scale = _parse_model_name(model_name)
            if h_input is None:
                continue

            param = {
                "org_img": frame,
                "bbox": image_bbox,
                "scale": scale,
                "out_w": w_input,
                "out_h": h_input,
                "crop": True,
            }
            if scale is None:
                param["crop"] = False

            img = cropper.crop(**param)
            prediction += predictor.predict(img, os.path.join(model_dir, model_name))

        # Label 1 = real, Label 0 = fake
        label = np.argmax(prediction)
        score = float(prediction[0][label] / prediction.sum())
        is_real = bool(label == 1)
        return is_real, round(score, 3)

    except Exception as e:
        print(f"[AntiSpoof] Lỗi: {e}")
        return True, 1.0


def _parse_model_name(model_name: str):
    """Parse tên model để lấy input size và scale."""
    try:
        info = model_name.split("_")[0:-1]
        h_input = int(info[-1])
        w_input = int(info[-2])
        model_type = info[0]
        if "CropFace" in model_name:
            scale = float(info[2])
        else:
            scale = None
        return h_input, w_input, model_type, scale
    except Exception:
        return None, None, None, None


def is_available() -> bool:
    """Kiểm tra anti-spoof model đã sẵn sàng chưa."""
    return _load_model()
