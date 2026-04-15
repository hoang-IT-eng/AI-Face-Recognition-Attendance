import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { recognizeImage } from "../api";

const API = "http://localhost:8000";

const STATUS_COLOR = {
  check_in: "bg-green-100 text-green-700",
  check_out: "bg-blue-100 text-blue-700",
  already_checked: "bg-gray-100 text-gray-600",
  unknown: "bg-red-100 text-red-600",
};

const STATUS_LABEL = {
  check_in: "✅ Check-in",
  check_out: "🚪 Check-out",
  already_checked: "⏸ Đã điểm danh",
  unknown: "❓ Không nhận ra",
};

export default function Camera() {
  const webcamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const intervalRef = useRef(null);

  // Mode: "webcam" = chụp từ browser, "stream" = MJPEG từ backend
  const [mode, setMode] = useState("stream");
  // Camera index cho MJPEG stream (0, 1, 2...)
  const [streamCamId, setStreamCamId] = useState(0);
  const [streamKey, setStreamKey] = useState(0); // để reload stream

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((list) => {
      const cams = list.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      const builtin = cams.find((d) =>
        /integrated|built.?in|facetime|internal/i.test(d.label)
      );
      setDeviceId(builtin?.deviceId || cams[0]?.deviceId || "");
    });
  }, []);

  const capture = useCallback(async () => {
    if (!webcamRef.current || loading) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setLoading(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const response = await recognizeImage(file);
      const data = response.data;
      if (data.length > 0) {
        setResults((prev) =>
          [...data.map((r) => ({ ...r, time: new Date().toLocaleTimeString() })), ...prev].slice(0, 50)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const toggleAuto = () => {
    if (autoMode) {
      clearInterval(intervalRef.current);
      setAutoMode(false);
    } else {
      setAutoMode(true);
      intervalRef.current = setInterval(capture, 3000);
    }
  };

  // Dừng auto khi đổi mode
  const switchMode = (m) => {
    if (autoMode) { clearInterval(intervalRef.current); setAutoMode(false); }
    setMode(m);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">📸 Điểm danh realtime</h1>

        {/* Tab chọn mode */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => switchMode("stream")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${mode === "stream" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}>
            🎥 Stream realtime
          </button>
          <button onClick={() => switchMode("webcam")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${mode === "webcam" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}>
            📷 Chụp thủ công
          </button>
        </div>

        {/* MJPEG Stream mode */}
        {mode === "stream" && (
          <div>
            <div className="bg-black rounded-xl overflow-hidden shadow mb-3">
              <img
                key={streamKey}
                src={`${API}/camera/stream/${streamCamId}`}
                alt="Live stream"
                className="w-full"
                onError={() => console.error("Stream lỗi")}
              />
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Camera index</label>
                <select value={streamCamId}
                  onChange={(e) => { setStreamCamId(Number(e.target.value)); setStreamKey((k) => k + 1); }}
                  className="border rounded px-3 py-2 text-sm w-full">
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i}>Camera {i}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setStreamKey((k) => k + 1)}
                className="mt-5 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                🔄 Reload
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Stream xử lý realtime trên server — bbox và tên hiển thị trực tiếp trên video
            </p>
          </div>
        )}

        {/* Webcam chụp thủ công */}
        {mode === "webcam" && (
          <div>
            {devices.length > 1 && (
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Chọn camera</label>
                <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                  className="border rounded px-3 py-2 text-sm w-full">
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="bg-black rounded-xl overflow-hidden shadow">
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480, deviceId: deviceId || undefined }}
                className="w-full" />
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={capture} disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {loading ? "Đang nhận diện..." : "📷 Chụp & Điểm danh"}
              </button>
              <button onClick={toggleAuto}
                className={`flex-1 py-2 rounded-lg font-medium border transition ${autoMode ? "bg-red-500 text-white border-red-500" : "border-blue-600 text-blue-600 hover:bg-blue-50"}`}>
                {autoMode ? "⏹ Dừng tự động" : "▶ Tự động (3s)"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kết quả */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Kết quả nhận diện</h2>
          <button onClick={() => setResults([])} className="text-xs text-gray-400 hover:text-red-500">
            Xóa lịch sử
          </button>
        </div>
        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {results.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {mode === "stream"
                ? "Kết quả điểm danh sẽ hiển thị ở đây khi stream nhận diện được người"
                : "Chưa có kết quả"}
            </div>
          )}
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{r.name}</p>
                {r.code && <p className="text-xs text-gray-500">Mã: {r.code}</p>}
                <p className="text-xs text-gray-400">{r.time}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[r.action] || "bg-gray-100"}`}>
                  {STATUS_LABEL[r.action] || r.action}
                </span>
                <p className="text-xs text-gray-400 mt-1">Score: {(r.score * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
