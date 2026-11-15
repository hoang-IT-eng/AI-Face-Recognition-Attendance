---
title: Face Attendance
emoji: 🛂
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Face Attendance (Docker Space)

Single container serving **FastAPI** + built **React** UI on port **7860**.

## Free Space limits (important)

- **No server webcam / Stream**: Hugging Face free CPUs usually have no camera device. Use **Kiosk Live** with the **browser webcam**, or upload faces on Register. The Monitoring MJPEG stream needs a camera attached to the *server* and will not work on typical Spaces.
- **Ephemeral disk**: SQLite is under `/tmp/attendance.db`. Data and DeepFace cache (`DEEPFACE_HOME=/tmp/.deepface`) are **lost** when the Space sleeps or restarts.
- **Cold start is slow**: First boot downloads DeepFace / TensorFlow models; expect a long wait before the UI responds.

## Default admin

Created on first boot by the backend seed (see `routes/auth.py`). Change the password after first login if the Space is public.

## Local Docker smoke test

```bash
docker build -t face-attendance .
docker run --rm -p 7860:7860 face-attendance
```

Open http://localhost:7860
