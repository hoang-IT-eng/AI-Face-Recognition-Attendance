/**
 * faceDetect — phát hiện khuôn mặt + chớp mắt ngay trong trình duyệt bằng
 * MediaPipe FaceLandmarker (tải lười từ CDN, chỉ dùng ở chế độ mô phỏng khi
 * máy chủ AI đang ngủ). Không phụ thuộc vào bản build: thư viện và mô hình
 * được nạp lúc chạy; nếu CDN không tải được, hàm trả lỗi rõ ràng để giao
 * diện báo "chưa sẵn sàng" thay vì giả vờ kiểm tra được.
 */

const TASKS_VERSION = "0.10.14";
// Mặc định tải từ CDN; có thể ghi đè qua biến môi trường VITE_MP_* khi cần
// tự host (ví dụ môi trường không ra được CDN).
const WASM_URL =
  import.meta.env.VITE_MP_WASM_URL ||
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`;
const BUNDLE_URL =
  import.meta.env.VITE_MP_BUNDLE_URL ||
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/vision_bundle.mjs`;
const MODEL_URL =
  import.meta.env.VITE_MP_MODEL_URL ||
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise = null;

async function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import(/* @vite-ignore */ BUNDLE_URL);
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      const base = {
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: true,
      };
      try {
        return await vision.FaceLandmarker.createFromOptions(fileset, {
          ...base,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        });
      } catch {
        return await vision.FaceLandmarker.createFromOptions(fileset, {
          ...base,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        });
      }
    })();
    // Cho phép thử lại ở lần gọi sau nếu lần này hỏng (mạng chập chờn).
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Không đọc được ảnh chụp"));
    img.src = src;
  });
}

/**
 * Kiểm tra một ảnh (data URL) có khuôn mặt rõ ràng hay không.
 * Trả { face: boolean }. Ném lỗi nếu bộ phát hiện chưa tải được.
 */
export async function detectFaceInImage(dataUrl) {
  const landmarker = await loadLandmarker();
  const img = await loadImage(dataUrl);
  const result = landmarker.detect(img);
  return { face: (result?.faceLandmarks?.length || 0) > 0 };
}

/**
 * Phân tích một khung hình webcam: có mặt không + mức chớp mắt (0..1).
 * Dùng cho Kiosk ở chế độ mô phỏng để đếm lần chớp mắt như bản thật.
 */
export async function analyzeFrame(videoEl) {
  const landmarker = await loadLandmarker();
  const result = landmarker.detect(videoEl);
  const shapes = result?.faceBlendshapes?.[0]?.categories || [];
  const get = (name) =>
    shapes.find((c) => c.categoryName === name)?.score || 0;
  return {
    face: (result?.faceLandmarks?.length || 0) > 0,
    blink: Math.max(get("eyeBlinkLeft"), get("eyeBlinkRight")),
  };
}
