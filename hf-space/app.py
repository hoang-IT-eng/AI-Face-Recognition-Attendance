"""Attend DeepFace demo — free HF Space (CPU).

Slim surface for portfolio demos: detect + Facenet512 embed + in-memory gallery.
Not the full FastAPI attendance product (auth/schedules/WS liveness).
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import cv2
import gradio as gr
import numpy as np
from deepface import DeepFace

MODEL_NAME = "Facenet512"
DETECTOR = "opencv"
THRESHOLD = 0.45

# Ephemeral gallery for this Space process (clears on restart/sleep).
_gallery: list[dict] = []


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def _represent(path: str) -> list[dict]:
    return DeepFace.represent(
        img_path=path,
        model_name=MODEL_NAME,
        enforce_detection=True,
        detector_backend=DETECTOR,
        anti_spoofing=False,
    )


def _save_upload(image: np.ndarray) -> str:
    if image is None:
        raise gr.Error("Upload an image first.")
    # Gradio gives RGB; OpenCV/DeepFace file path is fine as PNG.
    rgb = image if image.ndim == 3 else cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    fd, path = tempfile.mkstemp(suffix=".png")
    Path(path).write_bytes(b"")  # ensure file exists for cv2
    import os

    os.close(fd)
    # Write via cv2 expecting BGR
    bgr = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2BGR)
    if not cv2.imwrite(path, bgr):
        raise gr.Error("Could not write temp image.")
    return path


def detect_faces(image: np.ndarray) -> tuple[np.ndarray | None, str]:
    path = _save_upload(image)
    try:
        faces = _represent(path)
    except Exception as exc:  # DeepFace raises broadly
        return image, json.dumps({"ok": False, "error": str(exc)}, indent=2)
    finally:
        Path(path).unlink(missing_ok=True)

    annotated = image.copy()
    rows = []
    for i, face in enumerate(faces):
        area = face.get("facial_area") or {}
        x, y, w, h = int(area.get("x", 0)), int(area.get("y", 0)), int(area.get("w", 0)), int(area.get("h", 0))
        if w and h:
            cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 180, 120), 2)
            cv2.putText(annotated, f"face-{i}", (x, max(0, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 180, 120), 2)
        emb = np.array(face["embedding"], dtype=float)
        rows.append(
            {
                "index": i,
                "facial_area": area,
                "embedding_dim": int(emb.shape[0]),
                "embedding_preview": emb[:8].round(4).tolist(),
            }
        )
    return annotated, json.dumps({"ok": True, "faces": rows, "model": MODEL_NAME}, indent=2)


def enroll(image: np.ndarray, name: str) -> str:
    name = (name or "").strip() or f"person-{len(_gallery) + 1}"
    path = _save_upload(image)
    try:
        faces = _represent(path)
    except Exception as exc:
        return json.dumps({"ok": False, "error": str(exc)}, indent=2)
    finally:
        Path(path).unlink(missing_ok=True)
    if not faces:
        return json.dumps({"ok": False, "error": "No face detected"}, indent=2)
    emb = np.array(faces[0]["embedding"], dtype=float)
    _gallery.append({"name": name, "embedding": emb})
    return json.dumps({"ok": True, "enrolled": name, "gallery_size": len(_gallery)}, indent=2)


def recognize(image: np.ndarray) -> tuple[np.ndarray | None, str]:
    if not _gallery:
        return image, json.dumps({"ok": False, "error": "Gallery empty — enroll someone first."}, indent=2)
    path = _save_upload(image)
    try:
        faces = _represent(path)
    except Exception as exc:
        return image, json.dumps({"ok": False, "error": str(exc)}, indent=2)
    finally:
        Path(path).unlink(missing_ok=True)

    annotated = image.copy()
    results = []
    for i, face in enumerate(faces):
        emb = np.array(face["embedding"], dtype=float)
        best_name, best = "Unknown", -1.0
        for item in _gallery:
            score = _cosine(emb, item["embedding"])
            if score > best:
                best, best_name = score, item["name"]
        matched = best >= THRESHOLD
        label = f"{best_name} ({best:.2f})" if matched else f"Unknown ({best:.2f})"
        area = face.get("facial_area") or {}
        x, y, w, h = int(area.get("x", 0)), int(area.get("y", 0)), int(area.get("w", 0)), int(area.get("h", 0))
        color = (0, 180, 120) if matched else (200, 80, 60)
        if w and h:
            cv2.rectangle(annotated, (x, y), (x + w, y + h), color, 2)
            cv2.putText(annotated, label, (x, max(0, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
        results.append({"index": i, "name": best_name if matched else "Unknown", "score": round(best, 4), "matched": matched})
    return annotated, json.dumps({"ok": True, "results": results, "threshold": THRESHOLD}, indent=2)


def clear_gallery() -> str:
    _gallery.clear()
    return json.dumps({"ok": True, "gallery_size": 0}, indent=2)


with gr.Blocks(title="Attend DeepFace (CPU)") as demo:
    gr.Markdown(
        """# Attend — DeepFace demo (free CPU)
Upload a face photo to detect embeddings (Facenet512) or enroll/recognize against an ephemeral gallery.
Full attendance API (schedules, liveness WS, SQLite) is **not** hosted here — see repo + Azure FE shell."""
    )
    with gr.Tab("Detect"):
        inp = gr.Image(type="numpy", label="Face image")
        out_img = gr.Image(type="numpy", label="Annotated")
        out_json = gr.Code(language="json", label="Result")
        gr.Button("Detect").click(detect_faces, inputs=inp, outputs=[out_img, out_json])
    with gr.Tab("Enroll / Recognize"):
        name = gr.Textbox(label="Name for enroll", placeholder="Alice")
        inp2 = gr.Image(type="numpy", label="Face image")
        out_img2 = gr.Image(type="numpy", label="Annotated")
        out_json2 = gr.Code(language="json", label="Result")
        with gr.Row():
            gr.Button("Enroll").click(enroll, inputs=[inp2, name], outputs=out_json2)
            gr.Button("Recognize").click(recognize, inputs=inp2, outputs=[out_img2, out_json2])
            gr.Button("Clear gallery").click(clear_gallery, outputs=out_json2)

if __name__ == "__main__":
    demo.queue(max_size=8).launch()
