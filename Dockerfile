# Multi-stage: build React UI, then serve with FastAPI on port 7860 (HF Spaces)

# ---- Stage 1: Frontend build ----
FROM node:20-slim AS frontend
WORKDIR /ui
COPY face-attendance-ui/package.json face-attendance-ui/package-lock.json ./
RUN npm ci
COPY face-attendance-ui/ ./
# Same-origin API when UI is served by FastAPI
ENV VITE_API_BASE=
RUN npm run build

# ---- Stage 2: Python API + static UI ----
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEEPFACE_HOME=/tmp/.deepface \
    DATABASE_URL=sqlite:////tmp/attendance.db \
    STATIC_DIR=/app/static \
    HOME=/tmp \
    TF_CPP_MIN_LOG_LEVEL=2

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY face-attendance/requirements.hf.txt /app/requirements.hf.txt
RUN pip install --no-cache-dir -r /app/requirements.hf.txt

COPY face-attendance/ /app/
COPY --from=frontend /ui/dist /app/static

RUN mkdir -p /tmp/.deepface /tmp && \
    chown -R 1000:1000 /tmp /app

USER 1000
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
